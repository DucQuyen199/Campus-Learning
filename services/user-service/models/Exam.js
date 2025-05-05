const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Exam = sequelize.define('Exam', {
  ExamID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  AlternateId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
    _isVirtual: true
  },
  CourseID: {
    type: DataTypes.BIGINT,
    allowNull: false
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
      isIn: [['multiple_choice', 'essay', 'coding', 'mixed']]
    }
  },
  Duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  TotalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  PassingScore: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  StartTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  EndTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  Instructions: {
    type: DataTypes.TEXT
  },
  AllowReview: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ShuffleQuestions: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  AllowRetakes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  MaxRetakes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  Status: {
    type: DataTypes.STRING(20),
    defaultValue: 'upcoming',
    validate: {
      isIn: [['upcoming', 'ongoing', 'completed', 'cancelled']]
    }
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
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Exams',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

module.exports = Exam; 