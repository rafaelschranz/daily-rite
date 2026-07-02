import * as cheerio from 'cheerio';
import { berlinToday, formatDisplayDate } from '../lib/berlinDate.js';
import { getCached, setCached } from '../lib/cache.js';
import { fetchWithTimeout } from '../lib/fetchWithTimeout.js';
import { getFallback } from '../lib/fallback.js';

const TTL_MS = 12 * 60 * 60 * 1000;
const FEED_URL_DE = 'https://archives.taize.fr/readingrss.php?lang=de';
const FEED_URL_EN = 'https://archives.taize.fr/readingrss.php?lang=en';

// Grobe Heuristik, um versehentlich englischsprachigen Inhalt im "de"-Feed zu erkennen.
const GERMAN_HINTS = [' der ', ' die ', ' das ', ' und ', ' ist ', ' nicht ', ' ein ', ' du ', ' wie '];

function looksGerman(text) {
  const padded = ` ${text.toLowerCase()} `;
  return GERMAN_HINTS.some((hint) => padded.includes(hint));
}

function parseFeed(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const item = $('item').first();
  if (!item.length) return null;

  const rawTitle = item.find('title').text().trim();
  const rawDescription = item.find('description').text().trim();
  const pubDate = item.find('pubDate').text().trim();

  if (!rawDescription) return null;

  // Bibelstelle steht in der Beschreibung eingeklammert am Ende, z.B. "... (Jak 2,14-26)"
  const match = rawDescription.match(/^(.*)\(([^()]+)\)\s*$/);
  const text = match ? match[1].trim() : rawDescription;
  const reference = match ? match[2].trim() : '';

  let date = rawTitle || null;
  const parsedDate = pubDate ? new Date(pubDate) : null;
  if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
    date = formatDisplayDate(parsedDate);
  }

  if (!date) return null;
  return { date, text, reference };
}

async function fetchFeed(url) {
  const response = await fetchWithTimeout(url, { timeoutMs: 8000 });
  const xml = await response.text();
  return parseFeed(xml);
}

export async function getTaizeReading() {
  // Datumsbasierter Schlüssel: Der Cache schlägt um Mitternacht (Berlin) um,
  // damit morgens nicht die Lesung von gestern ausgeliefert wird.
  const cacheKey = `taize-reading:${berlinToday().isoDate}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    let parsed = await fetchFeed(FEED_URL_DE);

    if (!parsed || !looksGerman(parsed.text)) {
      const enParsed = await fetchFeed(FEED_URL_EN).catch(() => null);
      parsed = enParsed ?? parsed;
    }

    if (!parsed) throw new Error('Taizé-Feed lieferte keinen verwertbaren Eintrag');

    const result = { ...parsed, source: 'live' };
    setCached(cacheKey, result, TTL_MS);
    return result;
  } catch (error) {
    console.error('[taize] Live-Feed fehlgeschlagen, nutze Fallback:', error.message);
    return getFallback('mittag');
  }
}
