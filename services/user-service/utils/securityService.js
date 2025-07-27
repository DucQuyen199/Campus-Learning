/*-----------------------------------------------------------------
* File: securityService.js
* Author: Quyen Nguyen Duc
* Date: 2025-01-19
* Description: Security service for handling login attempts, account locking
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/

const { pool, sql } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Configuration constants
const MAX_FAILED_ATTEMPTS = 5; // Max failed attempts before locking
const LOCKOUT_DURATION_MINUTES = 30; // Account lockout duration in minutes
const TIME_WINDOW_MINUTES = 15; // Time window to count failed attempts
const TOKEN_EXPIRY_HOURS = 24; // Unlock token expiry time

// Export constants
module.exports.MAX_FAILED_ATTEMPTS = MAX_FAILED_ATTEMPTS;
module.exports.LOCKOUT_DURATION_MINUTES = LOCKOUT_DURATION_MINUTES;
module.exports.TIME_WINDOW_MINUTES = TIME_WINDOW_MINUTES;

/**
 * Record a login attempt (success or failure)
 */
const recordLoginAttempt = async (ipAddress, email, userID, isSuccessful, userAgent, failureReason = null) => {
  try {
    await pool.request()
      .input('ipAddress', sql.VarChar, ipAddress)
      .input('email', sql.VarChar, email)
      .input('userID', sql.BigInt, userID)
      .input('isSuccessful', sql.Bit, isSuccessful)
      .input('userAgent', sql.NVarChar, userAgent)
      .input('failureReason', sql.NVarChar, failureReason)
      .query(`
        INSERT INTO LoginAttempts (IPAddress, Email, UserID, IsSuccessful, UserAgent, FailureReason)
        VALUES (@ipAddress, @email, @userID, @isSuccessful, @userAgent, @failureReason)
      `);
  } catch (error) {
    console.error('Error recording login attempt:', error);
  }
};

/**
 * Check if an IP address should be blocked due to too many failed attempts
 */
const checkIPBlocking = async (ipAddress) => {
  try {
    const cutoffTime = new Date(Date.now() - TIME_WINDOW_MINUTES * 60 * 1000);
    
    const result = await pool.request()
      .input('ipAddress', sql.VarChar, ipAddress)
      .input('cutoffTime', sql.DateTime, cutoffTime)
      .query(`
        SELECT COUNT(*) as FailedCount
        FROM LoginAttempts
        WHERE IPAddress = @ipAddress
          AND AttemptTime >= @cutoffTime
          AND IsSuccessful = 0
      `);
    
    const failedCount = result.recordset[0].FailedCount;
    return {
      isBlocked: failedCount >= MAX_FAILED_ATTEMPTS,
      failedCount,
      maxAttempts: MAX_FAILED_ATTEMPTS,
      timeWindow: TIME_WINDOW_MINUTES
    };
  } catch (error) {
    console.error('Error checking IP blocking:', error);
    return { isBlocked: false, failedCount: 0 };
  }
};

/**
 * Check if a user account should be locked due to failed attempts
 */
const checkAccountLocking = async (email) => {
  try {
    // Get the current time
    const now = new Date();
    // Calculate cutoff time (15 minutes ago)
    const cutoffTime = new Date(now.getTime() - TIME_WINDOW_MINUTES * 60 * 1000);
    
    console.log(`[DEBUG] Checking account locking for email: ${email}`);
    console.log(`[DEBUG] Current time: ${now.toISOString()}`);
    console.log(`[DEBUG] Cutoff time: ${cutoffTime.toISOString()}`);
    
    // First check for any login attempts in the last 24 hours
    const recentAttemptsCheck = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT COUNT(*) as FailedCount
        FROM LoginAttempts
        WHERE Email = @email
          AND IsSuccessful = 0
          AND DATEDIFF(HOUR, AttemptTime, GETDATE()) <= 24
      `);
    
    const recentFailedCount = recentAttemptsCheck.recordset[0].FailedCount;
    console.log(`[DEBUG] Failed attempts in last 24 hours: ${recentFailedCount}`);
    
    // Get consecutive failed attempts regardless of time window
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT TOP ${MAX_FAILED_ATTEMPTS} * 
        FROM LoginAttempts
        WHERE Email = @email
        ORDER BY AttemptTime DESC
      `);
    
    // Count consecutive failed attempts
    let consecutiveFailedCount = 0;
    for (const attempt of result.recordset) {
      if (!attempt.IsSuccessful) {
        consecutiveFailedCount++;
      } else {
        // If we encounter a successful attempt, stop counting
        break;
      }
    }
    
    console.log(`[DEBUG] Consecutive failed attempts: ${consecutiveFailedCount}`);
    console.log(`[DEBUG] Should lock account: ${consecutiveFailedCount >= MAX_FAILED_ATTEMPTS}`);
    
    return {
      shouldLock: consecutiveFailedCount >= MAX_FAILED_ATTEMPTS,
      failedCount: consecutiveFailedCount,
      maxAttempts: MAX_FAILED_ATTEMPTS
    };
  } catch (error) {
    console.error('Error checking account locking:', error);
    return { shouldLock: false, failedCount: 0 };
  }
};

/**
 * Lock a user account
 */
const lockUserAccount = async (userID, reason = 'Multiple failed login attempts') => {
  try {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    
    await pool.request()
      .input('userID', sql.BigInt, userID)
      .input('lockReason', sql.NVarChar, reason)
      .input('lockDuration', sql.Int, LOCKOUT_DURATION_MINUTES)
      .input('lockedUntil', sql.DateTime, lockedUntil)
      .query(`
        UPDATE Users
        SET AccountStatus = 'LOCKED',
            LockReason = @lockReason,
            LockDuration = @lockDuration,
            LockedUntil = @lockedUntil,
            UpdatedAt = GETDATE()
        WHERE UserID = @userID
      `);
    
    return { locked: true, lockedUntil, duration: LOCKOUT_DURATION_MINUTES };
  } catch (error) {
    console.error('Error locking user account:', error);
    return { locked: false, error: error.message };
  }
};

