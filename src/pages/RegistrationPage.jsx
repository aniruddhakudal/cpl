import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import {
  fetchRegistrationCohorts,
  fetchRegistrations,
  uploadRegistrationImage,
  submitRegistration,
} from '../utils/registrationLoader';
import './RegistrationPage.css';

const MAX_IMAGE_BYTES = 150 * 1024;
const MAX_IMAGE_DIM = 300;
const MAX_RECEIPT_DATA_URL_LEN = 2.5 * 1024 * 1024; // ~1.9MB binary to stay under 2MB backend limit
const MAX_RECEIPT_DIM = 1600;

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const resizeImageIfNeeded = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= MAX_IMAGE_DIM && height <= MAX_IMAGE_DIM) {
        resolve(dataUrl);
        return;
      }
      const scale = Math.min(MAX_IMAGE_DIM / width, MAX_IMAGE_DIM / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      let result = canvas.toDataURL('image/jpeg', 0.8);
      while (result.length > MAX_IMAGE_BYTES * 1.4 && result.length > 100) {
        result = canvas.toDataURL('image/jpeg', 0.6);
        break;
      }
      resolve(result);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

const resizeReceiptIfNeeded = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= MAX_RECEIPT_DIM && height <= MAX_RECEIPT_DIM) {
        let result = dataUrl;
        if (result.length > MAX_RECEIPT_DATA_URL_LEN) {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          for (let q = 0.85; q >= 0.3; q -= 0.1) {
            result = canvas.toDataURL('image/jpeg', q);
            if (result.length <= MAX_RECEIPT_DATA_URL_LEN) break;
          }
        }
        resolve(result);
        return;
      }
      const scale = Math.min(MAX_RECEIPT_DIM / width, MAX_RECEIPT_DIM / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      let result = canvas.toDataURL('image/jpeg', 0.85);
      for (let q = 0.85; q >= 0.3; q -= 0.1) {
        result = canvas.toDataURL('image/jpeg', q);
        if (result.length <= MAX_RECEIPT_DATA_URL_LEN) break;
      }
      resolve(result);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });

