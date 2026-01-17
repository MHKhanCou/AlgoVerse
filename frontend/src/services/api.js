import axios from 'axios';

// Use VITE_API_BASE_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

console.log('API base ->', import.meta.env.VITE_API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,  // Important for cookies/sessions
  timeout: 15000,  // 15 second timeout
});

// Request interceptor to add auth token and handle requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request details for debugging
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      headers: config.headers,
      params: config.params,
      data: config.data,
    });
    
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses and errors
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} ${response.config.url}`, {
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    const { response } = error;
    const errorMessage = response?.data?.detail || error.message;
    
    console.error(`[API] Error ${response?.status || 'NO_RESPONSE'} ${error.config?.url || 'unknown'}:`, {
      message: errorMessage,
      status: response?.status,
      data: response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      },
    });
    
    // Handle specific error statuses
    if (response) {
      switch (response.status) {
        case 401:
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('login')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
          break;
        case 403:
          error.message = 'You do not have permission to perform this action.';
          break;
        case 404:
          error.message = 'The requested resource was not found.';
          break;
        case 500:
          error.message = 'An internal server error occurred. Please try again later.';
          break;
      }
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please check your internet connection and try again.';
    } else if (error.message === 'Network Error') {
      error.message = 'Unable to connect to the server. Please check your internet connection.';
    }
    
    // Add server error details if available
    if (response?.data) {
      error.serverError = response.data;
    }
    
    return Promise.reject(error);
  }
);

export default api;
