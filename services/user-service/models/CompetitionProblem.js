const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Competition = require('./Competition');

const CompetitionProblem = sequelize.define('CompetitionProblem', {
  ProblemID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  CompetitionID: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: Competition,
      key: 'CompetitionID'
    }
  },
  Title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  Difficulty: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Trung bình'
  },
  Points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100
  },
  TimeLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  MemoryLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 256
  },
  InputFormat: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  OutputFormat: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  Constraints: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  SampleInput: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  SampleOutput: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  Explanation: {
    type: DataTypes.TEXT,
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
  ImageURL: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  StarterCode: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  TestCasesVisible: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  TestCasesHidden: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  Tags: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  Instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'CompetitionProblems',
  timestamps: false
});

// Define associations
CompetitionProblem.belongsTo(Competition, { foreignKey: 'CompetitionID' });
Competition.hasMany(CompetitionProblem, { foreignKey: 'CompetitionID' });

module.exports = CompetitionProblem; 