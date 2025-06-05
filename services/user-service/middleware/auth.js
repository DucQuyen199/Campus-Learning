const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const sql = require('mssql');

// Create the authentication function
const authenticate = async (req, res, next) => {
  // Special case for /calls/active endpoint
  if (req.path === '/calls/active' || req.originalUrl === '/calls/active') {
    console.log('Allowing access to /calls/active without authentication');
    req.user = { id: null, userId: null, role: 'GUEST' };
    return next();
  }
  
  // Check if authentication should be bypassed for testing
  if (req.bypassAuth === true) {
    console.log('Bypassing authentication for testing');
    // Set a mock user for testing
    req.user = { id: 1, userId: 1, role: 'STUDENT' };
    return next();
  }
  
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle different JWT token structures (id or userId)
    const userIdFromToken = decoded.userId || decoded.id;
    
    if (!userIdFromToken) {
      console.error('Token does not contain userId or id field:', decoded);
      return res.status(401).json({ message: 'Token không hợp lệ: không tìm thấy ID người dùng' });
    }
    
    // Kiểm tra user trong database
    const result = await pool.request()
      .input('userId', sql.BigInt, userIdFromToken)
      .query(`
        SELECT UserID, Username, Role, AccountStatus
        FROM Users
        WHERE UserID = @userId AND DeletedAt IS NULL
      `);

    if (result.recordset.length === 0) {
      console.error(`User with ID ${userIdFromToken} not found in database`);
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    const user = result.recordset[0];

    // Kiểm tra trạng thái tài khoản
    if (user.AccountStatus !== 'ACTIVE') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa hoặc tạm ngưng' });
    }

    // Set both id and userId for compatibility
    req.user = {
      ...user,
      id: user.UserID,
      userId: user.UserID
    };
    
    console.log('User authenticated:', req.user.id);
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

// Export both names for backward compatibility
module.exports = {
  authenticate,
  authenticateToken: authenticate
}; 