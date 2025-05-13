const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth');

/**
 * @route   GET /api/profile/:userId
 * @desc    Get student profile
 * @access  Private
 */
router.get('/:userId', profileController.getProfile);

/**
 * @route   GET /api/profile/:userId/academic
 * @desc    Get student academic information
 * @access  Private
 */
router.get('/:userId/academic', profileController.getAcademicInfo);

/**
 * @route   GET /api/profile/:userId/metrics
 * @desc    Get student metrics
 * @access  Private
 */
router.get('/:userId/metrics', profileController.getMetrics);

/**
 * @route   PUT /api/profile/:userId
 * @desc    Update student profile
 * @access  Private
 */
router.put('/:userId', authMiddleware.optional, profileController.updateProfile);

/**
 * @route   GET /api/profile/:userId/updates
 * @desc    Get profile update history
 * @access  Private
 */
router.get('/:userId/updates', profileController.getProfileUpdates);

module.exports = router; 