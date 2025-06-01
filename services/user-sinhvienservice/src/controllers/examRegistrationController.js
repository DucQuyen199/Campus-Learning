const examRegistrationModel = require('../models/examRegistration');
const { validationResult } = require('express-validator');

/**
 * Get available exams for improvement for a specific student
 */
exports.getAvailableExams = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const semesterId = req.query.semesterId ? parseInt(req.query.semesterId) : null;
    
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    // Get exams that are available for improvement
    const exams = await examRegistrationModel.getAvailableExams(userId, semesterId);
    
    return res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error('Error in getAvailableExams controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching available exams',
      error: error.message
    });
  }
};

/**
 * Get a student's exam registration history
 */
exports.getRegistrationHistory = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    // Get registration history
    const history = await examRegistrationModel.getRegistrationHistory(userId);
    
    return res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error in getRegistrationHistory controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching registration history',
      error: error.message
    });
  }
};

/**
 * Get active semesters for exam registration
 */
exports.getActiveSemesters = async (req, res) => {
  try {
    // Get semesters where exam registration is active
    const semesters = await examRegistrationModel.getActiveSemesters();
    
    return res.json({
      success: true,
      data: semesters
    });
  } catch (error) {
    console.error('Error in getActiveSemesters controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching active semesters',
      error: error.message
    });
  }
};

/**
 * Register for improvement exams
 */
exports.registerForExams = async (req, res) => {
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
    
    // Get exam IDs from request body
    const { examIds, semesterId } = req.body;
    
    if (!examIds || !Array.isArray(examIds) || examIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide at least one exam to register for' 
      });
    }
    
    if (!semesterId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a semester ID' 
      });
    }
    
    // Register for exams
    const result = await examRegistrationModel.registerForExams(userId, examIds, semesterId);
    
    return res.json({
      success: true,
      message: 'Exam registration successful',
      data: result
    });
  } catch (error) {
    console.error('Error in registerForExams controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during exam registration',
      error: error.message
    });
  }
};

/**
 * Get exam registration fee information
 */
exports.getExamFeeInfo = async (req, res) => {
  try {
    // Get fee information
    const feeInfo = await examRegistrationModel.getExamFeeInfo();
    
    return res.json({
      success: true,
      data: feeInfo
    });
  } catch (error) {
    console.error('Error in getExamFeeInfo controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching exam fee information',
      error: error.message
    });
  }
};

/**
 * Cancel exam registration
 */
exports.cancelRegistration = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const registrationId = parseInt(req.params.registrationId);
    
    if (isNaN(userId) || isNaN(registrationId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID or registration ID' 
      });
    }
    
    // Cancel registration
    const result = await examRegistrationModel.cancelRegistration(userId, registrationId);
    
    return res.json({
      success: true,
      message: 'Exam registration cancelled successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in cancelRegistration controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while cancelling registration',
      error: error.message
    });
  }
}; 