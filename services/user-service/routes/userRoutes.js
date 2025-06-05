const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const emailController = require('../controllers/emailController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const User = require('../models/user');

// Route để lấy thông tin người dùng hiện tại
router.get('/me', authMiddleware, authController.getMe);

// Route để cập nhật thông tin người dùng
router.put('/update', authMiddleware, userController.updateUser);

// Routes cho hồ sơ người dùng
router.get('/profile', authMiddleware, userController.getUserProfile);
router.get('/profile/:userId', authMiddleware, userController.getUserProfile);
router.put('/profile', authMiddleware, userController.updateUserProfile);

// Route tìm kiếm người dùng
router.get('/search', authMiddleware, userController.searchUsers);

// Gợi ý bạn bè
router.get('/suggest-friends', authMiddleware, userController.suggestFriends);

// Đường dẫn mới cho danh sách người dùng (đảm bảo route này có '/' ở đầu)
router.get('/', authMiddleware, userController.getUsers);

// Email settings routes (moved before dynamic userId route)
router.get('/emails', authMiddleware, emailController.getUserEmails);
router.post('/emails', authMiddleware, emailController.addUserEmail);
router.put('/emails/:emailId/primary', authMiddleware, emailController.setPrimaryEmail);
router.delete('/emails/:emailId', authMiddleware, emailController.deleteUserEmail);
router.post('/emails/:emailId/resend-verification', authMiddleware, emailController.resendVerificationEmail);

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