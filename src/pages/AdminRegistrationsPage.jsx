import { useState, useEffect } from 'react';
import {
  fetchRegistrationSeasons,
  fetchRegistrationCohorts,
  fetchRegistrations,
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
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

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
  }, [authenticated, filterSeason, filterCategory]);

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
                <th>Name</th>
                <th>Season</th>
                <th>Cohort</th>
                <th>Status</th>
                <th>Registration Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>
                    {r.image_url ? (
                      <img
                        src={r.image_url}
                        alt=""
                        className="admin-registrations-table__photo"
                      />
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
    </div>
  );
};

export default AdminRegistrationsPage;
