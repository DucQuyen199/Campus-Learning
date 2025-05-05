const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExamQuestion = sequelize.define('ExamQuestion', {
  QuestionID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  ExamID: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  Type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['multiple_choice', 'essay', 'coding']]
    }
  },
  Content: {
    type: DataTypes.TEXT
  },
  Points: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  OrderIndex: {
    type: DataTypes.INTEGER
  },
  Options: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('Options');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('Options', JSON.stringify(value));
    }
  },
  CorrectAnswer: {
    type: DataTypes.TEXT
  },
  Explanation: {
    type: DataTypes.TEXT
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
  tableName: 'ExamQuestions',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

module.exports = ExamQuestion; 