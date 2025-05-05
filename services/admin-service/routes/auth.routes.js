const router = require('express').Router();
const { poolPromise, sql } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const pool = await poolPromise;
    
    // Log request data
    console.log('Login attempt:', { username });
    
    // Find user with exact column names from database structure
    const userResult = await pool.request()
      .input('identifier', sql.VarChar(50), username)
      .query(`
        SELECT UserID, Username, Email, Password, FullName, Role, Status, AccountStatus,
               LastLoginAt, LastLoginIP
        FROM Users 
        WHERE (Username = @identifier OR Email = @identifier)
          AND DeletedAt IS NULL 
          AND Status IN ('ONLINE', 'OFFLINE', 'AWAY')
          AND AccountStatus = 'ACTIVE'
          AND Role = 'ADMIN'
      `);
    
    // Log user search result
    console.log('User search result:', {
      found: userResult.recordset.length > 0,
      searchedIdentifier: username
    });
    
    if (userResult.recordset.length === 0) {
      return res.status(401).json({ 
        message: 'Tài khoản không tồn tại hoặc không có quyền admin' 
      });
    }

    const user = userResult.recordset[0];
    
    // Log user details (excluding sensitive data)
    console.log('Found user:', {
      id: user.UserID,
      username: user.Username,
      role: user.Role,
      status: user.Status,
      accountStatus: user.AccountStatus
    });
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.Password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Mật khẩu không chính xác' 
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.UserID, 
        role: user.Role,
        username: user.Username 
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1d' }
    );
    
    // Create refresh token (valid for 30 days)
    const refreshToken = jwt.sign(
      { 
        userId: user.UserID, 
        role: user.Role,
        username: user.Username,
        tokenType: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
      { expiresIn: '30d' }
    );

    // Update last login info
    await pool.request()
      .input('userId', sql.BigInt, user.UserID)
      .input('lastLoginAt', sql.DateTime, new Date())
      .input('lastLoginIP', sql.VarChar(45), req.ip)
      .input('status', sql.VarChar(20), 'ONLINE')
      .query(`
        UPDATE Users 
        SET LastLoginAt = @lastLoginAt,
            LastLoginIP = @lastLoginIP,
            Status = @status
        WHERE UserID = @userId
      `);
    
    // Return user info and token (excluding password)
    const { Password, ...userWithoutPassword } = user;
    return res.status(200).json({
      user: userWithoutPassword,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ 
      message: 'Lỗi server khi đăng nhập. Vui lòng thử lại sau.' 
    });
  }
});

// Add session check route
router.get('/session', auth.verifyAdmin, async (req, res) => {
  try {
    // Return sanitized user data
    const { Password, ...userWithoutPassword } = req.user;
    return res.status(200).json({ 
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Session Check Error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error during session check'
    });
  }
});

// Add refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'refresh_secret_key'
    );
    
    // Check token type to ensure it's a refresh token
    if (decoded.tokenType !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Verify user exists in the database
    const pool = await poolPromise;
    const userResult = await pool.request()
      .input('userId', sql.BigInt, decoded.userId)
      .query(`
        SELECT UserID, Username, Email, FullName, Role, Status, AccountStatus
        FROM Users 
        WHERE UserID = @userId
          AND DeletedAt IS NULL 
          AND AccountStatus = 'ACTIVE'
          AND Role = 'ADMIN'
      `);
    
    if (userResult.recordset.length === 0) {
      return res.status(401).json({ message: 'User not found or inactive' });
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
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    return res.status(500).json({ message: 'Server error while refreshing token' });
  }
});

// Add logout endpoint
router.post('/logout', auth.verifyAdmin, async (req, res) => {
  try {
    // Update user status to offline
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.BigInt, req.user.UserID)
      .input('status', sql.VarChar(20), 'OFFLINE')
      .query(`
        UPDATE Users 
        SET Status = @status
        WHERE UserID = @userId
      `);
    
    return res.status(200).json({ 
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout Error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error during logout'
    });
  }
});

module.exports = router;