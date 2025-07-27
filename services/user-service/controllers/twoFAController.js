/*-----------------------------------------------------------------
* File: twoFAController.js
* Author: Quyen Nguyen Duc
* Date: 2025-06-28
* Description: Controller for handling 2FA operations
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/

const { pool, sql } = require('../config/db');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');
const { sendTwoFASetupEmail } = require('../utils/emailService');

/**
 * Get user's 2FA status
 */
exports.getTwoFAStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT TwoFAEnabled, RequireTwoFA
        FROM Users
        WHERE UserID = @userId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    const user = result.recordset[0];

    res.json({
      enabled: !!user.TwoFAEnabled,
      required: !!user.RequireTwoFA
    });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi lấy trạng thái 2FA',
      error: error.message
    });
  }
};

/**
 * Initialize 2FA setup
 */
exports.initTwoFASetup = async (req, res) => {
  try {
    const { setupToken } = req.body;
    let userId;

    // Verify token if provided in request body (for forced setup)
    if (setupToken) {
      try {
        const decoded = jwt.verify(setupToken, process.env.JWT_SECRET);
        if (!decoded.userId || !decoded.requireTwoFASetup) {
          return res.status(401).json({
            message: 'Token không hợp lệ cho thiết lập 2FA'
          });
        }
        userId = decoded.userId;
      } catch (err) {
        return res.status(401).json({
          message: 'Token đã hết hạn hoặc không hợp lệ'
        });
      }
    } else {
      // Regular setup - get userId from authenticated user
      userId = req.user.userId;
    }

    // Get user information
    const userResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT UserID, Email, Username, FullName, TwoFAEnabled
        FROM Users
        WHERE UserID = @userId
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    const user = userResult.recordset[0];

    // Check if 2FA is already enabled
    if (user.TwoFAEnabled) {
      return res.status(400).json({
        message: 'Xác thực hai yếu tố đã được kích hoạt cho tài khoản này'
      });
    }

    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `CampusLearning:${user.Email || user.Username}`
    });

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(secret.otpauth_url);

    // Store temporary secret in the session
    const tempToken = jwt.sign(
      { 
        userId: user.UserID,
        tempSecret: secret.base32,
        setupProcess: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    // Send email notification about 2FA setup
    try {
      await sendTwoFASetupEmail(
        user.Email,
        user.FullName,
        req.ip || req.connection.remoteAddress || 'unknown'
      );
    } catch (emailError) {
      console.error('Failed to send 2FA setup email:', emailError);
    }

    res.json({
      message: 'Mã QR cho thiết lập 2FA đã được tạo',
      qrCodeData,
      secret: secret.base32,
      tempToken
    });
  } catch (error) {
    console.error('Error initializing 2FA setup:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi khởi tạo thiết lập 2FA',
      error: error.message
    });
  }
};

/**
 * Verify and enable 2FA
 */
exports.verifyAndEnable2FA = async (req, res) => {
  try {
    const { token, code } = req.body;
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.setupProcess || !decoded.userId || !decoded.tempSecret) {
        return res.status(401).json({
          message: 'Token không hợp lệ cho quá trình thiết lập 2FA'
        });
      }
    } catch (err) {
      return res.status(401).json({
        message: 'Token đã hết hạn hoặc không hợp lệ'
      });
    }

    // Verify OTP code
    const verified = speakeasy.totp.verify({
      secret: decoded.tempSecret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow 2 time steps (1 minute) variance
    });

    if (!verified) {
      return res.status(400).json({
        message: 'Mã xác thực không chính xác',
        success: false
      });
    }

    // Save the secret and enable 2FA
    await pool.request()
      .input('userId', sql.BigInt, decoded.userId)
      .input('twoFASecret', sql.VarChar, decoded.tempSecret)
      .query(`
        UPDATE Users
        SET TwoFASecret = @twoFASecret,
            TwoFAEnabled = 1,
            RequireTwoFA = 0,
            UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `);

    res.json({
      message: 'Xác thực hai yếu tố đã được kích hoạt thành công',
      success: true
    });
  } catch (error) {
    console.error('Error verifying and enabling 2FA:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi xác minh và kích hoạt 2FA',
      error: error.message,
      success: false
    });
  }
};

/**
 * Disable 2FA
 */
exports.disable2FA = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: 'Mật khẩu là bắt buộc để tắt xác thực hai yếu tố'
      });
    }

    // Get user information and verify password
    const userResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT Password
        FROM Users
        WHERE UserID = @userId
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    const user = userResult.recordset[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.Password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Mật khẩu không chính xác'
      });
    }

    // Disable 2FA
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        UPDATE Users
        SET TwoFASecret = NULL,
            TwoFAEnabled = 0,
            UpdatedAt = GETDATE()
        WHERE UserID = @userId
      `);

    res.json({
      message: 'Xác thực hai yếu tố đã được tắt thành công',
      success: true
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi tắt xác thực hai yếu tố',
      error: error.message
    });
  }
};

/**
 * Verify login with 2FA
 */
exports.verifyLogin = async (req, res) => {
  try {
    const { code, token } = req.body;
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.userId || !decoded.twoFaAllowed) {
        return res.status(401).json({
          message: 'Token không hợp lệ cho xác thực 2FA'
        });
      }
    } catch (err) {
      return res.status(401).json({
        message: 'Token đã hết hạn hoặc không hợp lệ'
      });
    }

    // Get user's 2FA secret
    const userResult = await pool.request()
      .input('userId', sql.BigInt, decoded.userId)
      .query(`
        SELECT UserID, Username, Email, FullName, Role, TwoFASecret, HasPasskey
        FROM Users
        WHERE UserID = @userId
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        message: 'Người dùng không tồn tại'
      });
    }

    const user = userResult.recordset[0];
    const secret = user.TwoFASecret;

    if (!secret) {
      return res.status(400).json({
        message: '2FA chưa được thiết lập cho tài khoản này'
      });
    }

    // Verify OTP code
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow 2 time steps (1 minute) variance
    });

    if (!verified) {
      return res.status(400).json({
        message: 'Mã xác thực không chính xác'
      });
    }

    // Update last login
    await pool.request()
      .input('userId', sql.BigInt, decoded.userId)
      .input('ip', sql.VarChar, req.ip || req.connection.remoteAddress || 'unknown')
      .query(`
        UPDATE Users
        SET LastLoginAt = GETDATE(),
            LastLoginIP = @ip,
            Status = 'ONLINE'
        WHERE UserID = @userId
      `);

    // Generate access token
    const accessToken = jwt.sign(
      { 
        userId: user.UserID,
        role: user.Role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { 
        userId: user.UserID,
        role: user.Role,
        tokenType: 'refresh'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Xác thực 2FA thành công',
      token: accessToken,
      refreshToken,
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        role: user.Role,
        hasPasskey: !!user.HasPasskey
      }
    });
  } catch (error) {
    console.error('Error verifying 2FA login:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi xác thực 2FA',
      error: error.message
    });
  }
}; 