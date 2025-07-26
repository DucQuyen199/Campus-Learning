import axios from 'axios';
import { API_URL } from '../config';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data || error)
);

export const searchApi = {
  globalSearch: async (query) => {
    try {
      const response = await apiClient.get('/search', { params: { q: query } });
      return response;
    } catch (error) {
      console.error('Error global searching:', error);
      throw error;
    }
  }
}; 