/**
 * Check if a user account is currently locked
 */
const isAccountLocked = async (userID) => {
  try {
    const result = await pool.request()
      .input('userID', sql.BigInt, userID)
      .query(`
        SELECT AccountStatus, LockedUntil, LockReason
        FROM Users
        WHERE UserID = @userID
      `);
    
    if (result.recordset.length === 0) {
      return { isLocked: false };
    }
    
    const user = result.recordset[0];
    const now = new Date();
    
    if (user.AccountStatus === 'LOCKED') {
      // Always return locked status, even if lock period has expired
      // This ensures that accounts can only be unlocked through email verification
      return {
        isLocked: true,
        lockedUntil: user.LockedUntil,
        reason: user.LockReason
      };
    }
    
    return { isLocked: false };
  } catch (error) {
    console.error('Error checking account lock status:', error);
    return { isLocked: false, error: error.message };
  }
};

/**
 * Unlock a user account
 */
const unlockUserAccount = async (userID) => {
  try {
    await pool.request()
      .input('userID', sql.BigInt, userID)
      .query(`
        UPDATE Users
        SET AccountStatus = 'ACTIVE',
            LockReason = NULL,
            LockDuration = NULL,
            LockedUntil = NULL,
            UpdatedAt = GETDATE(),
            RequireTwoFA = 1
        WHERE UserID = @userID
      `);
    
    return { unlocked: true };
  } catch (error) {
    console.error('Error unlocking user account:', error);
    return { unlocked: false, error: error.message };
  }
};

/**
 * Generate account unlock token
 */
const generateUnlockToken = async (userID, ipAddress) => {
  try {
    const unlockToken = uuidv4();
    const emailToken = uuidv4();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    
    // Clean up any existing tokens for this user
    await pool.request()
      .input('userID', sql.BigInt, userID)
      .query(`
        UPDATE AccountUnlockTokens
        SET IsUsed = 1, UsedAt = GETDATE()
        WHERE UserID = @userID AND IsUsed = 0
      `);
    
    // Create new token
    await pool.request()
      .input('userID', sql.BigInt, userID)
      .input('unlockToken', sql.VarChar, unlockToken)
      .input('emailToken', sql.VarChar, emailToken)
      .input('ipAddress', sql.VarChar, ipAddress)
      .input('expiresAt', sql.DateTime, expiresAt)
      .query(`
        INSERT INTO AccountUnlockTokens (UserID, UnlockToken, EmailToken, IPAddress, ExpiresAt)
        VALUES (@userID, @unlockToken, @emailToken, @ipAddress, @expiresAt)
      `);
    
    return {
      success: true,
      unlockToken,
      emailToken,
      expiresAt
    };
  } catch (error) {
    console.error('Error generating unlock token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify unlock token
 */
const verifyUnlockToken = async (unlockToken) => {
  try {
    const result = await pool.request()
      .input('unlockToken', sql.VarChar, unlockToken)
      .input('now', sql.DateTime, new Date())
      .query(`
        SELECT TokenID, UserID, EmailToken, ExpiresAt, IsUsed
        FROM AccountUnlockTokens
        WHERE UnlockToken = @unlockToken
          AND ExpiresAt > @now
          AND IsUsed = 0
      `);
    
    if (result.recordset.length === 0) {
      return { valid: false, reason: 'Token không hợp lệ hoặc đã hết hạn' };
    }
    
    const token = result.recordset[0];
    return {
      valid: true,
      tokenID: token.TokenID,
      userID: token.UserID,
      emailToken: token.EmailToken
    };
  } catch (error) {
    console.error('Error verifying unlock token:', error);
    return { valid: false, reason: 'Lỗi xác thực token' };
  }
};

/**
 * Use unlock token (mark as used)
 */
const useUnlockToken = async (tokenID) => {
  try {
    await pool.request()
      .input('tokenID', sql.BigInt, tokenID)
      .query(`
        UPDATE AccountUnlockTokens
        SET IsUsed = 1, UsedAt = GETDATE()
        WHERE TokenID = @tokenID
      `);
    
    return { success: true };
  } catch (error) {
    console.error('Error using unlock token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up expired tokens
 */
const cleanupExpiredTokens = async () => {
  try {
    const result = await pool.request()
      .input('now', sql.DateTime, new Date())
      .query(`
        DELETE FROM AccountUnlockTokens
        WHERE ExpiresAt < @now OR IsUsed = 1
      `);
    
    console.log(`Cleaned up ${result.rowsAffected[0]} expired unlock tokens`);
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
};

/**
 * Reset failed attempts for successful login
 */
const resetFailedAttempts = async (email, ipAddress) => {
  try {
    // Record successful login attempt
    await recordLoginAttempt(ipAddress, email, null, true, null, null);
  } catch (error) {
    console.error('Error resetting failed attempts:', error);
  }
};

module.exports = {
  recordLoginAttempt,
  checkIPBlocking,
  checkAccountLocking,
  lockUserAccount,
  unlockUserAccount,
  isAccountLocked,
  generateUnlockToken,
  verifyUnlockToken,
  useUnlockToken,
  cleanupExpiredTokens,
  resetFailedAttempts,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
  TIME_WINDOW_MINUTES
}; 