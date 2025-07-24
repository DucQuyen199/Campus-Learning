/*-----------------------------------------------------------------
* File: axiosInstance.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';

// Create axios instance with default config
const axiosInstance = axios.create({
  // Set baseURL without the trailing slash to avoid double-slash issues
  baseURL: (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, ''),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug log to trace API calls (remove in production)
    console.debug(`[API] ${config.method?.toUpperCase() || 'GET'} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Handle logout or token refresh here
      // For now, just redirect to login if token expired
      const isAuthPage = window.location.pathname.includes('/login') || 
                         window.location.pathname.includes('/register');
      
      if (!isAuthPage) {
        // If not on auth page already, redirect to login
        console.log('Authentication expired. Redirecting to login...');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 
