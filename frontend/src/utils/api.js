/**
 * Simple JWT decoder to extract the expiration time
 * @param {string} token - The JWT token
 * @returns {object|null} - Decoded payload or null
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

/**
 * API Client wrapper to handle global errors and auth headers
 */
class ApiClient {
  constructor() {
    this.logoutHandler = null;
  }

  setLogoutHandler(handler) {
    this.logoutHandler = handler;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('code2cloud_token');
    
    const headers = {
      'Content-Type': options.body instanceof FormData ? undefined : 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Remove Content-Type if it was set to undefined (for FormData)
    if (headers['Content-Type'] === undefined) {
      delete headers['Content-Type'];
    }

    const config = {
      ...options,
      headers,
    };

    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        console.warn('Unauthorized request detected (401). Logging out...');
        if (this.logoutHandler) {
          this.logoutHandler();
        }
        throw new Error('Unauthorized');
      }

      return response;
    } catch (error) {
      if (error.message === 'Unauthorized') {
        // Redirection should ideally happen in the handler or via state change
        throw error;
      }
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
