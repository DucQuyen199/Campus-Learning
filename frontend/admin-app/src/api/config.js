import axios from 'axios';

// Get the API URL from environment variables or use the default
const apiUrl = import.meta?.env?.VITE_API_URL || 'http://localhost:5002/api';

const adminApi = axios.create({
  baseURL: apiUrl,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Thêm biến để theo dõi refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Handle network or server errors
    if (!error.response) {
      console.error('Network error detected:', error.message);
      return Promise.reject(new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'));
    }

    // Handle 401 and refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        try {
          // Wait for the other refresh call
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return adminApi(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('admin_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await adminApi.post('/auth/refresh', { refreshToken });
        
        if (response.data?.token) {
          localStorage.setItem('admin_token', response.data.token);
          localStorage.setItem('admin_refresh_token', response.data.refreshToken);
          
          adminApi.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          
          processQueue(null, response.data.token);
          return adminApi(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Lưu URL hiện tại trước khi chuyển hướng
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          localStorage.setItem('auth_redirect', currentPath);
        }
        
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default adminApi; 