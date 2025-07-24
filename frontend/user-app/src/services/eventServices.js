/*-----------------------------------------------------------------
* File: eventServices.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';
import { API_URL } from '@/config';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const getEventDetail = async (eventId) => {
  const token = getAuthToken();
  return await axios.get(`${API_URL}/api/events/${eventId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const registerForEvent = async (eventId, userData = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để đăng ký tham gia sự kiện');
  }
  
  console.log('Fallback registerForEvent called with:', eventId);
  return await axios.post(`${API_URL}/api/events/${eventId}/register`, userData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export const cancelEventRegistration = async (eventId) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn cần đăng nhập để hủy đăng ký sự kiện');
  }
  
  console.log('Fallback cancelEventRegistration called with:', eventId);
  return await axios.delete(`${API_URL}/api/events/${eventId}/register`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export const checkEventRegistration = async (eventId) => {
  const token = getAuthToken();
  if (!token) {
    return { isRegistered: false };
  }
  
  try {
    const response = await axios.get(`${API_URL}/api/events/${eventId}/registration-status`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking registration status:', error);
    return { isRegistered: false };
  }
}; 
