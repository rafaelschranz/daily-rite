import { useCallback, useEffect, useRef, useState } from 'react';
import Candle from './components/Candle.jsx';
import ChantPlayer from './components/ChantPlayer.jsx';
import Controls from './components/Controls.jsx';
import FinishedView from './components/FinishedView.jsx';
import ModeSelect from './components/ModeSelect.jsx';
import ProgressDots from './components/ProgressDots.jsx';
import StepView from './components/StepView.jsx';
import chants from './data/chants.json';
import { TOTAL_DURATION } from './data/steps.js';
import { useBell } from './hooks/useBell.js';
import { usePrayerSession } from './hooks/usePrayerSession.js';
import { useWakeLock } from './hooks/useWakeLock.js';
import { fetchLosungAbend, fetchLosungMorgen, fetchTaizeReading } from './lib/api.js';
import { loadJSON, saveJSON } from './lib/storage.js';

const MODE_LABELS = { morgen: 'Morgen', mittag: 'Mittag', abend: 'Abend' };

function suggestMode() {
  const hour = new Date().getHours();
  if (hour < 11) return 'morgen';
  return hour < 15 ? 'mittag' : 'abend';
}

function weekdayChantId() {
  return chants[new Date().getDay() % chants.length].youtubeId;
}

function formatClock(totalSeconds) {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

export default function App() {
  const [screen, setScreen] = useState('select');
  const [mode, setMode] = useState(() => loadJSON('lastMode', suggestMode()));
  const [chantId, setChantId] = useState(() => loadJSON('chantId', weekdayChantId()));
  const [bellMuted, setBellMuted] = useState(() => loadJSON('muteBell', false));
  const [chantMuted, setChantMuted] = useState(() => loadJSON('muteChant', false));
  const [needsTap, setNeedsTap] = useState(false);
  // undefined = lädt noch, null = endgültig fehlgeschlagen (siehe api.js).
  const [taize, setTaize] = useState(undefined);
  const [losung, setLosung] = useState(undefined);
  const [losungMorgen, setLosungMorgen] = useState(undefined);

  const loadVerses = useCallback(() => {
    fetchTaizeReading().then(setTaize);
    fetchLosungMorgen().then(setLosungMorgen);
    fetchLosungAbend().then(setLosung);
  }, []);

  useEffect(() => {
    loadVerses();
  }, [loadVerses]);

  useEffect(() => saveJSON('lastMode', mode), [mode]);
  useEffect(() => saveJSON('chantId', chantId), [chantId]);
  useEffect(() => saveJSON('muteBell', bellMuted), [bellMuted]);
  useEffect(() => saveJSON('muteChant', chantMuted), [chantMuted]);

  const playBell = useBell(bellMuted);
  const chantPlayerRef = useRef(null);
  const handleStepChange = useCallback(() => playBell(), [playBell]);

  const session = usePrayerSession(mode, { onStepChange: handleStepChange, onFinish: playBell });

  // Display anlassen, solange die Gebetszeit läuft (Haupt-Use-Case: Handy).
  useWakeLock(session.isRunning);

  if (screen === 'select') {
    return (
      <ModeSelect
        mode={mode}
        onModeChange={setMode}
        chantId={chantId}
        onChantChange={setChantId}
        onBegin={() => {
          // Verse auffrischen, falls die App seit dem letzten Öffnen den Tag gewechselt hat.
          loadVerses();
          setScreen('session');
        }}
      />
    );
  }

  if (session.isFinished) {
    return (
      <FinishedView
        mode={mode}
        onRestart={() => {
          session.reset();
          setScreen('select');
        }}
      />
    );
  }

  const verseByType = { taize, losung, 'losung-morgen': losungMorgen };
  const verse = session.step.verseType ? verseByType[session.step.verseType] : null;
  const isSilence = session.step.kind === 'silence';
  const chantActive = isSilence && session.isRunning;
  const modeLabel = MODE_LABELS[mode] ?? 'Mittag';

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 24px 32px',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
      }}
    >
      <ChantPlayer
        ref={chantPlayerRef}
        videoId={chantId}
        isActive={chantActive}
        muted={chantMuted}
        onNeedsTap={setNeedsTap}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            session.reset();
            setScreen('select');
          }}
        >
          ← Auswahl
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-faint)', fontSize: 13 }}>
          <span>{modeLabel}</span>
          {!isSilence && <span className="tnum">{formatClock(session.secondsLeft)}</span>}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
        <Candle breathing={isSilence && session.isRunning} />
        <StepView
          step={session.step}
          verse={verse}
          secondsLeft={session.secondsLeft}
          showTapHint={chantActive && needsTap}
          onTapPlay={() => {
            chantPlayerRef.current?.play();
            setNeedsTap(false);
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <ProgressDots
          steps={session.steps}
          stepIndex={session.stepIndex}
          elapsedTotal={session.elapsedTotal}
          totalDuration={TOTAL_DURATION}
        />
        <Controls
          isRunning={session.isRunning}
          hasStarted={session.hasStarted}
          onStart={session.start}
          onPause={session.pause}
          onReset={session.reset}
          bellMuted={bellMuted}
          onToggleBell={() => setBellMuted((value) => !value)}
          chantMuted={chantMuted}
          onToggleChant={() => setChantMuted((value) => !value)}
        />
      </div>
    </main>
  );
}
