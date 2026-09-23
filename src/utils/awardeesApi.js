import { API_BASE_URL } from '../config/api';
import { ADMIN_KEY_STORAGE } from './registrationsApi';

const AWARDEES_URL = `${API_BASE_URL}/v1/ganpati/2026/awardees`;

function buildHeaders(adminKey = '') {
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
      ? detail.map((item) => item.msg || item).join(', ')
      : typeof detail === 'string'
        ? detail
        : 'Request failed. Please try again.';
    throw new Error(message);
  }
  return result;
}

async function request(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return parseResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'Cannot reach the API. Start the backend with `python main.py` in ' +
          'backend/v1.0.4/cpl-backend/api, then restart the frontend dev server.',
      );
    }
    throw new Error(error?.message || 'Request failed. Please try again.');
  }
}

export async function fetchAwardeeEvents() {
  const result = await request(`${AWARDEES_URL}/events`);
  return result.data || [];
}

export async function createAwardeeEvent(eventName, adminKey) {
  return request(`${AWARDEES_URL}/events`, {
    method: 'POST',
    headers: buildHeaders(adminKey),
    body: JSON.stringify({ event_name: eventName }),
  });
}

export async function updateAwardeeEvent(eventId, eventName, adminKey) {
  return request(`${AWARDEES_URL}/events/${eventId}`, {
    method: 'PATCH',
    headers: buildHeaders(adminKey),
    body: JSON.stringify({ event_name: eventName }),
  });
}

export async function deleteAwardeeEvent(eventId, adminKey) {
  return request(`${AWARDEES_URL}/events/${eventId}`, {
    method: 'DELETE',
    headers: buildHeaders(adminKey),
  });
}

export async function fetchAwardees(adminKey = '') {
  return request(AWARDEES_URL, {
    headers: buildHeaders(adminKey),
  });
}

export async function createAwardee(payload, adminKey) {
  return request(AWARDEES_URL, {
    method: 'POST',
    headers: buildHeaders(adminKey),
    body: JSON.stringify(payload),
  });
}

export async function updateAwardee(awardeeId, payload, adminKey) {
  return request(`${AWARDEES_URL}/${awardeeId}`, {
    method: 'PATCH',
    headers: buildHeaders(adminKey),
    body: JSON.stringify(payload),
  });
}

export async function deleteAwardee(awardeeId, adminKey) {
  return request(`${AWARDEES_URL}/${awardeeId}`, {
    method: 'DELETE',
    headers: buildHeaders(adminKey),
  });
}

export { ADMIN_KEY_STORAGE };
