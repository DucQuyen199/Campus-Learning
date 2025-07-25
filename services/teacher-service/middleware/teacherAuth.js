/*-----------------------------------------------------------------
* File: teacherAuth.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the teacher backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { poolPromise } = require('../config/database');
const jwt = require('jsonwebtoken');

const teacherAuth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication token not found' });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        } catch (error) {
            console.error('JWT Verification Error:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired' });
            }
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        // Check if userId exists in the decoded token
        // Support both naming conventions: userId and UserID
        const userId = decoded.userId || decoded.UserID;
        
        if (!userId) {
            return res.status(401).json({ message: 'Token does not contain user information' });
        }

        try {
            // Check user and role in database
            const pool = await poolPromise;
            const result = await pool.request()
                .input('userId', userId)
                .query(`
                    SELECT u.UserID, u.Role, u.FullName, u.Email, u.Avatar 
                    FROM Users u
                    WHERE u.UserID = @userId 
                    AND (u.Role = 'TEACHER' OR u.Role = 'ADMIN')
                    AND u.AccountStatus = 'ACTIVE'
                `);

            if (result.recordset.length === 0) {
                return res.status(403).json({ 
                    message: 'Access denied. Account is not a teacher or administrator',
                    error: 'forbidden',
                    userId: userId
                });
            }

            // Add user info to request for use in handlers
            // Ensure both formats are available for backward compatibility
            req.user = {
                ...result.recordset[0],
                userId: userId,
                UserID: userId
            };
            
            console.log(`User authenticated: ${req.user.FullName} (${req.user.Role})`);
            next();
        } catch (dbError) {
            console.error('Database Error in Auth Middleware:', dbError);
            return res.status(500).json({ 
                message: 'Error checking user permissions',
                error: dbError.message 
            });
        }
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(401).json({ 
            message: 'User authentication error',
            error: error.message
        });
    }
};

module.exports = teacherAuth; 
