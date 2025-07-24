/*-----------------------------------------------------------------
* File: eventServices.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';
import { API_URL } from '@/config';

const getAuthToken = () => localStorage.getItem('token');

export const eventServices = {
  getAllEvents: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.category && filters.category !== 'all') {
        queryParams.append('category', filters.category);
      }
      if (filters.difficulty && filters.difficulty !== 'all') {
        queryParams.append('difficulty', filters.difficulty);
      }
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      
      const url = `/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Requesting URL:', url);
      
      const response = await axios.get(url);
      console.log('API Response:', response.data);
      return response;
    } catch (error) {
      console.error('Error in getAllEvents:', error);
      throw error;
    }
  },

  getUpcomingEvents: () => axios.get('/events/upcoming'),

  getEventDetail: async (eventId) => {
    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_URL}/events/${eventId}`, { headers });
      return response;
    } catch (error) {
      // Xử lý lỗi nhưng không tự động logout
      throw error;
    }
  },

  registerEvent: async (eventId, userData = {}) => {
    console.log('API registerEvent called with:', { eventId, userData });
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Bạn cần đăng nhập để đăng ký tham gia sự kiện');
    }

    try {
      const response = await axios.post(`${API_URL}/events/${eventId}/register`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API registration error:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  cancelRegistration: async (eventId) => {
    console.log('API cancelRegistration called for event:', eventId);
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Bạn cần đăng nhập để hủy đăng ký sự kiện');
    }

    try {
      const response = await axios.delete(`${API_URL}/events/${eventId}/register`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Cancel registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API cancel registration error:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  checkRegistrationStatus: async (eventId) => {
    console.log('Checking registration status for event:', eventId);
    
    const token = localStorage.getItem('token');
    if (!token) {
      return { isRegistered: false };
    }

    try {
      const response = await axios.get(`${API_URL}/events/${eventId}/registration-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Registration status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking registration status:', error);
      return { isRegistered: false };
    }
  },

  getEventParticipants: (eventId) => axios.get(`/events/${eventId}/participants`),

  getEventSchedule: (eventId) => axios.get(`/events/${eventId}/schedule`),
}; 
