/*-----------------------------------------------------------------
* File: EmailVerification.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailVerification = sequelize.define('EmailVerification', {
  VerificationID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  UserID: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'UserID'
    }
  },
  Email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  OTP: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  ExpiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  IsUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  Type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'email_verification'
  },
  CreatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'EmailVerifications',
  timestamps: false
});

module.exports = EmailVerification; 
