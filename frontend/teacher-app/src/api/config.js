/*-----------------------------------------------------------------
* File: config.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
