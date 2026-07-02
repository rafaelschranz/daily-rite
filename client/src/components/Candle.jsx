import './Candle.css';

export default function Candle({ breathing = false }) {
  return (
    <div className="candle-wrap" aria-hidden="true">
      <div className={`candle-glow${breathing ? ' breathing' : ''}`} />
      <div className="candle-body">
        <div className="candle-wick" />
        <div className="candle-flame">
          <div className="flame-outer" />
        </div>
      </div>
    </div>
  );
}
