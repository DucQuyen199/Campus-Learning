const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../models/user');

// Route để lấy thông tin người dùng hiện tại
router.get('/me', authMiddleware, authController.getMe);

// Route để cập nhật thông tin người dùng
router.put('/update', authMiddleware, userController.updateUser);

// Route tìm kiếm người dùng
router.get('/search', authMiddleware, userController.searchUsers);

// Đường dẫn mới cho danh sách người dùng (đảm bảo route này có '/' ở đầu)
router.get('/', authMiddleware, userController.getUsers);

// Route để lấy thông tin người dùng theo ID - phải đặt ở cuối cùng
router.get('/:userId', authMiddleware, userController.getUserById);

// Ensure you have a route handler for GET /api/users
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const users = await User.find({}).limit(limit);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 