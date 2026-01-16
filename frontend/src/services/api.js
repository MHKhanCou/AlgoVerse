import axios from 'axios';

// Set the production API URL explicitly
const PRODUCTION_URL = 'https://algoverse-kpwz.onrender.com';

// Use production URL in production, otherwise use environment variable or localhost
const API_BASE_URL = import.meta.env.PROD 
  ? PRODUCTION_URL 
  : (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000');

console.log('API Base URL:', API_BASE_URL);  // Debug log

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true  // Important for cookies/sessions
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request:', config);  // Debug log
    return config;
  },
  (error) => {
    console.error('Request Error:', error);  // Debug log
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response);  // Debug log
    return response;
  },
  (error) => {
    console.error('Response Error:', error.response || error);  // Debug log
    
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
