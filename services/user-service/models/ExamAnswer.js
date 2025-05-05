const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExamAnswer = sequelize.define('ExamAnswer', {
  AnswerID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  ParticipantID: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  QuestionID: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  Answer: {
    type: DataTypes.TEXT
  },
  IsCorrect: {
    type: DataTypes.BOOLEAN
  },
  Score: {
    type: DataTypes.INTEGER
  },
  ReviewerComments: {
    type: DataTypes.TEXT
  },
  SubmittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ExamAnswers',
  timestamps: false
});

module.exports = ExamAnswer; 