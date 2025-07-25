/*-----------------------------------------------------------------
* File: teacher.routes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the teacher backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
