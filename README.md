# Silentium

Eine ruhige, klosterhafte 5-Minuten-Taizé-Gebetsapp für Morgen, Mittag und Abend. Vite + React im Frontend, ein minimaler Express-Server im Backend (für das serverseitige Fetchen und Parsen der beiden externen Tagesverse).

## Architektur

```
daily-rite/
  server/                  Express-Backend (ESM, Node ≥ 18)
    src/
      index.js             App-Setup, Routen, optionales Static-Serving für client/dist
      routes/
        taize.js            GET /api/taize-reading – RSS-Feed, XML-Parsing mit cheerio
        losung.js            GET /api/losung-morgen & /api/losung-abend – HTML-Parsing mit cheerio (ISO-8859-1)
      lib/
        cache.js             In-Memory-Cache mit TTL (12h)
        fetchWithTimeout.js  fetch mit AbortController-Timeout
        fallback.js          liest data/verses.json, rotiert nach Wochentag
    data/verses.json         Fallback-Verse (freie Formulierung, nicht wörtlich zitiert)

  client/                   Vite + React Frontend
    src/
      App.jsx                Screens: Auswahl → Session → Ende
      components/            Candle, ChantPlayer, Controls, ProgressDots, StepView, ...
      hooks/                  usePrayerSession (Timer/Schritte), useBell (Web Audio API)
      data/
        steps.js              Abläufe für Morgen/Mittag/Abend, Vaterunser- & Segenstext
        chants.json            Taizé-Gesänge (YouTube-IDs)
      lib/
        api.js                 Fetch-Client mit localStorage-Offline-Fallback
        youtube.js              Lazy-Loader für die YouTube-IFrame-API
```

### Backend-Endpunkte

- `GET /api/taize-reading` → `{ date, text, reference, source }`
  Holt den RSS-Feed `archives.taize.fr/readingrss.php?lang=de`, parst das erste `<item>` mit cheerio (XML-Modus). Bibelstelle wird aus der Klammer am Ende der `<description>` extrahiert. Fällt automatisch auf `lang=en` zurück, wenn der deutsche Feed leer ist oder (heuristisch erkannt) unerwartet nicht-deutschen Text enthält.
- `GET /api/losung-morgen` und `GET /api/losung-abend` → `{ date, text, reference, source }`
  Holen `losung.net/?t=&m=&j=` (aktuelles Datum, ein gemeinsamer Fetch + Cache für beide), dekodieren die Antwort korrekt als **ISO-8859-1** und parsen den Textblock in `#jerky p` strukturell: Der Inhalt wird an den `<br>`-Tags in Blöcke zerlegt; vorn stehen Losung (AT, `<b>…</b>`) + Bibelstelle, hinten Lehrtext (NT) + Bibelstelle – kein blindes String-Splitting, sondern DOM-basiertes Parsing. Morgens wird die Losung ausgeliefert (traditionell das Morgenwort), abends der Lehrtext.

Beide Routen cachen erfolgreiche Antworten im Speicher (max. 12 Stunden, zusätzlich tagesscharf: der Cache-Schlüssel enthält das Datum in Europe/Berlin, sodass um Mitternacht nie der Vers von gestern ausgeliefert wird). Sie haben ein 8-Sekunden-Timeout und fallen bei jedem Fehler (Timeout, HTTP-Fehler, Parsing-Fehler) auf `server/data/verses.json` zurück, rotierend nach Wochentag. `source` im Response ist `"live"` oder `"fallback"`. Sämtliche Datumslogik (URL-Parameter, Anzeigedatum, Wochentagsrotation) rechnet bewusst in Europe/Berlin, unabhängig von der Server-Zeitzone.

### Frontend

- Vite-Dev-Server auf Port 5173, proxied `/api/*` auf `http://localhost:3001` (siehe `client/vite.config.js`) – im Dev-Betrieb also keine CORS-Konfiguration nötig.
- Die Abläufe (Ankommen/Wort/Stille/Ausrichtung-Fürbitte-Rückblick/Vaterunser) sind als reine Daten in `client/src/data/steps.js` definiert; `usePrayerSession` steuert Timer, automatische Übergänge und Countdown.
- Verse werden beim App-Start und bei jedem "Beginnen" geladen (damit eine tagelang offene App keinen veralteten Vers zeigt) und zusätzlich in `localStorage` gecacht; schlägt der Request zum eigenen Backend fehl (z. B. offline), wird der zuletzt erfolgreich geladene Vers aus `localStorage` verwendet. Ein dezenter Hinweistext erscheint, wenn ein Fallback-Vers angezeigt wird.
- Während die Gebetszeit läuft, hält ein Screen Wake Lock (`navigator.wakeLock`) das Handy-Display an; Browser ohne Unterstützung ignorieren das still.
- **PWA:** Ein Service Worker (`vite-plugin-pwa`, Workbox) macht die App vom Homescreen installierbar und cached alle Assets inkl. Google Fonts; `/api`-Aufrufe laufen bewusst immer übers Netz (Offline-Verse kommen aus dem localStorage-Cache). Ein offener Tab lädt sich nach einem neuen Deploy automatisch einmal neu (`main.jsx` registriert manuell via `virtual:pwa-register` und hört auf `controllerchange`) – ohne das würde ein bereits geöffneter Tab unbemerkt auf einem alten, gecachten Stand hängen bleiben.
- **Stille-Dauer wählbar** (3/5/10 Minuten) auf dem Auswahl-Screen; während der Stille blenden Header und Controls nach ein paar Sekunden aus, ein Tap holt sie zurück.
- **Atemführung:** Beim Ankommen weitet und verengt sich ein feiner Ring um die Kerze im 6-Sekunden-Zyklus.
- **Tageszeit-Stimmung:** Morgens wärmt ein Hauch Dämmerungslicht den Hintergrund, abends wird er tiefer nachtblau (`data-mode` auf `<html>`).
- Beim Phasenwechsel vibriert das Handy dezent (`navigator.vibrate`), zusätzlich zur Glocke; der Gesang hat einen Lautstärkeregler.
- Die **Jahreslosung** wird von losung.net mitgeparst (`GET /api/jahreslosung`) und auf dem Startscreen gezeigt.
- `client/public/gebetszeiten.ics` (Download-Link auf dem Startscreen) legt drei tägliche Gebetszeiten (7:00/12:00/21:30, Europe/Berlin) im Kalender an.
- Der Gesang läuft ausschließlich über einen unsichtbaren offiziellen **YouTube-IFrame-Embed** (siehe unten), gesteuert über die YouTube-IFrame-API (`client/src/lib/youtube.js`, `client/src/components/ChantPlayer.jsx`).

