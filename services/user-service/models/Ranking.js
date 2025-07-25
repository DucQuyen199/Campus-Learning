/*-----------------------------------------------------------------
* File: Ranking.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Ranking = sequelize.define('UserRankings', {
  RankingID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  UserID: {
    type: DataTypes.BIGINT,
    references: {
      model: User,
      key: 'UserID'
    }
  },
  Tier: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['MASTER', 'DIAMOND', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE']]
    },
    defaultValue: 'BRONZE'
  },
  TotalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  EventPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  CoursePoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ProblemsSolved: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  Accuracy: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  Wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  MonthlyScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  WeeklyScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  LastCalculatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'UserRankings',
  timestamps: false
});

// Define association with User model
Ranking.belongsTo(User, { foreignKey: 'UserID' });
User.hasOne(Ranking, { foreignKey: 'UserID' });

module.exports = Ranking; 
