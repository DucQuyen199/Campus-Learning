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
  const response = await apiClient.get(`/competitions/${id}`);
  return response.data;
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
    
    // Handle 500 error
    if (error.response?.status === 500) {
      return {
        success: false,
        message: 'Server error occurred while loading problem details. Please try again later.',
        isServerError: true
      };
    }
    
    // Rethrow for other error handling
    throw error;
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
 * Submit a solution to a problem
 */
export const submitSolution = async (competitionId, problemId, data) => {
  const response = await apiClient.post(
    `/competitions/${competitionId}/problems/${problemId}/submit`, 
    data
  );
  return response.data;
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