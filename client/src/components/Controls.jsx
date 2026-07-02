import { BellIcon, BellOffIcon, MusicIcon, MusicOffIcon } from './icons.jsx';

export default function Controls({
  isRunning,
  hasStarted,
  onStart,
  onPause,
  onReset,
  bellMuted,
  onToggleBell,
  chantMuted,
  onToggleChant,
}) {
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
      <div style={{ display: 'flex', gap: 10 }}>
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
          onClick={onToggleChant}
          aria-pressed={!chantMuted}
          aria-label={chantMuted ? 'Gesang einschalten' : 'Gesang stummschalten'}
          title={chantMuted ? 'Gesang einschalten' : 'Gesang stummschalten'}
        >
          {chantMuted ? <MusicOffIcon /> : <MusicIcon />}
        </button>
      </div>
    </div>
  );
}
