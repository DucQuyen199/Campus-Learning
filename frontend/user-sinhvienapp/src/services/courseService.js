/*-----------------------------------------------------------------
* File: courseService.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student portal application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/academic`;

// Set up axios interceptor to include the auth token
const authInterceptor = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
};

// Add interceptor to axios
axios.interceptors.request.use(authInterceptor);

const courseService = {
  /**
   * Get available courses for registration
   * @param {Object} params - Query parameters
   * @param {Number} params.semesterId - Optional semester ID
   * @param {String} params.query - Optional search query
   * @returns {Promise} - Promise with course data
   */
  getAvailableCourses: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/available-courses`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching available courses:', error);
      throw error;
    }
  },
  
  /**
   * Get student's registered courses
   * @param {Number} userId - User ID
   * @param {Object} params - Query parameters
   * @param {Number} params.semesterId - Optional semester ID
   * @returns {Promise} - Promise with registered courses data
   */
  getRegisteredCourses: async (userId, params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/registrations/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching registered courses:', error);
      throw error;
    }
  },
  
  /**
   * Register for a course
   * @param {Object} data - Registration data
   * @param {Number} data.userId - User ID
   * @param {Number} data.classId - Class ID
   * @param {String} data.registrationType - Registration type (Regular, Retake, Improvement)
   * @returns {Promise} - Promise with registration result
   */
  registerCourse: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/register-course`, data);
      return response.data;
    } catch (error) {
      console.error('Error registering course:', error);
      throw error;
    }
  },
  
  /**
   * Cancel a course registration
   * @param {Number} registrationId - Registration ID
   * @param {Number} userId - User ID
   * @returns {Promise} - Promise with cancellation result
   */
  cancelRegistration: async (registrationId, userId) => {
    try {
      const response = await axios.delete(`${API_URL}/cancel-registration/${registrationId}`, {
        data: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling registration:', error);
      throw error;
    }
  },
  
  /**
   * Get semesters
   * @returns {Promise} - Promise with semesters data
   */
  getSemesters: async () => {
    try {
      const response = await axios.get(`${API_URL}/semesters`);
      return response.data;
    } catch (error) {
      console.error('Error fetching semesters:', error);
      throw error;
    }
  },
  
  /**
   * Get current registration period info
   * @returns {Promise} - Promise with registration period data
   */
  getRegistrationPeriod: async () => {
    try {
      const response = await axios.get(`${API_URL}/registration-period`);
      return response.data;
    } catch (error) {
      console.error('Error fetching registration period:', error);
      throw error;
    }
  }
};

export default courseService; 
