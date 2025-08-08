const BASE_URL = 'http://localhost:8000';

export const authService = {
  async login(email, password) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      localStorage.setItem('token', data.access_token);
      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      console.error('Login error:', err);
      throw err;
    }
  },

  async adminLogin(email, password) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Admin login failed');
      }

      localStorage.setItem('token', data.access_token);
      return data;
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      console.error('Admin login error:', err);
      throw err;
    }
  },

  logout() {
    console.log("Logging out: Removing token");
    localStorage.removeItem('token');
  },

  getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  async fetchProtectedResource(url, options = {}) {
    try {
      console.log('Sending request:', {
        url,
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body,
      });

      const response = await fetch(`${BASE_URL}${url}`, {
        method: options.method || 'GET',
        headers: {
          ...this.getAuthHeader(),
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Session expired. Please sign in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData) || 'Failed to fetch resource');
      }

      return options.method === 'DELETE' ? { success: true } : await response.json();
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      console.error('API request error:', err);
      throw err;
    }
  },

  async getCurrentUser() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(`${BASE_URL}/profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Session expired. Please sign in again.');
        }
        const data = await response.json();
        throw new Error(data.detail || `Failed to fetch user profile (Status: ${response.status})`);
      }

      return await response.json();
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      console.error('User profile fetch error:', err.message);
      throw err;
    }
  },

  async getCurrentAdmin() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No token found");
      }

      const response = await fetch(`${BASE_URL}/admin/dashboard/admin-info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          this.logout();
          throw new Error("Token expired or invalid");
        }
        throw new Error(data.detail || "Not an admin or unauthorized");
      }

      return await response.json();
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      console.error('Admin verification error:', err);
      throw err;
    }
  },
};