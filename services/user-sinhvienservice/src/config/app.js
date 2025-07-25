/*-----------------------------------------------------------------
* File: app.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 5008,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  demoMode: process.env.DEMO_MODE === 'true' || false,
  logLevel: process.env.LOG_LEVEL || 'info',
  apiPrefix: '/api',
}; 
