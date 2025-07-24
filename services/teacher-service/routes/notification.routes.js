/*-----------------------------------------------------------------
* File: notification.routes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the teacher backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();

// TODO: Import controller khi đã tạo
// const notificationController = require('../controllers/notificationController');

router.get('/', (req, res) => {
    res.json({ message: 'Notification routes working' });
});

module.exports = router; 
