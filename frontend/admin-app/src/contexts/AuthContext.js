/*-----------------------------------------------------------------
* File: AuthContext.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Hàm refresh token
  const refreshTokens = async () => {
    try {
      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (!refreshToken) {
        return false;
      }

      const response = await authAPI.refreshToken();
      if (response.data?.token) {
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_refresh_token', response.data.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Setup auto refresh token
  useEffect(() => {
    if (isAuthenticated) {
      const REFRESH_INTERVAL = 55 * 60 * 1000; // 55 phút
      const interval = setInterval(refreshTokens, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Kiểm tra phiên đăng nhập
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setIsAuthenticated(false); 
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      try {
        // Thử check session trước
        const response = await authAPI.checkSession();
        if (response?.data?.user) {
          setCurrentUser(response.data.user);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }

        // Nếu response không có data hoặc không có user, thử refresh token
        const refreshSuccess = await refreshTokens();
        if (!refreshSuccess) {
          throw new Error('Session expired');
        }

        // Check session lại sau khi refresh token  
        const newResponse = await authAPI.checkSession();
        if (newResponse?.data?.user) {
          setCurrentUser(newResponse.data.user);
          setIsAuthenticated(true);
        } else {
          throw new Error('Invalid session');
        }
      } catch (err) {
        // Log chi tiết lỗi để debug
        console.error('Session check failed:', err.message);
        
        // Lưu đường dẫn hiện tại trước khi đăng xuất
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          localStorage.setItem('auth_redirect', currentPath);
        }
        
        // Xóa token nếu lỗi xác thực
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        
        setCurrentUser(null);
        setIsAuthenticated(false);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(credentials);
      
      if (response.data?.token) {
        localStorage.setItem('admin_token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('admin_refresh_token', response.data.refreshToken);
        }
        setCurrentUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      }
      throw new Error('Invalid response format');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 
                          'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(errorMessage);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  // Check if user has a specific role
  const hasRole = (roleName) => {
    if (!currentUser || !currentUser.role) return false;
    return currentUser.role.name === roleName;
  };

  // Value object to be provided to consumers
  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
