import axios from 'axios';

// Determine base URL and ensure it ends with `/api` to match backend routes
let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5008';
if (!API_URL.endsWith('/api')) {
  API_URL = API_URL.replace(/\/+$/, '') + '/api'; // remove trailing slashes then append /api
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL, 
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // Increased timeout for slow connections
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Fix URL path to avoid /api/api duplication
    if (config.url) {
      // Remove any existing /api prefix to prevent duplication
      let path = config.url;
      if (path.startsWith('/api/')) {
        path = path.substring(5); // Remove the /api/ prefix
      } else if (path.startsWith('api/')) {
        path = path.substring(4); // Remove the api/ prefix
      }
      
      // Now ensure it starts with /
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      
      // Set the final URL without duplicating /api
      config.url = path;
      
      // Debug log
      console.log('Final request URL:', config.url);
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
    if (error.config) {
      console.error('Request URL:', error.config.url);
      console.error('Full URL:', error.config.baseURL + error.config.url);
    }
    
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
      const response = await apiClient.get(`/profile/${userId}`);
      
      // Check if we have data in the response
      if (response.data && response.data.data) {
        console.log('Profile API response:', response.data);
        return response.data.data;
      } else if (response.data && response.data.success) {
        console.log('Profile API response (empty data):', response.data);
        return {};
      } else {
        console.log('Profile API raw response:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Get user academic information
  getAcademicInfo: async (userId) => {
    try {
      const response = await apiClient.get(`/profile/${userId}/academic`);
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.success) {
        return [];
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching academic information:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userId, profileData) => {
    try {
      console.log(`Updating profile for user ID: ${userId}`, profileData);
      const response = await apiClient.put(`/profile/${userId}`, profileData);
      console.log('Profile update response:', response.data);
      if (response.data && response.data.data) {
        return response.data.data;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Get profile update history
  getProfileUpdates: async (userId) => {
    try {
      const response = await apiClient.get(`/profile/${userId}/updates`);
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.success) {
        return [];
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching profile updates:', error);
      throw error;
    }
  },

  // Change user password
  changePassword: async (userId, passwords) => {
    try {
      const response = await apiClient.post(`/users/${userId}/change-password`, passwords);
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
      const response = await apiClient.get(`/profile/${userId}`);
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
      const response = await apiClient.get(`/profile/${userId}/academic`);
      return response.data;
    } catch (error) {
      console.error('Error fetching academic information:', error);
      throw error;
    }
  },

  // Get student metrics
  getMetrics: async (userId) => {
    try {
      const response = await apiClient.get(`/profile/${userId}/metrics`);
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
      const response = await apiClient.put(`/profile/${userId}`, profileData);
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
      const response = await apiClient.get(`/profile/${userId}/updates`);
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
      // Try profile endpoint first
      try {
        const response = await profileService.getAcademicInfo(userId);
        if (response && (Array.isArray(response) ? response.length > 0 : true)) {
          return response;
        }
      } catch (error) {
        console.warn('Failed to fetch from profile endpoint, trying academic endpoint');
      }
      
      // Try academic program endpoint as fallback
      const response = await apiClient.get(`/academic/program/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching academic program:', error);
      throw error;
    }
  },

  // Get academic metrics
  getMetrics: async (userId) => {
    try {
      console.log(`Attempting to fetch metrics for user ${userId}`);
      
      // Try multiple endpoints to get academic metrics
      const endpoints = [
        // First try profile metrics endpoint
        async () => {
          console.log('Trying profile metrics endpoint');
          const response = await apiClient.get(`/profile/${userId}/metrics`);
          return response.data;
        },
        // Then try academic metrics endpoint
        async () => {
          console.log('Trying academic metrics endpoint');
          const response = await apiClient.get(`/academic/metrics/${userId}`);
          return response.data;
        }
      ];

      // Try each endpoint in sequence until one works
      for (const tryEndpoint of endpoints) {
        try {
          const data = await tryEndpoint();
          console.log('Metrics endpoint succeeded:', data);
          if (data && (Array.isArray(data) ? data.length > 0 : true)) {
            return data;
          }
        } catch (err) {
          console.warn('Endpoint attempt failed, trying next one');
        }
      }

      // If all endpoints fail, throw an error
      throw new Error('Could not fetch academic metrics from any endpoint');
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

// Exam Registration services
export const examRegistrationService = {
  // Get available exams for improvement
  getAvailableExams: async (userId, semesterId = null) => {
    try {
      let url = `/exam-registration/${userId}`;
      if (semesterId) {
        url += `?semesterId=${semesterId}`;
      }
      const response = await apiClient.get(url);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching available exams:', error);
      throw error;
    }
  },

  // Get registration history
  getRegistrationHistory: async (userId) => {
    try {
      const response = await apiClient.get(`/exam-registration/${userId}/history`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching registration history:', error);
      throw error;
    }
  },

  // Get active semesters
  getActiveSemesters: async () => {
    try {
      const response = await apiClient.get('/exam-registration/semesters');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching active semesters:', error);
      throw error;
    }
  },

  // Register for exams
  registerForExams: async (userId, examIds, semesterId) => {
    try {
      const response = await apiClient.post(`/exam-registration/${userId}/register`, {
        examIds,
        semesterId
      });
      return response.data;
    } catch (error) {
      console.error('Error registering for exams:', error);
      throw error;
    }
  },

  // Get fee information
  getExamFeeInfo: async () => {
    try {
      const response = await apiClient.get('/exam-registration/fee-info');
      return response.data?.data || {};
    } catch (error) {
      console.error('Error fetching exam fee info:', error);
      throw error;
    }
  },

  // Cancel registration
  cancelRegistration: async (userId, registrationId) => {
    try {
      const response = await apiClient.delete(`/exam-registration/${userId}/${registrationId}`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling registration:', error);
      throw error;
    }
  }
};

export default {
  profileService,
  academicService,
  scheduleService,
  tuitionService,
  userService,
  examRegistrationService
}; 