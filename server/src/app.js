import cors from 'cors';
import express from 'express';
import { getLosungAbend, getLosungMorgen } from './routes/losung.js';
import { getTaizeReading } from './routes/taize.js';

// Reine App-Definition ohne listen(): wird lokal von index.js gestartet
// und auf Vercel als Serverless Function (api/index.js) exportiert.
export const app = express();
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

app.get('/api/losung-morgen', async (_req, res) => {
  res.json(await getLosungMorgen());
});

app.get('/api/losung-abend', async (_req, res) => {
  res.json(await getLosungAbend());
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
