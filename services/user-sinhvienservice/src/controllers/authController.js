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
      
      // For social login, email is required
      if (isSocialLogin && !email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required for social login'
        });
      }
      
      // For regular login, username/email and password are required
      if (!isSocialLogin && (!username && !email) || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username/email and password are required'
        });
      }
      
      // For demo mode, we'll create a mock user
      // In production, you would validate against the database
      const userId = 1;
      const fullName = isSocialLogin ? email.split('@')[0] : (username || email.split('@')[0]);
      const userRole = 'STUDENT';
      
      // Create JWT payload
      const payload = {
        user: {
          id: userId,
          UserID: userId,
          username: username || email,
          email: email || (username + '@example.com'),
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
          UserID: userId,
          Username: username || email,
          Email: email || (username + '@example.com'),
          FullName: fullName,
          Role: userRole,
          Status: 'ONLINE',
          PhoneNumber: null,
          Avatar: null,
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