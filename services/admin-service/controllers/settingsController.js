/*-----------------------------------------------------------------
* File: settingsController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { poolPromise } = require('../config/database');
const { validationResult } = require('express-validator'); // Install express-validator if not present

let tablesInitialized = false;

async function initializeTables() {
    if (tablesInitialized) return;
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

        tablesInitialized = true;
    } catch (error) {
        console.error('Error initializing tables:', error);
        throw error; // Re-throw so startup can fail
    }
}

// Input validation helper
function validateSettingsInput(body) {
    const errors = [];
    const { siteName, siteDescription, contactEmail, maintenanceMode, language, timezone } = body;

    if (siteName !== undefined && (typeof siteName !== 'string' || siteName.length > 255)) {
        errors.push('siteName must be a string with max 255 characters');
    }
    if (siteDescription !== undefined && typeof siteDescription !== 'string') {
        errors.push('siteDescription must be a string');
    }
    if (contactEmail !== undefined) {
        if (typeof contactEmail !== 'string' || contactEmail.length > 255) {
            errors.push('contactEmail must be a string with max 255 characters');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contactEmail)) {
                errors.push('contactEmail is not a valid email');
            }
        }
    }
    if (maintenanceMode !== undefined && ![0, 1, '0', '1', true, false].includes(maintenanceMode)) {
        errors.push('maintenanceMode must be a boolean or 0/1');
    }
    if (language !== undefined && (typeof language !== 'string' || language.length > 10)) {
        errors.push('language must be a string with max 10 characters');
    }
    if (timezone !== undefined && (typeof timezone !== 'string' || timezone.length > 50)) {
        errors.push('timezone must be a string with max 50 characters');
    }

    return errors;
}

function validateNotificationInput(body) {
    const errors = [];
    const { emailNotifications, newUserAlerts, systemAlerts, reportAlerts, eventReminders, examNotifications } = body;

    const booleanFields = [
        { name: 'emailNotifications', value: emailNotifications },
        { name: 'newUserAlerts', value: newUserAlerts },
        { name: 'systemAlerts', value: systemAlerts },
        { name: 'reportAlerts', value: reportAlerts },
        { name: 'eventReminders', value: eventReminders },
        { name: 'examNotifications', value: examNotifications }
    ];

    for (const field of booleanFields) {
        if (field.value !== undefined && ![0, 1, '0', '1', true, false].includes(field.value)) {
            errors.push(`${field.name} must be a boolean or 0/1`);
        }
    }

    return errors;
}

const settingsController = {
    // Call this at server startup to ensure tables exist
    initializeTables,

    // Get system settings
    getSettings: async (req, res) => {
        try {
            // Authentication check placeholder - implement actual auth middleware
            // if (!req.user || !req.user.isAdmin) {
            //     return res.status(403).json({ success: false, message: 'Forbidden' });
            // }

            await initializeTables(); // Idempotent now

            const pool = await poolPromise;
            const result = await pool.request()
                .query('SELECT * FROM SystemSettings');
            
            // Set query timeout (example 30 seconds)
            // pool.request().setTimeout(30000);

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
            // Authentication check placeholder
            // if (!req.user || !req.user.isAdmin) {
            //     return res.status(403).json({ success: false, message: 'Forbidden' });
            // }

            const validationErrors = validateSettingsInput(req.body);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }

            await initializeTables();

            const {
                siteName,
                siteDescription,
                contactEmail,
                maintenanceMode,
                language,
                timezone
            } = req.body;

            const pool = await poolPromise;
            // Set timeout for this request
            pool.request().setTimeout(30000);

            await pool.request()
                .input('siteName', require('mssql').NVarChar(255), siteName || 'Hệ thống quản lý')
                .input('siteDescription', require('mssql').NVarChar('MAX'), siteDescription || 'Mô tả hệ thống')
                .input('contactEmail', require('mssql').NVarChar(255), contactEmail || 'admin@example.com')
                .input('maintenanceMode', require('mssql').Bit, maintenanceMode != null ? (maintenanceMode === true || maintenanceMode === 1 ? 1 : 0) : 0)
                .input('language', require('mssql').NVarChar(10), language || 'vi')
                .input('timezone', require('mssql').NVarChar(50), timezone || 'Asia/Ho_Chi_Minh')
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
            // Authentication check placeholder
            // if (!req.user || !req.user.isAdmin) {
            //     return res.status(403).json({ success: false, message: 'Forbidden' });
            // }

            const pool = await poolPromise;
            pool.request().setTimeout(30000);
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
            // Authentication check placeholder
            // if (!req.user || !req.user.isAdmin) {
            //     return res.status(403).json({ success: false, message: 'Forbidden' });
            // }

            const validationErrors = validateNotificationInput(req.body);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }

            await initializeTables();

            const {
                emailNotifications,
                newUserAlerts,
                systemAlerts,
                reportAlerts,
                eventReminders,
                examNotifications
            } = req.body;

            const pool = await poolPromise;
            pool.request().setTimeout(30000);

            await pool.request()
                .input('emailNotifications', require('mssql').Bit, emailNotifications != null ? (emailNotifications === true || emailNotifications === 1 ? 1 : 0) : 1)
                .input('newUserAlerts', require('mssql').Bit, newUserAlerts != null ? (newUserAlerts === true || newUserAlerts === 1 ? 1 : 0) : 1)
                .input('systemAlerts', require('mssql').Bit, systemAlerts != null ? (systemAlerts === true || systemAlerts === 1 ? 1 : 0) : 1)
                .input('reportAlerts', require('mssql').Bit, reportAlerts != null ? (reportAlerts === true || reportAlerts === 1 ? 1 : 0) : 1)
                .input('eventReminders', require('mssql').Bit, eventReminders != null ? (eventReminders === true || eventReminders === 1 ? 1 : 0) : 1)
                .input('examNotifications', require('mssql').Bit, examNotifications != null ? (examNotifications === true || examNotifications === 1 ? 1 : 0) : 1)
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
            // Authentication check placeholder
            // if (!req.user || !req.user.isAdmin) {
            //     return res.status(403).json({ success: false, message: 'Forbidden' });
            // }

            const pool = await poolPromise;
            pool.request().setTimeout(30000);
            
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