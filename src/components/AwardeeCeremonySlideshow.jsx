import { useCallback, useEffect, useState } from 'react';
import './AwardeeCeremonySlideshow.css';

/**
 * Full-screen modal slideshow for prize distribution.
 * Each slide: event name, winner, 1st/2nd runner-up (generic layout).
 */
const AwardeeCeremonySlideshow = ({ items, onClose }) => {
  const slides = items || [];
  const total = slides.length;
  const [index, setIndex] = useState(0);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(total - 1, i + 1));
  }, [total]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, goPrev, goNext]);

  useEffect(() => {
    setIndex(0);
  }, [items]);

  if (total === 0) return null;

  const current = slides[index];

  return (
    <div
      className="ceremony-slideshow"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ceremony-slideshow-title"
    >
      <div className="ceremony-slideshow__backdrop" aria-hidden="true" />
      <div className="ceremony-slideshow__sparkles" aria-hidden="true" />

      <button
        type="button"
        className="ceremony-slideshow__close"
        onClick={onClose}
        aria-label="Close slideshow"
      >
        ×
      </button>

      <p className="ceremony-slideshow__festive-tag">Prize distribution</p>

      <div className="ceremony-slideshow__stage" key={current.id ?? index}>
        <h1 id="ceremony-slideshow-title" className="ceremony-slideshow__event">
          {current.event_name}
        </h1>

        <div className="ceremony-slideshow__honorees">
          <div className="ceremony-slideshow__honoree ceremony-slideshow__honoree--winner">
            <span className="ceremony-slideshow__role">Winner</span>
            <span className="ceremony-slideshow__medal" aria-hidden="true">🥇</span>
            <p className="ceremony-slideshow__name">{current.winner_name}</p>
          </div>

          <div className="ceremony-slideshow__honoree ceremony-slideshow__honoree--runner">
            <span className="ceremony-slideshow__role">1st Runner-up</span>
            <span className="ceremony-slideshow__medal" aria-hidden="true">🥈</span>
            <p className="ceremony-slideshow__name">
              {current.runner_up_name?.trim() ? current.runner_up_name : '—'}
            </p>
          </div>

          <div className="ceremony-slideshow__honoree ceremony-slideshow__honoree--bronze">
            <span className="ceremony-slideshow__role">2nd Runner-up</span>
            <span className="ceremony-slideshow__medal" aria-hidden="true">🥉</span>
            <p className="ceremony-slideshow__name">
              {current.bronze_name?.trim() ? current.bronze_name : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="ceremony-slideshow__controls">
        <button
          type="button"
          className="ceremony-slideshow__nav"
          onClick={goPrev}
          disabled={index === 0}
        >
          Previous
        </button>
        <span className="ceremony-slideshow__progress" aria-live="polite">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          className="ceremony-slideshow__nav ceremony-slideshow__nav--primary"
          onClick={goNext}
          disabled={index >= total - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AwardeeCeremonySlideshow;
