import axios from 'axios';
import { API_URL } from '../config';

/**
 * Utility function to check if an ID is valid
 * @param {string|number} id - The ID to validate
 * @returns {boolean} - True if ID is valid, false otherwise
 */
const isValidId = (id) => {
  return id !== undefined && id !== null && id !== 'undefined' && id !== 'null';
};

/**
 * Get all competitions with optional filters
 * @param {Object} params - Query parameters for filtering competitions
 * @param {string} params.status - Filter by status (upcoming, ongoing, completed)
 * @param {string} params.difficulty - Filter by difficulty level
 * @param {boolean} params.registered - Filter by user registration status
 * @param {string} token - User authentication token
 * @returns {Promise} - Promise with competition data
 */
export const getAllCompetitions = async (params = {}, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const response = await axios.get(`${API_URL}/api/competitions`, {
      params,
      headers
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching competitions:', error);
    throw error;
  }
};

/**
 * Get competition by ID
 * @param {string|number} id - Competition ID
 * @param {string} token - User authentication token
 * @returns {Promise} - Promise with competition data
 */
export const getCompetitionById = async (id, token = null) => {
  // Validate ID before making API call
  if (!isValidId(id)) {
    console.error('Invalid competition ID provided to getCompetitionById:', id);
    return Promise.reject(new Error('Invalid competition ID'));
  }
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const response = await axios.get(`${API_URL}/api/competitions/${id}`, {
      headers
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching competition ${id}:`, error);
    throw error;
  }
};

/**
 * Register for a competition
 * @param {string|number} id - Competition ID
 * @param {string} token - User authentication token
 * @returns {Promise} - Promise with registration result
 */
export const registerCompetition = async (id, token) => {
  // Validate ID before making API call
  if (!id || id === 'undefined') {
    console.error('Invalid competition ID provided to registerCompetition:', id);
    return {
      success: false,
      message: 'Invalid competition ID'
    };
  }
  
  if (!token) {
    console.error('No authentication token provided for registration');
    return {
      success: false,
      message: 'Authentication token is required for registration'
    };
  }
  
  try {
    console.log(`Sending registration request for competition ${id} with token`);
    
    // Make sure token is properly formatted
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Verify token format
    if (formattedToken.split(' ')[1].length < 10) {
      console.error('Token appears to be invalid (too short)');
      return {
        success: false,
        message: 'Invalid authentication token'
      };
    }
    
    const response = await axios.post(
      `${API_URL}/api/competitions/${id}/register`,
      {},
      { 
        headers: { 
          Authorization: formattedToken,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    console.log(`Registration response for competition ${id}:`, response.data);
    
    // If the response doesn't include a success flag, add it
    if (response.data && !response.data.hasOwnProperty('success')) {
      return {
        ...response.data,
        success: true
      };
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error registering for competition ${id}:`, error);
    
    // More detailed error handling for date/time conversion errors
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
      console.error('Error data:', errorData);
      
      // Specific handling for date conversion errors
      if (errorData.error && errorData.error.includes('converting date')) {
        return {
          success: false,
          message: 'Registration failed due to a date formatting issue. Please try again later.',
          error: errorData.error
        };
      }
      
      // Return the error message from the server if available
      return {
        success: false,
        message: errorData.message || 'Registration failed',
        error: errorData.error || error.message
      };
    }
    
    // Generic error handling
    return {
      success: false,
      message: 'Failed to register for competition',
      error: error.message
    };
  }
};

/**
 * Get competition leaderboard
 * @param {string|number} id - Competition ID
 * @returns {Promise} - Promise with leaderboard data
 */
