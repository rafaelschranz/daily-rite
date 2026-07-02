export default function ProgressDots({ steps, stepIndex, elapsedTotal, totalDuration }) {
  const progressPercent = Math.min(100, (elapsedTotal / totalDuration) * 100);

  return (
    <div
      style={{ width: '100%', maxWidth: 280, margin: '0 auto' }}
      role="group"
      aria-label={`Schritt ${stepIndex + 1} von ${steps.length}`}
    >
      <div
        style={{
          height: 2,
          borderRadius: 2,
          background: 'var(--dot-inactive)',
          overflow: 'hidden',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'var(--accent-gold)',
            transition: 'width 1s linear',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        {steps.map((step, index) => (
          <span
            key={step.id}
            style={{
              width: index === stepIndex ? 8 : 6,
              height: index === stepIndex ? 8 : 6,
              borderRadius: '50%',
              background: index <= stepIndex ? 'var(--accent-gold)' : 'var(--dot-inactive)',
              opacity: index === stepIndex ? 1 : 0.7,
              transition: 'all 0.4s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
