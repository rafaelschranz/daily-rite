// Vercel Serverless Function: kapselt die Express-App.
// Alle /api/*-Requests werden per Rewrite (vercel.json) hierher geleitet.
import { app } from '../server/src/app.js';

export default app;
