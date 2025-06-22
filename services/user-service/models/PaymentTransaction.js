const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentTransaction = sequelize.define('PaymentTransaction', {
  TransactionID: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  UserID: {
    type: DataTypes.BIGINT
  },
  CourseID: {
    type: DataTypes.BIGINT
  },
  Amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  Currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'VND'
  },
  PaymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['vnpay', 'credit_card', 'bank_transfer', 'momo', 'free', 'paypal']]
    }
  },
  TransactionCode: {
    type: DataTypes.STRING(100),
    unique: true
  },
  PaymentStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'completed', 'failed', 'refunded', 'cancelled']]
    }
  },
  PaymentDate: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  CreatedAt: {
    type: DataTypes.STRING(30),
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  UpdatedAt: {
    type: DataTypes.STRING(30),
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  PaymentDetails: {
    type: DataTypes.TEXT
  },
  ReturnURL: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  CancelURL: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  Notes: {
    type: DataTypes.STRING(1000),
    allowNull: true
  }
}, {
  tableName: 'PaymentTransactions',
  timestamps: false
});

module.exports = PaymentTransaction; 