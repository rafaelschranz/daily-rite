import { useEffect } from 'react';

// Hält das Display an, solange die Gebetszeit läuft – sonst geht das Handy
// mitten in der Stille aus. Nicht unterstützte Browser ignorieren das still.
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;

    let lock = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        // z.B. Energiesparmodus oder fehlende Berechtigung – dann eben ohne.
      }
    };

    // Der Lock geht beim Tab-Wechsel verloren; bei Rückkehr neu anfordern.
    const onVisibility = () => {
      if (!cancelled && document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release?.().catch(() => {});
    };
  }, [active]);
}
