/*-----------------------------------------------------------------
* File: user.controller.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { poolPromise, sql } = require('../config/database');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const userController = {
  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .query(`
          SELECT UserID, Username, Email, FullName,
                 Role, Status, AccountStatus, School,
                 CreatedAt, LastLoginAt
          FROM Users
          WHERE DeletedAt IS NULL
          ORDER BY CreatedAt DESC
        `);
      
      // Đếm tổng số người dùng
      const countResult = await pool.request()
        .query(`
          SELECT COUNT(*) as totalCount
          FROM Users
          WHERE DeletedAt IS NULL
        `);
      
      // Trả về dữ liệu theo định dạng mà frontend yêu cầu
      res.json({
        users: result.recordset,
        totalCount: countResult.recordset[0].totalCount
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
      const result = await pool.request()
        .input('userId', sql.BigInt, id)
        .query(`
          SELECT UserID, Username, Email, FullName,
                 Role, Status, AccountStatus, School,
                 ProfilePicture, Bio, CreatedAt, LastLoginAt
          FROM Users
          WHERE UserID = @userId AND DeletedAt IS NULL
        `);

      if (!result.recordset[0]) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(result.recordset[0]);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        fullName,
        email,
        school,
        bio
      } = req.body;

      const pool = await poolPromise;
      await pool.request()
        .input('userId', sql.BigInt, id)
        .input('fullName', sql.NVarChar(100), fullName)
        .input('email', sql.VarChar(100), email)
        .input('school', sql.NVarChar(100), school)
        .input('bio', sql.NVarChar(500), bio)
        .query(`
          UPDATE Users
          SET FullName = @fullName,
              Email = @email,
              School = @school,
              Bio = @bio,
              UpdatedAt = GETDATE()
          WHERE UserID = @userId AND DeletedAt IS NULL
        `);

      res.json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
      await pool.request()
        .input('userId', sql.BigInt, id)
        .query(`
          UPDATE Users
          SET DeletedAt = GETDATE(),
              AccountStatus = 'DELETED'
          WHERE UserID = @userId AND DeletedAt IS NULL
        `);

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Update user role
  updateUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const pool = await poolPromise;
      await pool.request()
        .input('userId', sql.BigInt, id)
        .input('role', sql.VarChar(20), role)
        .query(`
          UPDATE Users
          SET Role = @role,
              UpdatedAt = GETDATE()
          WHERE UserID = @userId AND DeletedAt IS NULL
        `);

      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Lock user account
  lockUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { duration, reason } = req.body;

      // Calculate locked until date based on duration (in hours)
      const lockedUntil = duration === -1 ? null : new Date(Date.now() + duration * 60 * 60 * 1000);

      const pool = await poolPromise;
      await pool.request()
        .input('userId', sql.BigInt, id)
        .input('duration', sql.Int, duration)
        .input('reason', sql.NVarChar(255), reason)
        .input('lockedUntil', sql.DateTime, lockedUntil)
        .query(`
          UPDATE Users
          SET AccountStatus = 'LOCKED',
              LockDuration = @duration,
              LockReason = @reason,
              LockedUntil = @lockedUntil,
              UpdatedAt = GETDATE()
          WHERE UserID = @userId AND DeletedAt IS NULL
        `);

      res.json({ message: 'User account locked successfully' });
    } catch (error) {
      console.error('Error locking user account:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Unlock user account
  unlockUser: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await poolPromise;
      await pool.request()
        .input('userId', sql.BigInt, id)
        .query(`
          UPDATE Users
          SET AccountStatus = 'ACTIVE',
              LockDuration = NULL,
              LockReason = NULL,
              LockedUntil = NULL,
              UpdatedAt = GETDATE()
          WHERE UserID = @userId AND DeletedAt IS NULL
        `);

      res.json({ message: 'User account unlocked successfully' });
    } catch (error) {
      console.error('Error unlocking user account:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // Reset user password
  resetUserPassword: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Generate a secure random password (12 characters)
      const newPassword = crypto.randomBytes(6).toString('hex');
      
      // Hash the password with bcrypt
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const pool = await poolPromise;
      await pool.request()
        .input('userId', sql.BigInt, id)
        .input('password', sql.VarChar(255), hashedPassword)
        .query(`
          UPDATE Users
          SET Password = @password,
              UpdatedAt = GETDATE()
          WHERE UserID = @userId AND DeletedAt IS NULL
        `);

      // Return the new plain text password to be shown to the admin
      res.json({ 
        success: true, 
        message: 'Password reset successfully',
        newPassword: newPassword
      });
    } catch (error) {
      console.error('Error resetting user password:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = userController; 
