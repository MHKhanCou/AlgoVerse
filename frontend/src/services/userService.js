 const API_URL = 'http://127.0.0.1:8000';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || response.statusText);
  }
  return response.json();
};

export const userService = {
  async getProfile() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },
  
  // Request OTP to be sent to the new email for verification
  async requestEmailOtp(data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile/request-email-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  
  // Verify OTP and finalize email change, expecting new access token
  async verifyEmailOtp(data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile/verify-email-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    if (result.access_token) {
      localStorage.setItem('token', result.access_token);
    }
    return result;
  },

  async getStats() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async updateEmail(data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile/update-email`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse(response);
    if (result.access_token) {
      localStorage.setItem('token', result.access_token);
    }
    return result;
  },

  async updatePassword(data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile/update-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteAccount() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile/delete`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to delete account');
    }
    localStorage.clear();
    return null;
  },

  async getMyProgress() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile/my-progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(response);
  },

  async getPublicProfile(userId) {
    const response = await fetch(`${API_URL}/users/${userId}/public`);
    return handleResponse(response);
  },
};