/*-----------------------------------------------------------------
* File: settingsController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { poolPromise } = require('../config/database');

const settingsController = {
    // Initialize tables if not exist
    async initializeTables() {
        try {
            const pool = await poolPromise;
            
            // Create SystemSettings table if not exists
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SystemSettings' and xtype='U')
                CREATE TABLE SystemSettings (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    siteName NVARCHAR(255) DEFAULT 'Hệ thống quản lý',
                    siteDescription NVARCHAR(MAX) DEFAULT 'Mô tả hệ thống',
                    contactEmail NVARCHAR(255) DEFAULT 'admin@example.com',
                    maintenanceMode BIT DEFAULT 0,
                    language NVARCHAR(10) DEFAULT 'vi',
                    timezone NVARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
                    updatedAt DATETIME DEFAULT GETDATE()
                )

                IF NOT EXISTS (SELECT * FROM SystemSettings)
                INSERT INTO SystemSettings (siteName, siteDescription, contactEmail, maintenanceMode, language, timezone)
                VALUES ('Hệ thống quản lý', 'Mô tả hệ thống', 'admin@example.com', 0, 'vi', 'Asia/Ho_Chi_Minh')
            `);

            // Create NotificationSettings table if not exists
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NotificationSettings' and xtype='U')
                CREATE TABLE NotificationSettings (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    emailNotifications BIT DEFAULT 1,
                    newUserAlerts BIT DEFAULT 1,
                    systemAlerts BIT DEFAULT 1,
                    reportAlerts BIT DEFAULT 1,
                    eventReminders BIT DEFAULT 1,
                    examNotifications BIT DEFAULT 1,
                    updatedAt DATETIME DEFAULT GETDATE()
                )

                IF NOT EXISTS (SELECT * FROM NotificationSettings)
                INSERT INTO NotificationSettings (emailNotifications, newUserAlerts, systemAlerts, reportAlerts, eventReminders, examNotifications)
                VALUES (1, 1, 1, 1, 1, 1)
            `);

        } catch (error) {
            console.error('Error initializing tables:', error);
        }
    },

    // Get system settings
    getSettings: async (req, res) => {
        try {
            await settingsController.initializeTables(); // Ensure tables exist
            
            const pool = await poolPromise;
            const result = await pool.request()
                .query('SELECT * FROM SystemSettings');
            
            res.json({
                success: true,
                settings: result.recordset[0]
            });
        } catch (error) {
            console.error('Error getting settings:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting system settings',
                error: error.message
            });
        }
    },

    // Update system settings
    updateSettings: async (req, res) => {
        try {
            await settingsController.initializeTables(); // Ensure tables exist
            
            const {
                siteName,
                siteDescription,
                contactEmail,
                maintenanceMode,
                language,
                timezone
            } = req.body;

            const pool = await poolPromise;
            await pool.request()
                .input('siteName', 'NVARCHAR(255)', siteName || 'Hệ thống quản lý')
                .input('siteDescription', 'NVARCHAR(MAX)', siteDescription || 'Mô tả hệ thống')
                .input('contactEmail', 'NVARCHAR(255)', contactEmail || 'admin@example.com')
                .input('maintenanceMode', 'BIT', maintenanceMode || 0)
                .input('language', 'NVARCHAR(10)', language || 'vi')
                .input('timezone', 'NVARCHAR(50)', timezone || 'Asia/Ho_Chi_Minh')
                .query(`
                    UPDATE TOP(1) SystemSettings 
                    SET siteName = @siteName,
                        siteDescription = @siteDescription,
                        contactEmail = @contactEmail,
                        maintenanceMode = @maintenanceMode,
                        language = @language,
                        timezone = @timezone,
                        updatedAt = GETDATE()
                `);

            // Fetch updated settings
            const result = await pool.request()
                .query('SELECT * FROM SystemSettings');

            res.json({
                success: true,
                message: 'Settings updated successfully',
                settings: result.recordset[0]
            });
        } catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating system settings',
                error: error.message
            });
        }
    },

    // Get notification settings
    getNotificationSettings: async (req, res) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .query('SELECT * FROM NotificationSettings');

            res.json({
                success: true,
                notificationSettings: result.recordset[0] || {
                    emailNotifications: true,
                    newUserAlerts: true,
                    systemAlerts: true,
                    reportAlerts: true,
                    eventReminders: true,
                    examNotifications: true
                }
            });
        } catch (error) {
            console.error('Error getting notification settings:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting notification settings',
                error: error.message
            });
        }
    },

    // Update notification settings
    updateNotificationSettings: async (req, res) => {
        try {
            await settingsController.initializeTables(); // Ensure tables exist

            const {
                emailNotifications,
                newUserAlerts,
                systemAlerts,
                reportAlerts,
                eventReminders,
                examNotifications
            } = req.body;

            const pool = await poolPromise;
            await pool.request()
                .input('emailNotifications', 'BIT', emailNotifications || 1)
                .input('newUserAlerts', 'BIT', newUserAlerts || 1)
                .input('systemAlerts', 'BIT', systemAlerts || 1)
                .input('reportAlerts', 'BIT', reportAlerts || 1)
                .input('eventReminders', 'BIT', eventReminders || 1)
                .input('examNotifications', 'BIT', examNotifications || 1)
                .query(`
                    UPDATE TOP(1) NotificationSettings 
                    SET emailNotifications = @emailNotifications,
                        newUserAlerts = @newUserAlerts,
                        systemAlerts = @systemAlerts,
                        reportAlerts = @reportAlerts,
                        eventReminders = @eventReminders,
                        examNotifications = @examNotifications,
                        updatedAt = GETDATE()
                `);

            // Fetch updated settings
            const result = await pool.request()
                .query('SELECT * FROM NotificationSettings');

            res.json({
                success: true,
                message: 'Notification settings updated successfully',
                notificationSettings: result.recordset[0]
            });
        } catch (error) {
            console.error('Error updating notification settings:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating notification settings',
                error: error.message
            });
        }
    },

    // Get system info
    getSystemInfo: async (req, res) => {
        try {
            // Thực hiện các truy vấn để lấy thông tin hệ thống
            const pool = await poolPromise;
            
            // Lấy version từ package.json
            const packageJson = require('../package.json');
            const version = packageJson.version;

            // Lấy số lượng người dùng đang hoạt động
            const activeUsersResult = await pool.request()
                .query('SELECT COUNT(*) as count FROM Users');

            const activeUsers = activeUsersResult.recordset[0].count;

            const systemInfo = {
                version: version || '1.0.0',
                lastUpdated: new Date().toISOString(),
                serverStatus: 'Online',
                databaseStatus: 'Connected',
                storageUsage: '45%',
                activeUsers: activeUsers
            };

            res.json({
                success: true,
                systemInfo
            });
        } catch (error) {
            console.error('Error getting system info:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting system information',
                error: error.message
            });
        }
    }
};

module.exports = settingsController; 
