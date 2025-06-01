const jwt = require('jsonwebtoken');
const sql = require('mssql');

// Middleware to authenticate admin users
const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Không tìm thấy token xác thực. Vui lòng đăng nhập.' 
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin_secret_key');
    
    // Check if token is valid and user exists in database
    const pool = await sql.connect();
    const result = await pool.request()
      .input('userId', sql.BigInt, decoded.userId)
      .query(`
        SELECT UserID, Username, Email, FullName, Role, Status
        FROM Users
        WHERE UserID = @userId AND UPPER(Role) = 'ADMIN' AND AccountStatus = 'ACTIVE'
      `);
    
    // If user not found or not an admin
    if (result.recordset.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền truy cập vào trang này.' 
      });
    }
    
    // Add user info to request
    req.user = result.recordset[0];
    
    // Proceed to next middleware
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token không hợp lệ. Vui lòng đăng nhập lại.' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi xác thực người dùng.' 
    });
  }
};

module.exports = authenticateAdmin; 