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

function extractVerse(verseBlock, referenceBlock) {
  const $verse = cheerio.load(`<div>${verseBlock}</div>`);
  const boldText = $verse('b').first().text().trim();
  const text = boldText || $verse('div').text().trim();
  const reference = cheerio.load(`<div>${referenceBlock}</div>`)('div').text().trim();
  if (!text || !reference) return null;
  return { text, reference };
}

// Robustes DOM-Parsing statt String-Splitting: Der Textblock in #jerky p ist durch
// <br>-Tags gegliedert. Nach der Datumszeile folgen Losung (AT, <b>) + Bibelstelle,
// dann Lehrtext (NT, <b>) + Bibelstelle – vorn die Losung, hinten der Lehrtext.
// Exportiert für den Parser-Test mit HTML-Fixture (server/test/).
export function parseLosungPage(html) {
  const $ = cheerio.load(html);
  const container = $('#jerky p').first();
  if (!container.length) return null;

  const blocks = (container.html() || '')
    .split(/<br\s*\/?>/i)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length < 5) return null;

  const losung = extractVerse(blocks[1], blocks[2]);
  const lehrtext = extractVerse(blocks[blocks.length - 2], blocks[blocks.length - 1]);

  if (!losung && !lehrtext) return null;

  // Die Jahreslosung steht im Seitenkopf (h2), z.B. "Jahreslosung 2026:<br>Gott spricht: ..."
  // <br> vor dem Text-Extrahieren durch Leerzeichen ersetzen, sonst kleben die Teile zusammen.
  const headlineHtml = ($('h2 font').first().html() || '').replace(/<br\s*\/?>/gi, ' ');
  const headline = cheerio.load(`<div>${headlineHtml}</div>`)('div').text().replace(/\s+/g, ' ').trim();
  const jahreslosung = headline.startsWith('Jahreslosung') ? headline : null;

  return { losung, lehrtext, jahreslosung };
}

// Beide Verse stehen auf derselben Seite: einmal fetchen, beides tagesscharf cachen.
async function getLosungPair() {
  const today = berlinToday();
  const cacheKey = `losung-pair:${today.isoDate}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = `https://losung.net/?t=${today.day}&m=${today.month}&j=${today.year}`;
  const response = await fetchWithTimeout(url, { timeoutMs: 8000 });
  const buffer = await response.arrayBuffer();
  const html = decodeLatin1(buffer);
  const parsed = parseLosungPage(html);

  if (!parsed) throw new Error('Losung/Lehrtext konnten nicht aus der Seite extrahiert werden');

  const result = { date: formatDisplayDate(), ...parsed };
  setCached(cacheKey, result, TTL_MS);
  return result;
}

async function getLosungVerse(part, fallbackType) {
  try {
    const pair = await getLosungPair();
    const verse = pair[part];
    if (!verse) throw new Error(`${part} fehlt auf der Seite`);
    return { date: pair.date, text: verse.text, reference: verse.reference, source: 'live' };
  } catch (error) {
    console.error(`[losung] Live-Seite fehlgeschlagen (${part}), nutze Fallback:`, error.message);
    return getFallback(fallbackType);
  }
}

// Morgen: die Losung (alttestamentlicher Vers) – traditionell das Morgenwort.
export function getLosungMorgen() {
  return getLosungVerse('losung', 'morgen');
}

// Abend: der Lehrtext (neutestamentlicher Vers).
export function getLosungAbend() {
  return getLosungVerse('lehrtext', 'abend');
}

// Jahreslosung für den Startscreen; ohne Fallback – bei Fehler blendet der Client sie aus.
export async function getJahreslosung() {
  try {
    const pair = await getLosungPair();
    return { text: pair.jahreslosung ?? null };
  } catch (error) {
    console.error('[losung] Jahreslosung nicht verfügbar:', error.message);
    return { text: null };
  }
}
