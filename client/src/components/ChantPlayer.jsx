import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { loadYouTubeAPI } from '../lib/youtube.js';

const ChantPlayer = forwardRef(function ChantPlayer({ videoId, isActive, muted, onNeedsTap }, ref) {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const failedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    play: () => {
      playerRef.current?.playVideo?.();
    },
  }));

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    failedRef.current = false;

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !mountRef.current) return;
      playerRef.current = new YT.Player(mountRef.current, {
        height: '1',
        width: '1',
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          playsinline: 1,
          fs: 0,
        },
        events: {
          onReady: () => setReady(true),
          onError: (event) => {
            // Video gelöscht/gesperrt: merken, damit kein irreführender
            // "Tippe zum Abspielen"-Hinweis erscheint.
            console.warn(`[chant] Video ${videoId} nicht abspielbar (Code ${event?.data})`);
            failedRef.current = true;
            onNeedsTap?.(false);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId, onNeedsTap]);

  useEffect(() => {
    if (!ready) return;
    playerRef.current?.setVolume?.(muted ? 0 : 35);
  }, [muted, ready]);

  useEffect(() => {
    if (!ready) return undefined;
    const player = playerRef.current;
    if (!player) return undefined;

    if (isActive) {
      player.playVideo?.();
      const check = setTimeout(() => {
        if (failedRef.current) return;
        const state = player.getPlayerState?.();
        // 1 = playing; alles andere deutet auf einen Autoplay-Block hin.
        onNeedsTap?.(state !== 1);
      }, 900);
      return () => clearTimeout(check);
    }

    player.pauseVideo?.();
    onNeedsTap?.(false);
    return undefined;
  }, [isActive, ready, onNeedsTap]);

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', top: 0, left: 0, width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
    >
      <div ref={mountRef} />
    </div>
  );
});

export default ChantPlayer;
