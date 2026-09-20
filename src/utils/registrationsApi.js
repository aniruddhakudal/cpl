import { API_BASE_URL } from '../config/api';

export const ADMIN_KEY_STORAGE = 'ganpati_admin_key';

const REGISTRATIONS_URL = `${API_BASE_URL}/v1/ganpati/2026/registrations`;

export function getNetworkErrorMessage(error) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return (
      'Cannot reach the registration API. Start the backend with ' +
      '`python main.py` in backend/v1.0.4/cpl-backend/api, then restart the frontend dev server.'
    );
  }
  return error?.message || 'Request failed. Please try again.';
}

function buildHeaders(adminKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (adminKey) {
    headers['X-Admin-Key'] = adminKey;
  }
  return headers;
}

async function parseResponse(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = result.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(', ')
      : typeof detail === 'string'
        ? detail
        : 'Request failed. Please try again.';
    throw new Error(message);
  }
  return result;
}

async function request(url, options) {
  try {
    const response = await fetch(url, options);
    return parseResponse(response);
  } catch (error) {
    throw new Error(getNetworkErrorMessage(error));
  }
}

export async function fetchRegistrations(adminKey = '') {
  return request(REGISTRATIONS_URL, {
    headers: buildHeaders(adminKey),
  });
}

export async function updateRegistration(id, payload, adminKey) {
  return request(`${REGISTRATIONS_URL}/${id}`, {
    method: 'PATCH',
    headers: buildHeaders(adminKey),
    body: JSON.stringify(payload),
  });
}

export async function deleteRegistration(id, adminKey) {
  return request(`${REGISTRATIONS_URL}/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(adminKey),
  });
}

const PHONE_NUMBER_PATTERN = /^\d{10}$/;

export function validatePhoneNumber(value) {
  const cleaned = (value || '').trim();
  if (!PHONE_NUMBER_PATTERN.test(cleaned)) {
    return 'Phone number must be exactly 10 digits.';
  }
  return '';
}

export function formatRegistrationDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
}
