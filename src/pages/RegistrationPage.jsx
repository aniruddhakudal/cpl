import { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import ScheduleButton from '../components/ScheduleButton';
import { API_BASE_URL } from '../config/api';
import { validatePhoneNumber } from '../utils/registrationsApi';
import { BUILDING_OPTIONS } from '../utils/buildingOptions';
import { FESTIVAL_EVENTS } from '../utils/ganpatiEvents';
import './RegistrationPage.css';

const initialFormState = {
  name: '',
  contact: '',
  building: '',
  flat: '',
  dateOfBirth: '',
  events: [],
};

const RegistrationPage = () => {
  const [form, setForm] = useState(initialFormState);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [contactError, setContactError] = useState('');
  const [eventError, setEventError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEvent = (eventName) => {
    setEventError('');
    setForm((prev) => {
      const events = prev.events.includes(eventName)
        ? prev.events.filter((item) => item !== eventName)
        : [...prev.events, eventName];
      return { ...prev, events };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneError = validatePhoneNumber(form.contact);
    if (phoneError) {
      setContactError(phoneError);
      return;
    }

    if (form.events.length === 0) {
      setEventError('Please select at least one event.');
      return;
    }

    setContactError('');
    setEventError('');
    setSubmitError('');
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/ganpati/2026/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          contact: form.contact.trim(),
          building: form.building.trim(),
          flat: form.flat.trim(),
          date_of_birth: form.dateOfBirth,
          events: form.events,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = result.detail;
        const message = Array.isArray(detail)
          ? detail.map((item) => item.msg).join(', ')
          : typeof detail === 'string'
            ? detail
            : 'Failed to submit registration. Please try again.';
        throw new Error(message);
      }

      setSubmittedName(form.name.trim());
      setSubmitted(true);
      setForm(initialFormState);
    } catch (error) {
      setSubmitError(error.message || 'Failed to submit registration. Please try again.');
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="registration-page">
      <ThemeToggle />

      <header className="registration-header">
        <Link to="/" className="registration-back-link">
          ← Back to Home
        </Link>
        <h1 className="registration-title">Celebria Ganpati Festival 2026</h1>
        <p className="registration-subtitle">Registration</p>
        <div className="registration-nav-links">
          <Link to="/ganpati/2026/participants" className="registration-back-link">
            View Registered Participants
          </Link>
          <ScheduleButton className="registration-back-link">View Schedule</ScheduleButton>
        </div>
      </header>

      <main className="registration-content">
        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="registration-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="registration-field">
            <label htmlFor="contact">Contact (Preferably WhatsApp Number)</label>
            <input
              id="contact"
              type="tel"
              value={form.contact}
              onChange={(e) => {
                setContactError('');
                updateField('contact', e.target.value);
              }}
              required
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="\d{10}"
              placeholder="10-digit phone number"
            />
            {contactError && (
              <p className="registration-error" role="alert">
                {contactError}
              </p>
            )}
          </div>

          <div className="registration-field-row">
            <div className="registration-field">
              <label htmlFor="building">Building</label>
              <select
                id="building"
                value={form.building}
                onChange={(e) => updateField('building', e.target.value)}
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

            <div className="registration-field">
              <label htmlFor="flat">Flat</label>
              <input
                id="flat"
                type="text"
                value={form.flat}
                onChange={(e) => updateField('flat', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="registration-field">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
              required
            />
          </div>

          <fieldset className="registration-events">
            <legend>Select One or More Events</legend>
            <div className="registration-events-list">
              {FESTIVAL_EVENTS.map((eventName) => (
                <label key={eventName} className="registration-event-option">
                  <input
                    type="checkbox"
                    checked={form.events.includes(eventName)}
                    onChange={() => toggleEvent(eventName)}
                  />
                  <span>{eventName}</span>
                </label>
              ))}
            </div>
            {eventError && (
              <p className="registration-error" role="alert">
                {eventError}
              </p>
            )}
          </fieldset>

          <button type="submit" className="registration-submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Registration'}
          </button>

          {submitError && (
            <p className="registration-error" role="alert">
              {submitError}
            </p>
          )}

          {submitted && (
            <p className="registration-success" role="status">
              Thank you, {submittedName || 'participant'}! Your registration has been recorded.
            </p>
          )}
        </form>
      </main>
    </div>
  );
};

export default RegistrationPage;
