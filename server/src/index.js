import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { getLosungAbend } from './routes/losung.js';
import { getTaizeReading } from './routes/taize.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

// Tagesverse sollen nicht vom Browser (heuristisch) gecacht werden –
// die Aktualität steuert der serverseitige, tagesscharfe Cache.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/api/taize-reading', async (_req, res) => {
  res.json(await getTaizeReading());
});

app.get('/api/losung-abend', async (_req, res) => {
  res.json(await getLosungAbend());
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Optional: gebautes Frontend mitausliefern (npm run build im client-Ordner),
// damit die App auch mit einem einzigen laufenden Prozess nutzbar ist.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`daily-rite Server läuft auf http://localhost:${PORT}`);
});
