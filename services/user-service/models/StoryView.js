const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoryView = sequelize.define('StoryView', {
    ViewID: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    StoryID: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'Stories',
            key: 'StoryID'
        }
    },
    ViewerID: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'UserID'
        }
    },
    ViewedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'StoryViews',
    timestamps: true,
    createdAt: 'ViewedAt',
    updatedAt: false
});

module.exports = StoryView; 