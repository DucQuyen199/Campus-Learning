const jwt = require('jsonwebtoken');
const sql = require('mssql');
const dbConfig = require('../config/db');

/**
 * Authentication middleware
 * Verifies the JWT token and ensures the user has ADMIN role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campus-secret-key');
    
    // Get connection pool
    const pool = await dbConfig.getPool();
    
    // Check if user exists and has required permissions
    const result = await pool.request()
      .input('id', sql.BigInt, decoded.id)
      .query('SELECT UserID, Username, Role, AccountStatus FROM Users WHERE UserID = @id');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }
    
    const user = result.recordset[0];
    
    // Check if account is active
    if (user.AccountStatus !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa'
      });
    }
    
    // Check if user is an admin - case sensitive check
    if (user.Role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }
    
    // Attach the user to the request
    req.user = {
      id: user.UserID,
      username: user.Username,
      role: user.Role
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực'
    });
  }
};

module.exports = authMiddleware; 