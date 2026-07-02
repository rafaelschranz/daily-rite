function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function StepView({ step, verse, secondsLeft, showTapHint, onTapPlay }) {
  if (step.kind === 'silence') {
    return (
      <div className="step-content" style={{ textAlign: 'center' }} aria-live="polite">
        <p className="verse-serif" style={{ fontSize: 22, color: 'var(--text-muted)', margin: '0 0 8px' }}>
          {step.label}
        </p>
        <p className="tnum" style={{ fontSize: 14, color: 'var(--text-faint)', letterSpacing: '0.08em' }}>
          {formatSeconds(secondsLeft)}
        </p>
        {showTapHint && (
          <button
            type="button"
            className="btn btn-ghost pulse"
            onClick={onTapPlay}
            style={{ marginTop: 24, fontSize: 13 }}
          >
            Tippe zum Abspielen des Gesangs
          </button>
        )}
      </div>
    );
  }

  if (step.kind === 'verse') {
    if (verse === undefined) {
      return (
        <p className="pulse" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Der Vers wird geladen …
        </p>
      );
    }
    if (verse === null) {
      return (
        <div className="step-content" style={{ textAlign: 'center', maxWidth: 380 }} aria-live="polite">
          <p className="verse-serif" style={{ fontSize: 26, fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 14px' }}>
            Sei still und lausche. Auch ohne Worte bist du gehalten.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Der Tagesvers konnte nicht geladen werden.
          </p>
        </div>
      );
    }
    return (
      <div className="step-content" style={{ textAlign: 'center', maxWidth: 380 }} aria-live="polite">
        <p className="verse-serif" style={{ fontSize: 26, fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 14px' }}>
          {verse.text}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.03em' }}>{verse.reference}</p>
        {verse.source === 'fallback' && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 18 }}>
            Der Tagesvers konnte nicht geladen werden – ein Wort aus dem Ruhepuffer.
          </p>
        )}
      </div>
    );
  }

  if (step.kind === 'prayer') {
    return (
      <div className="step-content" style={{ textAlign: 'center', maxWidth: 380 }} aria-live="polite">
        <p style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
          {step.label}
        </p>
        <p className="verse-serif" style={{ fontSize: 21, lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>
          {step.text}
        </p>
      </div>
    );
  }

  return (
    <p
      className="verse-serif step-content"
      style={{ textAlign: 'center', fontSize: 24, fontStyle: 'italic', maxWidth: 340 }}
      aria-live="polite"
    >
      {step.text}
    </p>
  );
}
