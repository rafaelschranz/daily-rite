import Candle from './Candle.jsx';

const CLOSINGS = {
  morgen: 'Geh gesegnet in den Tag.',
  mittag: 'Ein gesegneter Tag.',
  abend: 'Eine gute Nacht.',
};

export default function FinishedView({ mode, onRestart }) {
  const closing = CLOSINGS[mode] ?? CLOSINGS.mittag;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '32px 24px',
        textAlign: 'center',
      }}
    >
      <Candle />
      <div>
        <p className="verse-serif" style={{ fontSize: 26, fontStyle: 'italic', margin: '0 0 6px' }}>
          Amen.
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{closing}</p>
      </div>
      <button type="button" className="btn" style={{ marginTop: 12 }} onClick={onRestart}>
        Neu beginnen
      </button>
    </main>
  );
}
