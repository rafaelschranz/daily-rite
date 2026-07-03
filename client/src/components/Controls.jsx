import { useState } from 'react';
import { BellIcon, BellOffIcon, MusicIcon, MusicOffIcon } from './icons.jsx';

export default function Controls({
  isRunning,
  hasStarted,
  onStart,
  onPause,
  onReset,
  bellMuted,
  onToggleBell,
  chantVolume,
  onChantVolume,
}) {
  // Der Regler ist standardmäßig ausgeblendet – ein schlichteres Bild während
  // der Gebetszeit. Ein Klick aufs Lautstärke-Icon blendet ihn kurz ein.
  const [volumeOpen, setVolumeOpen] = useState(false);
  const chantMuted = chantVolume === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {isRunning ? (
          <button type="button" className="btn btn-primary" onClick={onPause}>
            Pause
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onStart}>
            {hasStarted ? 'Weiter' : 'Start'}
          </button>
        )}
        {hasStarted && (
          <button type="button" className="btn" onClick={onReset}>
            Zurücksetzen
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          className="btn btn-icon"
          onClick={onToggleBell}
          aria-pressed={!bellMuted}
          aria-label={bellMuted ? 'Glocke einschalten' : 'Glocke stummschalten'}
          title={bellMuted ? 'Glocke einschalten' : 'Glocke stummschalten'}
        >
          {bellMuted ? <BellOffIcon /> : <BellIcon />}
        </button>
        <button
          type="button"
          className="btn btn-icon"
          onClick={() => setVolumeOpen((open) => !open)}
          aria-expanded={volumeOpen}
          aria-label="Lautstärke des Gesangs"
          title="Lautstärke des Gesangs"
        >
          {chantMuted ? <MusicOffIcon /> : <MusicIcon />}
        </button>
        {volumeOpen && (
          <input
            type="range"
            className="volume-slider"
            min="0"
            max="100"
            step="5"
            value={chantVolume}
            onChange={(event) => onChantVolume(Number(event.target.value))}
            aria-label="Lautstärke des Gesangs"
          />
        )}
      </div>
    </div>
  );
}
