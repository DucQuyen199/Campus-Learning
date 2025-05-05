const express = require('express');
const router = express.Router();

// TODO: Import controller khi đã tạo
// const notificationController = require('../controllers/notificationController');

router.get('/', (req, res) => {
    res.json({ message: 'Notification routes working' });
});

module.exports = router; 