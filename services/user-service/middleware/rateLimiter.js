/*-----------------------------------------------------------------
* File: rateLimiter.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: Rate limiter middleware for registration attempts
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const db = require('../models');
const { Op } = require('sequelize');

const MAX_ATTEMPTS = 5; // Số lần thử tối đa
const BLOCK_DURATION = 30; // Thời gian block (phút)

const registrationLimiter = async (req, res, next) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;

    // Kiểm tra xem IP có bị block không
    const attempt = await db.RegistrationAttempts.findOne({
      where: { IPAddress: clientIP }
    });

    if (attempt) {
      // Nếu đã hết thời gian block
      if (attempt.BlockedUntil && new Date() > attempt.BlockedUntil) {
        await attempt.update({
          AttemptCount: 1,
          BlockedUntil: null
        });
        return next();
      }

      // Nếu đang bị block
      if (attempt.BlockedUntil) {
        const minutesLeft = Math.ceil((new Date(attempt.BlockedUntil) - new Date()) / (1000 * 60));
        return res.status(429).json({
          error: 'TOO_MANY_ATTEMPTS',
          message: `Quá nhiều lần thử đăng ký. Vui lòng thử lại sau ${minutesLeft} phút.`
        });
      }

      // Tăng số lần thử
      await attempt.update({
        AttemptCount: attempt.AttemptCount + 1,
        BlockedUntil: attempt.AttemptCount + 1 >= MAX_ATTEMPTS ? 
          new Date(Date.now() + BLOCK_DURATION * 60 * 1000) : null
      });

      // Nếu vượt quá số lần thử
      if (attempt.AttemptCount + 1 >= MAX_ATTEMPTS) {
        return res.status(429).json({
          error: 'TOO_MANY_ATTEMPTS',
          message: `Quá nhiều lần thử đăng ký. Vui lòng thử lại sau ${BLOCK_DURATION} phút.`
        });
      }
    } else {
      // Tạo record mới cho IP (DB sẽ tự thêm AttemptCount, LastAttemptAt, CreatedAt)
      await db.RegistrationAttempts.create({
        IPAddress: clientIP
      });
    }

    next();
  } catch (error) {
    console.error('Registration rate limiter error:', error);
    next(error);
  }
};

module.exports = registrationLimiter; 