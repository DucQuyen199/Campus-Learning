/*-----------------------------------------------------------------
* File: settings.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';
import { API_URL } from '@/config';

// Create settings API instance
const api = axios.create({
  baseURL: `${API_URL}/api/settings`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Settings services
const settingsServices = {
  // Get user settings
  getUserSettings: () => api.get('/'),
  
  // Update user settings
  updateSettings: (settings) => api.put('/', { settings }),
  
  // Upload profile picture
  uploadProfilePicture: (formData) => api.post('/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Change password
  changePassword: (currentPassword, newPassword) => api.post('/change-password', { 
    currentPassword, 
    newPassword 
  }),
  
  // Delete account
  deleteAccount: (password, reason) => api.post('/delete-account', { 
    password, 
    reason 
  }),

  // Export user data
  exportData: () => api.post('/export-data', {}, {
    responseType: 'arraybuffer',
    headers: {
      'Accept': 'application/json, application/octet-stream'
    }
  }).then(response => {
    // Check if the response is a JSON or a file
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      return response;
    } else {
      // Convert arraybuffer to blob
      response.data = new Blob([response.data], {
        type: contentType || 'application/json'
      });
      return response;
    }
  }),
};

export default settingsServices; 
