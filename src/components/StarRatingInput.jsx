import { useState } from 'react';
import { ratingLabel } from '../utils/feedbackApi';
import './StarRatingInput.css';

const STAR_COUNT = 5;

function starFill(rating, index) {
  if (rating >= index) return 'full';
  if (rating >= index - 0.5) return 'half';
  return 'empty';
}

const StarRatingInput = ({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  compact = false,
  id = 'star-rating',
}) => {
  const [hoverRating, setHoverRating] = useState(null);
  const displayRating = hoverRating ?? value ?? null;
  const starsRating = displayRating ?? 0;

  const setFromPointer = (event, starIndex) => {
    if (disabled || readOnly) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const isLeftHalf = event.clientX - rect.left < rect.width / 2;
    const next = isLeftHalf ? starIndex - 0.5 : starIndex;
    onChange(next);
  };

  return (
    <div
      className={`star-rating${compact ? ' star-rating--compact' : ''}`}
      id={id}
    >
      <div
        className="star-rating__stars"
        role={readOnly ? 'img' : 'slider'}
        aria-label={readOnly ? `Rating ${value} out of 5` : 'Select a rating from 0 to 5 stars'}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={value ?? 0}
        onMouseLeave={() => !readOnly && setHoverRating(null)}
      >
        {Array.from({ length: STAR_COUNT }, (_, i) => {
          const starIndex = i + 1;
          const fill = starFill(starsRating, starIndex);
          return (
            <button
              key={starIndex}
              type="button"
              className={`star-rating__star star-rating__star--${fill}`}
              disabled={disabled || readOnly}
              aria-hidden={readOnly ? undefined : true}
              tabIndex={readOnly ? -1 : 0}
              onMouseMove={(e) => {
                if (readOnly) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const isLeftHalf = e.clientX - rect.left < rect.width / 2;
                setHoverRating(isLeftHalf ? starIndex - 0.5 : starIndex);
              }}
              onClick={(e) => setFromPointer(e, starIndex)}
              onKeyDown={(e) => {
                if (readOnly || disabled) return;
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  onChange(Math.min(5, (value ?? 0) + 0.5));
                }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  onChange(Math.max(0, (value ?? 0) - 0.5));
                }
              }}
            />
          );
        })}
      </div>
      {!compact && (
        <p className="star-rating__label">
          {displayRating == null
            ? 'Select a rating (required)'
            : ratingLabel(displayRating)}
          {!readOnly && value != null && (
            <span className="star-rating__value"> ({value} / 5)</span>
          )}
        </p>
      )}
      {!readOnly && (
        <button
          type="button"
          className="star-rating__zero"
          disabled={disabled}
          onClick={() => onChange(0)}
        >
          0 — Improvement needed
        </button>
      )}
    </div>
  );
};

export default StarRatingInput;
