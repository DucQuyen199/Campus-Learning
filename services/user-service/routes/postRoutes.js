/*-----------------------------------------------------------------
* File: postRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');

// Public routes - không cần auth
router.get('/', postController.getPosts);
// Route to get posts by user ID - must come before /:id route
router.get('/user/:userId', authenticateToken, postController.getPostsByUserId);

// Get all bookmarked posts (should be before '/:id' to avoid route conflict)
router.get('/bookmarks', authenticateToken, postController.getBookmarkedPosts);

// Route to get a specific post by ID
router.get('/:id', postController.getPost);

// Protected routes - cần auth
router.post('/', 
  authenticateToken,
  uploadMiddleware.array('media', 10),
  postController.createPost
);
router.put('/:id', authenticateToken, postController.updatePost);
router.delete('/:id', authenticateToken, postController.deletePost);
router.post('/:postId/like', authenticateToken, postController.likePost);
router.post('/:postId/share', authenticateToken, postController.sharePost);

// Media routes for posts
router.post('/:id/media',
  authenticateToken,
  uploadMiddleware.array('media', 10),
  postController.addPostMedia
);
router.delete('/:postId/media/:mediaId', authenticateToken, postController.deletePostMedia);

// Comment routes
router.get('/:postId/comments', postController.getComments);
router.post('/:postId/comments', authenticateToken, postController.addComment);
router.post('/comments/:commentId/like', authenticateToken, postController.likeComment);
router.delete('/comments/:commentId', authenticateToken, postController.deleteComment);

// Add these routes to support bookmarking functionality

// Bookmark/unbookmark a post
router.post('/:postId/bookmark', authenticateToken, postController.toggleBookmark);

module.exports = router; 
