import { useState, useEffect } from 'react';
import {
  fetchRegistrationSeasons,
  fetchRegistrationCohorts,
  fetchRegistrations,
  fetchShowParticipants,
  updateShowParticipants,
  updateRegistrationStatus,
  deleteRegistration,
} from '../utils/registrationLoader';
import './AdminRegistrationsPage.css';

const STATUS_OPTIONS = [
  { value: 'awaiting_confirmation', label: 'Awaiting Confirmation' },
  { value: 'registered', label: 'Registered' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AdminRegistrationsPage = () => {
  const [adminKey, setAdminKey] = useState(() =>
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cpl_admin_key') || '' : ''
  );
  const [authenticated, setAuthenticated] = useState(!!adminKey);
  const [seasons, setSeasons] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [filterSeason, setFilterSeason] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalImage, setModalImage] = useState(null);
  const [showParticipantsList, setShowParticipantsList] = useState(false);
  const [updatingShowParticipants, setUpdatingShowParticipants] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('asc');

  const saveAdminKey = (key) => {
    setAdminKey(key);
    if (key) {
      sessionStorage.setItem('cpl_admin_key', key);
      setAuthenticated(true);
    } else {
      sessionStorage.removeItem('cpl_admin_key');
      setAuthenticated(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const input = e.target.elements.adminKey;
    const key = input?.value?.trim();
    if (key) {
      saveAdminKey(key);
      setErrorMessage('');
    } else {
      setErrorMessage('Please enter the admin key.');
    }
  };

  const handleLogout = () => {
    saveAdminKey('');
    setRegistrations([]);
    setLoading(true);
  };

  const loadSeasons = async () => {
    const data = await fetchRegistrationSeasons();
    setSeasons(data);
  };

  const loadCohorts = async () => {
    const data = await fetchRegistrationCohorts(filterSeason || undefined);
    setCohorts(data);
  };

  const loadRegistrations = async () => {
    setLoading(true);
    const opts = { order_by: 'created_at.asc', limit: 500 };
    if (filterSeason) opts.season = filterSeason;
    if (filterCategory) opts.category = filterCategory;
    if (filterStatus) opts.status = filterStatus;
    const data = await fetchRegistrations(opts);
    setRegistrations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    loadCohorts();
  }, [filterSeason]);

  useEffect(() => {
    if (authenticated) loadRegistrations();
  }, [authenticated, filterSeason, filterCategory, filterStatus]);

  useEffect(() => {
    const load = async () => {
      if (authenticated) {
        const show = await fetchShowParticipants();
        setShowParticipantsList(show);
      }
    };
    load();
  }, [authenticated]);

  const handleShowParticipantsToggle = async () => {
    if (!adminKey) return;
    setUpdatingShowParticipants(true);
    setErrorMessage('');
    try {
      const newVal = !showParticipantsList;
      await updateShowParticipants(newVal, adminKey);
      setShowParticipantsList(newVal);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update setting');
    } finally {
      setUpdatingShowParticipants(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setModalImage(null);
    };
    if (modalImage) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [modalImage]);

  const handleStatusChange = async (id, newStatus) => {
    if (!adminKey) return;
    setUpdatingId(id);
    setErrorMessage('');
    try {
      await updateRegistrationStatus(id, newStatus, adminKey);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update status');
      if (err.message?.includes('403') || err.message?.toLowerCase().includes('invalid')) {
        saveAdminKey('');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedRegistrations = [...registrations].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') {
      const na = `${(a.first_name || '')} ${(a.last_name || '')}`.toLowerCase();
      const nb = `${(b.first_name || '')} ${(b.last_name || '')}`.toLowerCase();
      cmp = na.localeCompare(nb);
    } else if (sortBy === 'status') {
      cmp = (a.status || '').localeCompare(b.status || '');
    } else if (sortBy === 'category') {
      cmp = (a.category || '').localeCompare(b.category || '');
    } else if (sortBy === 'created_at') {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      cmp = da - db;
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const handleDelete = async (id, name) => {
    if (!adminKey) return;
    if (!window.confirm(`Delete registration for ${name}? This cannot be undone.`)) return;
    setDeletingId(id);
    setErrorMessage('');
    try {
      await deleteRegistration(id, adminKey);
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete');
      if (err.message?.includes('403') || err.message?.toLowerCase().includes('invalid')) {
        saveAdminKey('');
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (!authenticated) {
    return (
      <div className="admin-registrations-page">
        <div className="admin-registrations-page__login">
          <h1>Admin: Registration Management</h1>
          <p>Enter your admin key to manage registration statuses.</p>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              type="password"
              name="adminKey"
              placeholder="Admin key"
              autoComplete="off"
              className="admin-login-form__input"
            />
            <button type="submit" className="admin-login-form__submit">
              Sign in
            </button>
          </form>
          {errorMessage && <p className="admin-login-form__error">{errorMessage}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-registrations-page">
      <div className="admin-registrations-page__header">
        <h1>Admin: Registration Management</h1>
        <div className="admin-registrations-page__actions">
          <label className="admin-registrations-page__show-participants">
            <span className="admin-registrations-page__toggle-label">Show participants on public page</span>
            <input
              type="checkbox"
              checked={showParticipantsList}
              onChange={handleShowParticipantsToggle}
              disabled={updatingShowParticipants}
              className="admin-registrations-page__toggle-input"
            />
            <span className="admin-registrations-page__toggle-switch" />
          </label>
          <select
            value={filterSeason}
            onChange={(e) => setFilterSeason(e.target.value)}
            className="admin-registrations-page__filter"
          >
            <option value="">All seasons</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {String(s).toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="admin-registrations-page__filter"
          >
            <option value="">All cohorts</option>
            {cohorts.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="admin-registrations-page__filter"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button onClick={handleLogout} className="admin-registrations-page__logout">
            Sign out
          </button>
        </div>
      </div>

      {errorMessage && (
        <p className="admin-registrations-page__error">{errorMessage}</p>
      )}

      {loading ? (
        <div className="admin-registrations-page__loading">
          <div className="spinner"></div>
          <p>Loading registrations...</p>
        </div>
      ) : registrations.length === 0 ? (
        <p className="admin-registrations-page__empty">No registrations found.</p>
      ) : (
        <div className="admin-registrations-table-wrap">
          <table className="admin-registrations-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Photo</th>
                <th>Receipt</th>
                <th>
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="admin-registrations-table__sort-header"
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th>Season</th>
                <th>
                  <button
                    type="button"
                    onClick={() => handleSort('category')}
                    className="admin-registrations-table__sort-header"
                  >
                    Cohort {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="admin-registrations-table__sort-header"
                  >
                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    onClick={() => handleSort('created_at')}
                    className="admin-registrations-table__sort-header"
                  >
                    Registration Time {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRegistrations.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>
                    {r.image_url ? (
                      <button
                        type="button"
                        onClick={() => setModalImage({ url: r.image_url, label: 'Profile photo' })}
                        className="admin-registrations-table__photo-btn"
                        title="View profile photo"
                      >
                        <img
                          src={r.image_url}
                          alt=""
                          className="admin-registrations-table__photo"
                        />
                      </button>
                    ) : (
                      <span className="admin-registrations-table__no-photo">—</span>
                    )}
                  </td>
                  <td>
                    {r.payment_receipt_url ? (
                      <button
                        type="button"
                        onClick={() => setModalImage({ url: r.payment_receipt_url, label: 'Receipt' })}
                        className="admin-registrations-table__receipt-btn"
                        title="View receipt"
                      >
                        <img
                          src={r.payment_receipt_url}
                          alt="Receipt"
                          className="admin-registrations-table__receipt"
                        />
                      </button>
                    ) : (
                      <span className="admin-registrations-table__no-photo">—</span>
                    )}
                  </td>
                  <td>
                    {r.first_name} {r.last_name}
                  </td>
                  <td>{r.season ? String(r.season).toUpperCase() : '—'}</td>
                  <td>
                    {r.category
                      ? r.category.charAt(0).toUpperCase() + r.category.slice(1)
                      : '—'}
                  </td>
                  <td>
                    <span
                      className={`admin-registrations-table__status admin-registrations-table__status--${(
                        r.status || 'awaiting_confirmation'
                      )
                        .toLowerCase()
                        .replace(/ /g, '_')}`}
                    >
                      {(r.status || 'awaiting_confirmation').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td>
                    <div className="admin-registrations-table__actions-cell">
                      <select
                        value={r.status || 'awaiting_confirmation'}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        disabled={updatingId === r.id}
                        className="admin-registrations-table__select"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id, `${r.first_name} ${r.last_name}`)}
                        disabled={deletingId === r.id}
                        className="admin-registrations-table__delete"
                        title="Delete"
                        aria-label={`Delete ${r.first_name} ${r.last_name}`}
                      >
                        {deletingId === r.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalImage && (
        <div
          className="admin-registrations-modal"
          onClick={() => setModalImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="View image"
        >
          <div className="admin-registrations-modal__backdrop" />
          <div className="admin-registrations-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-registrations-modal__header">
              <span className="admin-registrations-modal__label">{modalImage.label}</span>
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="admin-registrations-modal__close"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <img
              src={modalImage.url}
              alt={modalImage.label}
              className="admin-registrations-modal__img"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrationsPage;
