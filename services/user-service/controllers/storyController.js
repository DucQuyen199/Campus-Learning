/*-----------------------------------------------------------------
* File: storyController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { Story, User, StoryView, StoryLike, Chat } = require('../models');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

// Get all stories
exports.getAllStories = async (req, res) => {
    try {
        const stories = await Story.findAll({
            where: {
                ExpiresAt: {
                    [Op.gt]: new Date()
                },
                IsDeleted: false
            },
            include: [{
                model: User,
                attributes: ['UserID', 'Username', 'FullName', 'Image']
            }],
            order: [['CreatedAt', 'DESC']]
        });
            
        res.json({ stories });
    } catch (error) {
        console.error('Error getting stories:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create a new story
exports.createStory = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        
        const { mediaType, textContent, backgroundColor, duration } = req.body;
        
        if (!mediaType) {
            return res.status(400).json({ message: 'Media type is required' });
        }

        // Calculate expiration date (24 hours from now)
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        // Format as YYYY-MM-DD without timezone information
        const expiresAtSQL = expiresAt.toISOString().split('T')[0];

        if (mediaType === 'text') {
            if (!textContent) {
                return res.status(400).json({ message: 'Text content is required for text story' });
            }

            // Create text story
            const story = await Story.create({
                UserID: req.user.UserID,
                MediaType: 'text',
                TextContent: textContent,
                BackgroundColor: backgroundColor || '#000000',
                Duration: duration || 15,
                ExpiresAt: expiresAtSQL // Using SQL-friendly date format
            });

            // Get story with user info
            const storyWithUser = await Story.findByPk(story.StoryID, {
                include: [{
                    model: User,
                    attributes: ['UserID', 'Username', 'FullName', 'Image']
                }]
            });
            
            return res.status(201).json({ story: storyWithUser });
        }

        // Handle media story (image/video)
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded for media story' });
        }

        const isVideo = req.file.mimetype.startsWith('video/');
        const uploadDir = isVideo ? 'uploads/stories/videos' : 'uploads/stories/images';
        const fileName = req.file.filename;
        const mediaUrl = `/uploads/stories/${isVideo ? 'videos' : 'images'}/${fileName}`;

        const story = await Story.create({
            UserID: req.user.UserID,
            MediaUrl: mediaUrl,
            MediaType: isVideo ? 'video' : 'image',
            Duration: duration || 15,
            ExpiresAt: expiresAtSQL // Using SQL-friendly date format
        });

        // Get story with user info
        const storyWithUser = await Story.findByPk(story.StoryID, {
            include: [{
                model: User,
                attributes: ['UserID', 'Username', 'FullName', 'Image']
            }]
        });
        
        res.status(201).json({ story: storyWithUser });
    } catch (error) {
        console.error('Error creating story:', error);
        // If there's an error, clean up the uploaded file
        if (req.file) {
            const filePath = path.join(__dirname, '..', req.file.path);
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        res.status(500).json({ 
            message: 'Error creating story',
            error: error.message,
            details: error.errors ? error.errors.map(e => e.message) : []
        });
    }
};

// Mark story as viewed
exports.viewStory = async (req, res) => {
    try {
        const storyId = req.params.storyId;
        const viewerId = req.user.UserID;

        const story = await Story.findByPk(storyId);
        
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        const existingView = await StoryView.findOne({
            where: {
                StoryID: storyId,
                ViewerID: viewerId
            }
        });

        if (!existingView) {
            // Use SQL Server compatible date format (without timezone info)
            await StoryView.create({
                StoryID: storyId,
                ViewerID: viewerId,
                // Let the model handle the date with the default value
                // No need to explicitly set ViewedAt
            });
            await story.increment('ViewCount');
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error viewing story:', error);
        res.status(500).json({ message: "An error occurred while viewing the story." });
    }
};


// Get story viewers
exports.getStoryViewers = async (req, res) => {
    try {
        const storyId = req.params.storyId;
        
        const story = await Story.findByPk(storyId);
        
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }
        
        if (story.UserID !== req.user.UserID) {
            return res.status(403).json({ message: 'You can only view viewers of your own stories' });
        }
        
        const viewers = await StoryView.findAll({
            where: { StoryID: storyId },
            include: [{
                model: User,
                as: 'Viewer',
                attributes: ['UserID', 'Username', 'FullName', 'Image']
            }],
            order: [['ViewedAt', 'DESC']]
        });
        
        res.json({ viewers });
    } catch (error) {
        console.error('Error getting story viewers:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete a story
exports.deleteStory = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.storyId);
        
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Check ownership
        if (story.UserID !== req.user.UserID) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Mark as deleted instead of actually deleting
        story.IsDeleted = true;
        await story.save();

        res.json({ message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({ message: error.message });
    }
}; 

// Get stories by a specific user
exports.getUserStories = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const currentUserId = req.user.UserID;

    const stories = await Story.findAll({
      where: {
        UserID: userId,
        ExpiresAt: { [Op.gt]: new Date() },
        IsDeleted: false
      },
      include: [{
        model: User,
        attributes: ['UserID', 'Username', 'FullName', 'Image']
      }],
      order: [['CreatedAt', 'DESC']]
    });

    // Attach isOwner flag
    const formattedStories = stories.map(story => {
      const s = story.toJSON();
      s.isOwner = s.UserID === currentUserId;
      return s;
    });

    res.json({ stories: formattedStories });
  } catch (error) {
    console.error('Error getting user stories:', error);
    res.status(500).json({ message: error.message });
  }
};

// Like a story
exports.likeStory = async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.user.UserID;
    const story = await Story.findByPk(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    if (story.UserID === userId) {
      return res.status(400).json({ message: 'Cannot like your own story' });
    }
    const [like, created] = await StoryLike.findOrCreate({
      where: { StoryID: storyId, UserID: userId },
      defaults: { StoryID: storyId, UserID: userId }
    });
    if (created) {
      return res.json({ success: true, liked: true });
    }
    return res.json({ success: true, liked: false, message: 'Already liked' });
  } catch (error) {
    console.error('Error liking story:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reply to a story
exports.replyStory = async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const { content } = req.body;
    const senderId = req.user.UserID;
    const story = await Story.findByPk(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    const ownerId = story.UserID;
    if (ownerId === senderId) {
      return res.status(400).json({ message: 'Cannot reply to your own story' });
    }
    // Create or get private conversation
    const conversation = await Chat.createConversation('', [ownerId], senderId, 'private');
    const conversationId = conversation.ConversationID;
    // Send message
    const message = await Chat.sendMessage(conversationId, senderId, content, 'text');
    res.json({ conversationId, message });
  } catch (error) {
    console.error('Error replying to story:', error);
    res.status(500).json({ message: error.message });
  }
}; 
