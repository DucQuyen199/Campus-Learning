const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, sql } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { generateOTP, sendLoginOtpEmail } = require('../utils/emailService');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

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

    // First try to find user by primary email in Users table
    let result = await transaction.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT UserID, Username, Email, Password, FullName, Role, Status, AccountStatus, HasPasskey, TwoFAEnabled
        FROM Users
        WHERE Email = @email
        AND DeletedAt IS NULL
        AND AccountStatus = 'ACTIVE'
      `);

    let user = result.recordset[0];
    
    // If not found by primary email, check for verified secondary emails
    if (!user) {
      const secondaryEmailResult = await transaction.request()
        .input('email', sql.VarChar, email)
        .query(`
          SELECT u.UserID, u.Username, u.Email AS PrimaryEmail, u.Password, u.FullName, u.Role, u.Status, u.AccountStatus, u.HasPasskey, u.TwoFAEnabled
          FROM Users u
          JOIN UserEmails ue ON u.UserID = ue.UserID
          WHERE ue.Email = @email
          AND ue.IsVerified = 1
          AND u.DeletedAt IS NULL
          AND u.AccountStatus = 'ACTIVE'
        `);
        
      if (secondaryEmailResult.recordset.length > 0) {
        user = secondaryEmailResult.recordset[0];
      } else {
        await transaction.rollback();
        return res.status(401).json({
          message: 'Email hoặc mật khẩu không chính xác'
        });
      }
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.Password);
    if (!isValidPassword) {
      await transaction.rollback();
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    // If user has 2FA enabled, issue a temporary token for 2FA verification
    if (user.TwoFAEnabled) {
      await transaction.rollback();
      const tempToken = jwt.sign(
        { userId: user.UserID, twoFaAllowed: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        message: 'Yêu cầu 2FA',
        twoFaRequired: true,
        tempToken
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
    
    // Use the primary email in the response
    const responseEmail = user.PrimaryEmail || user.Email;

    res.json({
      message: 'Đăng nhập thành công',
      token,
      refreshToken,
      user: {
        id: user.UserID,
        username: user.Username,
        email: responseEmail,
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
    
    // Generate new access token (unchanged)
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

    // Removed rotating refresh token generation to keep original refreshToken

    // Return new tokens, reusing existing refreshToken
    res.json({
      token: newToken,
      refreshToken, // reuse original refresh token
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

/**
 * Request login OTP via email
 */
exports.requestLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const userResult = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT UserID, FullName, AccountStatus FROM Users WHERE Email = @email AND DeletedAt IS NULL');
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }
    const user = userResult.recordset[0];
    if (user.AccountStatus !== 'ACTIVE') {
      return res.status(403).json({ message: 'Tài khoản không hoạt động' });
    }
    const userId = user.UserID;
    const fullName = user.FullName;
    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .query('DELETE FROM OTPLogins WHERE UserID = @userId AND IsUsed = 0');
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('otp', sql.VarChar, otp)
      .input('expiresAt', sql.DateTime, expiresAt)
      .query('INSERT INTO OTPLogins (UserID, OTP, ExpiresAt) VALUES (@userId, @otp, @expiresAt)');
    await sendLoginOtpEmail(email, fullName, otp);
    res.json({ message: 'OTP đã được gửi đến email của bạn' });
  } catch (error) {
    console.error('RequestLoginOtp Error:', error);
    res.status(500).json({ message: 'Đã có lỗi xảy ra khi gửi OTP', error: error.message });
  }
};

/**
 * Verify login OTP and generate JWT tokens
 */
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email và OTP là bắt buộc' });
    }
    const userResult = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT UserID, Username, FullName, Role, HasPasskey, AccountStatus FROM Users WHERE Email = @email AND DeletedAt IS NULL');
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }
    const user = userResult.recordset[0];
    if (user.AccountStatus !== 'ACTIVE') {
      return res.status(403).json({ message: 'Tài khoản không hoạt động' });
    }
    const userId = user.UserID;
    const otpResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('otp', sql.VarChar, otp)
      .query('SELECT LoginOtpID, ExpiresAt, AttemptCount, IsUsed FROM OTPLogins WHERE UserID = @userId AND OTP = @otp');
    if (otpResult.recordset.length === 0) {
      await pool.request()
        .input('userId', sql.BigInt, userId)
        .query('UPDATE OTPLogins SET AttemptCount = AttemptCount + 1 WHERE UserID = @userId AND IsUsed = 0');
      return res.status(400).json({ message: 'OTP không hợp lệ' });
    }
    const entry = otpResult.recordset[0];
    if (new Date(entry.ExpiresAt) < new Date()) {
      return res.status(400).json({ message: 'OTP đã hết hạn' });
    }
    if (entry.IsUsed) {
      return res.status(400).json({ message: 'OTP đã được sử dụng' });
    }
    if (entry.AttemptCount >= 5) {
      return res.status(400).json({ message: 'Quá nhiều lượt thử. Vui lòng yêu cầu OTP mới.' });
    }
    await pool.request()
      .input('loginOtpId', sql.BigInt, entry.LoginOtpID)
      .query('UPDATE OTPLogins SET IsUsed = 1 WHERE LoginOtpID = @loginOtpId');
    const token = jwt.sign({ userId, role: user.Role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId, role: user.Role, tokenType: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      message: 'Đăng nhập thành công',
      token,
      refreshToken,
      user: {
        id: userId,
        username: user.Username,
        email,
        fullName: user.FullName,
        role: user.Role,
        hasPasskey: user.HasPasskey
      },
      requirePasskeySetup: !user.HasPasskey
    });
  } catch (error) {
    console.error('VerifyLoginOtp Error:', error);
    res.status(500).json({ message: 'Đã có lỗi xảy ra khi xác thực OTP', error: error.message });
  }
}; 

// Add 2FA handlers
/** Get 2FA status for current user */
exports.getTwoFaStatus = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query('SELECT TwoFAEnabled FROM Users WHERE UserID = @userId');
    const twoFaEnabled = result.recordset[0]?.TwoFAEnabled || false;
    res.json({ twoFaEnabled });
  } catch (error) {
    console.error('GetTwoFaStatus Error:', error);
    res.status(500).json({ message: 'Không thể lấy trạng thái 2FA' });
  }
};

/** Setup 2FA - generate secret and QR code */
exports.setup2Fa = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const email = req.user.Email || req.user.email;
    // Check existing secret
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query('SELECT TwoFASecret, TwoFAEnabled FROM Users WHERE UserID = @userId');
    const row = result.recordset[0] || {};
    let secretBase32;
    let otpauthUrl;
    if (row.TwoFASecret && !row.TwoFAEnabled) {
      // Reuse existing secret
      secretBase32 = row.TwoFASecret;
      otpauthUrl = speakeasy.otpauthURL({
        secret: secretBase32,
        label: `Campust (${email})`,
        issuer: 'Campust',
        encoding: 'base32'
      });
    } else {
      // Generate new secret
      const secretObj = speakeasy.generateSecret({
        name: `Campust (${email})`,
        issuer: 'Campust',
        length: 20
      });
      secretBase32 = secretObj.base32;
      otpauthUrl = secretObj.otpauth_url;
      // Store new secret only; enabling will occur upon verification
      await pool.request()
        .input('userId', sql.BigInt, userId)
        .input('secret', sql.VarChar, secretBase32)
        .query('UPDATE Users SET TwoFASecret = @secret WHERE UserID = @userId');
    }
    // Tạo QR code trực tiếp từ server thay vì dùng Google Chart API
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    res.json({ qrCodeUrl: qrCodeDataUrl, secret: secretBase32 });
  } catch (error) {
    console.error('Setup2Fa Error:', error);
    res.status(500).json({ message: 'Không thể khởi tạo 2FA' });
  }
};

/** Verify 2FA OTP and enable 2FA */
exports.verify2Fa = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { otp } = req.body;
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query('SELECT TwoFASecret FROM Users WHERE UserID = @userId');
    const secret = result.recordset[0]?.TwoFASecret;
    const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token: otp });
    if (!verified) {
      return res.status(400).json({ message: 'Mã 2FA không hợp lệ' });
    }
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .query('UPDATE Users SET TwoFAEnabled = 1 WHERE UserID = @userId');
    res.json({ message: '2FA đã được kích hoạt' });
  } catch (error) {
    console.error('Verify2Fa Error:', error);
    res.status(500).json({ message: 'Xác thực 2FA không thành công' });
  }
};

/** Disable 2FA */
exports.disable2Fa = async (req, res) => {
  try {
    const userId = req.user.UserID;
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .query('UPDATE Users SET TwoFAEnabled = 0, TwoFASecret = NULL WHERE UserID = @userId');
    res.json({ message: '2FA đã được vô hiệu hóa' });
  } catch (error) {
    console.error('Disable2Fa Error:', error);
    res.status(500).json({ message: 'Không thể vô hiệu hóa 2FA' });
  }
}; 

/**
 * Complete login after 2FA verification
 */
exports.login2Fa = async (req, res) => {
  try {
    const tempToken = req.headers.authorization?.split(' ')[1];
    if (!tempToken) {
      return res.status(401).json({ message: 'Temp token is required for 2FA login' });
    }
    // Verify tempToken (signed with JWT_SECRET, includes userId and twoFaAllowed)
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      if (!decoded.twoFaAllowed || !decoded.userId) {
        return res.status(401).json({ message: 'Invalid temporary token for 2FA' });
      }
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired temporary token' });
    }
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }
    // Get user's secret
    const result = await pool.request()
      .input('userId', sql.BigInt, decoded.userId)
      .query('SELECT TwoFASecret, Role, Username, Email, FullName, HasPasskey FROM Users WHERE UserID = @userId');
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = result.recordset[0];
    const secret = user.TwoFASecret;
    // Verify OTP
    const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token: otp });
    if (!verified) {
      return res.status(400).json({ message: 'Invalid 2FA code' });
    }
    // Generate access and refresh tokens
    const token = jwt.sign({ userId: decoded.userId, role: user.Role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: decoded.userId, role: user.Role, tokenType: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    // Return same response format as login
    const responseEmail = user.Email;
    res.json({
      message: 'Đăng nhập thành công',
      token,
      refreshToken,
      user: {
        id: decoded.userId,
        username: user.Username,
        email: responseEmail,
        fullName: user.FullName,
        role: user.Role,
        hasPasskey: user.HasPasskey
      },
      requirePasskeySetup: user.HasPasskey ? false : true
    });
  } catch (error) {
    console.error('Login2Fa Error:', error);
    res.status(500).json({ message: 'Error during 2FA login', error: error.message });
  }
}; 