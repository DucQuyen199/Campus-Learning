import axios from 'axios';

const teacherApi = axios.create({
  baseURL: 'http://localhost:5003/api/v1',
  timeout: 10000
});

teacherApi.interceptors.request.use(config => {
  const token = localStorage.getItem('teacher_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

teacherApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('teacher_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default teacherApi; 