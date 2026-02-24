const API_BASE = 'https://cpl-backend-h9oc.onrender.com';

/**
 * Fetch registration seasons (cplx, 2024, etc.)
 */
export const fetchRegistrationSeasons = async () => {
  try {
    const url = `${API_BASE}/v1/sports/cricket/registration/seasons?entity=celebria`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.seasons || ['cplx'];
  } catch (error) {
    console.error('Error fetching registration seasons:', error);
    return ['cplx'];
  }
};

/**
 * Fetch registration cohorts (men, kids, etc.) for a season
 * @param {string} season - Optional season filter
 */
export const fetchRegistrationCohorts = async (season = null) => {
  try {
    let url = `${API_BASE}/v1/sports/cricket/registration/cohorts?entity=celebria`;
    if (season) url += `&season=${encodeURIComponent(season)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.cohorts || ['men', 'kids', 'women'];
  } catch (error) {
    console.error('Error fetching registration cohorts:', error);
    return ['men', 'kids', 'women'];
  }
};

/**
 * Fetch all (season, cohort) pairs for the registration menu
 */
export const fetchRegistrationSeasonCohorts = async () => {
  try {
    const url = `${API_BASE}/v1/sports/cricket/registration/season-cohorts?entity=celebria`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.items || [{ season: 'cplx', cohort: 'men' }, { season: 'cplx', cohort: 'kids' }];
  } catch (error) {
    console.error('Error fetching registration season-cohorts:', error);
    return [
      { season: 'cplx', cohort: 'men' },
      { season: 'cplx', cohort: 'kids' },
    ];
  }
};

/**
 * Fetch registrations (public leaderboard)
 * @param {Object} opts - { season, category, status, limit, offset }
 */
export const fetchRegistrations = async (opts = {}) => {
  try {
    const params = new URLSearchParams();
    if (opts.season) params.set('season', opts.season);
    if (opts.category) params.set('category', opts.category);
    if (opts.status) params.set('status', opts.status);
    if (opts.limit) params.set('limit', opts.limit);
    if (opts.offset) params.set('offset', opts.offset);
    if (opts.order_by) params.set('order_by', opts.order_by);
    const url = `${API_BASE}/v1/sports/cricket/registration${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
};

/**
 * Upload profile photo to Supabase Storage. Returns the public URL.
 * @param {string} imageBase64 - Data URL (data:image/...;base64,...) or raw base64
 */
export const uploadRegistrationImage = async (imageBase64) => {
  const response = await fetch(`${API_BASE}/v1/sports/cricket/registration/upload-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed: ${response.status}`);
  }
  const result = await response.json();
  return result.url;
};

/**
 * Submit a new registration
 * @param {Object} data - { first_name, last_name, whatsapp_number, season, category, image_url? }
 */
export const submitRegistration = async (data) => {
  const response = await fetch(`${API_BASE}/v1/sports/cricket/registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Delete a registration (admin only)
 * @param {number} id - Registration ID
 * @param {string} adminKey - Admin secret
 */
export const deleteRegistration = async (id, adminKey) => {
  const response = await fetch(`${API_BASE}/v1/sports/cricket/registration/${id}/delete`, {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Update registration status (admin only)
 * @param {number} id - Registration ID
 * @param {string} status - New status (awaiting_confirmation, registered, rejected, cancelled)
 * @param {string} adminKey - Admin secret
 */
export const updateRegistrationStatus = async (id, status, adminKey) => {
  const response = await fetch(`${API_BASE}/v1/sports/cricket/registration/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};
