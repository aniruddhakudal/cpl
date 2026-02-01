const API_BASE = 'https://cpl-backend-h9oc.onrender.com';

/**
 * Fetches cohorts for an entity from the API
 * @param {string} entity - The entity parameter (e.g., 'celebria', 'adults')
 * @returns {Promise<Array>} Array of cohort values
 */
export const fetchCohorts = async (entity) => {
  if (!entity) {
    return [];
  }

  try {
    const url = `${API_BASE}/v1/sports/cricket/tournaments?field=cohort&entity=${encodeURIComponent(entity)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    let values = result.values;

    if (!values && result.data) {
      values = result.data.values || result.data;
    }
    if (!Array.isArray(values)) {
      values = result.cohorts?.values || result.results?.values || [];
    }
    if (Array.isArray(values)) {
      return values;
    }
    if (Array.isArray(result)) {
      return result;
    }
    if (Array.isArray(result.data)) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching cohorts:', error);
    return [];
  }
};

/**
 * Fetches tournaments from the API based on entity and cohort
 * @param {string} entity - The entity parameter (e.g., 'men', 'women', 'adults')
 * @param {string} cohort - The cohort parameter (e.g., 'adults', 'youth')
 * @returns {Promise<Array>} Array of tournament objects
 */
export const fetchTournaments = async (entity, cohort) => {
  if (!entity || !cohort) {
    console.warn('fetchTournaments: entity and cohort are required');
    return [];
  }

  try {
    const url = `${API_BASE}/v1/sports/cricket/tournaments?field=category&entity=${encodeURIComponent(entity)}&cohort=${encodeURIComponent(cohort)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('fetchTournaments: HTTP error', response.status, await response.text());
      return [];
    }
    
    const result = await response.json();
    
    // Extract the values array from the response
    // The API returns a structure with a "values" array containing category values
    let values = result.values;
    
    // If values is nested in data or other properties
    if (!values && result.data) {
      values = result.data.values || result.data;
    }
    
    // If it's still not an array, try other common structures
    if (!Array.isArray(values)) {
      values = result.tournaments?.values || result.categories?.values || result.results?.values || [];
    }
    
    // If values is an array, return it directly
    if (Array.isArray(values)) {
      return values;
    }
    
    // Fallback: if the response itself is an array, return it
    if (Array.isArray(result)) {
      return result;
    }
    
    // If we have a data property that's an array, return it
    if (Array.isArray(result.data)) {
      return result.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }
};

/**
 * Fetches seasons from the API based on entity and cohort
 * @param {string} entity - The entity parameter (e.g., 'men', 'women', 'adults')
 * @param {string} cohort - The cohort parameter (e.g., 'adults', 'youth')
 * @param {string} category - Optional category filter (tournament category)
 * @returns {Promise<Array>} Array of season values
 */
export const fetchSeasons = async (entity, cohort, category = null) => {
  if (!entity || !cohort) {
    throw new Error('Entity and cohort are required to fetch seasons');
  }

  try {
    let url = `${API_BASE}/v1/sports/cricket/tournaments?field=season&entity=${encodeURIComponent(entity)}&cohort=${encodeURIComponent(cohort)}`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Extract the values array from the response
    // The API returns a structure with a "values" array containing season values
    let values = result.values;
    
    // If values is nested in data or other properties
    if (!values && result.data) {
      values = result.data.values || result.data;
    }
    
    // If it's still not an array, try other common structures
    if (!Array.isArray(values)) {
      values = result.seasons?.values || result.results?.values || [];
    }
    
    // If values is an array, return it directly
    if (Array.isArray(values)) {
      return values;
    }
    
    // Fallback: if the response itself is an array, return it
    if (Array.isArray(result)) {
      return result;
    }
    
    // If we have a data property that's an array, return it
    if (Array.isArray(result.data)) {
      return result.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching seasons:', error);
    throw error;
  }
};

