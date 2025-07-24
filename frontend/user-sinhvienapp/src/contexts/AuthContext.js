/*-----------------------------------------------------------------
* File: AuthContext.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student portal application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create auth context
const AuthContext = createContext();

// API base URL - Ensure it points to our backend service
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5008/api';

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to clear auth data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        // Check for token in localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        // Setup axios header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // For demo purposes, just set the user from localStorage
        let user = JSON.parse(localStorage.getItem('user'));
        if (user) {
          // Ensure the user has a UserID property; if not, treat as invalid session
          if (!user.UserID) {
            console.warn('Stored user data missing UserID. Clearing stale session.');
            clearAuthData();
            return;
          }
          
          // Store the updated user data
          localStorage.setItem('user', JSON.stringify(user));
          
          setCurrentUser(user);
          setIsAuthenticated(true);
        } else {
          // No user data, clear token
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);

  // Login function - only use the API
  const login = async (username, password, provider = 'local') => {
    try {
      setError(null);
      setLoading(true);
      
      // Auto-detect Gmail login by email pattern
      if (provider === 'local' && username && username.toLowerCase().includes('@gmail.com')) {
        provider = 'google';
      }
      const isGmailLogin = provider === 'google' || provider === 'gmail';
      
      console.log(`Attempting ${isGmailLogin ? 'Gmail' : 'regular'} login for: ${username}`);
      
      // Fix: ensure we don't have errors from previous login attempts
      delete axios.defaults.headers.common['Authorization'];
      
      // Use a timeout to handle potential network issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      // Prepare login data based on provider
      const loginData = isGmailLogin 
        ? { email: username, provider: 'google' } 
        : { username, password };
      
      console.log(`Sending login request to ${API_URL}/auth/login`);
      
      const response = await axios.post(`${API_URL}/auth/login`, loginData, { 
        signal: controller.signal,
        timeout: 8000
      });
      
      clearTimeout(timeoutId);
      
      if (response.data && response.data.success && response.data.token) {
        const token = response.data.token;
        const refreshToken = response.data.refreshToken || '';
        const userData = response.data.user || {};
        
        // Map id to UserID if needed
        if (!userData.UserID && userData.id) {
          userData.UserID = userData.id;
        }
        
        // Create a user object with token
        const userWithToken = {
          ...userData,
          token: token,
          refreshToken: refreshToken,
          provider: provider
        };
        
        // Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userWithToken));
        
        // Set auth header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update state
        setCurrentUser(userWithToken);
        setIsAuthenticated(true);
        
        toast.success('Đăng nhập thành công!');
        return { success: true, user: userWithToken };
      } else {
        throw new Error(response.data?.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage;
      
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Lỗi dịch vụ (404): API đăng nhập không tìm thấy. Vui lòng liên hệ quản trị viên.';
      } else {
        errorMessage = err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng thử lại sau.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Gmail login function
  const loginWithGmail = async (email) => {
    return login(email, null, 'google');
  };

  // Register function 
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      // Call API to register
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      if (response.data && response.data.success) {
        // If registration includes login (token is returned)
        if (response.data.token) {
          const token = response.data.token;
          const user = response.data.user;
          
          // Save to localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify({...user, token}));
          
          // Set auth header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Update state
          setCurrentUser({...user, token});
          setIsAuthenticated(true);
        }
        
        toast.success(response.data.message || 'Đăng ký thành công!');
        return { success: true, message: response.data.message, user: response.data.user };
      } else {
        throw new Error(response.data?.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Đăng ký thất bại';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Try to call logout API if possible
      try {
        await axios.post(`${API_URL}/auth/logout`);
      } catch (err) {
        console.log('Logout API error (non-critical):', err);
      }
      
      // Clear all local & state data
      clearAuthData();
      
      // Optional: force redirect to login page so UI fully resets
      window.location.href = '/login';
      
      toast.success('Đăng xuất thành công');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Đã xảy ra lỗi khi đăng xuất');
    } finally {
      setLoading(false);
    }
  };
  
  // Update profile
  const updateProfile = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      // In a real app, would call API here
      // For demo, just update the user object in localStorage and state
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      toast.success('Cập nhật thông tin thành công');
      return { success: true };
    } catch (err) {
      console.error('Profile update error:', err);
      setError('Cập nhật thông tin thất bại');
      toast.error('Cập nhật thông tin thất bại');
      return { success: false, error: 'Cập nhật thông tin thất bại' };
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    loginWithGmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
}; 
