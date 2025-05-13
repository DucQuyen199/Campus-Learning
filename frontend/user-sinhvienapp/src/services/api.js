import axios from 'axios';

// Default configuration for axios
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5008/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Log the error for debugging
    console.error('API Error:', error.message);
    console.error('Request URL:', error.config?.url);
    
    // Handle different error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('Error status:', error.response.status);
      console.log('Error data:', error.response.data);
      
      // Handle 401 Unauthorized globally
      if (error.response.status === 401) {
        // Redirect to login page or refresh token logic
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// User services
export const userService = {
  // Get user profile
  getProfile: async (userId) => {
    try {
      console.log(`Fetching profile for user ID: ${userId}`);
      const response = await apiClient.get(`/api/profile/${userId}`);
      console.log('Profile API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Get user academic information
  getAcademicInfo: async (userId) => {
    try {
      const response = await apiClient.get(`/api/profile/${userId}/academic`);
      return response.data;
    } catch (error) {
      console.error('Error fetching academic information:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userId, profileData) => {
    try {
      console.log(`Updating profile for user ID: ${userId}`, profileData);
      const response = await apiClient.put(`/api/profile/${userId}`, profileData);
      console.log('Profile update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Get profile update history
  getProfileUpdates: async (userId) => {
    try {
      const response = await apiClient.get(`/api/profile/${userId}/updates`);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile updates:', error);
      throw error;
    }
  },

  // Change user password
  changePassword: async (userId, passwords) => {
    try {
      const response = await apiClient.post(`/api/users/${userId}/change-password`, passwords);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
};

// Profile services
export const profileService = {
  // Get student profile
  getProfile: async (userId) => {
    try {
      console.log(`Fetching profile for user ID: ${userId}`);
      const response = await apiClient.get(`/api/profile/${userId}`);
      console.log('Profile API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Get student academic information
  getAcademicInfo: async (userId) => {
    try {
      const response = await apiClient.get(`/api/profile/${userId}/academic`);
      return response.data;
    } catch (error) {
      console.error('Error fetching academic information:', error);
      throw error;
    }
  },

  // Get student metrics
  getMetrics: async (userId) => {
    try {
      const response = await apiClient.get(`/api/profile/${userId}/metrics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student metrics:', error);
      throw error;
    }
  },

  // Update student profile
  updateProfile: async (userId, profileData) => {
    try {
      console.log(`Updating profile for user ID: ${userId}`, profileData);
      const response = await apiClient.put(`/api/profile/${userId}`, profileData);
      console.log('Profile update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Get profile update history
  getProfileUpdates: async (userId) => {
    try {
      const response = await apiClient.get(`/api/profile/${userId}/updates`);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile updates:', error);
      throw error;
    }
  }
};

// Academic services
export const academicService = {
  // Get academic program
  getProgram: async (userId) => {
    try {
      const response = await profileService.getAcademicInfo(userId);
      return response;
    } catch (error) {
      console.error('Error fetching academic program:', error);
      throw error;
    }
  },

  // Get academic metrics
  getMetrics: async (userId) => {
    try {
      const response = await profileService.getMetrics(userId);
      return response;
    } catch (error) {
      console.error('Error fetching academic metrics:', error);
      throw error;
    }
  },

  // Get academic results (grades)
  getResults: async (userId, semesterId = null) => {
    try {
      let url = `/academic/results/${userId}`;
      if (semesterId) {
        url += `?semesterId=${semesterId}`;
      }
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching academic results:', error);
      throw error;
    }
  },

  // Get conduct scores
  getConductScores: async (userId) => {
    try {
      const response = await apiClient.get(`/academic/conduct/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conduct scores:', error);
      throw error;
    }
  },

  // Get academic warnings
  getWarnings: async (userId) => {
    try {
      const response = await apiClient.get(`/academic/warnings/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching academic warnings:', error);
      throw error;
    }
  }
};

// Schedule services
export const scheduleService = {
  // Get class schedule
  getClassSchedule: async (userId, semesterId = null) => {
    try {
      let url = `/schedule/class/${userId}`;
      if (semesterId) {
        url += `?semesterId=${semesterId}`;
      }
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching class schedule:', error);
      throw error;
    }
  },

  // Get exam schedule
  getExamSchedule: async (userId, semesterId = null) => {
    try {
      let url = `/schedule/exam/${userId}`;
      if (semesterId) {
        url += `?semesterId=${semesterId}`;
      }
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching exam schedule:', error);
      throw error;
    }
  }
};

// Tuition services
export const tuitionService = {
  // Get current semester tuition
  getCurrentTuition: async (userId) => {
    try {
      const response = await apiClient.get(`/tuition/current/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching current tuition:', error);
      throw error;
    }
  },

  // Get tuition history
  getTuitionHistory: async (userId) => {
    try {
      const response = await apiClient.get(`/tuition/history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tuition history:', error);
      throw error;
    }
  }
};

export default {
  profileService,
  academicService,
  scheduleService,
  tuitionService,
  userService
}; 