const RegistrationPage = () => {
  const { season, cohort } = useParams();
  const [cohorts, setCohorts] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);
  const receiptInputRef = useRef(null);

  const [showForm, setShowForm] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    whatsapp_number: '',
    image_url: '',
    payment_receipt_url: '',
  });

  const seasonLabel = season === 'cplx' ? 'CPL X' : (season ? String(season).toUpperCase() : '');
  const cohortLabel = cohort ? cohort.charAt(0).toUpperCase() + cohort.slice(1) : '';
  const isCohortValid = cohorts.length === 0 || cohorts.some((c) => c.toLowerCase() === cohort?.toLowerCase());

  useEffect(() => {
    const load = async () => {
      const data = await fetchRegistrationCohorts(season);
      setCohorts(data);
    };
    if (season) load();
  }, [season]);

  const loadRegistrations = async () => {
    if (!season || !cohort) return;
    setLoading(true);
    const data = await fetchRegistrations({
      season,
      category: cohort,
      order_by: 'created_at.asc',
    });
    setRegistrations(data);
    setLoading(false);
  };

  useEffect(() => {
    if (season && cohort) loadRegistrations();
  }, [season, cohort]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    try {
      let dataUrl = await fileToDataUrl(file);
      dataUrl = await resizeImageIfNeeded(dataUrl);
      setForm((f) => ({ ...f, image_url: dataUrl }));
      setErrorMessage('');
    } catch (err) {
      setErrorMessage('Failed to process image');
    }
    e.target.value = '';
  };

  const handleReceiptFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (JPEG, PNG, etc.) for the payment receipt.');
      return;
    }
    try {
      let dataUrl = await fileToDataUrl(file);
      dataUrl = await resizeReceiptIfNeeded(dataUrl);
      setForm((f) => ({ ...f, payment_receipt_url: dataUrl }));
      setErrorMessage('');
    } catch (err) {
      setErrorMessage('Failed to process receipt image');
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const { first_name, last_name, whatsapp_number } = form;
    if (!first_name?.trim() || !last_name?.trim() || !whatsapp_number?.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (!form.image_url?.trim()) {
      setErrorMessage('Profile photo is required.');
      return;
    }
    if (!form.payment_receipt_url?.trim()) {
      setErrorMessage('Payment receipt is required.');
      return;
    }
    if (!season?.trim() || !cohort?.trim()) {
      setErrorMessage('Invalid season or cohort.');
      return;
    }
    const num = whatsapp_number.replace(/\D/g, '');
    if (num.length < 10) {
      setErrorMessage('Please enter a valid WhatsApp number.');
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = null;
      if (form.image_url) {
        if (form.image_url.startsWith('data:')) {
          imageUrl = await uploadRegistrationImage(form.image_url, 'profile');
        } else {
          imageUrl = form.image_url;
        }
      }
      let receiptUrl = null;
      if (form.payment_receipt_url) {
        if (form.payment_receipt_url.startsWith('data:')) {
          receiptUrl = await uploadRegistrationImage(form.payment_receipt_url, 'receipt');
        } else {
          receiptUrl = form.payment_receipt_url;
        }
      }
      await submitRegistration({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        whatsapp_number: whatsapp_number.trim(),
        season: season.trim(),
        category: cohort.trim(),
        image_url: imageUrl,
        payment_receipt_url: receiptUrl,
      });
      setSuccessMessage('Registration submitted successfully! You will appear in the list below.');
      setForm({
        first_name: '',
        last_name: '',
        whatsapp_number: '',
        image_url: '',
        payment_receipt_url: '',
      });
      setShowForm(false);
      loadRegistrations();
    } catch (err) {
      setErrorMessage(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearPhoto = () => setForm((f) => ({ ...f, image_url: '' }));
  const clearReceipt = () => setForm((f) => ({ ...f, payment_receipt_url: '' }));

  if (!season || !cohort) {
    return <Navigate to="/cpl/register/cplx/men" replace />;
  }

  if (cohorts.length > 0 && !isCohortValid) {
    return <Navigate to={`/cpl/register/${season}/${cohorts[0]}`} replace />;
  }

  return (
    <div className="registration-page">
      <h1 className="registration-page__title">{seasonLabel} Registration - {cohortLabel}</h1>

      {!showForm ? (
        <div className="registration-page__register-cta">
          {successMessage && <p className="registration-form__success">{successMessage}</p>}
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setSuccessMessage('');
            }}
            className="registration-page__register-btn"
          >
            Register
          </button>
        </div>
      ) : (
      <section className="registration-page__form-section">
        <h2>Register</h2>
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="registration-form__row">
            <label>
              First Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder="First name"
              required
            />
          </div>
          <div className="registration-form__row">
            <label>
              Last Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              placeholder="Last name"
              required
            />
          </div>
          <div className="registration-form__row">
            <label>
              WhatsApp Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              name="whatsapp_number"
              value={form.whatsapp_number}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              required
            />
          </div>
          <div className="registration-form__row">
            <label>
              Profile Photo <span className="required">*</span>
            </label>
            <div className="registration-form__photo">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="registration-form__file-input"
              />
              {form.image_url ? (
                <div className="registration-form__preview">
                  <img src={form.image_url} alt="Preview" />
                  <button type="button" onClick={clearPhoto} className="registration-form__clear">
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="registration-form__upload-btn"
                >
                  Choose photo
                </button>
              )}
            </div>
          </div>
          <div className="registration-form__row registration-form__row--qr">
            <label className="registration-form__qr-label">Scan this QR to pay registration fee</label>
            <div className="registration-form__qr">
              <img src={cohort?.toLowerCase() === 'kids' ? '/data/cpl_contri_qr_kids.jpeg' : '/data/cpl_contri_qr_men.jpeg'} alt="Payment QR Code" className="registration-form__qr-img" />
            </div>
            <label className="registration-form__receipt-label">
              Payment Receipt <span className="required">*</span>
            </label>
            <div className="registration-form__photo">
              <input
                ref={receiptInputRef}
                type="file"
                accept="image/*"
                onChange={handleReceiptFileChange}
                className="registration-form__file-input"
              />
              {form.payment_receipt_url ? (
                <div className="registration-form__preview">
                  <img src={form.payment_receipt_url} alt="Receipt preview" />
                  <button type="button" onClick={clearReceipt} className="registration-form__clear">
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => receiptInputRef.current?.click()}
                  className="registration-form__upload-btn"
                >
                  Upload payment receipt
                </button>
              )}
            </div>
          </div>
          <div className="registration-form__submit-section">
            {errorMessage && <p className="registration-form__error">{errorMessage}</p>}
            {successMessage && <p className="registration-form__success">{successMessage}</p>}
            <div className="registration-form__buttons">
              <button type="submit" disabled={submitting} className="registration-form__submit">
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                disabled={submitting}
                className="registration-form__cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </section>
      )}

      <section className="registration-page__leaderboard">
        <h2>Registered Participants - {seasonLabel} {cohortLabel}</h2>
        {loading ? (
          <div className="registration-page__loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : registrations.length === 0 ? (
          <p className="registration-page__empty">No registrations yet. Be the first!</p>
        ) : (
          <div className="registration-leaderboard">
            <table className="registration-leaderboard__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Registration Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>
                      {r.image_url ? (
                        <button
                          type="button"
                          onClick={() => setModalImage({ url: r.image_url, label: `${r.first_name} ${r.last_name} - Profile photo` })}
                          className="registration-leaderboard__photo-btn"
                          title="View profile photo"
                        >
                          <img
                            src={r.image_url}
                            alt=""
                            className="registration-leaderboard__photo"
                          />
                        </button>
                      ) : (
                        <span className="registration-leaderboard__no-photo">—</span>
                      )}
                    </td>
                    <td>
                      {r.first_name} {r.last_name}
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
                      <span
                        className={`registration-leaderboard__status registration-leaderboard__status--${(r.status || 'awaiting_confirmation').toLowerCase().replace(' ', '_')}`}
                      >
                        {(r.status || 'awaiting_confirmation').replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="registration-page__admin-link">
        <Link to="/admin/registrations">Admin</Link>
      </p>

      {modalImage && (
        <div
          className="registration-page__modal"
          onClick={() => setModalImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="View image"
        >
          <div className="registration-page__modal-backdrop" />
          <div className="registration-page__modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="registration-page__modal-header">
              <span className="registration-page__modal-label">{modalImage.label}</span>
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="registration-page__modal-close"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <img
              src={modalImage.url}
              alt={modalImage.label}
              className="registration-page__modal-img"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;
