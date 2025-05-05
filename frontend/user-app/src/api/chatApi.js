import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL}/api/chat`;

// Create axios instance with auth headers
const axiosInstance = axios.create({
  baseURL: API,
});

// Add token to requests
axiosInstance.interceptors.request.use(
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

// Add response interceptors to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      // Token might be expired, clear it and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle connection errors
    if (error.message === 'Network Error') {
      console.error('Connection to server failed. Please check your internet connection.');
    }
    
    return Promise.reject(error);
  }
);

// Add timeout to requests
axiosInstance.defaults.timeout = 10000; // 10 seconds timeout

// Chat API functions
export const chatApi = {
  // User endpoints for chat
  getAllChatUsers: async (limit = 20) => {
    try {
      // Use pagination and limit the number of users returned
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/users`, {
        params: {
          limit: limit // Use a reasonable limit
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('User API response:', response.data);
      
      // Handle both pagination object format and direct array format
      const data = response.data?.data || response.data || [];
      
      if (Array.isArray(data)) {
        return data;
      } else if (typeof data === 'object') {
        // If it's an object with user properties, wrap in array
        return [data];
      } else {
        console.error('User data format is unexpected:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch users for chat:', error);
      // Try fallback endpoint if the main one fails
      try {
        const fallbackResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
          params: { limit: limit },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        const fallbackData = fallbackResponse.data?.data || fallbackResponse.data || [];
        console.log('Using fallback endpoint, got users:', fallbackData.length);
        return Array.isArray(fallbackData) ? fallbackData : [];
      } catch (fallbackError) {
        console.error('Fallback endpoint also failed:', fallbackError);
        return [];
      }
    }
  },
  
  // Search users using the same endpoint as MainLayout
  searchUsers: async (query, limit = 20) => {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }
      
      // Try multiple potential endpoints
      const possibleEndpoints = [
        `/api/chat/users?search=${encodeURIComponent(query)}&limit=${limit}`,
        `/api/users/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        `/api/users?q=${encodeURIComponent(query)}&limit=${limit}`
      ];
      
      let response;
      let endpointUsed;
      
      // Try each endpoint until one works
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying search endpoint: ${endpoint}`);
          response = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.status === 200) {
            endpointUsed = endpoint;
            console.log(`Successfully used endpoint: ${endpoint}`);
            break;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err.message);
          // Continue to next endpoint
        }
      }
      
      // If all endpoints failed, throw error
      if (!response) {
        throw new Error('All search endpoints failed');
      }
      
      // Better response data handling
      const responseData = response.data;
      console.log(`Search users API response from ${endpointUsed}:`, responseData);
      
      // Handle various response formats
      if (Array.isArray(responseData)) {
        return responseData;
      } else if (responseData && Array.isArray(responseData.users)) {
        return responseData.users;
      } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
        return responseData.data;
      } else if (responseData && typeof responseData === 'object') {
        // Extract any array we can find in the response
        const possibleArrays = Object.values(responseData).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          // Use the first array found
          return possibleArrays[0];
        }
      }
      
      console.warn('Unexpected response format from search API:', responseData);
      return [];
    } catch (error) {
      console.error('Failed to search users:', error);
      
      // Fallback to local search if API fails
      if (query && window.allUsers && Array.isArray(window.allUsers)) {
        console.log('Falling back to local user search');
        return window.allUsers
          .filter(user => 
            user.FullName?.toLowerCase().includes(query.toLowerCase()) ||
            user.Username?.toLowerCase().includes(query.toLowerCase()) ||
            user.Email?.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, limit); // Apply limit to local search results
      }
      
      return [];
    }
  },
  
  // Conversation endpoints
  createConversation: async (data) => {
    try {
      // Ensure proper data types for SQL Server
      const formattedData = {
        type: data.type,
        createdBy: parseInt(data.createdBy, 10), // Convert to number
        participants: data.participants.map(id => parseInt(id, 10)), // Convert all participant IDs to numbers
        ...(data.title && { title: data.title }) // Only include title if it exists
      };
      
      console.log('API createConversation - Sending data:', formattedData);
      const response = await axiosInstance.post('/conversations', formattedData);
      console.log('API createConversation - Success response:', response.data);
      return response.data;
    } catch (error) {
      // Log detailed error information
      console.error('API createConversation - Error:', error);
      console.error('API createConversation - Error config:', error.config);
      console.error('API createConversation - Error response:', error.response?.data);
      
      // Provide details for the calling function
      const errorDetails = {
        message: error.message || 'Failed to create conversation',
        status: error.response?.status,
        data: error.response?.data,
        originalError: error
      };
      
      throw errorDetails;
    }
  },

  getUserConversations: async () => {
    const response = await axiosInstance.get('/conversations');
    return response.data;
  },

  getConversationById: async (id) => {
    const response = await axiosInstance.get(`/conversations/${id}`);
    return response.data;
  },

  updateConversation: async (id, data) => {
    const response = await axiosInstance.put(`/conversations/${id}`, data);
    return response.data;
  },

  // Message endpoints
  sendMessage: async (conversationId, data) => {
    try {
      let response;
      
      try {
        // First try the specific conversation endpoint
        response = await axiosInstance.post(`/conversations/${conversationId}/messages`, data);
        return response.data;
      } catch (error) {
        // If that fails, try the general messages endpoint
        if (error.response && error.response.status === 404) {
          console.log('Falling back to general messages endpoint');
          response = await axiosInstance.post(`/messages`, { conversationId, ...data });
          return response.data;
        }
        throw error; // Re-throw if it's not a 404 error
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Return an object that can be used by the UI to show error state
      throw {
        error: true,
        message: error.message || 'Failed to send message',
        originalError: error
      };
    }
  },

  getMessages: async (conversationId, params = {}) => {
    // Nếu conversationId không hợp lệ, trả về mảng rỗng
    if (!conversationId) {
      console.warn('Invalid conversationId provided to getMessages');
      return [];
    }
    
    const response = await axiosInstance.get(`/conversations/${conversationId}/messages`, { params });
    return response.data;
  },

  updateMessage: async (messageId, data) => {
    const response = await axiosInstance.put(`/messages/${messageId}`, data);
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await axiosInstance.delete(`/messages/${messageId}`);
    return response.data;
  },

  markMessageAsRead: async (messageId) => {
    const response = await axiosInstance.put(`/messages/${messageId}/read`);
    return response.data;
  },

  // Call endpoints
  initiateCall: async (data) => {
    const response = await axiosInstance.post('/calls', data);
    return response.data;
  },

  updateCallStatus: async (callId, data) => {
    const response = await axiosInstance.put(`/calls/${callId}`, data);
    return response.data;
  },

  getCallHistory: async (params = {}) => {
    const response = await axiosInstance.get('/calls/history', { params });
    return response.data;
  },

  addCallParticipant: async (callId, data) => {
    const response = await axiosInstance.post(`/calls/${callId}/participants`, data);
    return response.data;
  }
};

export default chatApi; 