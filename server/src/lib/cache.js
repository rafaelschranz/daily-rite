const store = new Map();

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key, value, ttlMs) {
  // Abgelaufene Einträge (z.B. datumsbasierte Schlüssel von gestern) mit aufräumen.
  const now = Date.now();
  for (const [existingKey, entry] of store) {
    if (now > entry.expiresAt) store.delete(existingKey);
  }
  store.set(key, { value, expiresAt: now + ttlMs });
}
