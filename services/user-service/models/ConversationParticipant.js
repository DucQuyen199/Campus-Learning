/*-----------------------------------------------------------------
* File: ConversationParticipant.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConversationParticipant = sequelize.define('ConversationParticipant', {
  ParticipantID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  ConversationID: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'Conversations',
      key: 'ConversationID'
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
  JoinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('GETDATE()')
  },
  LeftAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  Role: {
    type: DataTypes.STRING(20),
    defaultValue: 'member',
    validate: {
      isIn: [['member', 'admin', 'moderator']]
    }
  },
  LastReadMessageID: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  IsAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  IsMuted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'ConversationParticipants',
  timestamps: false
});

module.exports = ConversationParticipant; 
