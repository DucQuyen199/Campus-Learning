/*-----------------------------------------------------------------
* File: CourseLesson.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CourseLesson = sequelize.define('CourseLesson', {
  LessonID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  ModuleID: {
    type: DataTypes.BIGINT
  },
  Title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  Description: {
    type: DataTypes.TEXT
  },
  Type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['video', 'text', 'quiz', 'assignment', 'coding']]
    }
  },
  Content: {
    type: DataTypes.TEXT
  },
  VideoUrl: {
    type: DataTypes.STRING(255)
  },
  Duration: {
    type: DataTypes.INTEGER
  },
  OrderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  IsPreview: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  IsPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  CreatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'CourseLessons',
  timestamps: false
});

module.exports = CourseLesson; 
