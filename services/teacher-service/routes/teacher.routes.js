const express = require('express');
const router = express.Router();
// ... định nghĩa các routes

// TODO: Import controller khi đã tạo
// const teacherController = require('../controllers/teacherController');

router.get('/', (req, res) => {
    res.json({ message: 'Teacher routes working' });
});

// Đảm bảo export router
module.exports = router; 