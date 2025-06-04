const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, sql } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

exports.register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      dateOfBirth,
      school
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Email không hợp lệ'
      });
    }

    // Validate username format (only letters, numbers, and underscores)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới, độ dài 3-30 ký tự'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Check existing user
    const checkResult = await pool.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .query(`
        SELECT Username, Email 
        FROM Users 
        WHERE Username = @username OR Email = @email
      `);

    if (checkResult.recordset.length > 0) {
      const existing = checkResult.recordset[0];
      if (existing.Username === username) {
        return res.status(400).json({ 
          message: 'Tên đăng nhập đã tồn tại' 
        });
      }
      if (existing.Email === email) {
        return res.status(400).json({ 
          message: 'Email đã được sử dụng' 
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    const insertResult = await pool.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('fullName', sql.NVarChar, fullName)
      .input('dateOfBirth', sql.Date, dateOfBirth || null)
      .input('school', sql.NVarChar, school || null)
      .query(`
        INSERT INTO Users (
          Username, Email, Password, FullName,
          DateOfBirth, School, Role, Status,
          AccountStatus, Provider, EmailVerified,
          CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.UserID
        VALUES (
          @username, @email, @password, @fullName,
          @dateOfBirth, @school, 'STUDENT', 'OFFLINE',
          'ACTIVE', 'local', 0,
          GETDATE(), GETDATE()
        )
      `);

    const userId = insertResult.recordset[0].UserID;

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        id: userId,
        username,
        email,
        fullName
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi đăng ký',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { email, password } = req.body;

    await transaction.begin();

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Find user
    const result = await transaction.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT UserID, Username, Email, Password, FullName, Role, Status, AccountStatus, HasPasskey
        FROM Users
        WHERE Email = @email
        AND DeletedAt IS NULL
        AND AccountStatus = 'ACTIVE'
      `);

    const user = result.recordset[0];

    if (!user) {
      await transaction.rollback();
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.Password);
    if (!isValidPassword) {
      await transaction.rollback();
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    // Update last login
    await transaction.request()
      .input('userId', sql.BigInt, user.UserID)
      .input('ip', sql.VarChar, req.ip)
      .query(`
        UPDATE Users
        SET 
          LastLoginAt = GETDATE(),
          LastLoginIP = @ip,
          Status = 'ONLINE'
        WHERE UserID = @userId
      `);

    await transaction.commit();

    // Generate access token
    const token = jwt.sign(
      { 
        userId: user.UserID,
        role: user.Role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Generate refresh token (longer expiration)
    const refreshToken = jwt.sign(
      { 
        userId: user.UserID,
        role: user.Role,
        tokenType: 'refresh'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const hasPasskey = user.HasPasskey;

    res.json({
      message: 'Đăng nhập thành công',
      token,
      refreshToken,
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        role: user.Role,
        hasPasskey
      },
      requirePasskeySetup: hasPasskey ? false : true
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Login Error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi đăng nhập',
      error: error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    // Update user status to offline
    const query = `
      UPDATE Users
      SET Status = 'OFFLINE'
      WHERE UserID = @userId
    `;

    await pool.request()
      .input('userId', req.user.UserID)
      .query(query);

    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi đăng xuất',
      error: error.message
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    // Lấy UserID từ middleware auth đã xác thực
    const UserID = req.user.UserID;
    
    // Ghi log để debug
    console.log('User from auth middleware:', req.user);
    console.log('UserID:', UserID);
    
    // Query để lấy thông tin user
    const query = `
      SELECT 
        UserID,
        Username,
        Email,
        FullName,
        DateOfBirth,
        School,
        Role,
        Status,
        AccountStatus,
        Image,
        Bio,
        EmailVerified,
        PhoneNumber,
        Address,
        City,
        Country,
        LastLoginAt,
        CreatedAt,
        UpdatedAt
      FROM Users 
      WHERE UserID = @userId
    `;

    const result = await pool.request()
      .input('userId', sql.BigInt, UserID)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const user = result.recordset[0];
    res.json(user);

  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ 
      message: 'Lỗi server',
      error: error.message 
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        message: 'Refresh token is required' 
      });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      // Additional security check - ensure it's a refresh token
      if (!decoded.userId || decoded.tokenType !== 'refresh') {
        return res.status(401).json({ 
          message: 'Invalid refresh token' 
        });
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ 
        message: 'Invalid or expired refresh token' 
      });
    }
    
    // Verify user exists in the database
    const result = await pool.request()
      .input('userId', sql.BigInt, decoded.userId)
      .query(`
        SELECT UserID, Username, Email, FullName, Role, Status, AccountStatus
        FROM Users
        WHERE UserID = @userId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    const user = result.recordset[0];
    
    // Check if user account is active
    if (user.AccountStatus !== 'ACTIVE') {
      return res.status(403).json({ 
        message: 'Account is inactive or suspended' 
      });
    }
    
    // Generate new tokens
    const newToken = jwt.sign(
      { 
        userId: user.UserID,
        username: user.Username,
        role: user.Role,
        tokenType: 'access'
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    const newRefreshToken = jwt.sign(
      { 
        userId: user.UserID,
        tokenType: 'refresh'
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    // Return new tokens
    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        role: user.Role
      }
    });
    
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi làm mới token',
      error: error.message
    });
  }
};

// Check auth endpoint to verify if a token is valid
exports.checkAuth = async (req, res) => {
  try {
    // If this middleware succeeds, it means the token is valid
    // and req.user contains the decoded user information
    
    // Return user data in response
    return res.json({
      success: true,
      user: {
        id: req.user.UserID,
        username: req.user.Username,
        email: req.user.Email,
        fullName: req.user.FullName,
        role: req.user.Role
      }
    });
  } catch (error) {
    console.error('Check Auth Error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi kiểm tra xác thực',
      error: error.message
    });
  }
};

