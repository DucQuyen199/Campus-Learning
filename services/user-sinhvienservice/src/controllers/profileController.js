const ProfileModel = require('../models/profile');

// Controller for handling student profile operations
const ProfileController = {
  // Get student profile
  async getProfile(req, res, next) {
    try {
      const userId = req.params.userId;
      console.log(`Fetching profile for user ID: ${userId}`);

      const profile = await ProfileModel.getProfileById(userId);

      if (!profile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student profile not found' 
        });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      next(error);
    }
  },

  // Get student academic information
  async getAcademicInfo(req, res, next) {
    try {
      const userId = req.params.userId;
      
      const academicInfo = await ProfileModel.getAcademicInfo(userId);
      
      res.json(academicInfo);
    } catch (error) {
      console.error('Error fetching academic information:', error);
      next(error);
    }
  },

  // Get student metrics
  async getMetrics(req, res, next) {
    try {
      const userId = req.params.userId;
      
      const metrics = await ProfileModel.getMetrics(userId);
      
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching student metrics:', error);
      next(error);
    }
  },

  // Update student profile
  async updateProfile(req, res, next) {
    try {
      const userId = req.params.userId;
      const profileData = req.body;
      
      console.log(`Updating profile for user ID: ${userId}`, profileData);
      
      await ProfileModel.updateProfile(userId, profileData);
      
      res.json({ 
        success: true,
        message: 'Profile updated successfully' 
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      next(error);
    }
  },

  // Get profile update history
  async getProfileUpdates(req, res, next) {
    try {
      const userId = req.params.userId;
      
      const updates = await ProfileModel.getProfileUpdates(userId);
      
      res.json(updates);
    } catch (error) {
      console.error('Error fetching profile updates:', error);
      next(error);
    }
  }
};

module.exports = ProfileController; 