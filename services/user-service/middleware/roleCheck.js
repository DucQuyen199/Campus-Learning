/*-----------------------------------------------------------------
* File: roleCheck.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
/**
 * Middleware kiểm tra vai trò của người dùng
 */

// Kiểm tra người dùng có phải là admin không
const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Kiểm tra vai trò của người dùng (từ token đã được xác thực)
    if (req.user.Role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    // Nếu là admin, cho phép đi tiếp
    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra quyền'
    });
  }
};

// Kiểm tra người dùng có phải là giáo viên hoặc admin không
const isTeacherOrAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Kiểm tra vai trò của người dùng
    if (req.user.Role !== 'TEACHER' && req.user.Role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này. Yêu cầu quyền giáo viên hoặc admin.'
      });
    }

    // Nếu là giáo viên hoặc admin, cho phép đi tiếp
    next();
  } catch (error) {
    console.error('Error checking teacher/admin role:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra quyền'
    });
  }
};

module.exports = {
  isAdmin,
  isTeacherOrAdmin
}; 