export const getCompetitionLeaderboard = async (id) => {
  // Validate ID before making API call
  if (!id || id === 'undefined') {
    console.error('Invalid competition ID provided to getCompetitionLeaderboard:', id);
    return Promise.reject(new Error('Invalid competition ID'));
  }
  
  try {
    const response = await axios.get(`${API_URL}/api/competitions/${id}/leaderboard`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching leaderboard for competition ${id}:`, error);
    throw error;
  }
};

/**
 * Get competition problems
 * @param {string|number} id - Competition ID
 * @param {string} token - User authentication token
 * @returns {Promise} - Promise with competition problems
 */
export const getCompetitionProblems = async (id, token = null) => {
  // Validate ID before making API call
  if (!isValidId(id)) {
    console.error('Invalid competition ID provided to getCompetitionProblems:', id);
    return Promise.reject(new Error('Invalid competition ID'));
  }
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const response = await axios.get(`${API_URL}/api/competitions/${id}/problems`, {
      headers
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching problems for competition ${id}:`, error);
    throw error;
  }
};

/**
 * Get problem by ID
 * @param {string|number} problemId - Problem ID
 * @param {string} token - User authentication token
 * @returns {Promise} - Promise with problem data
 */
export const getProblemById = async (problemId, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const response = await axios.get(`${API_URL}/api/competitions/problems/${problemId}`, {
      headers
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching problem ${problemId}:`, error);
    throw error;
  }
};

/**
 * Submit a solution for a competition problem
 * @param {string|number} competitionId - The ID of the competition
 * @param {string|number} problemId - The ID of the problem
 * @param {string} solution - The solution code
 * @param {string} token - Authentication token
 * @param {string} language - Programming language used (e.g., 'javascript', 'python')
 * @returns {Promise<Object>} - Response with success status and message
 */
export const submitSolution = async (competitionId, problemId, solution, token, language = 'javascript') => {
  // Validate IDs before making API call
  if (!competitionId || competitionId === 'undefined') {
    console.error('Invalid competition ID provided to submitSolution:', competitionId);
    return {
      success: false,
      message: 'Invalid competition ID'
    };
  }
  
  if (!problemId || problemId === 'undefined') {
    console.error('Invalid problem ID provided to submitSolution:', problemId);
    return {
      success: false,
      message: 'Invalid problem ID'
    };
  }
  
  try {
    if (!token) {
      console.error('No token provided when submitting solution');
      return {
        success: false,
        message: 'Bạn cần đăng nhập để nộp bài'
      };
    }

    const response = await axios.post(
      `${API_URL}/api/competitions/${competitionId}/problems/${problemId}/submit`,
      { 
        solution,
        language
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error submitting solution for problem ${problemId} in competition ${competitionId}:`, error);
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Lỗi khi nộp bài'
      };
    }
    
    return {
      success: false,
      message: 'Không thể kết nối đến server'
    };
  }
};

/**
 * Finish a competition
 * @param {string|number} id - Competition ID
 * @param {string} token - User authentication token
 * @returns {Promise} - Promise with finish result
 */
