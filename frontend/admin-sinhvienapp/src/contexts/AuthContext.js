import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if a stored token exists and is valid
  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // Check if token is expired
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // Token expired, remove it and log out
        localStorage.removeItem('auth_token');
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // Validate token with backend
      try {
        const response = await authService.validateToken();
        setCurrentUser(response.user);
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('auth_token');
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      localStorage.removeItem('auth_token');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login user
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(username, password);
      localStorage.setItem('auth_token', response.token);
      setCurrentUser(response.user);
      return response.user;
    } catch (error) {
      const errorMsg = error?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      return response;
    } catch (error) {
      const errorMsg = error?.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      setError(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get user profile
  const getUserProfile = async () => {
    setLoading(true);
    try {
      const response = await authService.getProfile();
      setCurrentUser(response.user);
      return response.user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    changePassword,
    getUserProfile,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 