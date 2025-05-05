const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompetitionRegistration = sequelize.define('CompetitionRegistration', {
  RegistrationID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'UserID'
    }
  },
  CompetitionID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Competitions',
      key: 'CompetitionID'
    }
  },
  RegistrationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  Status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'REGISTERED'
  },
  Score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  ProblemsSolved: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  Ranking: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'CompetitionRegistrations',
  timestamps: false
});

module.exports = CompetitionRegistration; 