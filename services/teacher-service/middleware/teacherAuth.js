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
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token đã hết hạn' });
            }
            return res.status(401).json({ message: 'Token không hợp lệ' });
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
                    SELECT u.UserID, u.Role, u.FullName, u.Email, u.Avatar 
                    FROM Users u
                    WHERE u.UserID = @userId 
                    AND (u.Role = 'TEACHER' OR u.Role = 'ADMIN')
                    AND u.AccountStatus = 'ACTIVE'
                `);

            if (result.recordset.length === 0) {
                return res.status(403).json({ 
                    message: 'Không có quyền truy cập. Tài khoản không phải giáo viên hoặc quản trị viên',
                    error: 'forbidden',
                    userId: decoded.userId
                });
            }

            // Thêm thông tin user vào request để sử dụng trong các handlers
            req.user = {
                ...result.recordset[0],
                UserID: decoded.userId
            };
            
            console.log(`User authenticated: ${req.user.FullName} (${req.user.Role})`);
            next();
        } catch (dbError) {
            console.error('Database Error in Auth Middleware:', dbError);
            return res.status(500).json({ 
                message: 'Lỗi khi kiểm tra quyền người dùng',
                error: dbError.message 
            });
        }
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(401).json({ 
            message: 'Lỗi xác thực người dùng',
            error: error.message
        });
    }
};

module.exports = teacherAuth; 