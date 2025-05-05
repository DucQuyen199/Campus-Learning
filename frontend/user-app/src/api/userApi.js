import axios from 'axios';
// import { API_BASE_URL } from '../config';

// Fix the base URL to avoid duplicate /api segments
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Use the corrected API base URL for your user fetch function
export const fetchUsers = async (limit = 100) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error.message);
    throw error;
  }
};

// Search users API function
export const searchUsers = async (query) => {
  if (!query || query.trim().length < 2) {
    return { users: [] };
  }
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching users:', error.message);
    return { users: [] };
  }
};

// Get the authentication token from local storage
const getAuthToken = () => localStorage.getItem('token');

// Get the current user's information
export const getUserInfo = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    
    // For development/testing - provide mock data if API fails or is not available yet
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using mock user data in development mode');
      return {
        success: true,
        data: {
          id: 'USR123456',
          userId: 'USR123456', 
          username: 'nguyenvana',
          fullName: 'Nguyễn Văn A',
          email: 'nguyenvana@example.com',
          role: 'student'
        }
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể lấy thông tin người dùng',
      error: error
    };
  }
};

// Update user profile
export const updateUserProfile = async (userData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/profile`, userData, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể cập nhật thông tin người dùng',
      error: error
    };
  }
};

// Change password
export const changePassword = async (passwordData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/change-password`, passwordData, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });

    return {
      success: true,
      message: response.data.message || 'Đổi mật khẩu thành công'
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Không thể đổi mật khẩu',
      error: error
    };
  }
}; 