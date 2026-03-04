import { useState } from 'react';
import './TossPage.css';

const TossPage = () => {
  const [result, setResult] = useState(null);
  const [choice, setChoice] = useState(null);
  const [flipping, setFlipping] = useState(false);

  const flip = (userChoice) => {
    if (flipping) return;
    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    setChoice(userChoice);
    setResult(outcome);
    setFlipping(true);

    const duration = 1200;
    setTimeout(() => setFlipping(false), duration);
  };

  const won = result && choice && result === choice.toLowerCase();

  return (
    <div className="toss-page">
      <h1 className="toss-page__title">Coin Toss</h1>
      <p className="toss-page__subtitle">Pick Heads or Tails and flip the coin</p>

      <div className={`toss-page__coin-wrap ${flipping ? 'toss-page__coin-wrap--flipping' : ''}`}>
        <div
          className={`toss-page__coin ${flipping ? 'toss-page__coin--flipping' : ''}`}
          data-result={result || 'heads'}
          aria-hidden
        >
          <div className="toss-page__coin-face toss-page__coin-face--heads">
            <div className="toss-page__coin-inr-heads">
              <span className="toss-page__coin-hindi">भारत</span>
              <span className="toss-page__coin-emblem" aria-hidden>
                <svg viewBox="0 0 24 24" className="toss-page__emblem-svg">
                  <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.2"/>
                  {[...Array(24)].map((_, i) => {
                    const a = (i * 15 - 90) * Math.PI / 180;
                    const x1 = 12 + 6 * Math.cos(a);
                    const y1 = 12 + 6 * Math.sin(a);
                    const x2 = 12 + 9 * Math.cos(a);
                    const y2 = 12 + 9 * Math.sin(a);
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.8"/>;
                  })}
                </svg>
              </span>
              <span className="toss-page__coin-english">INDIA</span>
            </div>
          </div>
          <div className="toss-page__coin-face toss-page__coin-face--tails">
            <div className="toss-page__coin-inr-tails">
              <span className="toss-page__coin-hindi">रुपया</span>
              <span className="toss-page__coin-value">1</span>
              <span className="toss-page__coin-english">RUPEE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="toss-page__buttons">
        <button
          type="button"
          className="toss-page__btn toss-page__btn--heads"
          onClick={() => flip('heads')}
          disabled={flipping}
        >
          Heads
        </button>
        <button
          type="button"
          className="toss-page__btn toss-page__btn--tails"
          onClick={() => flip('tails')}
          disabled={flipping}
        >
          Tails
        </button>
      </div>

      {result && !flipping && (
        <div className="toss-page__result">
          <p className="toss-page__outcome">
            Result: <strong>{result.charAt(0).toUpperCase() + result.slice(1)}</strong>
          </p>
          <p className={`toss-page__verdict ${won ? 'toss-page__verdict--won' : 'toss-page__verdict--lost'}`}>
            {won ? "You won!" : "Better luck next time!"}
          </p>
        </div>
      )}
    </div>
  );
};

export default TossPage;
