const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LessonProgress = sequelize.define('LessonProgress', {
  ProgressID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  EnrollmentID: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  LessonID: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  Status: {
    type: DataTypes.STRING(20),
    defaultValue: 'not_started',
    validate: {
      isIn: [['not_started', 'in_progress', 'completed']]
    }
  },
  CompletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  TimeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  LastPosition: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'LessonProgress',
  timestamps: false
});

module.exports = LessonProgress; 