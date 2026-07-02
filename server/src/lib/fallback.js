import { readFileSync } from 'node:fs';
import { berlinToday, formatDisplayDate } from './berlinDate.js';

// new URL(..., import.meta.url) statt path.join(__dirname, ...): dieses Muster
// erkennt Vercels Bundler (@vercel/nft) und packt die JSON-Datei mit ins Deployment.
const versesUrl = new URL('../../data/verses.json', import.meta.url);
const verses = JSON.parse(readFileSync(versesUrl, 'utf-8'));

export function getFallback(type) {
  const list = type === 'mittag' ? verses.mittag_fallback : verses.abend_fallback;
  const entry = list[berlinToday().weekday % list.length];

  return {
    date: formatDisplayDate(),
    text: entry.text,
    reference: entry.reference,
    source: 'fallback',
  };
}