// Handle forgot password: generate token and send reset link
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    // Find user by email
    const userResult = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`SELECT UserID FROM Users WHERE Email = @email AND DeletedAt IS NULL`);
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }
    const userId = userResult.recordset[0].UserID;
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    
    // Delete any existing OTP for this user
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`DELETE FROM PasswordResets WHERE UserID = @userId`);
    
    // Store new OTP
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('otp', sql.VarChar, otp)
      .input('expiresAt', sql.DateTime, expiresAt)
      .query(
        `INSERT INTO PasswordResets (UserID, OTP, ExpiresAt) VALUES (@userId, @otp, @expiresAt)`
      );
    
    // In a production environment, you would send this OTP via SMS or email
    // For now, we'll log it to the console for testing purposes
    console.log('Password reset OTP for user', email, ':', otp);
    
    // Return success but don't include the OTP in the response
    res.json({ message: 'OTP sent to email', userId });
  } catch (error) {
    console.error('ForgotPassword Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Handle reset password: verify token and update password
exports.resetPassword = async (req, res) => {
  try {
    const { userId, otp, password } = req.body;
    
    if (!userId || !otp || !password) {
      return res.status(400).json({ message: 'User ID, OTP, and password are all required' });
    }
    
    // Verify OTP
    const otpResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('otp', sql.VarChar, otp)
      .query(
        `SELECT ResetID, ExpiresAt, AttemptCount, IsUsed FROM PasswordResets 
         WHERE UserID = @userId AND OTP = @otp`
      );
    
    if (otpResult.recordset.length === 0) {
      // Increment attempt count for security tracking if we found any pending OTP for this user
      await pool.request()
        .input('userId', sql.BigInt, userId)
        .query(
          `UPDATE PasswordResets SET AttemptCount = AttemptCount + 1 
           WHERE UserID = @userId AND IsUsed = 0`
        );
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    const resetEntry = otpResult.recordset[0];
    
    // Check if OTP is expired
    if (new Date(resetEntry.ExpiresAt) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }
    
    // Check if OTP has already been used
    if (resetEntry.IsUsed) {
      return res.status(400).json({ message: 'OTP has already been used' });
    }
    
    // Check if too many attempts
    if (resetEntry.AttemptCount >= 5) {
      return res.status(400).json({ message: 'Too many attempts. Please request a new OTP.' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update user password
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('password', sql.VarChar, hashedPassword)
      .query(
        `UPDATE Users SET Password = @password WHERE UserID = @userId`
      );
      
    // Mark OTP as used
    await pool.request()
      .input('resetId', sql.Int, resetEntry.ResetID)
      .query(
        `UPDATE PasswordResets SET IsUsed = 1 WHERE ResetID = @resetId`
      );
      
    res.json({ message: 'Password reset successful', success: true });
  } catch (error) {
    console.error('ResetPassword Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify OTP without resetting password
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }
    
    // Verify OTP
    const otpResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('otp', sql.VarChar, otp)
      .query(
        `SELECT ResetID, ExpiresAt, AttemptCount, IsUsed FROM PasswordResets 
         WHERE UserID = @userId AND OTP = @otp`
      );
    
    if (otpResult.recordset.length === 0) {
      // Increment attempt count for security tracking
      await pool.request()
        .input('userId', sql.BigInt, userId)
        .query(
          `UPDATE PasswordResets SET AttemptCount = AttemptCount + 1 
           WHERE UserID = @userId AND IsUsed = 0`
        );
      return res.status(400).json({ message: 'Invalid OTP', verified: false });
    }
    
    const resetEntry = otpResult.recordset[0];
    
    // Check if OTP is expired
    if (new Date(resetEntry.ExpiresAt) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired', verified: false });
    }
    
    // Check if OTP has already been used
    if (resetEntry.IsUsed) {
      return res.status(400).json({ message: 'OTP has already been used', verified: false });
    }
    
    // Check if too many attempts
    if (resetEntry.AttemptCount >= 5) {
      return res.status(400).json({ 
        message: 'Too many attempts. Please request a new OTP.', 
        verified: false 
      });
    }
    
    // OTP is valid, but we don't mark it as used yet
    // Update attempt count to track verification
    await pool.request()
      .input('resetId', sql.Int, resetEntry.ResetID)
      .query(
        `UPDATE PasswordResets SET AttemptCount = AttemptCount + 1 WHERE ResetID = @resetId`
      );
    
    // Return success
    res.json({ 
      message: 'OTP verified successfully', 
      verified: true,
      userId 
    });
  } catch (error) {
    console.error('VerifyOTP Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 