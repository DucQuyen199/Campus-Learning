const { poolPromise, sql } = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const authController = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    message: 'Email và mật khẩu là bắt buộc'
                });
            }

            const pool = await poolPromise;
            if (!pool) {
                throw new Error('Database connection not established');
            }

            // Use parameterized query to prevent SQL injection
            const result = await pool.request()
                .input('email', sql.VarChar(100), email)
                .query(`
                    SELECT u.UserID, u.Username, u.Email, u.Password, u.Role,
                           u.FullName, u.Avatar, u.Status
                    FROM Users u
                    WHERE u.Email = @email 
                    AND (u.Role = 'TEACHER' OR u.Role = 'ADMIN')
                    AND u.AccountStatus = 'ACTIVE'
                `);

            if (result.recordset.length === 0) {
                return res.status(401).json({
                    message: 'Email hoặc mật khẩu không chính xác'
                });
            }

            const user = result.recordset[0];

            // Verify password
            const validPassword = await bcrypt.compare(password, user.Password);
            if (!validPassword) {
                return res.status(401).json({
                    message: 'Email hoặc mật khẩu không chính xác'
                });
            }

            // Create token with role
            const token = jwt.sign(
                { 
                    userId: user.UserID,
                    role: user.Role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Remove password from user object
            delete user.Password;

            res.status(200).json({
                message: 'Login successful',
                token,
                user
            });
        } catch (error) {
            console.error('Login Error:', error.message, error.stack);
            
            // Send a more helpful error message for debugging
            const errorMessage = process.env.NODE_ENV === 'development' 
                ? `Login failed: ${error.message}` 
                : 'Đã có lỗi xảy ra, vui lòng thử lại';
                
            res.status(500).json({
                message: errorMessage
            });
        }
    },

    getCurrentUser: async (req, res) => {
        try {
            const userId = req.user.UserID;

            const pool = await poolPromise;
            if (!pool) {
                throw new Error('Database connection not established');
            }

            const result = await pool.request()
                .input('userId', sql.BigInt, userId)
                .query(`
                    SELECT u.UserID, u.Username, u.Email, u.Role,
                           u.FullName, u.Avatar, u.Status
                    FROM Users u
                    WHERE u.UserID = @userId
                    AND u.AccountStatus = 'ACTIVE'
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const user = result.recordset[0];
            res.status(200).json({ user });
        } catch (error) {
            console.error('Get Current User Error:', error.message, error.stack);
            res.status(500).json({
                message: 'Failed to retrieve user information'
            });
        }
    }
};

module.exports = authController; 