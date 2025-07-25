/*-----------------------------------------------------------------
* File: Achievement.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Achievement = sequelize.define('Achievement', {
  AchievementID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Description: {
    type: DataTypes.STRING(500)
  },
  Type: {
    type: DataTypes.STRING(50)
  },
  Icon: {
    type: DataTypes.STRING(255)
  },
  Points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  Criteria: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('Criteria');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('Criteria', JSON.stringify(value));
    }
  },
  CreatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Achievements',
  timestamps: false
});

module.exports = Achievement; 
