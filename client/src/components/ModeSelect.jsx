import chants from '../data/chants.json';
import Candle from './Candle.jsx';
import { MoonIcon, SunIcon, SunriseIcon } from './icons.jsx';

const SILENCE_OPTIONS = [3, 5, 10];

export default function ModeSelect({
  mode,
  onModeChange,
  chantId,
  onChantChange,
  silenceMin,
  onSilenceMinChange,
  jahreslosung,
  onBegin,
}) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: '32px 24px',
      }}
    >
      <Candle />
      <div style={{ textAlign: 'center' }}>
        <h1 className="verse-serif" style={{ fontSize: 34, fontWeight: 500, margin: '0 0 8px' }}>
          Silentium
        </h1>
        {jahreslosung && (
          <p
            className="verse-serif"
            style={{ color: 'var(--text-faint)', fontSize: 15, fontStyle: 'italic', maxWidth: 320, margin: '14px auto 0' }}
          >
            {jahreslosung}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 340 }} role="group" aria-label="Tageszeit wählen">
        <button
          type="button"
          className={`mode-btn${mode === 'morgen' ? ' active' : ''}`}
          onClick={() => onModeChange('morgen')}
          aria-pressed={mode === 'morgen'}
        >
          <SunriseIcon width={16} height={16} />
          Morgen
        </button>
        <button
          type="button"
          className={`mode-btn${mode === 'mittag' ? ' active' : ''}`}
          onClick={() => onModeChange('mittag')}
          aria-pressed={mode === 'mittag'}
        >
          <SunIcon width={16} height={16} />
          Mittag
        </button>
        <button
          type="button"
          className={`mode-btn${mode === 'abend' ? ' active' : ''}`}
          onClick={() => onModeChange('abend')}
          aria-pressed={mode === 'abend'}
        >
          <MoonIcon width={16} height={16} />
          Abend
        </button>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 340, color: 'var(--text-muted)', fontSize: 13 }}>
        Gesang wählen
        <select className="select" value={chantId} onChange={(event) => onChantChange(event.target.value)}>
          {chants.map((chant) => (
            <option key={chant.youtubeId} value={chant.youtubeId}>
              {chant.title}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 340, color: 'var(--text-muted)', fontSize: 13 }}>
        Stille
        <div style={{ display: 'flex', gap: 8 }} role="group" aria-label="Dauer der Stille">
          {SILENCE_OPTIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              className={`pill${silenceMin === minutes ? ' active' : ''}`}
              onClick={() => onSilenceMinChange(minutes)}
              aria-pressed={silenceMin === minutes}
            >
              {minutes} Min
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="btn btn-primary" onClick={onBegin}>
        Beginnen
      </button>

      <a
        href="/gebetszeiten.ics"
        download
        style={{ color: 'var(--text-faint)', fontSize: 12, textDecoration: 'none' }}
      >
        Gebetszeiten für den Kalender (.ics)
      </a>
    </main>
  );
}
