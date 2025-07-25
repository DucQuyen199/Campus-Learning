/*-----------------------------------------------------------------
* File: authController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { jwtSecret, jwtExpiresIn, refreshTokenExpiresIn } = require('../config/app');

// Controller for authentication
const authController = {
  // User login
  login: async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { username, password, email, provider } = req.body;
      console.log('Login attempt with:', { username, email, provider });
      
      // Check if this is a social login
      const isSocialLogin = provider === 'google' || provider === 'facebook';
      
      // Only allow Gmail login; reject other login types
      if (!isSocialLogin) {
        return res.status(400).json({
          success: false,
          message: 'Chỉ hỗ trợ đăng nhập bằng Gmail (Google)'
        });
      }
      
      // For Gmail login, email is required
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email là bắt buộc khi đăng nhập bằng Gmail'
        });
      }
      
      // Fetch user from database
      const { sqlConnection } = require('../config/database');
      const pool = await sqlConnection.connect();
      
      // Build query: Gmail login uses email only
      let query = `SELECT TOP 1 * FROM Users WHERE Email = @email`;
      
      const request = pool.request();
      request.input('email', sqlConnection.sql.VarChar(100), email);
      
      const result = await request.query(query);
      
      if (result.recordset.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản hoặc mật khẩu không đúng'
        });
      }
      
      const dbUser = result.recordset[0];
      const userId = dbUser.UserID;
      const fullName = dbUser.FullName;
      const userRole = dbUser.Role || 'STUDENT';
      
      // Create JWT payload
      const payload = {
        user: {
          id: userId,
          UserID: userId,
          username: dbUser.Username,
          email: dbUser.Email,
          role: userRole
        }
      };
      
      // Sign the token
      const token = jwt.sign(
        payload, 
        jwtSecret,
        { expiresIn: jwtExpiresIn }
      );
      
      // Create refresh token
      const refreshToken = jwt.sign(
        { user: { id: userId, type: 'refresh' } },
        jwtSecret,
        { expiresIn: refreshTokenExpiresIn }
      );
      
      // Return tokens and user data
      return res.json({
        success: true,
        token,
        refreshToken,
        user: {
          UserID: dbUser.UserID,
          Username: dbUser.Username,
          Email: dbUser.Email,
          FullName: dbUser.FullName,
          Role: dbUser.Role,
          Status: dbUser.Status,
          PhoneNumber: dbUser.PhoneNumber,
          Avatar: dbUser.Avatar,
          Provider: isSocialLogin ? provider : 'local'
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  },
  
  // Refresh token
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }
      
      // Verify refresh token
      jwt.verify(refreshToken, jwtSecret, (err, decoded) => {
        if (err) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
          });
        }
        
        // Check if it's a refresh token
        if (!decoded.user || !decoded.user.id || decoded.user.type !== 'refresh') {
          return res.status(401).json({
            success: false,
            message: 'Invalid token type'
          });
        }
        
        // Create new tokens
        const userId = decoded.user.id;
        
        // Create JWT payload
        const payload = {
          user: {
            id: userId,
            UserID: userId,
            username: 'user' + userId,
            email: 'user' + userId + '@example.com',
            role: 'STUDENT'
          }
        };
        
        // Sign the new token
        const newToken = jwt.sign(
          payload, 
          jwtSecret,
          { expiresIn: jwtExpiresIn }
        );
        
        // Create new refresh token
        const newRefreshToken = jwt.sign(
          { user: { id: userId, type: 'refresh' } },
          jwtSecret,
          { expiresIn: refreshTokenExpiresIn }
        );
        
        return res.json({
          success: true,
          token: newToken,
          refreshToken: newRefreshToken
        });
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during token refresh'
      });
    }
  },
  
  // Logout
  logout: async (req, res) => {
    try {
      // In a stateless JWT setup, the client is responsible for removing the token
      // Server-side we could implement a blacklist for revoked tokens if needed
      
      return res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during logout'
      });
    }
  }
};

module.exports = authController; 
