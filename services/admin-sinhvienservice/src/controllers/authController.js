/*-----------------------------------------------------------------
* File: authController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { executeQuery, sql } = require('../config/db');

/**
 * Admin login controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên đăng nhập và mật khẩu.'
      });
    }

    // Query user by username or email
    const query = `
      SELECT UserID, Username, Email, Password, FullName, Role, Status, AccountStatus
      FROM Users
      WHERE (Username = @username OR Email = @username) AND AccountStatus = 'ACTIVE'
    `;

    const result = await executeQuery(query, {
      username: sql.VarChar(50), username
    });

    // Check if user exists
    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác.'
      });
    }

    const user = result.recordset[0];

    // Check if user is an admin - case insensitive check
    if (user.Role.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập hệ thống quản trị.'
      });
    }

    // Check if account is locked
    if (user.AccountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.Password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.UserID },
      process.env.JWT_SECRET || 'admin_secret_key',
      { expiresIn: '24h' }
    );

    // Update last login time
    await executeQuery(`
      UPDATE Users
      SET LastLoginAt = GETDATE(), LastLoginIP = @ip
      WHERE UserID = @userId
    `, {
      ip: sql.VarChar(45), ip: req.ip || '127.0.0.1',
      userId: sql.BigInt, userId: user.UserID
    });

    // Return success with token and user info
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        role: user.Role,
        status: user.Status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.'
    });
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.UserID;

    const query = `
      SELECT
        u.UserID,
        u.Username,
        u.Email,
        u.FullName,
        u.Role,
        u.Status,
        u.PhoneNumber,
        u.Avatar,
        u.Bio,
        u.LastLoginAt
      FROM Users u
      WHERE u.UserID = @userId AND u.AccountStatus = 'ACTIVE'
    `;

    const result = await executeQuery(query, {
      userId: sql.BigInt, userId
    });

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng.'
      });
    }

    return res.status(200).json({
      success: true,
      user: result.recordset[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin cá nhân.'
    });
  }
};

/**
 * Change password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 8 ký tự.'
      });
    }

    // Get current password
    const userQuery = `
      SELECT Password
      FROM Users
      WHERE UserID = @userId
    `;

    const userResult = await executeQuery(userQuery, {
      userId: sql.BigInt, userId
    });

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản.'
      });
    }

    // Verify current password
    const user = userResult.recordset[0];
    const isPasswordValid = await bcrypt.compare(currentPassword, user.Password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác.'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await executeQuery(`
      UPDATE Users
      SET Password = @password, UpdatedAt = GETDATE()
      WHERE UserID = @userId
    `, {
      password: sql.VarChar(255), password: hashedPassword,
      userId: sql.BigInt, userId
    });

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đổi mật khẩu.'
    });
  }
};

/**
 * Check if token is valid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const validateToken = async (req, res) => {
  // If middleware passes, token is valid and user is authenticated
  return res.status(200).json({
    success: true,
    message: 'Token hợp lệ',
    user: {
      id: req.user.UserID,
      username: req.user.Username,
      email: req.user.Email,
      fullName: req.user.FullName,
      role: req.user.Role
    }
  });
};

module.exports = {
  login,
  getProfile,
  changePassword,
  validateToken
}; 
