import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './index.css';

// Sobald ein neuer Service Worker die Kontrolle übernimmt (nach einem Deploy),
// die Seite einmal automatisch neu laden – sonst bleibt ein offener Tab auf der
// alten, gecachten Version stehen, ohne dass etwas darauf hindeutet.
let reloading = false;
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (reloading) return;
  reloading = true;
  window.location.reload();
});

registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    // Auch bei lange offenem Tab regelmäßig auf ein neues Deployment prüfen.
    if (!registration) return;
    setInterval(() => registration.update(), 60 * 60 * 1000);
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
