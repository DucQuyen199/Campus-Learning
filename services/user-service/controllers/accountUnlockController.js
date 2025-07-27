/*-----------------------------------------------------------------
* File: accountUnlockController.js
* Author: Quyen Nguyen Duc
* Date: 2025-01-19
* Description: Controller for handling account unlock functionality
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/

const { pool, sql } = require('../config/db');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const securityService = require('../utils/securityService');
const { sendAccountUnlockedEmail } = require('../utils/emailService');

/**
 * Verify unlock token and get user info for unlock process
 */
exports.verifyUnlockToken = async (req, res) => {
  try {
    const { token } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    if (!token) {
      return res.status(400).json({
        message: 'Token mở khóa là bắt buộc'
      });
    }

    // Verify the unlock token
    const tokenVerification = await securityService.verifyUnlockToken(token);
    if (!tokenVerification.valid) {
      return res.status(400).json({
        message: tokenVerification.reason || 'Token không hợp lệ'
      });
    }

    // Get user information
    const userResult = await pool.request()
      .input('userID', sql.BigInt, tokenVerification.userID)
      .query(`
        SELECT UserID, Username, Email, FullName, AccountStatus, LockedUntil, TwoFAEnabled
        FROM Users
        WHERE UserID = @userID
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    const user = userResult.recordset[0];

    // Check if account is still locked
    if (user.AccountStatus !== 'LOCKED') {
      return res.status(400).json({
        message: 'Tài khoản không ở trạng thái khóa'
      });
    }

    res.json({
      message: 'Token hợp lệ',
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        twoFaEnabled: user.TwoFAEnabled
      },
      emailToken: tokenVerification.emailToken,
      requiresTwoFA: user.TwoFAEnabled
    });

  } catch (error) {
    console.error('Verify unlock token error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi xác thực token',
      error: error.message
    });
  }
};

/**
 * Verify email token (first step of unlock process)
 */
exports.verifyEmailToken = async (req, res) => {
  try {
    const { emailToken } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    if (!emailToken) {
      return res.status(400).json({
        message: 'Email token là bắt buộc'
      });
    }

    // Find token by email token
    const tokenResult = await pool.request()
      .input('emailToken', sql.VarChar, emailToken)
      .input('now', sql.DateTime, new Date())
      .query(`
        SELECT TokenID, UserID, UnlockToken, ExpiresAt, IsUsed
        FROM AccountUnlockTokens
        WHERE EmailToken = @emailToken
          AND ExpiresAt > @now
          AND IsUsed = 0
      `);

    if (tokenResult.recordset.length === 0) {
      return res.status(400).json({
        message: 'Email token không hợp lệ hoặc đã hết hạn'
      });
    }

    const token = tokenResult.recordset[0];

    // Get user information
    const userResult = await pool.request()
      .input('userID', sql.BigInt, token.UserID)
      .query(`
        SELECT UserID, Email, FullName, TwoFAEnabled, AccountStatus
        FROM Users
        WHERE UserID = @userID
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    const user = userResult.recordset[0];

    if (user.AccountStatus !== 'LOCKED') {
      return res.status(400).json({
        message: 'Tài khoản không ở trạng thái khóa'
      });
    }

    // Track that email verification was successful
    await pool.request()
      .input('tokenID', sql.BigInt, token.TokenID)
      .query(`
        UPDATE AccountUnlockTokens
        SET EmailVerified = 1, EmailVerifiedAt = GETDATE()
        WHERE TokenID = @tokenID
      `);

    // If user doesn't have 2FA enabled, unlock immediately after email verification
    if (!user.TwoFAEnabled) {
      // Unlock the account
      const unlockResult = await securityService.unlockUserAccount(token.UserID);
      if (!unlockResult.unlocked) {
        return res.status(500).json({
          message: 'Không thể mở khóa tài khoản',
          error: unlockResult.error
        });
      }

      // Mark token as used
      await securityService.useUnlockToken(token.TokenID);

      // Send confirmation email
      try {
        await sendAccountUnlockedEmail(user.Email, user.FullName, ipAddress);
      } catch (emailError) {
        console.error('Failed to send unlock confirmation email:', emailError);
      }

      return res.json({
        message: 'Tài khoản đã được mở khóa thành công',
        unlocked: true,
        requiresTwoFA: false
      });
    }

    // If 2FA is enabled, generate a temporary token for 2FA verification
    const tempToken = jwt.sign(
      { 
        userId: token.UserID,
        tokenID: token.TokenID,
        unlockProcess: true,
        emailVerified: true  // Add flag to indicate email was verified
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({
      message: 'Email xác thực thành công. Vui lòng nhập mã 2FA.',
      emailVerified: true,
      requiresTwoFA: true,
      tempToken
    });

  } catch (error) {
    console.error('Verify email token error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi xác thực email',
      error: error.message
    });
  }
};

/**
 * Verify 2FA and complete unlock process
 */
exports.verifyTwoFAUnlock = async (req, res) => {
  try {
    const { otp, tempToken } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    if (!otp || !tempToken) {
      return res.status(400).json({
        message: 'Mã 2FA và temp token là bắt buộc'
      });
    }

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      if (!decoded.unlockProcess || !decoded.userId || !decoded.tokenID || !decoded.emailVerified) {
        return res.status(401).json({
          message: 'Token không hợp lệ cho quá trình mở khóa hoặc email chưa được xác thực'
        });
      }
    } catch (err) {
      return res.status(401).json({
        message: 'Token đã hết hạn hoặc không hợp lệ'
      });
    }

    // Verify that email was verified for this token
    const tokenResult = await pool.request()
      .input('tokenID', sql.BigInt, decoded.tokenID)
      .query(`
        SELECT TokenID, UserID, EmailVerified, IsUsed
        FROM AccountUnlockTokens
        WHERE TokenID = @tokenID AND IsUsed = 0
      `);

    if (tokenResult.recordset.length === 0 || !tokenResult.recordset[0].EmailVerified) {
      return res.status(401).json({
        message: 'Email chưa được xác thực hoặc token không hợp lệ'
      });
    }

    // Get user's 2FA secret
    const userResult = await pool.request()
      .input('userID', sql.BigInt, decoded.userId)
      .query(`
        SELECT UserID, Email, FullName, TwoFASecret, AccountStatus
        FROM Users
        WHERE UserID = @userID
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    const user = userResult.recordset[0];

    if (user.AccountStatus !== 'LOCKED') {
      return res.status(400).json({
        message: 'Tài khoản không ở trạng thái khóa'
      });
    }

    // Verify 2FA OTP
    const secret = user.TwoFASecret;
    if (!secret) {
      return res.status(400).json({
        message: '2FA chưa được thiết lập cho tài khoản này'
      });
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: otp,
      window: 2 // Allow 2 time steps (1 minute) variance
    });

    if (!verified) {
      return res.status(400).json({
        message: 'Mã 2FA không chính xác'
      });
    }

    // Unlock the account
    const unlockResult = await securityService.unlockUserAccount(decoded.userId);
    if (!unlockResult.unlocked) {
      return res.status(500).json({
        message: 'Không thể mở khóa tài khoản',
        error: unlockResult.error
      });
    }

    // Mark token as used
    await securityService.useUnlockToken(decoded.tokenID);

    // Send confirmation email
    try {
      await sendAccountUnlockedEmail(user.Email, user.FullName, ipAddress);
    } catch (emailError) {
      console.error('Failed to send unlock confirmation email:', emailError);
    }

    res.json({
      message: 'Tài khoản đã được mở khóa thành công',
      unlocked: true
    });

  } catch (error) {
    console.error('Verify 2FA unlock error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi xác thực 2FA',
      error: error.message
    });
  }
};

/**
 * Request new unlock email (if previous one expired)
 */
exports.requestNewUnlockEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    if (!email) {
      return res.status(400).json({
        message: 'Email là bắt buộc'
      });
    }

    // Find user by email
    const userResult = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT UserID, Username, Email, FullName, AccountStatus, LockedUntil
        FROM Users
        WHERE Email = @email
          AND DeletedAt IS NULL
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    const user = userResult.recordset[0];

    if (user.AccountStatus !== 'LOCKED') {
      return res.status(400).json({
        message: 'Tài khoản không ở trạng thái khóa'
      });
    }

    // Generate new unlock token
    const unlockTokenResult = await securityService.generateUnlockToken(user.UserID, ipAddress);
    if (!unlockTokenResult.success) {
      return res.status(500).json({
        message: 'Không thể tạo token mở khóa',
        error: unlockTokenResult.error
      });
    }

    const unlockUrl = `${process.env.FRONTEND_URL || 'http://localhost:5004'}/unlock-account?token=${unlockTokenResult.unlockToken}&email=${encodeURIComponent(email)}`;

    // Send unlock email
    try {
      await sendAccountUnlockedEmail(
        email,
        user.FullName,
        unlockUrl,
        ipAddress,
        securityService.LOCKOUT_DURATION_MINUTES
      );

      res.json({
        message: 'Email mở khóa mới đã được gửi',
        emailSent: true
      });
    } catch (emailError) {
      console.error('Failed to send unlock email:', emailError);
      res.status(500).json({
        message: 'Không thể gửi email mở khóa',
        error: emailError.message
      });
    }

  } catch (error) {
    console.error('Request new unlock email error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi yêu cầu email mới',
      error: error.message
    });
  }
};

/**
 * Get account lock status
 */
exports.getAccountLockStatus = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        message: 'Email là bắt buộc'
      });
    }

    // Find user by email
    const userResult = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT UserID, AccountStatus, LockedUntil, LockReason, LockDuration
        FROM Users
        WHERE Email = @email
          AND DeletedAt IS NULL
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    const user = userResult.recordset[0];
    
    // Check if account is locked
    const lockStatus = await securityService.isAccountLocked(user.UserID);

    res.json({
      isLocked: lockStatus.isLocked,
      lockedUntil: lockStatus.lockedUntil,
      reason: lockStatus.reason,
      canRequestUnlock: lockStatus.isLocked
    });

  } catch (error) {
    console.error('Get account lock status error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi kiểm tra trạng thái khóa',
      error: error.message
    });
  }
}; 