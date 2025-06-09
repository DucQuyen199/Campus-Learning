const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

// Profile routes
router.get('/profile', teacherController.getTeacherProfile);
router.put('/profile', teacherController.updateTeacherProfile);

// Basic route
router.get('/', (req, res) => {
    res.json({ message: 'Teacher routes working' });
});

// Đảm bảo export router
module.exports = router; 