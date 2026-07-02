import { useCallback, useRef } from 'react';

export function useBell(muted) {
  const ctxRef = useRef(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  return useCallback(() => {
    if (mutedRef.current) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = ctxRef.current ?? (ctxRef.current = new AudioCtx());
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const fundamental = 528;

    [1, 2.4, 3.9].forEach((multiplier, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = fundamental * multiplier;

      const peak = 0.16 / (index + 1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.7);
    });
  }, []);
}
