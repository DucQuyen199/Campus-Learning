/*-----------------------------------------------------------------
* File: Friendship.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
module.exports = (sequelize, DataTypes) => {
  const Friendship = sequelize.define('Friendship', {
    FriendshipID: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    UserID: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    FriendID: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    Status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending'
    },
    RequestedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    UpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    Notes: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'Friendships',
    timestamps: false
  });

  Friendship.associate = function(models) {
    Friendship.belongsTo(models.User, {
      foreignKey: 'UserID',
      as: 'User'
    });

    Friendship.belongsTo(models.User, {
      foreignKey: 'FriendID',
      as: 'Friend'
    });
  };

  return Friendship;
};

