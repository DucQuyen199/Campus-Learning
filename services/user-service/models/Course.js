/*-----------------------------------------------------------------
* File: Course.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
  CourseID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  Title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  Slug: {
    type: DataTypes.STRING(255),
    unique: true
  },
  Description: {
    type: DataTypes.TEXT
  },
  ShortDescription: {
    type: DataTypes.STRING(500)
  },
  InstructorID: {
    type: DataTypes.BIGINT
  },
  Level: {
    type: DataTypes.STRING(20),
    validate: {
      isIn: [['beginner', 'intermediate', 'advanced', 'expert']]
    }
  },
  Category: {
    type: DataTypes.STRING(50)
  },
  SubCategory: {
    type: DataTypes.STRING(50)
  },
  Language: {
    type: DataTypes.STRING(20),
    defaultValue: 'vi'
  },
  Duration: {
    type: DataTypes.INTEGER
  },
  Capacity: {
    type: DataTypes.INTEGER
  },
  EnrolledCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  Rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0
  },
  RatingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  Price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  DiscountPrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  ImageUrl: {
    type: DataTypes.STRING(255)
  },
  VideoUrl: {
    type: DataTypes.STRING(255)
  },
  Requirements: {
    type: DataTypes.TEXT
  },
  Objectives: {
    type: DataTypes.TEXT
  },
  Syllabus: {
    type: DataTypes.TEXT
  },
  Status: {
    type: DataTypes.STRING(20),
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'review', 'published', 'archived']]
    }
  },
  IsPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  PublishedAt: {
    type: DataTypes.DATE
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
    type: DataTypes.DATE
  }
}, {
  tableName: 'Courses',
  timestamps: false
});

module.exports = Course; 
