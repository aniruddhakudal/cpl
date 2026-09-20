const PRODUCTION_API_BASE_URL = 'https://cpl-backend-h9oc.onrender.com';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : PRODUCTION_API_BASE_URL);
