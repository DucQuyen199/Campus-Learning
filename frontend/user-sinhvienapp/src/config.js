/*-----------------------------------------------------------------
* File: config.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student portal application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
// API configuration
let API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5008';
if (!API_BASE_URL.endsWith('/api')) {
  API_BASE_URL = API_BASE_URL.replace(/\/+$/, '') + '/api';
}
export { API_BASE_URL };

// Authentication configuration
export const AUTH_CONFIG = {
  tokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token',
  userKey: 'user_data',
  expiresInKey: 'token_expires'
};

// Course registration configuration
export const COURSE_REGISTRATION_CONFIG = {
  maxCredits: 24,  // Maximum credits per semester
  maxCourses: 8    // Maximum courses per semester
};

export default {
  API_BASE_URL,
  AUTH_CONFIG,
  COURSE_REGISTRATION_CONFIG
}; 
