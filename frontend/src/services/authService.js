import api from './api';

export const authService = {
  async login(email, password) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/login', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      localStorage.setItem('token', response.data.access_token);
      return response.data;
    } catch (err) {
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
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

      const response = await api.post('/admin/login', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      localStorage.setItem('token', response.data.access_token);
      return response.data;
    } catch (err) {
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
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

  async getCurrentUser() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No token found");
      }

      const response = await api.get('/profile/me');
      return response.data;
    } catch (err) {
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
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

      const response = await api.get('/admin/dashboard/admin-info');
      return response.data;
    } catch (err) {
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        throw new Error('Network error: Unable to reach the server. Please check if the backend is running.');
      }
      console.error('Admin verification error:', err);
      throw err;
    }
  },
};