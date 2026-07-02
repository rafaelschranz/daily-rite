import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { berlinToday, formatDisplayDate } from './berlinDate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const versesPath = path.join(__dirname, '..', '..', 'data', 'verses.json');
const verses = JSON.parse(readFileSync(versesPath, 'utf-8'));

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
