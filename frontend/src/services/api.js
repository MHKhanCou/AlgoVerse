import axios from 'axios';

// Get API base URL from environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      error.message = 'Network error: Unable to reach the server. Please check if the backend is running.';
    }
    
    return Promise.reject(error);
  }
);

export default api;
