import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AwardeeCeremonySlideshow from '../components/AwardeeCeremonySlideshow';
import ThemeToggle from '../components/ThemeToggle';
import { SORTED_AWARDEE_EVENTS, sortAwardeeRecords } from '../utils/awardeeEvents';
import {
  ADMIN_KEY_STORAGE,
  createAwardee,
  deleteAwardee,
  fetchAwardees,
  updateAwardee,
} from '../utils/awardeesApi';
import './AwardeesPage.css';

const emptyForm = {
  event_name: '',
  winner_name: '',
  runner_up_name: '',
  bronze_name: '',
};

const AwardeesPage = () => {
  const [awardees, setAwardees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(ADMIN_KEY_STORAGE) || '');
  const [adminMessage, setAdminMessage] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editError, setEditError] = useState('');
  const [ceremonyOpen, setCeremonyOpen] = useState(false);

  const sortedAwardees = useMemo(() => sortAwardeeRecords(awardees), [awardees]);

  const usedEventNames = useMemo(
    () => new Set(awardees.map((row) => row.event_name)),
    [awardees],
  );

  const availableEventsForAdd = useMemo(
    () => SORTED_AWARDEE_EVENTS.filter((event) => !usedEventNames.has(event)),
    [usedEventNames],
  );

  const loadAwardees = useCallback(async (key = adminKey) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAwardees(key);
      setAwardees(result.data || []);
      setIsAdmin(Boolean(result.is_admin));
      if (key && !result.is_admin) {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        setAdminKey('');
        setAdminMessage('Invalid admin key.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load awardees.');
      setAwardees([]);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    loadAwardees();
  }, [loadAwardees]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminMessage('');
    const key = adminKeyInput.trim();
    if (!key) {
      setAdminMessage('Enter admin key.');
      return;
    }
    try {
      const result = await fetchAwardees(key);
      if (result.is_admin) {
        sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
        setAdminKey(key);
        setAwardees(result.data || []);
        setIsAdmin(true);
        setAdminKeyInput('');
        setAdminMessage('Admin access enabled.');
        return;
      }
      throw new Error('Invalid admin key.');
    } catch (err) {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
      setAdminKey('');
      setIsAdmin(false);
      setAdminMessage(err.message || 'Invalid admin key.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey('');
    setAdminKeyInput('');
    setIsAdmin(false);
    setAdminMessage('');
    loadAwardees('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.event_name) {
      setFormError('Select an event.');
      return;
    }
    if (!form.winner_name.trim()) {
      setFormError('Winner name is required.');
      return;
    }
    setSaving(true);
    try {
      await createAwardee(
        {
          event_name: form.event_name,
          winner_name: form.winner_name.trim(),
          runner_up_name: form.runner_up_name.trim() || null,
          bronze_name: form.bronze_name.trim() || null,
        },
        adminKey,
      );
      setForm(emptyForm);
      await loadAwardees();
    } catch (err) {
      setFormError(err.message || 'Failed to add awardee.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      event_name: item.event_name,
      winner_name: item.winner_name || '',
      runner_up_name: item.runner_up_name || '',
      bronze_name: item.bronze_name || '',
    });
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditForm(emptyForm);
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.winner_name.trim()) {
      setEditError('Winner name is required.');
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      await updateAwardee(
        editingItem.id,
        {
          event_name: editForm.event_name,
          winner_name: editForm.winner_name.trim(),
          runner_up_name: editForm.runner_up_name.trim() || null,
          bronze_name: editForm.bronze_name.trim() || null,
        },
        adminKey,
      );
      closeEditModal();
      await loadAwardees();
    } catch (err) {
      setEditError(err.message || 'Failed to update awardee.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete award for "${item.event_name}"?`);
    if (!confirmed) return;
    try {
      await deleteAwardee(item.id, adminKey);
      await loadAwardees();
    } catch (err) {
      window.alert(err.message || 'Failed to delete awardee.');
    }
  };

  return (
    <div className="awardees-page ganpati-theme">
      <ThemeToggle />

      <header className="awardees-header">
        <Link to="/" className="awardees-back-link">
          ← Back to Home
        </Link>
        <h1 className="awardees-title">Celebria Ganpati Festival 2026</h1>
        <p className="awardees-subtitle">Awardees</p>
      </header>

      <main className="awardees-content">
        <div className="awardees-toolbar">
          <p className="awardees-count">
            {loading ? 'Loading...' : `${sortedAwardees.length} award(s)`}
          </p>
          <button
            type="button"
            className="awardees-ceremony-open"
            onClick={() => setCeremonyOpen(true)}
            disabled={loading || sortedAwardees.length === 0}
          >
            Prize ceremony slideshow
          </button>
        </div>

        {!isAdmin && (
          <form className="awardees-admin-login" onSubmit={handleAdminLogin}>
            <label htmlFor="awardees-admin-key">Admin access (add / edit / delete)</label>
            <div className="awardees-admin-login-row">
              <input
                id="awardees-admin-key"
                type="password"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                placeholder="Enter admin key"
              />
              <button type="submit">Unlock</button>
            </div>
            {adminMessage && <p className="awardees-admin-message">{adminMessage}</p>}
          </form>
        )}

        {isAdmin && (
          <>
            <div className="awardees-admin-banner">
              <span>Admin mode enabled</span>
              <button type="button" className="awardees-admin-logout" onClick={handleAdminLogout}>
                Log out
              </button>
            </div>

            <section className="awardees-form-section">
              <h2>Add awardee</h2>
              <form className="awardees-form" onSubmit={handleAddSubmit}>
                <div className="awardees-field">
                  <label htmlFor="awardee-event">Event</label>
                  <select
                    id="awardee-event"
                    value={form.event_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, event_name: e.target.value }))}
                    required
                  >
                    <option value="">Select event</option>
                    {availableEventsForAdd.map((event) => (
                      <option key={event} value={event}>
                        {event}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="awardees-field">
                  <label htmlFor="awardee-winner">Winner</label>
                  <input
                    id="awardee-winner"
                    type="text"
                    value={form.winner_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, winner_name: e.target.value }))}
                    required
                    maxLength={255}
                  />
                </div>
                <div className="awardees-field">
                  <label htmlFor="awardee-runner-up">Runner-up (optional)</label>
                  <input
                    id="awardee-runner-up"
                    type="text"
                    value={form.runner_up_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, runner_up_name: e.target.value }))}
                    maxLength={255}
                  />
                </div>
                <div className="awardees-field">
                  <label htmlFor="awardee-bronze">Bronze (optional)</label>
                  <input
                    id="awardee-bronze"
                    type="text"
                    value={form.bronze_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, bronze_name: e.target.value }))}
                    maxLength={255}
                  />
                </div>
                {formError && <p className="awardees-error" role="alert">{formError}</p>}
                <div className="awardees-form-actions">
                  <button type="submit" disabled={saving || availableEventsForAdd.length === 0}>
                    {saving ? 'Saving...' : 'Add'}
                  </button>
                </div>
                {availableEventsForAdd.length === 0 && (
                  <p className="awardees-admin-message">All events already have awards.</p>
                )}
              </form>
            </section>
          </>
        )}

        {error && <p className="awardees-error" role="alert">{error}</p>}

        {!loading && !error && sortedAwardees.length === 0 && (
          <p className="awardees-empty">No awardees listed yet.</p>
        )}

        {!loading && sortedAwardees.length > 0 && (
          <div className="awardees-table-wrap">
            <table className="awardees-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Event</th>
                  <th>Winner</th>
                  <th>Runner-up</th>
                  <th>Bronze</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sortedAwardees.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.event_name}</td>
                    <td>
                      <span className="awardees-name-with-medal">
                        <span className="awardees-medal" aria-hidden="true">🥇</span>
                        {item.winner_name}
                      </span>
                    </td>
                    <td>
                      {item.runner_up_name ? (
                        <span className="awardees-name-with-medal">
                          <span className="awardees-medal" aria-hidden="true">🥈</span>
                          {item.runner_up_name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {item.bronze_name ? (
                        <span className="awardees-name-with-medal">
                          <span className="awardees-medal" aria-hidden="true">🥉</span>
                          {item.bronze_name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    {isAdmin && (
                      <td className="awardees-actions">
                        <button type="button" onClick={() => openEditModal(item)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="awardees-delete-btn"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {ceremonyOpen && (
        <AwardeeCeremonySlideshow
          items={sortedAwardees}
          onClose={() => setCeremonyOpen(false)}
        />
      )}

      {editingItem && (
        <div className="awardees-modal-overlay" onClick={closeEditModal}>
          <div
            className="awardees-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-awardee-title"
          >
            <h2 id="edit-awardee-title">Edit awardee</h2>
            <form className="awardees-form" onSubmit={handleEditSubmit}>
              <div className="awardees-field">
                <label htmlFor="edit-awardee-event">Event</label>
                <select
                  id="edit-awardee-event"
                  value={editForm.event_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, event_name: e.target.value }))}
                  required
                >
                  {SORTED_AWARDEE_EVENTS.map((event) => (
                    <option
                      key={event}
                      value={event}
                      disabled={usedEventNames.has(event) && event !== editingItem.event_name}
                    >
                      {event}
                    </option>
                  ))}
                </select>
              </div>
              <div className="awardees-field">
                <label htmlFor="edit-awardee-winner">Winner</label>
                <input
                  id="edit-awardee-winner"
                  type="text"
                  value={editForm.winner_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, winner_name: e.target.value }))}
                  required
                  maxLength={255}
                />
              </div>
              <div className="awardees-field">
                <label htmlFor="edit-awardee-runner-up">Runner-up (optional)</label>
                <input
                  id="edit-awardee-runner-up"
                  type="text"
                  value={editForm.runner_up_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, runner_up_name: e.target.value }))
                  }
                  maxLength={255}
                />
              </div>
              <div className="awardees-field">
                <label htmlFor="edit-awardee-bronze">Bronze (optional)</label>
                <input
                  id="edit-awardee-bronze"
                  type="text"
                  value={editForm.bronze_name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, bronze_name: e.target.value }))
                  }
                  maxLength={255}
                />
              </div>
              {editError && <p className="awardees-error" role="alert">{editError}</p>}
              <div className="awardees-form-actions">
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={closeEditModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AwardeesPage;
