const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Competition = sequelize.define('Competition', {
  CompetitionID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  Title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  StartTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  EndTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  Duration: {
    type: DataTypes.INTEGER, // Duration in minutes
    allowNull: false
  },
  Difficulty: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['Dễ', 'Trung bình', 'Khó']]
    },
    defaultValue: 'Trung bình'
  },
  Status: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['draft', 'upcoming', 'ongoing', 'completed', 'cancelled']]
    },
    defaultValue: 'draft'
  },
  MaxParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  CurrentParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  PrizePool: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  OrganizedBy: {
    type: DataTypes.BIGINT,
    references: {
      model: User,
      key: 'UserID'
    }
  },
  ThumbnailUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  CoverImageURL: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  CreatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  DeletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Competitions',
  timestamps: true,
  paranoid: true, // Enable soft deletes
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  deletedAt: 'DeletedAt'
});

module.exports = Competition; 