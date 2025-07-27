/*-----------------------------------------------------------------
* File: RegistrationAttempts.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: Sequelize model for registration attempts tracking
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RegistrationAttempts extends Model {
    static associate(models) {
      // define associations here if needed
    }
  }

  RegistrationAttempts.init({
    AttemptID: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    IPAddress: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    AttemptCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    LastAttemptAt: {
      type: DataTypes.DATE
    },
    BlockedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    CreatedAt: {
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'RegistrationAttempts',
    tableName: 'RegistrationAttempts',
    timestamps: false
  });

  return RegistrationAttempts;
}; 