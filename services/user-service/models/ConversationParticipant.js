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
    allowNull: false
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
    allowNull: true,
    references: {
      model: 'Messages',
      key: 'MessageID'
    }
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