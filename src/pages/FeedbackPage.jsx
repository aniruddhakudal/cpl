import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import StarRatingInput from '../components/StarRatingInput';
import {
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
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchFeedback({
        sortBy: 'created_at',
        sortOrder: 'desc',
        minRating: 'all',
        maxRating: 'all',
        anonymous: 'all',
        hasComment: 'all',
      });
      setItems(result.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load feedback.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const openSubmitModal = () => {
    setFormError('');
    setFormSuccess('');
    setSubmitModalOpen(true);
  };

  const closeSubmitModal = () => {
    if (submitting) return;
    setSubmitModalOpen(false);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

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
      setSubmitModalOpen(false);
      await loadFeedback();
    } catch (err) {
      setFormError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
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
        <section className="feedback-list-section">
          <div className="feedback-toolbar">
            <h2>Community feedback</h2>
            <button type="button" className="feedback-submit-open" onClick={openSubmitModal}>
              Submit feedback
            </button>
          </div>

          {formSuccess && (
            <p className="feedback-success feedback-success--banner" role="status">
              {formSuccess}
            </p>
          )}

          <p className="feedback-count">
            {loading ? 'Loading...' : `${items.length} feedback item(s)`}
          </p>

          {error && <p className="feedback-error" role="alert">{error}</p>}

          {!loading && !error && items.length === 0 && (
            <p className="feedback-empty">
              No feedback yet. Use Submit feedback to share yours.
            </p>
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

      {submitModalOpen && (
        <div className="feedback-modal-overlay" onClick={closeSubmitModal}>
          <div
            className="feedback-modal feedback-modal--wide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-feedback-title"
          >
            <h2 id="submit-feedback-title">Submit feedback</h2>
            <p className="feedback-form-note">
              Share your experience at Celebria Ganpati Festival 2026. You may submit anonymously.
            </p>
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
              <div className="feedback-modal-actions">
                <button type="button" onClick={closeSubmitModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="feedback-submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
