/**
 * API Service Utility
 * Handles all HTTP requests with proper base URL configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Get authorization header with token
 */
function getAuthHeader() {
  const token = localStorage.getItem('access_token');
  if (!token) return {};
  return { 'Authorization': `Bearer ${token}` };
}

/**
 * Make API request with error handling
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Check if response is OK
    if (!response.ok) {
      const error = new Error(`API Error: ${response.status}`);
      error.status = response.status;
      error.response = response;

      // Try to parse error body
      try {
        error.data = await response.json();
      } catch {
        error.text = await response.text();
      }

      throw error;
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error(`API Request Failed: ${url}`, error);
    throw error;
  }
}

/**
 * GET request
 */
export function apiGet(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export function apiPost(endpoint, data, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request
 */
export function apiPatch(endpoint, data, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export function apiDelete(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Upload file (FormData)
 */
export async function apiUpload(endpoint, formData, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const config = {
    method: options.method || 'POST',
    headers: getAuthHeader(),
    body: formData,
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = new Error(`Upload Failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error(`Upload Failed: ${endpoint}`, error);
    throw error;
  }
}

export default {
  apiRequest,
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  apiUpload,
};
