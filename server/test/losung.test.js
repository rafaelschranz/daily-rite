import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseLosungPage } from '../src/routes/losung.js';

// Fixture: losung.net für den 2.7.2026, gespeichert als Original-Bytes (ISO-8859-1).
// Bricht der Test, hat sich vermutlich das HTML der Seite geändert – dann greift
// in Produktion der Fallback und das Parsing muss angepasst werden.
const fixtureUrl = new URL('./fixtures/losung-sample.html', import.meta.url);
const html = new TextDecoder('iso-8859-1').decode(readFileSync(fixtureUrl));

test('parseLosungPage extrahiert die Losung (AT-Vers) mit Bibelstelle', () => {
  const parsed = parseLosungPage(html);
  assert.ok(parsed, 'Seite muss parsebar sein');
  assert.ok(parsed.losung, 'Losung muss vorhanden sein');
  assert.match(parsed.losung.text, /HERR, verdirb dein Volk/);
  assert.equal(parsed.losung.reference, '5.Mose 9,26');
});

test('parseLosungPage extrahiert den Lehrtext (NT-Vers) mit Bibelstelle', () => {
  const parsed = parseLosungPage(html);
  assert.ok(parsed.lehrtext, 'Lehrtext muss vorhanden sein');
  assert.match(parsed.lehrtext.text, /Maria wird einen Sohn gebären/);
  assert.equal(parsed.lehrtext.reference, 'Matthäus 1,21');
});

test('parseLosungPage extrahiert die Jahreslosung aus dem Seitenkopf', () => {
  const parsed = parseLosungPage(html);
  assert.ok(parsed.jahreslosung, 'Jahreslosung muss vorhanden sein');
  assert.match(parsed.jahreslosung, /^Jahreslosung \d{4}:/);
  assert.match(parsed.jahreslosung, /alles neu/);
});

test('parseLosungPage gibt null zurück, wenn die Struktur fehlt', () => {
  assert.equal(parseLosungPage('<html><body>leer</body></html>'), null);
});

test('Losung und Lehrtext sind fett getaggte Verse ohne Sprecher-Einleitung', () => {
  const parsed = parseLosungPage(html);
  // Der Lehrtext-Block enthält "Der Engel sprach zu Josef:" vor dem <b>-Vers –
  // extrahiert werden darf nur der fettgedruckte Vers selbst.
  assert.ok(!parsed.lehrtext.text.startsWith('Der Engel'), 'Einleitung darf nicht im Vers stehen');
});
