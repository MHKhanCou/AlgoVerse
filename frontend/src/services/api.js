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

console.log('🚀 AlgoVerse API Configuration:');
console.log(`   MODE: ${import.meta.env.MODE}`);
console.log(`   VITE_ENVIRONMENT: ${import.meta.env.VITE_ENVIRONMENT}`);
console.log(`   VITE_API_URL: ${import.meta.env.VITE_API_URL}`);
console.log(`   VITE_PROD_API_BASE_URL: ${import.meta.env.VITE_PROD_API_BASE_URL}`);
console.log(`   isProduction: ${isProduction}`);
console.log(`   API Base URL: ${API_BASE_URL}`);
console.log('='.repeat(50));

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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api;