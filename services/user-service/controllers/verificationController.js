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

/**
 * Add additional email to user account
 */
exports.addEmail = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    const { email } = req.body;
    const userId = req.user.userId;
    
    if (!email) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Vui lòng nhập địa chỉ email' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Định dạng email không hợp lệ' });
    }

    // Check email uniqueness across all accounts
    const emailExistsResult = await transaction.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT 1 FROM Users WHERE Email = @email
        UNION
        SELECT 1 FROM UserEmails WHERE Email = @email
      `);
    
    if (emailExistsResult.recordset.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Email này đã được sử dụng' });
    }
    
    // Check email count limit (max 3)
    const emailCountResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT COUNT(*) AS EmailCount FROM (
          SELECT Email FROM Users WHERE UserID = @userId
          UNION ALL
          SELECT Email FROM UserEmails WHERE UserID = @userId
        ) AS Emails
      `);
    
    const emailCount = emailCountResult.recordset[0].EmailCount;
    if (emailCount >= 3) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Bạn chỉ có thể thêm tối đa 3 địa chỉ email' });
    }
    
    // Generate verification token
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    
    // Add email to UserEmails table
    await transaction.request()
      .input('userId', sql.BigInt, userId)
      .input('email', sql.VarChar, email)
      .input('verificationToken', sql.VarChar, verificationToken)
      .query(`
        INSERT INTO UserEmails (UserID, Email, IsPrimary, IsVerified, Visibility, VerificationToken, CreatedAt)
        VALUES (@userId, @email, 0, 0, 'private', @verificationToken, GETDATE())
      `);
    
    // Generate OTP
    const otp = generateOTP(6);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP valid for 15 minutes
    
    // Save OTP to database with type = 'secondary_email_verification'
    await transaction.request()
      .input('userId', sql.BigInt, userId)
      .input('email', sql.VarChar, email)
      .input('otp', sql.VarChar, otp)
      .input('expiresAt', sql.DateTime, expiresAt)
      .input('type', sql.VarChar, 'sec_email')
      .query(`
        INSERT INTO EmailVerifications (UserID, Email, OTP, ExpiresAt, IsUsed, CreatedAt, Type)
        VALUES (@userId, @email, @otp, @expiresAt, 0, GETDATE(), @type)
      `);
    
    // Get user name for the email
    const userResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .query(`SELECT FullName FROM Users WHERE UserID = @userId`);
    
    await transaction.commit();
    
    // Send verification email
    await sendVerificationEmail(email, userResult.recordset[0].FullName, otp, 'Xác thực địa chỉ email phụ');
    
    res.status(200).json({
      message: 'Email đã được thêm. Vui lòng kiểm tra hộp thư để xác thực.',
      email: email
    });
    
  } catch (error) {
    console.error('Add email error:', error);
    await transaction.rollback();
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi thêm email',
      error: error.message
    });
  }
};

/**
 * Verify additional email
 */
exports.verifyAdditionalEmail = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    const { email, otp } = req.body;
    const userId = req.user.userId;
    
    if (!email || !otp) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ email và mã xác thực' });
    }
    
    // Check if the email exists in UserEmails table
    const emailResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .input('email', sql.VarChar, email)
      .query(`
        SELECT EmailID, IsVerified
        FROM UserEmails
        WHERE UserID = @userId AND Email = @email
      `);
    
    if (emailResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy email này trong tài khoản của bạn' });
    }
    
    const emailRecord = emailResult.recordset[0];
    
    // Check if email already verified
    if (emailRecord.IsVerified) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Email này đã được xác thực' });
    }
    
    // Check OTP
    const verificationResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .input('email', sql.VarChar, email)
      .input('otp', sql.VarChar, otp)
      .input('type', sql.VarChar, 'sec_email')
      .query(`
        SELECT VerificationID, ExpiresAt
        FROM EmailVerifications
        WHERE UserID = @userId AND Email = @email AND OTP = @otp AND IsUsed = 0 AND Type = @type
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
    
    // Mark email as verified
    await transaction.request()
      .input('emailId', sql.BigInt, emailRecord.EmailID)
      .query(`
        UPDATE UserEmails
        SET IsVerified = 1, VerifiedAt = GETDATE(), VerificationToken = NULL
        WHERE EmailID = @emailId
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
      message: 'Xác thực email thành công',
      emailVerified: true,
      email: email
    });
    
  } catch (error) {
    console.error('Verify additional email error:', error);
    await transaction.rollback();
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi xác thực email',
      error: error.message
    });
  }
};

/**
 * Resend verification OTP for additional email
 */
exports.resendAdditionalEmailVerification = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    let { email, emailId } = req.body;
    const userId = req.user.userId;
    
    // Nếu provide emailId thì tra cứu email
    if (!email && emailId) {
      const emailLookup = await transaction.request()
        .input('userId', sql.BigInt, userId)
        .input('emailId', sql.BigInt, emailId)
        .query(`SELECT Email FROM UserEmails WHERE EmailID=@emailId AND UserID=@userId`);
      if (emailLookup.recordset.length > 0) {
        email = emailLookup.recordset[0].Email;
      }
    }

    if (!email) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email' });
    }
    
    // Check if the email exists in UserEmails table
    const emailResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .input('email', sql.VarChar, email)
      .query(`
        SELECT EmailID, IsVerified
        FROM UserEmails
        WHERE UserID = @userId AND Email = @email
      `);
    
    if (emailResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy email này trong tài khoản của bạn' });
    }
    
    const emailRecord = emailResult.recordset[0];
    
    // Check if email already verified
    if (emailRecord.IsVerified) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Email này đã được xác thực' });
    }
    
    // Generate OTP
    const otp = generateOTP(6);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP valid for 15 minutes
    
    // Delete any existing unused OTPs for this email
    await transaction.request()
      .input('userId', sql.BigInt, userId)
      .input('email', sql.VarChar, email)
      .query(`
        DELETE FROM EmailVerifications
        WHERE UserID = @userId AND Email = @email AND IsUsed = 0
      `);
    
    // Save OTP to database with type = 'secondary_email_verification'
    await transaction.request()
      .input('userId', sql.BigInt, userId)
      .input('email', sql.VarChar, email)
      .input('otp', sql.VarChar, otp)
      .input('expiresAt', sql.DateTime, expiresAt)
      .input('type', sql.VarChar, 'sec_email')
      .query(`
        INSERT INTO EmailVerifications (UserID, Email, OTP, ExpiresAt, IsUsed, CreatedAt, Type)
        VALUES (@userId, @email, @otp, @expiresAt, 0, GETDATE(), @type)
      `);
    
    // Get user name for the email
    const userResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .query(`SELECT FullName FROM Users WHERE UserID = @userId`);
    
    await transaction.commit();
    
    // Send verification email
    await sendVerificationEmail(email, userResult.recordset[0].FullName, otp, 'Xác thực địa chỉ email phụ');
    
    res.status(200).json({
      message: 'Mã xác thực đã được gửi lại đến email của bạn',
      email: email
    });
    
  } catch (error) {
    console.error('Resend additional email verification error:', error);
    await transaction.rollback();
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi gửi lại mã xác thực',
      error: error.message
    });
  }
}; 