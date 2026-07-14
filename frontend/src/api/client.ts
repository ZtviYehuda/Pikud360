import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Retrieve configuration API URL (fallback to relative proxy for dev server compatibility)
const API_URL = import.meta.env.VITE_API_URL || '/api-proxy';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token if authenticated
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Dynamically inject active language header
    const lang = localStorage.getItem('lang') || 'en';
    if (config.headers) {
      config.headers['Accept-Language'] = lang;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Parse global response envelope or handle unauthorized codes
apiClient.interceptors.response.use(
  (response) => {
    // Return the custom inner data block directly if matching our API Response shape
    if (response.data && response.data.success) {
      return response.data;
    }
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Automatically logout if receiving 401 Unauthorized, and redirect to login
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    // Standardize error formats for easier frontend handling
    const errorMessage = error.response?.data?.error?.message || error.message || 'API request failed';
    const errorCode = error.response?.data?.error?.code || 'NETWORK_ERROR';
    const errorDetails = error.response?.data?.error?.details || null;
    
    return Promise.reject({
      message: errorMessage,
      code: errorCode,
      details: errorDetails,
      status: error.response?.status,
    });
  }
);
