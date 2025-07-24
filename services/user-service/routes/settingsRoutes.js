/*-----------------------------------------------------------------
* File: settingsRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middlewares/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/images');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// File filter to only accept image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép tải lên file ảnh JPG, JPEG hoặc PNG'), false);
  }
};

// Initialize multer with configured storage
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

// Get user settings
router.get('/', authMiddleware, settingsController.getUserSettings);

// Update user settings
router.put('/', authMiddleware, settingsController.updateUserSettings);

// Upload profile picture
router.post('/profile-picture', authMiddleware, upload.single('image'), settingsController.updateProfilePicture);

// Change password
router.post('/change-password', authMiddleware, settingsController.changePassword);

// Delete account
router.post('/delete-account', authMiddleware, settingsController.deleteAccount);

// Export user data
router.post('/export-data', authMiddleware, settingsController.exportUserData);

module.exports = router; 
