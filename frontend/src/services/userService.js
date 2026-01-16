 import api from './api';

const handleResponse = (response) => {
  return response.data;
};

export const userService = {
  async getProfile() {
    const response = await api.get('/profile/me');
    return handleResponse(response);
  },
  
  // Request OTP to be sent to the new email for verification
  async requestEmailOtp(data) {
    const response = await api.post('/profile/request-email-otp', data);
    return handleResponse(response);
  },
  
  // Verify OTP and finalize email change, expecting new access token
  async verifyEmailOtp(data) {
    const response = await api.post('/profile/verify-email-otp', data);
    const result = handleResponse(response);
    if (result.access_token) {
      localStorage.setItem('token', result.access_token);
    }
    return result;
  },

  async getStats() {
    const response = await api.get('/profile/stats');
    return handleResponse(response);
  },

  async updateEmail(data) {
    const response = await api.put('/profile/update-email', data);
    const result = handleResponse(response);
    if (result.access_token) {
      localStorage.setItem('token', result.access_token);
    }
    return result;
  },

  async updatePassword(data) {
    const response = await api.put('/profile/update-password', data);
    return handleResponse(response);
  },

  async deleteAccount() {
    const response = await api.delete('/profile/delete');
    localStorage.clear();
    return null;
  },

  async getMyProgress() {
    const response = await api.get('/profile/my-progress');
    return handleResponse(response);
  },

  async getPublicProfile(userId) {
    const response = await api.get(`/users/${userId}/public`);
    return handleResponse(response);
  },
};