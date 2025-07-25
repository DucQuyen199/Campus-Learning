/*-----------------------------------------------------------------
* File: api.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';

// Lấy base URL từ biến môi trường hoặc sử dụng URL mặc định
const BASE_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null) || 
                process.env.REACT_APP_API_URL || 
                'http://localhost:5002/api';

// Tạo instance Axios với cấu hình mặc định
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 giây
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Quan trọng cho các API yêu cầu xác thực cookies
});

// Hàm lấy token xác thực từ localStorage hoặc sessionStorage
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Request interceptor: Thêm token xác thực vào header cho mỗi request
api.interceptors.request.use(
  config => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: Xử lý lỗi và refresh token nếu cần
api.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;
    
    // Xử lý lỗi 401 Unauthorized - Refresh token hoặc đăng xuất
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Thử refresh token (nếu có)
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Gọi API refresh token
          const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
            refreshToken
          });
          
          if (response.data.token) {
            // Lưu token mới
            localStorage.setItem('token', response.data.token);
            
            // Cập nhật token cho request hiện tại
            originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
            return api(originalRequest);
          }
        }
        
        // Nếu không có refresh token hoặc refresh thất bại, đăng xuất
        console.warn('Authentication expired. Logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Chuyển hướng đến trang đăng nhập
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Xử lý đăng xuất nếu refresh token thất bại
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    // Xử lý lỗi 403 Forbidden
    if (error.response && error.response.status === 403) {
      console.warn('Access forbidden. You may not have sufficient permissions.');
      // Có thể hiển thị thông báo lỗi hoặc chuyển hướng
    }
    
    // Xử lý lỗi CORS (thường không thể bắt trực tiếp qua JS)
    if (error.message && error.message.includes('Network Error')) {
      console.error('Network error. Possible CORS issue or server unavailable.');
    }
    
    return Promise.reject(error);
  }
);

export default api; 
