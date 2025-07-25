/*-----------------------------------------------------------------
* File: callApi.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: Call API functions for voice and video calling functionality
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';
import { API_URL } from '../config';

const API_BASE_URL = API_URL;

// Create axios instance with default config
const callApiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/calls`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
callApiClient.interceptors.request.use(
  (config) => {
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

// Add response interceptor for error handling
callApiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const callApi = {
  // Initiate a call (audio or video)
  initiateCall: async (callData) => {
    try {
      const response = await callApiClient.post('/initiate', callData);
      return response;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  },

  // Answer an incoming call
  answerCall: async (callData) => {
    try {
      const response = await callApiClient.post('/answer', callData);
      return response;
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  },

  // End a call
  endCall: async (callData) => {
    try {
      const response = await callApiClient.post('/end', callData);
      return response;
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  },

  // Reject an incoming call
  rejectCall: async (callData) => {
    try {
      const response = await callApiClient.post('/reject', callData);
      return response;
    } catch (error) {
      console.error('Error rejecting call:', error);
      throw error;
    }
  },

  // Get call history for a user
  getCallHistory: async (params = {}) => {
    try {
      const response = await callApiClient.get('/history', { params });
      return response;
    } catch (error) {
      console.error('Error getting call history:', error);
      throw error;
    }
  },

  // Get missed calls for a user
  getMissedCalls: async (params = {}) => {
    try {
      const response = await callApiClient.get('/missed', { params });
      return response;
    } catch (error) {
      console.error('Error getting missed calls:', error);
      throw error;
    }
  },

  // Get active call for a user
  getActiveCall: async () => {
    try {
      const response = await callApiClient.get('/active');
      return response;
    } catch (error) {
      console.error('Error getting active call:', error);
      throw error;
    }
  },

  // Get all active calls (admin feature)
  getActiveCalls: async () => {
    try {
      const response = await callApiClient.get('/active-calls');
      return response;
    } catch (error) {
      console.error('Error getting active calls:', error);
      throw error;
    }
  },

  // Join a call (for group calls)
  joinCall: async (callData) => {
    try {
      const response = await callApiClient.post('/join', callData);
      return response;
    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  },

  // Leave a call (for group calls)
  leaveCall: async (callData) => {
    try {
      const response = await callApiClient.post('/leave', callData);
      return response;
    } catch (error) {
      console.error('Error leaving call:', error);
      throw error;
    }
  },

  // Update call status
  updateCallStatus: async (callId, statusData) => {
    try {
      const response = await callApiClient.put(`/${callId}/status`, statusData);
      return response;
    } catch (error) {
      console.error('Error updating call status:', error);
      throw error;
    }
  },

  // Get call details
  getCallDetails: async (callId) => {
    try {
      const response = await callApiClient.get(`/${callId}`);
      return response;
    } catch (error) {
      console.error('Error getting call details:', error);
      throw error;
    }
  },

  // Update call settings (mute, video on/off, etc.)
  updateCallSettings: async (callId, settings) => {
    try {
      const response = await callApiClient.put(`/${callId}/settings`, settings);
      return response;
    } catch (error) {
      console.error('Error updating call settings:', error);
      throw error;
    }
  },

  // Start screen sharing
  startScreenShare: async (callId, shareData) => {
    try {
      const response = await callApiClient.post(`/${callId}/screen-share/start`, shareData);
      return response;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  },

  // Stop screen sharing
  stopScreenShare: async (callId) => {
    try {
      const response = await callApiClient.post(`/${callId}/screen-share/stop`);
      return response;
    } catch (error) {
      console.error('Error stopping screen share:', error);
      throw error;
    }
  },

  // Mute/unmute audio
  toggleAudio: async (callId, muted) => {
    try {
      const response = await callApiClient.put(`/${callId}/audio`, { muted });
      return response;
    } catch (error) {
      console.error('Error toggling audio:', error);
      throw error;
    }
  },

  // Enable/disable video
  toggleVideo: async (callId, enabled) => {
    try {
      const response = await callApiClient.put(`/${callId}/video`, { enabled });
      return response;
    } catch (error) {
      console.error('Error toggling video:', error);
      throw error;
    }
  },

  // Report call quality
  reportCallQuality: async (callId, qualityData) => {
    try {
      const response = await callApiClient.post(`/${callId}/quality`, qualityData);
      return response;
    } catch (error) {
      console.error('Error reporting call quality:', error);
      throw error;
    }
  },

  // Get call statistics
  getCallStats: async (callId) => {
    try {
      const response = await callApiClient.get(`/${callId}/stats`);
      return response;
    } catch (error) {
      console.error('Error getting call stats:', error);
      throw error;
    }
  }
}; 