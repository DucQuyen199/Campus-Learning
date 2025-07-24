/*-----------------------------------------------------------------
* File: authService.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const authService = {
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  forgotPassword: async (email) => {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data;
  },

  verifyResetToken: async (token) => {
    const response = await axios.get(`${API_URL}/auth/reset-password/${token}/verify`);
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await axios.post(`${API_URL}/auth/reset-password/${token}`, { password });
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await axios.put(`${API_URL}/users/profile`, userData, {
      headers: { Authorization: `Bearer ${authService.getToken()}` }
    });
    
    // Update stored user data
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await axios.post(`${API_URL}/auth/change-password`, 
      { currentPassword, newPassword },
      { headers: { Authorization: `Bearer ${authService.getToken()}` }}
    );
    return response.data;
  }
};

export default authService; 
