/*-----------------------------------------------------------------
* File: User.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  UserID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  Username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  Email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  Password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  FullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  DateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  School: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  Role: {
    type: DataTypes.STRING(20),
    defaultValue: 'STUDENT',
    validate: {
      isIn: [['STUDENT', 'TEACHER', 'ADMIN']]
    }
  },
  Status: {
    type: DataTypes.STRING(20),
    defaultValue: 'ONLINE'
  },
  AccountStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'ACTIVE'
  },
  Image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  Bio: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  Provider: {
    type: DataTypes.STRING(20),
    defaultValue: 'local'
  },
  ProviderID: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  EmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  PhoneNumber: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  Address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  City: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  Country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  LastLoginIP: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  PasskeyCredentials: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'PasskeyCredentials'
  },
  HasPasskey: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'HasPasskey'
  },
  CreatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  LastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  DeletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Users',
  timestamps: false
});

module.exports = User; 