export const finishCompetition = async (id, token) => {
  if (!token) {
    throw new Error('Authentication token is required to finish competition');
  }
  
  try {
    const response = await axios.post(
      `${API_URL}/api/competitions/${id}/finish`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error(`Error finishing competition ${id}:`, error);
    throw error;
  }
};

/**
 * Check if user is registered for a competition
 * @param {string|number} id - Competition ID
 * @param {string} token - User authentication token
 * @returns {Promise} - Promise with registration status
 */
export const checkRegistrationStatus = async (id, token) => {
  // Validate ID before making API call
  if (!id || id === 'undefined') {
    console.error('Invalid competition ID provided to checkRegistrationStatus:', id);
    return {
      success: false,
      isRegistered: false,
      message: 'Invalid competition ID'
    };
  }
  
  if (!token) {
    console.error('No token provided when checking registration status');
    return {
      success: false,
      isRegistered: false,
      message: 'Authentication token is required'
    };
  }
  
  try {
    const response = await axios.get(
      `${API_URL}/api/competitions/${id}/registration-status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return {
      success: true,
      isRegistered: response.data.isRegistered,
      registrationData: response.data
    };
  } catch (error) {
    console.error(`Error checking registration status for competition ${id}:`, error);
    
    return {
      success: false,
      isRegistered: false,
      message: error.response?.data?.message || 'Failed to check registration status',
      error: error.message
    };
  }
};

/**
 * Submit a solution for a competition problem
 * @param {string|number} problemId - Problem ID
 * @param {string} code - Solution code
 * @param {string} language - Programming language
 * @param {string} token - User authentication token
 * @returns {Promise} - Promise with submission result
 */
export const submitCompetitionSolution = async (problemId, code, language, token) => {
  if (!token) {
    return {
      success: false,
      message: 'Authentication token is required for submission'
    };
  }
  
  try {
    // Enhanced logging for debugging
    console.log(`Submitting solution for problem ${problemId} in ${language}`);
    
    const response = await axios.post(
      `${API_URL}/api/competitions/problems/${problemId}/evaluate`,
      {
        code,
        language,
        problemId
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Solution evaluation response:', response.data);
    
    // Standardize response format
    if (response.data.success) {
      return {
        success: true,
        message: response.data.data.passed 
          ? 'Solution passed all test cases!' 
          : 'Solution failed some test cases',
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Error evaluating solution',
        error: response.data.error
      };
    }
  } catch (error) {
    console.error(`Error submitting solution for problem ${problemId}:`, error);
    
    // Parse error response
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'Error evaluating solution',
        error: error.response.data.error
      };
    }
    
    return {
      success: false,
      message: error.message || 'Error connecting to server',
      error: error.toString()
    };
  }
};

/**
 * Execute code without submission (for testing)
 * This runs code in a Docker container but doesn't record results
 * 
 * @param {string} code - The code to execute
 * @param {string} language - Programming language (javascript, python, etc.)
 * @param {string} input - Optional input for the program
 * @param {string} token - User authentication token
 * @returns {Promise} - Promise with execution results
 */
export const executeCode = async (code, language, input = '', token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const response = await axios.post(
      `${API_URL}/api/execute-code`,
      {
        code,
        language,
        stdin: input
      },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error executing code:', error);
    
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'Error executing code',
        error: error.response.data.error
      };
    }
    
    return {
      success: false,
      message: error.message || 'Error connecting to server',
      error: error.toString()
    };
  }
};

/**
 * Get completed problems for a competition
 * @param {string|number} id - Competition ID
 * @param {string} token - User authentication token
 * @returns {Promise} - Promise with completed problems data
 */
export const getCompletedProblems = async (id, token) => {
  // Validate ID before making API call
  if (!id || id === 'undefined') {
    console.error('Invalid competition ID provided to getCompletedProblems:', id);
    return Promise.reject(new Error('Invalid competition ID'));
  }
  
  if (!token) {
    console.error('No token provided when getting completed problems');
    return Promise.reject(new Error('Authentication token is required'));
  }
  
  try {
    const response = await axios.get(
      `${API_URL}/api/competitions/${id}/completed-problems`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching completed problems for competition ${id}:`, error);
    throw error;
  }
};

/**
 * Get a submitted solution for a competition problem
 * @param {string|number} competitionId - Competition ID
 * @param {string|number} problemId - Problem ID
 * @param {string} token - User authentication token
 * @returns {Promise<Object>} - Submitted solution data
 */
export const getSubmittedSolution = async (competitionId, problemId, token) => {
  // Validate IDs before making API call
  if (!competitionId || competitionId === 'undefined') {
    console.error('Invalid competition ID provided to getSubmittedSolution:', competitionId);
    return Promise.reject(new Error('Invalid competition ID'));
  }
  
  if (!problemId || problemId === 'undefined') {
    console.error('Invalid problem ID provided to getSubmittedSolution:', problemId);
    return Promise.reject(new Error('Invalid problem ID'));
  }
  
  if (!token) {
    console.error('No token provided when getting submitted solution');
    return Promise.reject(new Error('Authentication token is required'));
  }
  
  try {
    const response = await axios.get(
      `${API_URL}/api/competitions/${competitionId}/problems/${problemId}/solution`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching submitted solution for problem ${problemId} in competition ${competitionId}:`, error);
    throw error;
  }
}; 