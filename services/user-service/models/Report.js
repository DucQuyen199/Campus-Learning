/*-----------------------------------------------------------------
* File: Report.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  ReportID: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  Title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  Content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  Category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['USER', 'CONTENT', 'COURSE', 'EVENT', 'COMMENT']]
    }
  },
  ReporterID: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  TargetID: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  TargetType: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'PENDING',
    validate: {
      isIn: [['PENDING', 'RESOLVED', 'REJECTED']]
    }
  },
  Notes: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  ActionTaken: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ResolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  DeletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Reports',
  timestamps: false
});

module.exports = Report; 
