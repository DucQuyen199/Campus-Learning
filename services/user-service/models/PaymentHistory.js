const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentHistory = sequelize.define('PaymentHistory', {
  HistoryID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  TransactionID: {
    type: DataTypes.BIGINT
  },
  Status: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Message: {
    type: DataTypes.STRING(500)
  },
  ResponseData: {
    type: DataTypes.TEXT
  },
  IPAddress: {
    type: DataTypes.STRING(50)
  },
  UserAgent: {
    type: DataTypes.STRING(500)
  },
  CreatedAt: {
    type: DataTypes.STRING(30),
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  UpdatedAt: {
    type: DataTypes.STRING(30),
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  Notes: {
    type: DataTypes.STRING(1000),
    allowNull: true
  }
}, {
  tableName: 'PaymentHistory',
  timestamps: false
});

module.exports = PaymentHistory; 