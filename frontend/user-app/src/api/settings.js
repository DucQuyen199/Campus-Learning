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
};

export default settingsServices; 