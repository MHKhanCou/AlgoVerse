/**
 * Centralized API Service for AlgoVerse
 * Environment-based automatic switching without commenting/uncommenting
 */

import axios from 'axios';

// Environment-based configuration
const isProduction = import.meta.env.MODE === 'production';
const DEV_API_BASE_URL = 'http://localhost:8000';
const PROD_API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_PROD_API_BASE_URL || 'https://algoverse-kpwz.onrender.com';

// Automatic URL selection based on environment
const API_BASE_URL = isProduction ? PROD_API_BASE_URL : DEV_API_BASE_URL;

// Dev-only. import.meta.env.DEV is replaced with `false` by Vite in a
// production build, so this whole block is dead code there and the resolved
// base URL never reaches a visitor's console.
if (import.meta.env.DEV) {
  console.debug(
    `[api] mode=${import.meta.env.MODE} env=${import.meta.env.VITE_ENVIRONMENT ?? '-'} base=${API_BASE_URL}`
  );
}

// Create axios instance with environment-based configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - automatically add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
      // Says whether a token was attached, never what it was.
      console.debug(
        `[api] ${config.method?.toUpperCase() ?? 'GET'} ${config.url} auth=${token ? 'yes' : 'no'}`
      );
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.debug(`[api] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Failures are worth logging in production too, but the response body is
    // not: it can echo back submitted fields. Keep the full dump to dev and
    // log only the routing facts a visitor would see in the Network tab.
    if (import.meta.env.DEV) {
      console.error('[api] request failed', {
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    } else {
      console.error(
        `[api] request failed: ${error.response?.status ?? 'no response'} ${error.config?.url ?? ''}`
      );
    }
    return Promise.reject(error);
  }
);

export default api;