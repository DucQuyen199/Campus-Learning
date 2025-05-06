import axios from 'axios';

// Flag to track if a token refresh is in progress
let isRefreshingToken = false;
// Store queued requests that need to be retried after token refresh
let requestsQueue = [];

// Function to process queued requests
const processRequestsQueue = (token) => {
  requestsQueue.forEach(({ config, resolve, reject }) => {
    // Apply new token to each queued request
    config.headers.Authorization = `Bearer ${token}`;
    // Retry the request with new token
    axios(config).then(resolve).catch(reject);
  });
  // Clear the queue
  requestsQueue = [];
};

const axiosClient = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json'
  },
  // Increase timeout to 10 seconds to handle slow network conditions
  timeout: 10000
});

// Add a request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log outgoing requests for debugging
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, {
      headers: config.headers,
      params: config.params,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Refresh token function
const refreshToken = async () => {
  try {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    const token = localStorage.getItem('token');
    
    // If we have a token but no refresh token, consider the session still valid
    if (token && !refreshTokenValue) {
      console.log('No refresh token available, but token exists - considering valid');
      return token;
    }
    
    if (!refreshTokenValue) {
      console.log('No refresh token available for API client refresh');
      throw new Error('No refresh token available');
    }
    
    // Make request to refresh token endpoint
    const response = await axios.post('http://localhost:5001/api/auth/refresh-token', {
      refreshToken: refreshTokenValue
    });
    
    if (response.data && response.data.token) {
      // Save new tokens
      localStorage.setItem('token', response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      return response.data.token;
    } else {
      throw new Error('Failed to refresh token');
    }
  } catch (error) {
    console.log('Error refreshing token:', error.message);
    // Only clear tokens if refresh explicitly failed (not for network errors)
    if (error.response && (error.response.status === 400 || error.response.status === 401)) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    throw error;
  }
};

// Add a response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`, {
      data: response.data
    });
    return response;
  },
  async (error) => {
    // Network errors (no connection to server)
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('Network error or timeout:', error.message);
      // Don't redirect for network errors, let components handle the fallback
      return Promise.reject({
        isNetworkError: true,
        message: 'Không thể kết nối đến máy chủ.'
      });
    }
    
    // Log response errors
    console.error('API Response Error:', error.message);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config.url
      });
    }
    
    const originalRequest = error.config;
    
    // Check if this is an authentication error
    if (error.response?.status === 401) {
      // Don't redirect for course details and other public endpoints
      const url = originalRequest.url || '';
      
      // Enhanced detection of public endpoints
      const isPublicEndpoint = 
        // Course detail pages (with either ID or slug)
        (url.includes('/courses/') && 
         !url.includes('/check-enrollment') && 
         !url.includes('/enroll') && 
         !url.includes('/content') &&
         !url.includes('/learn')) ||
        // All courses listing page
        url === '/courses' ||
        // Other public endpoints
        url.includes('/auth/') ||
        url.includes('/events') ||
        url.includes('/public/');
      
      console.log('URL checking for public endpoint:', url, 'Result:', isPublicEndpoint);
      
      // Check if user is already logged in (has token)
      const hasToken = localStorage.getItem('token');
      const hasRefreshToken = localStorage.getItem('refreshToken');
      
      // Only attempt to refresh token if user has logged in before and it's not a refresh token request
      if (hasToken && hasRefreshToken && !originalRequest._retry && !url.includes('/refresh-token')) {
        originalRequest._retry = true;
        
        if (!isRefreshingToken) {
          isRefreshingToken = true;
          
          try {
            // Attempt to refresh the token
            const newToken = await refreshToken();
            isRefreshingToken = false;
            
            // Process queued requests with new token
            processRequestsQueue(newToken);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            isRefreshingToken = false;
            
            // If refresh failed and this is not a public endpoint, redirect to login
            if (!isPublicEndpoint) {
              console.warn('Token refresh failed, redirecting to login page');
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
          }
        } else {
          // If a token refresh is already in progress, queue this request
          return new Promise((resolve, reject) => {
            requestsQueue.push({ config: originalRequest, resolve, reject });
          });
        }
      } else if (!isPublicEndpoint && !hasToken) {
        // Only redirect to login if not a public endpoint and user doesn't have a token
        console.warn('Not authenticated, redirecting to login page');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        console.log('Authentication required but allowing access without redirect for', url);
      }
    }
    return Promise.reject(error);
  }
);

// Export the API URL for direct use in other files
export const API_URL = process.env.VITE_API_URL || 'http://localhost:5001';

export default axiosClient; 