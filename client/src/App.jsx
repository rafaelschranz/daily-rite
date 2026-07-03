import { useCallback, useEffect, useRef, useState } from 'react';
import Candle from './components/Candle.jsx';
import ChantPlayer from './components/ChantPlayer.jsx';
import Controls from './components/Controls.jsx';
import FinishedView from './components/FinishedView.jsx';
import ModeSelect from './components/ModeSelect.jsx';
import ProgressDots from './components/ProgressDots.jsx';
import StepView from './components/StepView.jsx';
import chants from './data/chants.json';
import { useBell } from './hooks/useBell.js';
import { usePrayerSession } from './hooks/usePrayerSession.js';
import { useWakeLock } from './hooks/useWakeLock.js';
import { fetchJahreslosung, fetchLosungAbend, fetchLosungMorgen, fetchTaizeReading } from './lib/api.js';
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
  const [chantVolume, setChantVolume] = useState(() => loadJSON('chantVolume', 35));
  const [silenceMin, setSilenceMin] = useState(() => loadJSON('silenceMin', 3));
  const [needsTap, setNeedsTap] = useState(false);
  // undefined = lädt noch, null = endgültig fehlgeschlagen (siehe api.js).
  const [taize, setTaize] = useState(undefined);
  const [losung, setLosung] = useState(undefined);
  const [losungMorgen, setLosungMorgen] = useState(undefined);
  const [jahreslosung, setJahreslosung] = useState(null);

  // UI-Ausblenden während der Stille: nach ein paar Sekunden verschwinden
  // Header und Controls; ein Tap auf die Fläche holt sie zurück.
  const [uiHidden, setUiHidden] = useState(false);
  const [revealTick, setRevealTick] = useState(0);

  const loadVerses = useCallback(() => {
    fetchTaizeReading().then(setTaize);
    fetchLosungMorgen().then(setLosungMorgen);
    fetchLosungAbend().then(setLosung);
    fetchJahreslosung().then((data) => setJahreslosung(data?.text ?? null));
  }, []);

  useEffect(() => {
    loadVerses();
  }, [loadVerses]);

  useEffect(() => saveJSON('lastMode', mode), [mode]);
  useEffect(() => saveJSON('chantId', chantId), [chantId]);
  useEffect(() => saveJSON('muteBell', bellMuted), [bellMuted]);
  useEffect(() => saveJSON('muteChant', chantMuted), [chantMuted]);
  useEffect(() => saveJSON('chantVolume', chantVolume), [chantVolume]);
  useEffect(() => saveJSON('silenceMin', silenceMin), [silenceMin]);

  // Tageszeit-Stimmung: Hintergrund und Kerzenglimmen folgen dem Modus (index.css).
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  const playBell = useBell(bellMuted);
  const chantPlayerRef = useRef(null);
  const handleStepChange = useCallback(() => {
    playBell();
    navigator.vibrate?.(35);
  }, [playBell]);
  const handleFinish = useCallback(() => {
    playBell();
    navigator.vibrate?.([35, 70, 35]);
  }, [playBell]);

  const session = usePrayerSession(mode, {
    silenceSeconds: silenceMin * 60,
    onStepChange: handleStepChange,
    onFinish: handleFinish,
  });

  // Display anlassen, solange die Gebetszeit läuft (Haupt-Use-Case: Handy).
  useWakeLock(session.isRunning);

  const isSilence = session.step.kind === 'silence';
  const silenceRunning = isSilence && session.isRunning;

  useEffect(() => {
    if (!silenceRunning || needsTap) {
      setUiHidden(false);
      return undefined;
    }
    const timer = setTimeout(() => setUiHidden(true), 5000);
    return () => clearTimeout(timer);
  }, [silenceRunning, needsTap, revealTick]);

  if (screen === 'select') {
    return (
      <ModeSelect
        mode={mode}
        onModeChange={setMode}
        chantId={chantId}
        onChantChange={setChantId}
        silenceMin={silenceMin}
        onSilenceMinChange={setSilenceMin}
        jahreslosung={jahreslosung}
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
  const chantActive = silenceRunning;
  const modeLabel = MODE_LABELS[mode] ?? 'Mittag';

  return (
    <main
      onPointerDown={() => {
        if (!silenceRunning) return;
        setUiHidden(false);
        setRevealTick((tick) => tick + 1);
      }}
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
        volume={chantVolume}
        onNeedsTap={setNeedsTap}
      />

      <div
        className={`fade-ui${uiHidden ? ' is-hidden' : ''}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
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
        <Candle
          breathing={silenceRunning}
          breathGuide={session.step.id === 'ankommen' && session.isRunning}
        />
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

      <div className={`fade-ui${uiHidden ? ' is-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <ProgressDots
          steps={session.steps}
          stepIndex={session.stepIndex}
          elapsedTotal={session.elapsedTotal}
          totalDuration={session.totalDuration}
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
          chantVolume={chantVolume}
          onChantVolume={setChantVolume}
        />
      </div>
    </main>
  );
}
