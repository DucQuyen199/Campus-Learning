const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/profile/:userId
 * @desc    Get student profile
 * @access  Private
 */
router.get('/:userId', authenticate, ProfileController.getProfile);

/**
 * @route   GET /api/profile/:userId/academic
 * @desc    Get student academic information
 * @access  Private
 */
router.get('/:userId/academic', authenticate, ProfileController.getAcademicInfo);

/**
 * @route   GET /api/profile/:userId/metrics
 * @desc    Get student metrics
 * @access  Private
 */
router.get('/:userId/metrics', authenticate, ProfileController.getMetrics);

/**
 * @route   PUT /api/profile/:userId
 * @desc    Update student profile
 * @access  Private
 */
router.put('/:userId', authenticate, ProfileController.updateProfile);

/**
 * @route   GET /api/profile/:userId/updates
 * @desc    Get profile update history
 * @access  Private
 */
router.get('/:userId/updates', authenticate, ProfileController.getProfileUpdates);

module.exports = router; 