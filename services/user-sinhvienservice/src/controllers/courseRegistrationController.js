/*-----------------------------------------------------------------
* File: courseRegistrationController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const CourseRegistration = require('../models/courseRegistration');

// Get registered courses for a student in a semester
exports.getRegisteredCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { semesterId } = req.params;
    
    if (!semesterId) {
      return res.status(400).json({
        success: false,
        message: 'Semester ID is required'
      });
    }
    
    const result = await CourseRegistration.getRegisteredCourses(userId, semesterId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching registered courses',
        error: result.error
      });
    }
    
    return res.status(200).json({
      success: true,
      courses: result.registeredCourses
    });
  } catch (err) {
    console.error('Error in getRegisteredCourses controller:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching registered courses',
      error: err.message
    });
  }
};

// Get all available semesters
exports.getSemesters = async (req, res) => {
  try {
    const result = await CourseRegistration.getSemesters();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching semesters',
        error: result.error
      });
    }
    
    return res.status(200).json({
      success: true,
      semesters: result.semesters
    });
  } catch (err) {
    console.error('Error in getSemesters controller:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching semesters',
      error: err.message
    });
  }
};

// Get current semester
exports.getCurrentSemester = async (req, res) => {
  try {
    const result = await CourseRegistration.getCurrentSemester();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching current semester',
        error: result.error
      });
    }
    
    return res.status(200).json({
      success: true,
      semester: result.semester
    });
  } catch (err) {
    console.error('Error in getCurrentSemester controller:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching current semester',
      error: err.message
    });
  }
};

// Cancel course registration
exports.cancelRegistration = async (req, res) => {
  try {
    const userId = req.user.id;
    const { registrationId } = req.params;
    
    if (!registrationId) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID is required'
      });
    }
    
    const result = await CourseRegistration.cancelRegistration(userId, registrationId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error cancelling registration',
        error: result.error
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (err) {
    console.error('Error in cancelRegistration controller:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while cancelling registration',
      error: err.message
    });
  }
}; 
