import axios from 'axios';

// Environment-based configuration
const getApiBaseUrl = () => {
  // In development, use VITE_API_URL if set, otherwise default to localhost
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  }
  
  // In production, use the current origin's hostname to determine the API URL
  const hostname = window.location.hostname;
  
  // List of production domains and their corresponding API URLs
  const productionMappings = {
    'algo-verse-eight.vercel.app': 'https://algoverse-kpwz.onrender.com',
    'algo-verse-git-main-mehedi-hasan-khans-projects.vercel.app': 'https://algoverse-kpwz.onrender.com',
    'algo-verse-a9e9uoryp-mehedi-hasan-khans-projects.vercel.app': 'https://algoverse-kpwz.onrender.com',
    'localhost': 'http://127.0.0.1:8000',
    '127.0.0.1': 'http://127.0.0.1:8000'
  };

  return productionMappings[hostname] || 'https://algoverse-kpwz.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Important for cookies/sessions
  timeout: 10000,  // 10 second timeout
});

// Add a response interceptor to handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
