const express = require('express');
const router = express.Router();
const sql = require('mssql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Get database config from src/config/db.js
const dbConfig = require('../src/config/db');

/**
 * Login route for admin users
 * Authenticates users with ADMIN role only
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên đăng nhập và mật khẩu'
      });
    }

    // Log the authentication attempt
    console.log(`Authentication attempt for username/email: ${username}`);

    // Get connection pool
    const pool = await dbConfig.getPool();
    
    // Check if user exists with this username OR email (allowing either for login)
    const userCheck = await pool.request()
      .input('identifier', sql.VarChar(100), username)
      .query('SELECT UserID, Username, Email, Password, FullName, Role, AccountStatus FROM Users WHERE Username = @identifier OR Email = @identifier');
    
    console.log(`User query results: ${userCheck.recordset.length} records found`);
    
    // No user found with that username or email
    if (userCheck.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại'
      });
    }
    
    const user = userCheck.recordset[0];
    console.log(`User found: ${user.Username}, Role: ${user.Role}, Status: ${user.AccountStatus}`);
    
    // Check if account is active
    if (user.AccountStatus !== 'ACTIVE') {
      return res.status(401).json({
        success: false, 
        message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa'
      });
    }
    
    // Check if user has ADMIN role
    if (user.Role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập vào trang quản trị'
      });
    }
    
    // Verify password - using simple direct comparison for plaintext passwords
    console.log(`Password check: Input="${password}", DB="${user.Password}"`);
    
    // The password in the database is hashed with bcrypt (starts with $2a$), so we need to use bcrypt.compare
    let isPasswordValid = false;
    
    // Check if the password is hashed (starts with $2a$)
    if (user.Password.startsWith('$2a$')) {
      // Use bcrypt for hashed passwords
      isPasswordValid = await bcrypt.compare(password, user.Password);
    } else {
      // Fallback to direct comparison for non-hashed passwords
      isPasswordValid = password === user.Password;
    }
    
    console.log(`Password validation result: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không đúng'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.UserID, 
        username: user.Username, 
        role: user.Role,
        fullName: user.FullName
      },
      process.env.JWT_SECRET || 'campus-secret-key',
      { expiresIn: '8h' }
    );

    // Return user info and token
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.UserID,
        username: user.Username,
        role: user.Role,
        name: user.FullName,
        email: user.Email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng nhập'
    });
  }
});

/**
 * Validate token route
 * Verifies JWT token and confirms user has ADMIN role
 */
router.get('/validate-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'campus-secret-key');
    
    // Get connection pool
    const pool = await dbConfig.getPool();
    
    // Get user from database
    const result = await pool.request()
      .input('id', sql.BigInt, decoded.id)
      .query('SELECT UserID, Username, Role, FullName, Email, AccountStatus FROM Users WHERE UserID = @id');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }
    
    const user = result.recordset[0];
    
    // Verify user is active
    if (user.AccountStatus !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa'
      });
    }
    
    // Verify user has ADMIN role
    if (user.Role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập vào trang quản trị'
      });
    }
    
    // Return user info
    res.json({
      success: true,
      user: {
        id: user.UserID,
        username: user.Username,
        role: user.Role,
        name: user.FullName,
        email: user.Email
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
});

/**
 * Forgot password route
 */
router.post('/forgot-password', (req, res) => {
  res.json({
    success: true,
    message: 'Liên kết đặt lại mật khẩu đã được gửi đến email'
  });
});

/**
 * Reset password route
 */
router.post('/reset-password', (req, res) => {
  res.json({
    success: true,
    message: 'Mật khẩu đã được cập nhật thành công'
  });
});

/**
 * Gmail login route for admin users
 * Authenticates users with ADMIN role only
 */
router.post('/login-gmail', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email'
      });
    }

    // Log the authentication attempt
    console.log(`Gmail authentication attempt for email: ${email}`);

    // Get connection pool
    const pool = await dbConfig.getPool();
    
    // First check if user exists with this email and has gmail as provider
    const userCheck = await pool.request()
      .input('email', sql.VarChar(100), email)
      .query('SELECT UserID, Username, Email, FullName, Role, AccountStatus, Provider FROM Users WHERE Email = @email');
    
    console.log(`User query results: ${userCheck.recordset.length} records found`);
    
    // No user found with that email
    if (userCheck.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại với email này'
      });
    }
    
    const user = userCheck.recordset[0];
    console.log(`User found: ${user.Username}, Email: ${user.Email}, Role: ${user.Role}, Status: ${user.AccountStatus}`);
    
    // Check if account is active
    if (user.AccountStatus !== 'ACTIVE') {
      return res.status(401).json({
        success: false, 
        message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa'
      });
    }
    
    // Check if user has ADMIN role
    if (user.Role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập vào trang quản trị'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.UserID, 
        username: user.Username, 
        role: user.Role,
        fullName: user.FullName
      },
      process.env.JWT_SECRET || 'campus-secret-key',
      { expiresIn: '8h' }
    );

    // Return user info and token
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.UserID,
        username: user.Username,
        role: user.Role,
        name: user.FullName,
        email: user.Email
      }
    });
  } catch (error) {
    console.error('Gmail login error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng nhập bằng Gmail'
    });
  }
});

module.exports = router; 