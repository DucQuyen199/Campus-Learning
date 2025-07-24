/*-----------------------------------------------------------------
* File: profileApi.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import adminApi from './config';

// Profile API endpoints
export const profileAPI = {
  // Get admin profile
  getProfile: async () => {
    try {
      const response = await adminApi.get('/admin/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },
  
  // Update admin profile
  updateProfile: async (profileData) => {
    try {
      const response = await adminApi.put('/admin/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  
  // Update admin avatar
  updateAvatar: async (formData) => {
    try {
      const response = await adminApi.post('/admin/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  },
  
  // Get admin activity logs
  getActivityLogs: async (page = 1, limit = 10) => {
    try {
      const response = await adminApi.get(`/admin/activity-logs?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  },
  
  // Get admin login history
  getLoginHistory: async (page = 1, limit = 10) => {
    try {
      const response = await adminApi.get(`/admin/login-history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching login history:', error);
      throw error;
    }
  }
};

export default profileAPI;

