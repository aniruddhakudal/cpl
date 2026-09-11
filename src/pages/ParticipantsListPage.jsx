import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import ScheduleButton from '../components/ScheduleButton';
import { BUILDING_OPTIONS } from '../utils/buildingOptions';
import { FESTIVAL_EVENTS } from '../utils/ganpatiEvents';
import {
  ADMIN_KEY_STORAGE,
  deleteRegistration,
  fetchRegistrations,
  formatRegistrationDateTime,
  updateRegistration,
  validatePhoneNumber,
} from '../utils/registrationsApi';
import './ParticipantsListPage.css';

const MONTH_TO_NUM = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
};

function toDateInputValue(value) {
  if (!value) return '';

  const cleaned = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    return cleaned.slice(0, 10);
  }

  const match =
    /^(0[1-9]|[12]\d|3[01])-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{4})$/i.exec(
      cleaned,
    );
  if (!match) return '';

  const [, day, month, year] = match;
  const monthKey = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  const monthNum = MONTH_TO_NUM[monthKey];
  return monthNum ? `${year}-${monthNum}-${day}` : '';
}

const emptyEditForm = {
  name: '',
  contact: '',
  building: '',
  flat: '',
  date_of_birth: '',
  events: [],
};

const ParticipantsListPage = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(ADMIN_KEY_STORAGE) || '');
  const [adminMessage, setAdminMessage] = useState('');
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadParticipants = useCallback(async (key = adminKey) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchRegistrations(key);
      setParticipants(result.data || []);
      setIsAdmin(Boolean(result.is_admin));
      if (key && !result.is_admin) {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        setAdminKey('');
        setAdminMessage('Invalid admin key.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load participants.');
      setParticipants([]);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminMessage('');
    const key = adminKeyInput.trim();
    if (!key) {
      setAdminMessage('Enter admin key.');
      return;
    }

    try {
      const result = await fetchRegistrations(key);
      if (result.is_admin) {
        sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
        setAdminKey(key);
        setParticipants(result.data || []);
        setIsAdmin(true);
        setAdminKeyInput('');
        setAdminMessage('Admin access enabled.');
        return;
      }
      if (result.admin_configured === false) {
        throw new Error(
          'Admin access is not configured on the server. Set REGISTRATION_ADMIN_KEY in backend env and restart.',
        );
      }
      throw new Error(
        'Invalid admin key. It must exactly match REGISTRATION_ADMIN_KEY in backend/v1.0.4/cpl-backend/api/env (local) or Render environment variables (production).',
      );
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
    loadParticipants('');
  };

  const openEditModal = (participant) => {
    setEditingParticipant(participant);
    setEditForm({
      name: participant.name || '',
      contact: participant.contact || '',
      building: participant.building || '',
      flat: participant.flat || '',
      date_of_birth: toDateInputValue(participant.date_of_birth),
      events: participant.events || [],
    });
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingParticipant(null);
    setEditForm(emptyEditForm);
    setEditError('');
  };

  const toggleEditEvent = (eventName) => {
    setEditForm((prev) => {
      const events = prev.events.includes(eventName)
        ? prev.events.filter((item) => item !== eventName)
        : [...prev.events, eventName];
      return { ...prev, events };
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const phoneError = validatePhoneNumber(editForm.contact);
    if (phoneError) {
      setEditError(phoneError);
      return;
    }

    if (editForm.events.length === 0) {
      setEditError('Select at least one event.');
      return;
    }

    setSaving(true);
    setEditError('');
    try {
      await updateRegistration(
        editingParticipant.id,
        {
          name: editForm.name.trim(),
          contact: editForm.contact.trim(),
          building: editForm.building.trim(),
          flat: editForm.flat.trim(),
          date_of_birth: editForm.date_of_birth,
          events: editForm.events,
        },
        adminKey,
      );
      closeEditModal();
      await loadParticipants();
    } catch (err) {
      setEditError(err.message || 'Failed to update registration.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (participant) => {
    const confirmed = window.confirm(`Delete registration for ${participant.name}?`);
    if (!confirmed) return;

    try {
      await deleteRegistration(participant.id, adminKey);
      await loadParticipants();
    } catch (err) {
      window.alert(err.message || 'Failed to delete registration.');
    }
  };

  return (
    <div className="participants-page">
      <ThemeToggle />

      <header className="participants-header">
        <Link to="/" className="participants-back-link">
          ← Back to Home
        </Link>
        <h1 className="participants-title">Celebria Ganpati Festival 2026</h1>
        <p className="participants-subtitle">Registered Participants</p>
        <ScheduleButton className="participants-back-link">View Schedule</ScheduleButton>
      </header>

      <main className="participants-content">
        <div className="participants-toolbar">
          <p className="participants-count">
            {loading ? 'Loading...' : `${participants.length} participant(s)`}
          </p>
          <Link to="/ganpati/2026/registration" className="participants-register-link">
            New Registration
          </Link>
        </div>

        {!isAdmin && (
          <form className="participants-admin-login" onSubmit={handleAdminLogin}>
            <label htmlFor="adminKey">Admin access (edit/delete)</label>
            <div className="participants-admin-login-row">
              <input
                id="adminKey"
                type="password"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                placeholder="Enter admin key"
              />
              <button type="submit">Unlock</button>
            </div>
            {adminMessage && <p className="participants-admin-message">{adminMessage}</p>}
          </form>
        )}

        {isAdmin && (
          <div className="participants-admin-banner">
            <span>Admin mode enabled</span>
            <button type="button" onClick={handleAdminLogout}>
              Log out
            </button>
          </div>
        )}

        {error && <p className="participants-error" role="alert">{error}</p>}

        {!loading && !error && participants.length === 0 && (
          <p className="participants-empty">No registrations yet.</p>
        )}

        {!loading && participants.length > 0 && (
          <div className="participants-table-wrap">
            <table className="participants-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Name</th>
                  <th>Registration Date/Time</th>
                  <th>Building</th>
                  <th>Flat</th>
                  <th>Events</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {participants.map((participant, index) => (
                  <tr key={participant.id}>
                    <td>{index + 1}</td>
                    <td>{participant.name}</td>
                    <td>{formatRegistrationDateTime(participant.created_at)}</td>
                    <td>{participant.building}</td>
                    <td>{participant.flat}</td>
                    <td>{(participant.events || []).join(', ')}</td>
                    {isAdmin && (
                      <td className="participants-actions">
                        <button type="button" onClick={() => openEditModal(participant)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="participants-delete-btn"
                          onClick={() => handleDelete(participant)}
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

      {editingParticipant && (
        <div className="participants-modal-overlay" onClick={closeEditModal}>
          <div
            className="participants-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-participant-title"
          >
            <h2 id="edit-participant-title">Edit Registration</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="participants-modal-field">
                <label htmlFor="edit-name">Name</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="participants-modal-field">
                <label htmlFor="edit-contact">Contact</label>
                <input
                  id="edit-contact"
                  type="tel"
                  value={editForm.contact}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, contact: e.target.value }))}
                  required
                  inputMode="numeric"
                  maxLength={10}
                  pattern="\d{10}"
                  placeholder="10-digit phone number"
                />
              </div>

              <div className="participants-modal-row">
                <div className="participants-modal-field">
                  <label htmlFor="edit-building">Building</label>
                  <select
                    id="edit-building"
                    value={editForm.building}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, building: e.target.value }))}
                    required
                  >
                    <option value="">Select building</option>
                    {BUILDING_OPTIONS.map((building) => (
                      <option key={building} value={building}>
                        {building}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="participants-modal-field">
                  <label htmlFor="edit-flat">Flat</label>
                  <input
                    id="edit-flat"
                    type="text"
                    value={editForm.flat}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, flat: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="participants-modal-field">
                <label htmlFor="edit-dob">Date of Birth</label>
                <input
                  id="edit-dob"
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                  required
                />
              </div>

              <fieldset className="participants-modal-events">
                <legend>Events</legend>
                <div className="participants-modal-events-list">
                  {FESTIVAL_EVENTS.map((eventName) => (
                    <label key={eventName}>
                      <input
                        type="checkbox"
                        checked={editForm.events.includes(eventName)}
                        onChange={() => toggleEditEvent(eventName)}
                      />
                      <span>{eventName}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {editError && <p className="participants-error" role="alert">{editError}</p>}

              <div className="participants-modal-actions">
                <button type="button" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsListPage;
