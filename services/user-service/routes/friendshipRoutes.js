const express = require('express');
const router = express.Router();
const friendshipController = require('../controllers/friendshipController');
const authMiddleware = require('../middleware/authMiddleware');

// Test route that doesn't depend on the Friendship model
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Friendship routes are working',
    timestamp: new Date().toISOString()
  });
});

// Get all friendships for the current user
router.get('/', authMiddleware, friendshipController.getAllFriendships);

// Get friend suggestions for the current user
router.get('/suggestions', authMiddleware, friendshipController.getFriendSuggestions);

// Get random friend suggestions
router.get('/suggestions/random', authMiddleware, friendshipController.getRandomSuggestions);

// Get friendships for a specific user
router.get('/user/:userId', authMiddleware, friendshipController.getUserFriendships);

// Get friendship status with a specific user
router.get('/status/:userId', authMiddleware, friendshipController.getFriendshipStatus);

// Send a friend request
router.post('/', authMiddleware, friendshipController.sendFriendRequest);

// Accept a friend request
router.put('/:userId/accept', authMiddleware, friendshipController.acceptFriendRequest);

// Reject a friend request
router.put('/:userId/reject', authMiddleware, friendshipController.rejectFriendRequest);

// Remove a friend or cancel a friend request
router.delete('/:userId', authMiddleware, friendshipController.removeFriend);

module.exports = router; 