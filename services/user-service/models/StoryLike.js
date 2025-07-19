const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoryLike = sequelize.define('StoryLike', {
  LikeID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  StoryID: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'Stories',
      key: 'StoryID'
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
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.fn('GETDATE')
  }
}, {
  tableName: 'StoryLikes',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: false,
  indexes: [
    {
      name: 'UQ_StoryLikes_StoryID_UserID',
      unique: true,
      fields: ['StoryID', 'UserID']
    }
  ]
});

module.exports = StoryLike; 