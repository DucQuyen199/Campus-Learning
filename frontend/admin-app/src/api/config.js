/*-----------------------------------------------------------------
* File: config.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';

// Get the API URL from environment variables or use the default
const apiUrl = import.meta?.env?.VITE_API_URL || 'http://localhost:5002/api';

const adminApi = axios.create({
  baseURL: apiUrl,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Thêm biến để theo dõi refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Check if we're on the client side before accessing localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token');
  }
  return null;
};

adminApi.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Handle network or server errors
    if (!error.response) {
      console.error('Network error detected:', error.message);
      return Promise.reject(new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'));
    }

    // Handle 401 and refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Check if the error response indicates a token expiration
      const isTokenExpired = error.response?.data?.code === 'TOKEN_EXPIRED';

      if (isRefreshing) {
        try {
          // Wait for the other refresh call
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return adminApi(originalRequest);
        } catch (err) {
          // Don't redirect automatically, let the component handle it
          console.error('Error refreshing token:', err);
          return Promise.reject(err);
        }
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('admin_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Use the dedicated refresh endpoint
        const response = await axios.post(`${apiUrl}/refresh`, { refreshToken }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data?.token) {
          // Store the new tokens
          localStorage.setItem('admin_token', response.data.token);
          localStorage.setItem('admin_refresh_token', response.data.refreshToken);
          
          // Update headers for future requests
          adminApi.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          
          // Process queued requests with the new token
          processQueue(null, response.data.token);
          
          // Retry the original request with the new token
          return adminApi(originalRequest);
        } else {
          throw new Error('Refresh response did not contain a token');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Store current path but DON'T redirect automatically - let the component handle it
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            localStorage.setItem('auth_redirect', currentPath);
          }
          
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_refresh_token');
          
          // REMOVE automatic redirect
          // window.location.href = '/login';
          
          // Instead, dispatch a custom event that components can listen for
          const authErrorEvent = new CustomEvent('auth:error', { 
            detail: { 
              error: refreshError,
              message: 'Authentication failed. Please log in again.'
            } 
          });
          window.dispatchEvent(authErrorEvent);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default adminApi; 
