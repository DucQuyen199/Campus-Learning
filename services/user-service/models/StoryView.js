/*-----------------------------------------------------------------
* File: StoryView.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
        defaultValue: sequelize.fn('GETDATE'),
        get() {
            return this.getDataValue('ViewedAt');
        },
        set(value) {
            // If it's already a Date object, use it directly
            // Otherwise, if it's a string with timezone info, convert it properly
            if (value && typeof value === 'string') {
                const dateObj = new Date(value);
                this.setDataValue('ViewedAt', dateObj);
            } else {
                this.setDataValue('ViewedAt', value);
            }
        }
    }
}, {
    tableName: 'StoryViews',
    timestamps: true,
    createdAt: 'ViewedAt',
    updatedAt: false
});

module.exports = StoryView; 
