/*-----------------------------------------------------------------
* File: authMiddleware.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const jwt = require('jsonwebtoken');
const { pool, sql } = require('../config/db');

// This middleware is only applied to protected routes that specifically need authentication
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Không tìm thấy token xác thực' 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
      
      // Handle different JWT token structures (id or userId)
      const userIdFromToken = decoded.userId || decoded.id;
      
      if (!userIdFromToken) {
        console.error('Token does not contain userId or id field:', decoded);
        return res.status(401).json({ 
          success: false, 
          message: 'Token không hợp lệ: không tìm thấy ID người dùng' 
        });
      }
      
      // Use direct SQL query to find the user
      const result = await pool.request()
        .input('userId', sql.BigInt, userIdFromToken)
        .query(`
          SELECT * FROM Users 
          WHERE UserID = @userId 
          AND DeletedAt IS NULL
          AND AccountStatus = 'ACTIVE'
        `);
      
      if (result.recordset.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Người dùng không tồn tại' 
        });
      }

      const user = result.recordset[0];
      
      // Standardize user object with both id and userId properties for consistency
      req.user = {
        ...user,
        id: user.UserID,
        userId: user.UserID
      };
      
      console.log('User authenticated:', user.UserID);
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Token không hợp lệ hoặc đã hết hạn' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi xác thực' 
    });
  }
};

module.exports = authMiddleware; 
