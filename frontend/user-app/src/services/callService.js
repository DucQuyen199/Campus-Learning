/*-----------------------------------------------------------------
* File: callService.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';
import { API_URL } from '../config';
import { safeFetch } from '../utils/errorHandling';

/**
 * Creates an axios instance with custom error handling
 */
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  response => response,
  error => {
    // Return a default response for 404 errors to prevent app crashes
    if (error.response?.status === 404) {
      return {
        data: {
          message: 'Route not found',
          error: {
            status: 404,
            message: 'Route not found'
          }
        }
      };
    }
    return Promise.reject(error);
  }
);

const callService = {
  /**
   * Initiate a call to another user
   * @param {string} receiverId - User ID of the receiver
   * @param {string} type - Type of call ('audio' or 'video')
   * @returns {Promise} - Promise with call data
   */
  initiateCall: async (receiverId, type) => {
    try {
      const response = await api.post(`/calls/initiate`, {
        receiverId,
        type
      });
      return response.data;
    } catch (error) {
      // Log only in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Call initiation error:', error.message);
      }
      throw error.response?.data || { message: 'Failed to initiate call' };
    }
  },

  /**
   * Answer an incoming call
   * @param {string} callId - Call ID
   * @returns {Promise} - Promise with call data
   */
  answerCall: async (callId) => {
    try {
      const response = await api.post(`/calls/answer`, { callId });
      return response.data;
    } catch (error) {
      // Log only in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Call answer error:', error.message);
      }
      throw error.response?.data || { message: 'Failed to answer call' };
    }
  },

  /**
   * End an active call
   * @param {string} callId - Call ID
   * @returns {Promise} - Promise with call result
   */
  endCall: async (callId) => {
    try {
      const response = await api.post(`/calls/end`, { callId });
      return response.data;
    } catch (error) {
      // Log only in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Call end error:', error.message);
      }
      throw error.response?.data || { message: 'Failed to end call' };
    }
  },

  /**
   * Reject an incoming call
   * @param {string} callId - Call ID
   * @returns {Promise} - Promise with call result
   */
  rejectCall: async (callId) => {
    try {
      const response = await api.post(`/calls/reject`, { callId });
      return response.data;
    } catch (error) {
      // Log only in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Call rejection error:', error.message);
      }
      throw error.response?.data || { message: 'Failed to reject call' };
    }
  },

  /**
   * Get call history
   * @param {number} limit - Number of records to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise} - Promise with call history
   */
  getCallHistory: async (limit = 10, offset = 0) => {
    try {
      const response = await api.get(`/calls/history`, {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      // Log only in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Call history error:', error.message);
      }
      
      // Return empty data instead of throwing error
      return { calls: [], total: 0 };
    }
  },

  /**
   * Check for active call
   * @returns {Promise} - Promise with active call data if exists
   */
  getActiveCall: async () => {
    try {
      const response = await api.get(`/calls/active`);
      return response.data;
    } catch (error) {
      // If it's a 404, the endpoint doesn't exist - don't log it
      if (error.response?.status !== 404 && process.env.NODE_ENV === 'development') {
        console.warn('Active call check error:', error.message);
      }
      
      // Return a default response instead of throwing for 404 errors
      if (error.response?.status === 404) {
        return { hasActiveCall: false, call: null };
      }
      
      throw error.response?.data || { message: 'Failed to get active call' };
    }
  },
  
  /**
   * Check if call service is available
   * @returns {Promise<boolean>} - True if service is available
   */
  isServiceAvailable: async () => {
    try {
      // Use safeFetch to avoid exceptions
      const response = await safeFetch(`${API_URL}/calls/active`);
      return response.status !== 404 && response.ok;
    } catch (error) {
      return false;
    }
  }
};

export default callService;