## Design-Entscheidungen

- **Farben:** Hintergrund `#0d0f16` → `#171b28` (radialer Verlauf, kein reines Schwarz), warmes Kerzenglimmen `rgba(244,193,122,.09)`, Flamme `#ffe3ab → #f7b955 → #d97b3f`, Text `#eef1f7` / gedämpft `#98a1b8`, Akzent/Fortschritt `#d9a441`.
- **Typografie:** [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) (Serif) für Verse, Gebete und Titel; [Inter](https://fonts.google.com/specimen/Inter) (Sans) für UI-Elemente, Buttons, Countdown.
- **Kerze:** CSS-Keyframes für leichtes Flammenflackern (immer aktiv) und ein "atmendes" Glimmen (Glow-Radius, 4s-Zyklus) speziell während der Stille-Phase. `prefers-reduced-motion` wird global respektiert (Animationsdauer auf ~0 gesetzt).
- **Fortschrittsanzeige:** Fünf dezente Punkte plus eine hauchdünne Fortschrittslinie über den Gesamtverlauf – bewusst ohne Nummerierung oder Prozentangaben.
- **Gesang-Auswahl:** Ein schlichtes Dropdown ("Gesang wählen") auf dem Auswahl-Bildschirm statt automatischer Rotation – vorhersehbarer für die Nutzerin, mit sinnvollem Standardwert (Rotation nach Wochentag) vorbelegt.

## Musik während der Stille

Die Gesänge werden **ausschließlich per offiziellem YouTube-IFrame-Embed** der Ateliers et Presses de Taizé gestreamt – es werden keine Audiodateien selbst gehostet oder heruntergeladen. Der Player ist unsichtbar (1×1 px, `aria-hidden`), startet automatisch mit der Stille-Phase, pausiert bei jedem Phasenwechsel und läuft gedämpft (Lautstärke ~35 %). Falls der Browser Autoplay mit Ton blockiert, erscheint der Hinweis "Tippe zum Abspielen des Gesangs". Weitere Gesänge lassen sich jederzeit in `client/src/data/chants.json` ergänzen (Titel + YouTube-Video-ID).

## Lizenzhinweis Herrnhuter Losungen

Die Losungen und der Lehrtext sind urheberrechtlich geschützt (Evangelische Brüder-Unität Herrnhut) und dürfen laut Nutzungsbedingungen nicht auf kommerziellen Seiten oder in kostenpflichtiger Software verwendet werden. Diese App ist **rein privat und nicht-kommerziell**, enthält keine Werbung, kein Tracking und wird nicht als Produkt öffentlich verbreitet. Bitte bei eigener Weiterverwendung die Nutzungsbedingungen von [losung.net](https://losung.net) beachten.

## Lokal starten

Voraussetzung: Node.js ≥ 18.

```bash
# einmalig, im Projekt-Wurzelverzeichnis
npm install
npm run install:all

# startet Backend (Port 3001) und Frontend (Port 5173) gleichzeitig
npm run dev
```

Anschließend die App unter **http://localhost:5173** öffnen. Der Vite-Dev-Server proxyt `/api`-Aufrufe automatisch zum Backend – keine weitere Konfiguration nötig.

Alternative, ganz ohne Root-Setup (zwei Terminals):

```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

### Tests

```bash
npm test --prefix server    # Parser-Tests gegen eine gespeicherte losung.net-Fixture
```

Bricht der Test nach einer HTML-Änderung von losung.net, greift in Produktion automatisch der Fallback – der Test zeigt, dass das Parsing angepasst werden muss.

### Production-Build (optional)

```bash
npm run build              # baut client/dist
npm start                   # startet den Server, der client/dist automatisch mitausliefert
```

## Deployment auf Vercel

Das Repo ist für Vercel vorkonfiguriert (`vercel.json`):

- **Frontend:** `buildCommand` installiert die Client-Dependencies und baut nach `client/dist` (Output Directory).
- **Backend:** Die Express-App ist von `listen()` getrennt (`server/src/app.js`) und wird über `api/index.js` als Serverless Function exportiert; ein Rewrite leitet alle `/api/*`-Requests dorthin. Die Server-Dependencies (express, cheerio, cors) stehen dafür auch im Root-`package.json`, damit Vercels Bundler sie auflösen kann.
- Der In-Memory-Cache gilt pro warmgehaltener Function-Instanz – für den privaten Gebrauch völlig ausreichend, im Kaltstart wird einfach neu gefetcht.

Einfach das GitHub-Repo in Vercel importieren, keine weiteren Einstellungen nötig. Hinweis: Das Deployment sollte privat bleiben (Losungen-Nutzungsbedingungen, siehe Lizenzhinweis oben).
