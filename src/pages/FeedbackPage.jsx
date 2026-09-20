import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import StarRatingInput from '../components/StarRatingInput';
import {
  RATING_OPTIONS,
  createFeedback,
  displayName,
  fetchFeedback,
  formatFeedbackDateTime,
} from '../utils/feedbackApi';
import './FeedbackPage.css';

const emptyForm = {
  name: '',
  is_anonymous: false,
  rating: null,
  feedback_text: '',
};

const FeedbackPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [minRating, setMinRating] = useState('all');
  const [maxRating, setMaxRating] = useState('all');
  const [anonymousFilter, setAnonymousFilter] = useState('all');
  const [hasComment, setHasComment] = useState('all');

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchFeedback({
        sortBy,
        sortOrder,
        minRating,
        maxRating,
        anonymous: anonymousFilter,
        hasComment,
      });
      setItems(result.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load feedback.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, minRating, maxRating, anonymousFilter, hasComment]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (form.rating == null) {
      setFormError('Please select a star rating.');
      return;
    }
    if (!form.is_anonymous && !form.name.trim()) {
      setFormError('Enter your name or choose Anonymous.');
      return;
    }

    setSubmitting(true);
    try {
      await createFeedback({
        name: form.is_anonymous ? null : form.name.trim(),
        is_anonymous: form.is_anonymous,
        rating: form.rating,
        feedback_text: form.feedback_text.trim() || null,
      });
      setForm(emptyForm);
      setFormSuccess('Thank you for your feedback!');
      await loadFeedback();
    } catch (err) {
      setFormError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const ratingOptionLabel = (value) => {
    if (value === 0) return '0 — Improvement needed';
    if (value === 5) return '5 — Awesome';
    return String(value);
  };

  return (
    <div className="feedback-page ganpati-theme">
      <ThemeToggle />

      <header className="feedback-header">
        <Link to="/" className="feedback-back-link">
          ← Back to Home
        </Link>
        <h1 className="feedback-title">Celebria Ganpati Festival 2026</h1>
        <p className="feedback-subtitle">Feedback</p>
      </header>

      <main className="feedback-content">
        <section className="feedback-form-section">
          <h2>Share your feedback</h2>
          <form className="feedback-form" onSubmit={handleSubmit}>
            <div className="feedback-field">
              <div className="feedback-checkbox-row">
                <input
                  id="feedback-anonymous"
                  type="checkbox"
                  checked={form.is_anonymous}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm((prev) => ({
                      ...prev,
                      is_anonymous: checked,
                      name: checked ? '' : prev.name,
                    }));
                  }}
                />
                <label htmlFor="feedback-anonymous">Anonymous</label>
              </div>
            </div>
            <div className="feedback-field">
              <label htmlFor="feedback-name">Name</label>
              <input
                id="feedback-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={form.is_anonymous}
                required={!form.is_anonymous}
                maxLength={255}
                placeholder={form.is_anonymous ? 'Not required when anonymous' : 'Your name'}
              />
            </div>
            <div className="feedback-field">
              <label id="feedback-rating-label">Rating</label>
              <StarRatingInput
                id="feedback-rating"
                value={form.rating}
                onChange={(rating) => setForm((prev) => ({ ...prev, rating }))}
                disabled={submitting}
              />
            </div>
            <div className="feedback-field">
              <label htmlFor="feedback-text">Feedback (optional)</label>
              <textarea
                id="feedback-text"
                value={form.feedback_text}
                onChange={(e) => setForm((prev) => ({ ...prev, feedback_text: e.target.value }))}
                maxLength={2000}
                placeholder="Tell us what went well or what we can improve..."
              />
            </div>
            {formError && <p className="feedback-error" role="alert">{formError}</p>}
            {formSuccess && <p className="feedback-success" role="status">{formSuccess}</p>}
            <button type="submit" className="feedback-submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit feedback'}
            </button>
          </form>
        </section>

        <section className="feedback-list-section">
          <h2>Community feedback</h2>
          <div className="feedback-filters">
            <div>
              <label htmlFor="filter-sort-by">Sort by</label>
              <select
                id="filter-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_at">Date</option>
                <option value="rating">Rating</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-sort-order">Order</label>
              <select
                id="filter-sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-min-rating">Min rating</label>
              <select
                id="filter-min-rating"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              >
                <option value="all">Any</option>
                {RATING_OPTIONS.map((r) => (
                  <option key={`min-${r}`} value={r}>
                    {ratingOptionLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-max-rating">Max rating</label>
              <select
                id="filter-max-rating"
                value={maxRating}
                onChange={(e) => setMaxRating(e.target.value)}
              >
                <option value="all">Any</option>
                {RATING_OPTIONS.map((r) => (
                  <option key={`max-${r}`} value={r}>
                    {ratingOptionLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-anonymous">Anonymous</label>
              <select
                id="filter-anonymous"
                value={anonymousFilter}
                onChange={(e) => setAnonymousFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="yes">Anonymous only</option>
                <option value="no">Named only</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-comment">Comment</label>
              <select
                id="filter-comment"
                value={hasComment}
                onChange={(e) => setHasComment(e.target.value)}
              >
                <option value="all">All</option>
                <option value="yes">With comment</option>
                <option value="no">Without comment</option>
              </select>
            </div>
          </div>

          <p className="feedback-count">
            {loading ? 'Loading...' : `${items.length} feedback item(s)`}
          </p>

          {error && <p className="feedback-error" role="alert">{error}</p>}

          {!loading && !error && items.length === 0 && (
            <p className="feedback-empty">No feedback matches your filters yet.</p>
          )}

          {!loading && items.length > 0 && (
            <div className="feedback-table-wrap">
              <table className="feedback-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Rating</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{formatFeedbackDateTime(item.created_at)}</td>
                      <td>{displayName(item)}</td>
                      <td className="feedback-rating-cell">
                        <StarRatingInput value={item.rating} readOnly compact />
                      </td>
                      <td className="feedback-table-comment">
                        {item.feedback_text || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default FeedbackPage;
