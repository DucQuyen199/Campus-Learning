/*-----------------------------------------------------------------
* File: internshipService.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student portal application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
