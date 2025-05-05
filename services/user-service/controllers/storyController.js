const Story = require('../models/Story');
const User = require('../models/User');
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
        // Format as YYYY-MM-DD
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
                ExpiresAt: expiresAtSQL
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
            ExpiresAt: expiresAtSQL
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
        const story = await Story.findByPk(req.params.storyId);
        
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Increment view count
        await story.increment('ViewCount');
        await story.reload();

        res.json({ story });
    } catch (error) {
        console.error('Error viewing story:', error);
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