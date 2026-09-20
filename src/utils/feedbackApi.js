import { API_BASE_URL } from '../config/api';

const FEEDBACK_URL = `${API_BASE_URL}/v1/ganpati/2026/feedback`;

export const RATING_OPTIONS = Array.from({ length: 11 }, (_, i) => i * 0.5);

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

export async function fetchFeedback({
  sortBy = 'created_at',
  sortOrder = 'desc',
  minRating = 'all',
  maxRating = 'all',
  anonymous = 'all',
  hasComment = 'all',
} = {}) {
  const params = new URLSearchParams({
    sort_by: sortBy,
    sort_order: sortOrder,
  });
  if (minRating !== 'all' && minRating !== '') {
    params.set('min_rating', String(minRating));
  }
  if (maxRating !== 'all' && maxRating !== '') {
    params.set('max_rating', String(maxRating));
  }
  if (anonymous !== 'all') {
    params.set('anonymous', anonymous);
  }
  if (hasComment !== 'all') {
    params.set('has_comment', hasComment);
  }
  return request(`${FEEDBACK_URL}?${params.toString()}`);
}

export async function createFeedback(payload) {
  return request(FEEDBACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function ratingLabel(rating) {
  if (rating === 0) return 'Improvement needed';
  if (rating === 5) return 'Awesome';
  return `${rating} star${rating === 1 ? '' : 's'}`;
}

export function displayName(item) {
  if (item.is_anonymous) return 'Anonymous';
  return item.name || '—';
}

export function formatFeedbackDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
