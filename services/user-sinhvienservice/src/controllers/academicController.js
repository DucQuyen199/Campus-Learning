/*-----------------------------------------------------------------
* File: academicController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const academicModel = require('../models/academic');

// Controller for academic operations
const academicController = {
  // Get academic program
  getProgram: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const program = await academicModel.getProgram(userId);
      
      return res.json({
        success: true,
        data: program
      });
    } catch (error) {
      console.error('Error in getProgram controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching academic program' 
      });
    }
  },
  
  // Get courses in program
  getCourses: async (req, res) => {
    try {
      const programId = parseInt(req.params.programId);
      
      if (isNaN(programId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid program ID' 
        });
      }
      
      const courses = await academicModel.getCourses(programId);
      
      return res.json({
        success: true,
        data: courses
      });
    } catch (error) {
      console.error('Error in getCourses controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching program courses' 
      });
    }
  },
  
  // Get academic results (grades)
  getResults: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const semesterId = req.query.semesterId ? parseInt(req.query.semesterId) : null;
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const grades = await academicModel.getGrades(userId, semesterId);
      
      return res.json({
        success: true,
        data: grades
      });
    } catch (error) {
      console.error('Error in getResults controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching academic results' 
      });
    }
  },
  
  // Get conduct scores
  getConductScores: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const conductScores = await academicModel.getConductScores(userId);
      
      return res.json({
        success: true,
        data: conductScores
      });
    } catch (error) {
      console.error('Error in getConductScores controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching conduct scores' 
      });
    }
  },
  
  // Get academic warnings
  getWarnings: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const warnings = await academicModel.getWarnings(userId);
      
      return res.json({
        success: true,
        data: warnings
      });
    } catch (error) {
      console.error('Error in getWarnings controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching academic warnings' 
      });
    }
  },
  
  // Get academic metrics
  getMetrics: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
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
  },
  
  // Get registered courses
  getRegisteredCourses: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const semesterId = req.query.semesterId ? parseInt(req.query.semesterId) : null;
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const registeredCourses = await academicModel.getRegisteredCourses(userId, semesterId);
      
      return res.json({
        success: true,
        data: registeredCourses
      });
    } catch (error) {
      console.error('Error in getRegisteredCourses controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching registered courses' 
      });
    }
  },

  // Get available courses for registration
  getAvailableCourses: async (req, res) => {
    try {
      const semesterId = req.query.semesterId ? parseInt(req.query.semesterId) : null;
      const searchQuery = req.query.query || '';
      
      const availableCourses = await academicModel.getAvailableCourses(semesterId, searchQuery);
      
      return res.json({
        success: true,
        data: availableCourses
      });
    } catch (error) {
      console.error('Error in getAvailableCourses controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching available courses'
      });
    }
  },

  // Register for a course
  registerCourse: async (req, res) => {
    try {
      const { userId, classId, registrationType } = req.body;
      
      if (!userId || !classId) {
        return res.status(400).json({
          success: false,
          message: 'User ID and Class ID are required'
        });
      }
      
      // Check if registration is still open
      const isRegistrationOpen = await academicModel.isRegistrationOpen(classId);
      if (!isRegistrationOpen) {
        return res.status(400).json({
          success: false,
          message: 'Registration period for this course has ended or not started'
        });
      }
      
      // Check if class has available slots
      const classDetails = await academicModel.getClassDetails(classId);
      if (classDetails.CurrentStudents >= classDetails.MaxStudents) {
        return res.status(400).json({
          success: false,
          message: 'No available slots for this course'
        });
      }
      
      // Check if student already registered for this course
      const isAlreadyRegistered = await academicModel.isAlreadyRegistered(userId, classId);
      if (isAlreadyRegistered) {
        return res.status(400).json({
          success: false,
          message: 'You are already registered for this course'
        });
      }
      
      // Register the course
      const registrationResult = await academicModel.registerCourse(userId, classId, registrationType);
      
      return res.json({
        success: true,
        message: 'Course registered successfully',
        data: registrationResult
      });
    } catch (error) {
      console.error('Error in registerCourse controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while registering course'
      });
    }
  },

  // Cancel course registration
  cancelRegistration: async (req, res) => {
    try {
      const registrationId = parseInt(req.params.registrationId);
      const userId = req.body.userId;
      
      if (isNaN(registrationId) || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Valid Registration ID and User ID are required'
        });
      }
      
      // Check if registration exists and belongs to the user
      const registration = await academicModel.getRegistrationDetails(registrationId);
      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }
      
      if (registration.UserID !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to cancel this registration'
        });
      }
      
      // Check if cancellation is still allowed
      const isRegistrationOpen = await academicModel.isRegistrationOpen(registration.ClassID);
      if (!isRegistrationOpen) {
        return res.status(400).json({
          success: false,
          message: 'Registration cancellation period has ended'
        });
      }
      
      // Cancel the registration
      await academicModel.cancelRegistration(registrationId);
      
      return res.json({
        success: true,
        message: 'Course registration cancelled successfully'
      });
    } catch (error) {
      console.error('Error in cancelRegistration controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while cancelling registration'
      });
    }
  },

  // Get semesters
  getSemesters: async (req, res) => {
    try {
      const semesters = await academicModel.getSemesters();
      
      return res.json({
        success: true,
        data: semesters
      });
    } catch (error) {
      console.error('Error in getSemesters controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching semesters'
      });
    }
  },

  // Get registration period
  getRegistrationPeriod: async (req, res) => {
    try {
      const registrationPeriod = await academicModel.getRegistrationPeriod();
      
      return res.json({
        success: true,
        data: registrationPeriod
      });
    } catch (error) {
      console.error('Error in getRegistrationPeriod controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching registration period'
      });
    }
  },

  // Get courses that can be retaken (based on low grades)
  getRetakeableCourses: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      const retakeableCourses = await academicModel.getRetakeableCourses(userId);
      
      return res.json({
        success: true,
        data: retakeableCourses
      });
    } catch (error) {
      console.error('Error in getRetakeableCourses controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching retakeable courses'
      });
    }
  }
};

module.exports = academicController; 
