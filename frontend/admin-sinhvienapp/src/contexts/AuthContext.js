/*-----------------------------------------------------------------
* File: AuthContext.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';

// API endpoints
const API_ENDPOINTS = {
  validateToken: '/auth/validate-token',
  login: '/auth/login',
  loginGmail: '/auth/login-gmail'
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      setLoading(true);
      console.log('Validating token at endpoint:', API_ENDPOINTS.validateToken);
      const response = await axiosInstance.get(API_ENDPOINTS.validateToken);

      if (response.data.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Token validation error:', err);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Logging in at endpoint:', API_ENDPOINTS.login);
      
      // Format login request according to the backend API
      const loginData = {
        username,
        password
      };
      
      const response = await axiosInstance.post(API_ENDPOINTS.login, loginData);
      
      if (response.data.success) {
        // The backend already checks for ADMIN role
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        return { success: true, user: response.data.user };
      } else {
        setError(response.data.message || 'Đăng nhập thất bại');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific error cases
      if (err.response) {
        if (err.response.status === 401) {
          const errorMsg = err.response.data.message || 'Thông tin đăng nhập không đúng. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu.';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        } else if (err.response.status === 403) {
          const errorMsg = err.response.data.message || 'Tài khoản của bạn không có quyền truy cập hệ thống quản trị.';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      }
      
      const errorMessage = err.response?.data?.message || err.response?.statusText || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGmail = async (email) => {
    try {
      setLoading(true);
      setGmailLoading(true);
      setError('');
      
      console.log('Gmail login at endpoint:', API_ENDPOINTS.loginGmail);
      
      // Format data according to the backend API
      const gmailData = {
        email
      };
      
      const response = await axiosInstance.post(API_ENDPOINTS.loginGmail, gmailData);
      
      if (response.data.success) {
        // The backend already checks for ADMIN role
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        return { success: true, user: response.data.user };
      } else {
        setError(response.data.message || 'Đăng nhập bằng Gmail thất bại');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('Gmail login error:', err);
      
      // Handle specific error cases
      if (err.response) {
        if (err.response.status === 401) {
          const errorMsg = err.response.data.message || 'Không tìm thấy tài khoản với email này.';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        } else if (err.response.status === 403) {
          const errorMsg = err.response.data.message || 'Tài khoản Gmail của bạn không có quyền truy cập hệ thống quản trị.';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      }
      
      const errorMessage = err.response?.data?.message || err.response?.statusText || 'Đăng nhập bằng Gmail thất bại. Vui lòng thử lại sau.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      setGmailLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Đăng xuất thành công');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error, 
        isAuthenticated, 
        login, 
        loginWithGmail, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 
