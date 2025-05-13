import axios from 'axios';

// Default configuration for axios
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5008';

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
      // Remove any existing /api prefix before adding it again
      let path = config.url;
      if (path.startsWith('/api/')) {
        path = path.substring(4); // Remove the /api prefix
      }
      
      // Now ensure it starts with /api
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      
      config.url = '/api' + path;
      
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
      
      // Use mock data for development if server is unreachable
      if (process.env.NODE_ENV === 'development') {
        if (error.config.url.includes('/profile/')) {
          return Promise.resolve({
            data: {
              success: true,
              data: generateMockProfileData(error.config.url)
            }
          });
        }
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to generate mock data for development
function generateMockProfileData(url) {
  const userId = url.match(/\/profile\/(\d+)/)?.[1] || 1;
  
  if (url.includes('/academic')) {
    return {
      ProgramID: 1,
      ProgramCode: 'CNTT',
      ProgramName: 'Công nghệ thông tin',
      Department: 'Khoa Công nghệ thông tin',
      Faculty: 'Khoa học máy tính',
      TotalCredits: 145,
      DegreeName: 'Kỹ sư',
      AdvisorName: 'Nguyễn Văn A',
      AdvisorEmail: 'advisor@example.com',
      AdvisorPhone: '0123456789'
    };
  } else if (url.includes('/updates')) {
    return [
      {
        UpdateID: 1,
        UserID: userId,
        FieldName: 'Phone',
        OldValue: '0123456789',
        NewValue: '0987654321',
        UpdateTime: new Date().toISOString(),
        Status: 'Approved'
      }
    ];
  } else {
    return {
      UserID: userId,
      Username: `student${userId}`,
      Email: `student${userId}@example.com`,
      FullName: `Sinh viên ${userId}`,
      DateOfBirth: '2000-01-01',
      Gender: 'Male',
      PhoneNumber: '0987654321',
      Address: 'Hà Nội, Việt Nam',
      StudentID: `SV${userId.toString().padStart(6, '0')}`,
      EnrollmentDate: '2020-09-01',
      GraduationDate: null,
      Status: 'Active'
    };
  }
}

// User services
export const userService = {
  // Get user profile
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

  // Get user academic information
  getAcademicInfo: async (userId) => {
    try {
      const response = await apiClient.get(`/profile/${userId}/academic`);
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
      try {
        const response = await apiClient.get(`/academic/program/${userId}`);
        return response.data;
      } catch (secondError) {
        console.warn('Failed to fetch from academic endpoint, returning mock data');
        // Return mock data if both endpoints fail
        return [{
          ProgramID: 1,
          ProgramCode: 'CNTT',
          ProgramName: 'Công nghệ thông tin',
          Department: 'Khoa Công nghệ thông tin',
          Faculty: 'Khoa học máy tính',
          TotalCredits: 145,
          DegreeName: 'Kỹ sư',
          AdvisorName: 'Nguyễn Văn A',
          AdvisorEmail: 'advisor@example.com',
          AdvisorPhone: '0123456789'
        }];
      }
    } catch (error) {
      console.error('Error fetching academic program:', error);
      // Return mock data if all endpoints fail
      return [{
        ProgramID: 1,
        ProgramCode: 'CNTT',
        ProgramName: 'Công nghệ thông tin',
        Department: 'Khoa Công nghệ thông tin',
        Faculty: 'Khoa học máy tính',
        TotalCredits: 145,
        DegreeName: 'Kỹ sư',
        AdvisorName: 'Nguyễn Văn A',
        AdvisorEmail: 'advisor@example.com',
        AdvisorPhone: '0123456789'
      }];
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

      // If all endpoints fail, return mock data
      console.warn('All endpoints failed, returning mock data');
      return [{
        UserID: parseInt(userId),
        SemesterID: 1,
        TotalCredits: 140,
        EarnedCredits: 45,
        SemesterGPA: 3.5,
        CumulativeGPA: 3.5,
        AcademicStanding: 'Good Standing',
        RankInClass: 15,
        SemesterName: 'Học kỳ 1',
        AcademicYear: '2023-2024'
      }];
    } catch (error) {
      console.error('Error fetching academic metrics, returning mock data:', error);
      // Return mock data if all endpoints fail
      return [{
        UserID: parseInt(userId),
        SemesterID: 1,
        TotalCredits: 140,
        EarnedCredits: 45,
        SemesterGPA: 3.5,
        CumulativeGPA: 3.5,
        AcademicStanding: 'Good Standing',
        RankInClass: 15,
        SemesterName: 'Học kỳ 1',
        AcademicYear: '2023-2024'
      }];
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