const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  MessageID: {
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
  SenderID: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'UserID'
    }
  },
  Type: {
    type: DataTypes.STRING(20),
    defaultValue: 'text',
    validate: {
      isIn: [['text', 'image', 'video', 'file', 'audio', 'location']]
    }
  },
  Content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  MediaUrl: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  MediaType: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  ReplyToMessageID: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'Messages',
      key: 'MessageID'
    }
  },
  IsEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  IsDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  DeletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Messages',
  timestamps: false,
  returning: false
});

module.exports = Message; 