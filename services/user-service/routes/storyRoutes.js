const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

// Get all stories
router.get('/', storyController.getAllStories);

// Get stories by user
router.get('/user/:userId', storyController.getUserStories);

// Create new story
router.post('/', (req, res, next) => {
    if (req.body.mediaType === 'text') {
        next();
    } else {
        upload.single('media')(req, res, next);
    }
}, storyController.createStory);

// Mark story as viewed
router.post('/:storyId/view', storyController.viewStory);

// Get viewers of a story
router.get('/:storyId/viewers', storyController.getStoryViewers);

// Delete story (soft delete)
router.delete('/:storyId', storyController.deleteStory);

// Like a story
router.post('/:storyId/like', storyController.likeStory);

// Reply to a story
router.post('/:storyId/reply', storyController.replyStory);

module.exports = router; 