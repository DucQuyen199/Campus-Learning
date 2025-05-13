const profileModel = require('../models/profile');
const academicModel = require('../models/academic');
const { validationResult } = require('express-validator');

/**
 * Get a user's profile
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    const profile = await profileModel.getProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }
    
    return res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error in getProfile controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching profile' 
    });
  }
};

/**
 * Get a user's academic information
 */
exports.getAcademicInfo = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    // Get the academic program
    const program = await academicModel.getProgram(userId);
    
    return res.json({
      success: true,
      data: program
    });
  } catch (error) {
    console.error('Error in getAcademicInfo controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching academic information' 
    });
  }
};

/**
 * Get a user's academic metrics
 */
exports.getMetrics = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    // Get academic metrics
    const metrics = await academicModel.getMetrics(userId);
    
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error in getMetrics controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching academic metrics' 
    });
  }
};

/**
 * Update a user's profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    // Validate the input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const profileData = {
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      city: req.body.city,
      country: req.body.country,
      bio: req.body.bio
    };
    
    const result = await profileModel.updateProfile(userId, profileData);
    
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in updateProfile controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while updating profile' 
    });
  }
};

/**
 * Get a user's profile update history
 */
exports.getProfileUpdates = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    const updates = await profileModel.getProfileUpdates(userId);
    
    return res.json({
      success: true,
      data: updates
    });
  } catch (error) {
    console.error('Error in getProfileUpdates controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching profile updates' 
    });
  }
}; 