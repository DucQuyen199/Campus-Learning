/*-----------------------------------------------------------------
* File: MessageStatus.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageStatus = sequelize.define('MessageStatus', {
  StatusID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  MessageID: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'Messages',
      key: 'MessageID'
    }
  },
  UserID: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'UserID'
    }
  },
  Status: {
    type: DataTypes.STRING(20),
    defaultValue: 'sent',
    validate: {
      isIn: [['sent', 'delivered', 'read']]
    }
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('GETDATE()')
  }
}, {
  tableName: 'MessageStatus',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['MessageID', 'UserID']
    }
  ]
});

module.exports = MessageStatus; 
