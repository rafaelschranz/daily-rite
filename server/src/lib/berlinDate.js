// Alle Datumslogik läuft bewusst in Europe/Berlin (= Zeitzone der Losungen
// und des Nutzers), unabhängig davon, in welcher Zeitzone der Server steht.
const TZ = 'Europe/Berlin';

const displayFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: TZ,
});

// en-CA liefert das Format YYYY-MM-DD.
const isoFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });
const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' });

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatDisplayDate(date = new Date()) {
  return displayFormatter.format(date);
}

export function berlinToday(date = new Date()) {
  const isoDate = isoFormatter.format(date);
  const [year, month, day] = isoDate.split('-').map(Number);
  const weekday = WEEKDAYS.indexOf(weekdayFormatter.format(date));
  return { year, month, day, weekday, isoDate };
}
