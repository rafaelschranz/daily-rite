const PREFIX = 'daily-rite:';

export function loadJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // localStorage kann in seltenen Fällen (privater Modus, voller Speicher) fehlschlagen – dann eben ohne Persistenz.
  }
}
