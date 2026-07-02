import * as cheerio from 'cheerio';
import { berlinToday, formatDisplayDate } from '../lib/berlinDate.js';
import { getCached, setCached } from '../lib/cache.js';
import { fetchWithTimeout } from '../lib/fetchWithTimeout.js';
import { getFallback } from '../lib/fallback.js';

const TTL_MS = 12 * 60 * 60 * 1000;

// losung.net liefert die Seite als ISO-8859-1, nicht UTF-8.
function decodeLatin1(buffer) {
  return new TextDecoder('iso-8859-1').decode(buffer);
}

// Robustes DOM-Parsing statt String-Splitting: Der Textblock in #jerky p ist durch
// <br>-Tags gegliedert; die beiden fettgedruckten <b>-Verse sind Losung (AT) und
// Lehrtext (NT), gefolgt jeweils von ihrer Bibelstelle als eigener Block.
function parseLosungPage(html) {
  const $ = cheerio.load(html);
  const container = $('#jerky p').first();
  if (!container.length) return null;

  const blocks = (container.html() || '')
    .split(/<br\s*\/?>/i)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length < 2) return null;

  const lehrtextBlock = blocks[blocks.length - 2];
  const referenceBlock = blocks[blocks.length - 1];

  const $lehrtext = cheerio.load(`<div>${lehrtextBlock}</div>`);
  const boldText = $lehrtext('b').first().text().trim();
  const text = boldText || $lehrtext('div').text().trim();

  const reference = cheerio.load(`<div>${referenceBlock}</div>`)('div').text().trim();

  if (!text || !reference) return null;
  return { text, reference };
}

export async function getLosungAbend() {
  // Datum in Berliner Zeit bestimmen, damit URL und Anzeigedatum um Mitternacht
  // gemeinsam umschlagen; der datumsbasierte Schlüssel macht den Cache zusätzlich
  // tagesscharf (kein gestriger Vers am Morgen danach).
  const today = berlinToday();
  const cacheKey = `losung-abend:${today.isoDate}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = `https://losung.net/?t=${today.day}&m=${today.month}&j=${today.year}`;
  const date = formatDisplayDate();

  try {
    const response = await fetchWithTimeout(url, { timeoutMs: 8000 });
    const buffer = await response.arrayBuffer();
    const html = decodeLatin1(buffer);
    const parsed = parseLosungPage(html);

    if (!parsed) throw new Error('Lehrtext konnte nicht aus der Seite extrahiert werden');

    const result = { date, text: parsed.text, reference: parsed.reference, source: 'live' };
    setCached(cacheKey, result, TTL_MS);
    return result;
  } catch (error) {
    console.error('[losung] Live-Seite fehlgeschlagen, nutze Fallback:', error.message);
    return getFallback('abend');
  }
}
