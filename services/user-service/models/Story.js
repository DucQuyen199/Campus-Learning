/*-----------------------------------------------------------------
* File: Story.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Story = sequelize.define('Story', {
    StoryID: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    UserID: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'UserID'
        }
    },
    MediaUrl: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    MediaType: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            isIn: [['image', 'video', 'text']]
        }
    },
    Duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 15
    },
    ViewCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    BackgroundColor: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    TextContent: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    CreatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal('GETDATE()')
    },
    ExpiresAt: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('ExpiresAt');
            return rawValue ? new Date(rawValue) : null;
        },
        set(value) {
            if (value instanceof Date) {
                // Convert to SQL Server date format (YYYY-MM-DD)
                const dateStr = value.toISOString().split('T')[0];
                this.setDataValue('ExpiresAt', dateStr);
            } else if (typeof value === 'string') {
                // If it's already a string in the correct format, use it directly
                this.setDataValue('ExpiresAt', value);
            } else {
                this.setDataValue('ExpiresAt', null);
            }
        }
    },
    IsDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    }
}, {
    tableName: 'Stories',
    timestamps: false,
    indexes: [
        {
            name: 'IX_Stories_UserID',
            fields: ['UserID']
        }
    ]
});

module.exports = Story; 
