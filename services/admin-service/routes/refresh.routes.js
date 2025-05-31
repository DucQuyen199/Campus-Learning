const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/database');

// Token refresh endpoint
router.post('/', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || 'refresh_secret_key'
      );
    } catch (jwtError) {
      console.error('JWT Verification Error:', jwtError);
      
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ 
          message: 'Refresh token expired',
          code: 'REFRESH_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH'
      });
    }
    
    // Check token type to ensure it's a refresh token
    if (decoded.tokenType !== 'refresh') {
      return res.status(401).json({ 
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TYPE'
      });
    }
    
    // Verify user exists and is active in the database
    const pool = await poolPromise;
    const userResult = await pool.request()
      .input('userId', sql.BigInt, decoded.userId)
      .query(`
        SELECT UserID, Username, Email, FullName, Role, Status, AccountStatus
        FROM Users 
        WHERE UserID = @userId
          AND DeletedAt IS NULL 
          AND AccountStatus = 'ACTIVE'
      `);
    
    if (userResult.recordset.length === 0) {
      return res.status(401).json({ 
        message: 'User not found or inactive',
        code: 'USER_INVALID'
      });
    }
    
    const user = userResult.recordset[0];
    
    // Generate new access token
    const token = jwt.sign(
      { 
        userId: user.UserID, 
        role: user.Role,
        username: user.Username 
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1d' }
    );
    
    // Generate new refresh token (rotating refresh tokens)
    const newRefreshToken = jwt.sign(
      { 
        userId: user.UserID, 
        role: user.Role,
        username: user.Username,
        tokenType: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
      { expiresIn: '30d' }
    );
    
    // Return new tokens
    return res.status(200).json({
      token,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    return res.status(500).json({ 
      message: 'Server error during token refresh',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router; 