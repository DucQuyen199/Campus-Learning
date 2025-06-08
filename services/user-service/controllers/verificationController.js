const { pool, sql } = require('../config/db');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const { generateOTP, sendVerificationEmail } = require('../utils/emailService');

/**
 * Send email verification OTP
 */
exports.sendVerificationOTP = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    const userId = req.user.userId;
    
    // Get user details
    const userResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT Email, FullName, EmailVerified
        FROM Users
        WHERE UserID = @userId
      `);
    
    const user = userResult.recordset[0];
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Check if email already verified
    if (user.EmailVerified) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Email đã được xác thực' });
    }
    
    // Generate OTP
    const otp = generateOTP(6);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP valid for 15 minutes
    
    // Delete any existing unused OTPs for this user
    await transaction.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        DELETE FROM EmailVerifications
        WHERE UserID = @userId AND IsUsed = 0
      `);
    
    // Save OTP to database
    await transaction.request()
      .input('userId', sql.BigInt, userId)
      .input('email', sql.VarChar, user.Email)
      .input('otp', sql.VarChar, otp)
      .input('expiresAt', sql.DateTime, expiresAt)
      .query(`
        INSERT INTO EmailVerifications (UserID, Email, OTP, ExpiresAt, IsUsed, CreatedAt)
        VALUES (@userId, @email, @otp, @expiresAt, 0, GETDATE())
      `);
    
    await transaction.commit();
    
    // Send email
    await sendVerificationEmail(user.Email, user.FullName, otp);
    
    res.status(200).json({
      message: 'Mã xác thực đã được gửi đến email của bạn',
      email: user.Email
    });
    
  } catch (error) {
    console.error('Send verification OTP error:', error);
    await transaction.rollback();
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi gửi mã xác thực',
      error: error.message
    });
  }
};

/**
 * Verify OTP and update email verification status
 */
exports.verifyEmail = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    const { otp } = req.body;
    const userId = req.user.userId;
    
    if (!otp) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Vui lòng nhập mã xác thực' });
    }
    
    // Get user details
    const userResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT Email, EmailVerified
        FROM Users
        WHERE UserID = @userId
      `);
    
    const user = userResult.recordset[0];
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Check if email already verified
    if (user.EmailVerified) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Email đã được xác thực' });
    }
    
    // Check OTP
    const verificationResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .input('otp', sql.VarChar, otp)
      .query(`
        SELECT VerificationID, ExpiresAt
        FROM EmailVerifications
        WHERE UserID = @userId AND OTP = @otp AND IsUsed = 0
        ORDER BY CreatedAt DESC
      `);
    
    if (verificationResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Mã xác thực không hợp lệ' });
    }
    
    const verification = verificationResult.recordset[0];
    
    // Check if OTP expired
    if (new Date() > new Date(verification.ExpiresAt)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Mã xác thực đã hết hạn' });
    }
    
    // Mark OTP as used
    await transaction.request()
      .input('verificationId', sql.BigInt, verification.VerificationID)
      .query(`
        UPDATE EmailVerifications
        SET IsUsed = 1
        WHERE VerificationID = @verificationId
      `);
    
    // Update user's email verification status
    await transaction.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        UPDATE Users
        SET EmailVerified = 1
        WHERE UserID = @userId
      `);
    
    await transaction.commit();
    
    res.status(200).json({
      message: 'Xác thực email thành công',
      emailVerified: true
    });
    
  } catch (error) {
    console.error('Verify email error:', error);
    await transaction.rollback();
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi xác thực email',
      error: error.message
    });
  }
};

/**
 * Resend verification OTP
 */
exports.resendVerificationOTP = async (req, res) => {
  // Reuse sendVerificationOTP logic
  return exports.sendVerificationOTP(req, res);
};

/**
 * Request password reset and send OTP
 */
exports.requestPasswordReset = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    const { email } = req.body;
    
    if (!email) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }
    
    // Get user details
    const userResult = await transaction.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT UserID, Email, FullName
        FROM Users
        WHERE Email = @email
      `);
    
    const user = userResult.recordset[0];
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này' });
    }
    
    // Generate OTP
    const otp = generateOTP(6);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP valid for 15 minutes
    
    // Delete any existing unused OTPs for this user
    await transaction.request()
      .input('userId', sql.BigInt, user.UserID)
      .query(`
        DELETE FROM EmailVerifications
        WHERE UserID = @userId AND IsUsed = 0
      `);
    
    // Save OTP to database with type = 'password_reset'
    await transaction.request()
      .input('userId', sql.BigInt, user.UserID)
      .input('email', sql.VarChar, user.Email)
      .input('otp', sql.VarChar, otp)
      .input('expiresAt', sql.DateTime, expiresAt)
      .input('type', sql.VarChar, 'password_reset')
      .query(`
        INSERT INTO EmailVerifications (UserID, Email, OTP, ExpiresAt, IsUsed, CreatedAt, Type)
        VALUES (@userId, @email, @otp, @expiresAt, 0, GETDATE(), @type)
      `);
    
    await transaction.commit();
    
    // Send email
    await sendVerificationEmail(user.Email, user.FullName, otp, 'Đặt lại mật khẩu');
    
    res.status(200).json({
      message: 'Mã xác thực đã được gửi đến email của bạn',
      email: user.Email
    });
    
  } catch (error) {
    console.error('Request password reset error:', error);
    await transaction.rollback();
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi gửi yêu cầu đặt lại mật khẩu',
      error: error.message
    });
  }
};

/**
 * Reset password with OTP verification
 */
exports.resetPassword = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Vui lòng cung cấp đầy đủ email, mã xác thực và mật khẩu mới' 
      });
    }
    
    // Get user details
    const userResult = await transaction.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT UserID, Email
        FROM Users
        WHERE Email = @email
      `);
    
    const user = userResult.recordset[0];
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này' });
    }
    
    // Check OTP
    const verificationResult = await transaction.request()
      .input('userId', sql.BigInt, user.UserID)
      .input('otp', sql.VarChar, otp)
      .input('type', sql.VarChar, 'password_reset')
      .query(`
        SELECT VerificationID, ExpiresAt
        FROM EmailVerifications
        WHERE UserID = @userId AND OTP = @otp AND IsUsed = 0 AND Type = @type
        ORDER BY CreatedAt DESC
      `);
    
    if (verificationResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Mã xác thực không hợp lệ' });
    }
    
    const verification = verificationResult.recordset[0];
    
    // Check if OTP expired
    if (new Date() > new Date(verification.ExpiresAt)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Mã xác thực đã hết hạn' });
    }
    
    // Hash the new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    await transaction.request()
      .input('userId', sql.BigInt, user.UserID)
      .input('password', sql.VarChar, hashedPassword)
      .query(`
        UPDATE Users
        SET Password = @password
        WHERE UserID = @userId
      `);
    
    // Mark OTP as used
    await transaction.request()
      .input('verificationId', sql.BigInt, verification.VerificationID)
      .query(`
        UPDATE EmailVerifications
        SET IsUsed = 1
        WHERE VerificationID = @verificationId
      `);
    
    await transaction.commit();
    
    res.status(200).json({
      message: 'Mật khẩu đã được đặt lại thành công',
      success: true
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    await transaction.rollback();
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi đặt lại mật khẩu',
      error: error.message
    });
  }
}; 