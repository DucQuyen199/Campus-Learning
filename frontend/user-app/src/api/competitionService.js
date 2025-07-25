/*-----------------------------------------------------------------
* File: competitionService.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';
import { API_URL } from '@/config';

const API_ENDPOINT = `${API_URL}/api`;

// Create axios instance with auth header
const apiClient = axios.create({
  baseURL: API_ENDPOINT
});

// Add a request interceptor to include the token in every request
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

/**
 * Get all competitions
 */
export const getAllCompetitions = async () => {
  const response = await apiClient.get('/competitions');
  return response.data;
};

/**
 * Get competition details by ID
 */
export const getCompetitionDetails = async (id) => {
  try {
    console.log(`Fetching competition ${id} details`);
    const response = await apiClient.get(`/competitions/${id}`);
    
    // Debug competition participants count
    console.log('Competition API response:', response.data);
    console.log('Current participants count:', response.data?.data?.CurrentParticipants);
    
    // Ensure we have valid data structure
    if (!response.data?.data) {
      console.error('Invalid competition response format:', response.data);
      return {
        success: false,
        message: 'Invalid competition data format returned from server'
      };
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching competition ${id}:`, 
      error.response ? {
        status: error.response.status,
        data: error.response.data
      } : error.message);
    
    // Return an error response in a consistent format
    return {
      success: false,
      message: error.response?.data?.message || 'Error fetching competition details',
      error: error.message
    };
  }
};

/**
 * Get problem details
 */
export const getProblemDetails = async (competitionId, problemId) => {
  try {
    console.log(`Fetching problem details for competition ${competitionId}, problem ${problemId}`);
    const response = await apiClient.get(`/competitions/${competitionId}/problems/${problemId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching problem details for competition ${competitionId}, problem ${problemId}:`, 
      error.response ? {
        status: error.response.status,
        data: error.response.data
      } : error.message);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'You must be logged in to view problem details.',
        isAuthError: true
      };
    }

    // Handle permission errors
    if (error.response?.status === 403) {
      return {
        success: false,
        message: error.response.data.message || 'You do not have permission to view this problem.',
        isPermissionError: true
      };
    }
    
    // Handle 500 error
    if (error.response?.status === 500) {
      return {
        success: false,
        message: 'Server error occurred while loading problem details. Please try again later.',
        isServerError: true
      };
    }
    
    // Return a consistent error format for other errors
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'An error occurred while fetching problem details.',
        status: error.response.status
      };
    }
    
    // Generic network/connection errors
    return {
      success: false,
      message: 'Unable to connect to the server. Please check your internet connection.',
      isNetworkError: true
    };
  }
};

/**
 * Register for a competition
 */
export const registerForCompetition = async (competitionId) => {
  try {
    console.log(`Registering for competition ${competitionId}`);
    const response = await apiClient.post(`/competitions/${competitionId}/register`);
    console.log(`Registration response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Registration error for competition ${competitionId}:`, 
      error.response ? {
        status: error.response.status,
        data: error.response.data
      } : error.message);
    
    // Check for already registered error with more detailed logging
    if (error.response?.status === 400) {
      console.log('Checking for already registered error:', error.response.data);
      
      // Check for the specific error code
      if (error.response.data.code === 'ALREADY_REGISTERED') {
        console.log('Detected ALREADY_REGISTERED error code, returning success with flag');
        return {
          success: true,
          message: error.response.data.message || 'You are already registered for this competition',
          alreadyRegistered: true
        };
      }
      
      // Check if competition is not open for registration
      if (error.response.data.message?.includes('not open for registration')) {
        return {
          success: false,
          message: 'This competition is not open for registration at this time.',
          notOpen: true
        };
      }
      
      // Check if competition is full
      if (error.response.data.message?.includes('full')) {
        return {
          success: false,
          message: 'This competition is full. No more registrations are being accepted.',
          isFull: true
        };
      }
      
      // Various ways the message might indicate user is already registered
      const errorMessage = error.response.data.message || '';
      if (
        errorMessage.includes('already registered') || 
        errorMessage.includes('already enrolled') || 
        errorMessage.includes('already signed up') ||
        errorMessage.includes('already a participant')
      ) {
        console.log('Detected already registered error through message, returning success with flag');
        return {
          success: true,
          message: 'You are already registered for this competition',
          alreadyRegistered: true
        };
      }
    }
    
    // Rethrow other errors
    throw error;
  }
};

/**
 * Start a competition
 */
export const startCompetition = async (competitionId) => {
  try {
    console.log(`Starting competition ${competitionId}`);
    const response = await apiClient.post(`/competitions/${competitionId}/start`);
    console.log(`Start competition response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error starting competition ${competitionId}:`, 
      error.response ? {
        status: error.response.status,
        data: error.response.data
      } : error.message);
    
    // Handle common error cases
    if (error.response?.status === 400) {
      console.log('Checking start competition error:', error.response.data);
      
      // Handle case where the competition is not ongoing
      const errorMessage = error.response.data.message || '';
      if (errorMessage.includes('not currently ongoing')) {
        console.log('Competition is not ongoing, returning with friendly message');
        return {
          success: false,
          message: 'This competition cannot be started right now. It may not have begun yet or has already ended.',
          notOngoing: true
        };
      }
      
      // Handle case where user has already started
      if (errorMessage.includes('already started')) {
        console.log('User already started this competition, redirecting');
        return {
          success: true,
          message: 'You have already started this competition',
          alreadyStarted: true
        };
      }
    }
    
    // Handle server errors (500) with a friendly message
    if (error.response?.status === 500) {
      console.log('Server error when starting competition, returning friendly message');
      return {
        success: false,
        message: 'Unable to start competition due to a server error. Please try again later.',
        isServerError: true
      };
    }
    
    // Rethrow other errors
    throw error;
  }
};

/**
 * Submit a solution for a competition problem
 */
export const submitSolution = async (competitionId, problemId, sourceCode, language) => {
  try {
    console.log(`Submitting solution for competition ${competitionId}, problem ${problemId}`);
    const response = await apiClient.post(
      `/competitions/${competitionId}/problems/${problemId}/submit`, 
      { 
        sourceCode,
        language
      }
    );
    console.log(`Submission response:`, response.data);
    
    // If submission has additional result details, include them in the response
    if (response.data?.data?.results) {
      const results = response.data.data.results;
      return {
        ...response.data,
        data: {
          ...response.data.data,
          diffInfo: results.diffInfo || null, // Include any diff information if available
        }
      };
    }
    
    return response.data;
  } catch (error) {
    console.error(`Submission error for competition ${competitionId}, problem ${problemId}:`, 
      error.response ? {
        status: error.response.status,
        data: error.response.data
      } : error.message);
    
    // Return error in a consistent format
    return {
      success: false,
      message: error.response?.data?.message || 'Error submitting solution',
      error: error.message
    };
  }
};

/**
 * Get competition scoreboard
 */
export const getScoreboard = async (competitionId) => {
  const response = await apiClient.get(`/competitions/${competitionId}/scoreboard`);
  return response.data;
};

/**
 * Get submission details
 */
export const getSubmissionDetails = async (submissionId) => {
  const response = await apiClient.get(`/competitions/submissions/${submissionId}`);
  return response.data;
};

/**
 * Get user's competitions
 */
export const getUserCompetitions = async () => {
  const response = await apiClient.get(`/user/competitions`);
  return response.data;
}; 
