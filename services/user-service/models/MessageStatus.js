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
    allowNull: false
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