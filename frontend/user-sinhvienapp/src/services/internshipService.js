import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/internship`;

// attach token
axios.interceptors.request.use(config=>{
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export const internshipService = {
  getInternships: async (userId) => {
    const res = await axios.get(`${API_URL}/${userId}`);
    return res.data?.data || [];
  }
}; 