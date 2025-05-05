import axios from 'axios';
import { API_URL } from '../config';

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
  if (!token) {
    console.warn('No token provided for registration status check');
    return { isRegistered: false, success: true };
  }
  
  try {
    // Make sure token is properly formatted
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Verify token format
    if (formattedToken.split(' ')[1].length < 10) {
      console.error('Token appears to be invalid (too short)');
      return {
        success: false,
        isRegistered: false,
        message: 'Invalid authentication token'
      };
    }
    
    console.log(`Checking registration status for competition ${id}`);
    
    const response = await axios.get(
      `${API_URL}/api/competitions/${id}/registration-status`,
      { 
        headers: { 
          Authorization: formattedToken,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    // If the response doesn't include a success flag, add it
    if (response.data && !response.data.hasOwnProperty('success')) {
      return {
        ...response.data,
        success: true
      };
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error checking registration status for competition ${id}:`, error);
    
    // Log detailed error information for debugging
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    
    // For auth errors, return appropriate message
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      return { 
        isRegistered: false, 
        success: false,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        authError: true
      };
    }
    
    // For 404, assume the user is not registered
    if (error.response && error.response.status === 404) {
      const errorMessage = error.response.data?.message || '';
      
      // If user not found
      if (errorMessage.includes('User not found')) {
        return {
          isRegistered: false,
          success: false,
          message: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.',
          authError: true
        };
      }
      
      // Otherwise, just assume not registered
      return { isRegistered: false, success: true };
    }
    
    // Generic error - don't break the UI, just return a sensible default
    return { 
      isRegistered: false, 
      success: false,
      message: error.message || 'Lỗi khi kiểm tra trạng thái đăng ký',
      error: true
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
  if (!token) {
    console.warn('No token provided for getting completed problems');
    return [];
  }
  
  try {
    // Make sure token is properly formatted
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    console.log(`Fetching completed problems for competition ${id}`);
    
    const response = await axios.get(
      `${API_URL}/api/competitions/${id}/completed-problems`,
      { 
        headers: { 
          Authorization: formattedToken,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    return response.data;
  } catch (error) {
    // Silently handle the error, returning an empty array
    return [];
  }
};

/**
 * Get a submitted solution for a competition problem
 * @param {string|number} competitionId - The ID of the competition
 * @param {string|number} problemId - The ID of the problem
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Response with solution code
 */
export const getSubmittedSolution = async (competitionId, problemId, token) => {
  try {
    if (!token) {
      console.error('No token provided when fetching submitted solution');
      return {
        success: false,
        message: 'Authentication token is required'
      };
    }

    console.log(`Making API request to fetch solution for problem ${problemId} in competition ${competitionId}`);
    
    // Make sure token is properly formatted
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    const response = await axios.get(
      `${API_URL}/api/competitions/${competitionId}/problems/${problemId}/solution`,
      {
        headers: {
          'Authorization': formattedToken,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Solution fetch response:', response.status);
    return response.data;
  } catch (error) {
    console.error(`Error fetching submitted solution for problem ${problemId} in competition ${competitionId}:`, error);
    
    // Log detailed error information for debugging
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
      
      // Return a structured response instead of throwing an error
      return {
        success: false,
        message: error.response.data?.message || 'Failed to fetch solution',
        status: error.response.status
      };
    } else if (error.request) {
      console.error('No response received:', error.request);
      return {
        success: false,
        message: 'No response received from server'
      };
    }
    
    // Generic error case
    return {
      success: false,
      message: error.message || 'Unknown error occurred'
    };
  }
}; 