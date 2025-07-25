/*-----------------------------------------------------------------
* File: axiosConfig.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Define API base URL - use environment variable if available, otherwise default to local server
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5011/api';

// Create axios instance with proper base URL
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Log API configuration on startup
console.log('API configured with base URL:', API_BASE_URL);

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Fix potential double slashes in URL
    if (config.url && config.url.startsWith('/') && config.baseURL && config.baseURL.endsWith('/')) {
      config.url = config.url.substring(1);
    }
    
    // Log all API requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    
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

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Log the failed URL for debugging
    console.error('API request failed:', {
      url: originalRequest ? originalRequest.url : 'unknown',
      method: originalRequest ? originalRequest.method : 'unknown',
      baseURL: originalRequest ? originalRequest.baseURL : 'unknown',
      status: error.response ? error.response.status : 'network error'
    });
    
    // Handle network errors
    if (!error.response) {
      toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized errors
    if (error.response.status === 401 && !originalRequest._retry) {
      // Check if this is not a login request to prevent infinite loop
      if (!originalRequest.url.includes('/login') && !originalRequest.url.includes('/login-gmail')) {
        originalRequest._retry = true;
        
        // Log out the user when token is invalid
        localStorage.removeItem('token');
        
        // Show error message
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        
        // Redirect to login page
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }
    }
    
    // Handle 404 Not Found specifically for API endpoints
    if (error.response.status === 404) {
      console.error('API endpoint not found:', originalRequest?.url);
      toast.error('Không tìm thấy API endpoint. Vui lòng kiểm tra cấu hình hệ thống.');
    }
    
    // Handle 500 errors
    if (error.response.status >= 500) {
      toast.error('Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
    }
    
    // Handle 403 errors - Permission denied
    if (error.response.status === 403) {
      toast.error('Bạn không có quyền truy cập vào tài nguyên này.');
    }
    
    // Create error message to show to user
    const errorMsg = error.response?.data?.message || 
                     error.response?.statusText || 
                     error.message || 
                     'Có lỗi xảy ra. Vui lòng thử lại sau.';
    
    // Display error message for non-401 errors (we already handle 401 above)
    if (error.response && error.response.status !== 401) {
      toast.error(errorMsg);
    }
    
    // Log error to console
    console.error('API Error:', error);

    // Return the rejected promise
    return Promise.reject(error);
  }
);

export default axiosInstance; 
