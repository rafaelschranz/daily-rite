import { loadJSON, saveJSON } from './storage.js';

async function fetchVerse(endpoint, cacheKey) {
  try {
    const response = await fetch(endpoint, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    saveJSON(cacheKey, data);
    return data;
  } catch (error) {
    console.warn(`[api] ${endpoint} nicht erreichbar, nutze lokalen Zwischenspeicher:`, error.message);
    const cached = loadJSON(cacheKey);
    if (cached) return { ...cached, source: 'fallback' };
    // null = endgültig fehlgeschlagen (Backend down + kein Zwischenspeicher);
    // undefined bleibt dem "lädt noch"-Zustand vorbehalten.
    return null;
  }
}

export function fetchTaizeReading() {
  return fetchVerse('/api/taize-reading', 'cached-taize');
}

export function fetchLosungMorgen() {
  return fetchVerse('/api/losung-morgen', 'cached-losung-morgen');
}

export function fetchLosungAbend() {
  return fetchVerse('/api/losung-abend', 'cached-losung');
}
