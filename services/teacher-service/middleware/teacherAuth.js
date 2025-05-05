const { poolPromise } = require('../config/database');
const jwt = require('jsonwebtoken');

const teacherAuth = async (req, res, next) => {
    try {
        // Lấy token từ header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            console.error('JWT Verification Error:', error);
            return res.status(401).json({ message: 'Token không hợp lệ hoặc hết hạn' });
        }
        
        // Check if userId exists in the decoded token
        if (!decoded.userId) {
            return res.status(401).json({ message: 'Token không chứa thông tin người dùng' });
        }

        try {
            // Kiểm tra user và role trong database
            const pool = await poolPromise;
            const result = await pool.request()
                .input('userId', decoded.userId)
                .query(`
                    SELECT u.UserID, u.Role, u.FullName, u.Email 
                    FROM Users u
                    WHERE u.UserID = @userId 
                    AND (u.Role = 'TEACHER' OR u.Role = 'ADMIN')
                    AND (u.Status = 'ONLINE' OR u.Status = 'AWAY')
                    AND u.DeletedAt IS NULL
                    AND u.AccountStatus = 'ACTIVE'
                `);

            if (result.recordset.length === 0) {
                return res.status(403).json({ message: 'Không có quyền truy cập' });
            }

            req.user = {
                ...result.recordset[0],
                UserID: decoded.userId
            };
            next();
        } catch (dbError) {
            console.error('Database Error in Auth Middleware:', dbError);
            return res.status(500).json({ message: 'Lỗi khi kiểm tra quyền người dùng' });
        }
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

module.exports = teacherAuth; 