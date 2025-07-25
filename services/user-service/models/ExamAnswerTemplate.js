/*-----------------------------------------------------------------
* File: ExamAnswerTemplate.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExamAnswerTemplate = sequelize.define('ExamAnswerTemplate', {
  TemplateID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  ExamID: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  QuestionID: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  Content: {
    type: DataTypes.TEXT
  },
  Keywords: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('Keywords');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('Keywords', JSON.stringify(value));
    }
  },
  MinimumMatchPercentage: {
    type: DataTypes.DECIMAL(5, 2)
  },
  CreatedBy: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  CreatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  UpdatedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'ExamAnswerTemplates',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

module.exports = ExamAnswerTemplate; 
