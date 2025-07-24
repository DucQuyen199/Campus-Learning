/*-----------------------------------------------------------------
* File: secondMajorController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const secondMajorModel = require('../models/secondMajor');

const secondMajorController = {
  // Get all available programs for second major registration
  getAvailablePrograms: async (req, res) => {
    try {
      const programs = await secondMajorModel.getAvailablePrograms();
      
      return res.json({
        success: true,
        data: programs
      });
    } catch (error) {
      console.error('Error in getAvailablePrograms controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching available programs'
      });
    }
  },
  
  // Check if a student is eligible for second major registration
  checkEligibility: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      // Check if already registered for a second major
      const existingRegistration = await secondMajorModel.checkExistingRegistration(userId);
      if (existingRegistration) {
        return res.json({
          success: true,
          isEligible: false,
          reason: 'Already registered for a second major',
          existingRegistration
        });
      }
      
      // Get student's academic metrics
      const metrics = await secondMajorModel.getStudentMetrics(userId);
      if (!metrics) {
        return res.json({
          success: true,
          isEligible: false,
          reason: 'No academic records found'
        });
      }
      
      // Check GPA requirement (minimum 2.5)
      if (metrics.CumulativeGPA < 2.5) {
        return res.json({
          success: true,
          isEligible: false,
          reason: 'GPA requirement not met',
          requiredGPA: 2.5,
          currentGPA: metrics.CumulativeGPA
        });
      }
      
      // Check completed credits requirement (minimum 30)
      if (metrics.TotalCredits < 30) {
        return res.json({
          success: true,
          isEligible: false,
          reason: 'Credit requirement not met',
          requiredCredits: 30,
          currentCredits: metrics.TotalCredits
        });
      }
      
      // Student is eligible
      return res.json({
        success: true,
        isEligible: true,
        metrics
      });
    } catch (error) {
      console.error('Error in checkEligibility controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while checking eligibility'
      });
    }
  },
  
  // Register for a second major
  registerSecondMajor: async (req, res) => {
    try {
      const { userId, programId, reason } = req.body;
      
      if (!userId || !programId || !reason) {
        return res.status(400).json({
          success: false,
          message: 'User ID, Program ID and Reason are required'
        });
      }
      
      // Check if already registered for a second major
      const existingRegistration = await secondMajorModel.checkExistingRegistration(userId);
      if (existingRegistration) {
        return res.status(400).json({
          success: false,
          message: 'Already registered for a second major',
          existingRegistration
        });
      }
      
      // Get student's academic metrics
      const metrics = await secondMajorModel.getStudentMetrics(userId);
      if (!metrics) {
        return res.status(400).json({
          success: false,
          message: 'No academic records found'
        });
      }
      
      // Check GPA requirement
      if (metrics.CumulativeGPA < 2.5) {
        return res.status(400).json({
          success: false,
          message: 'GPA requirement not met (minimum 2.5)',
          currentGPA: metrics.CumulativeGPA
        });
      }
      
      // Check completed credits requirement
      if (metrics.TotalCredits < 30) {
        return res.status(400).json({
          success: false,
          message: 'Credit requirement not met (minimum 30 credits)',
          currentCredits: metrics.TotalCredits
        });
      }
      
      // Get current semester for registration
      const currentSemester = await secondMajorModel.getCurrentSemester();
      if (!currentSemester) {
        return res.status(400).json({
          success: false,
          message: 'No active semester found for registration'
        });
      }
      
      // Register for the second major
      const registrationId = await secondMajorModel.registerSecondMajor(
        userId,
        programId,
        metrics.CumulativeGPA,
        metrics.TotalCredits,
        reason,
        currentSemester.SemesterID
      );
      
      // Get the registration details
      const registrationDetails = await secondMajorModel.getRegistrationDetails(registrationId);
      
      return res.status(201).json({
        success: true,
        message: 'Second major registration submitted successfully',
        data: registrationDetails
      });
    } catch (error) {
      console.error('Error in registerSecondMajor controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while registering for second major'
      });
    }
  },
  
  // Get student's second major registrations
  getStudentRegistrations: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      const registrations = await secondMajorModel.getStudentRegistrations(userId);
      
      return res.json({
        success: true,
        data: registrations
      });
    } catch (error) {
      console.error('Error in getStudentRegistrations controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching registrations'
      });
    }
  },
  
  // Get registration details
  getRegistrationDetails: async (req, res) => {
    try {
      const registrationId = parseInt(req.params.registrationId);
      
      if (isNaN(registrationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid registration ID'
        });
      }
      
      const registration = await secondMajorModel.getRegistrationDetails(registrationId);
      
      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }
      
      return res.json({
        success: true,
        data: registration
      });
    } catch (error) {
      console.error('Error in getRegistrationDetails controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching registration details'
      });
    }
  },
  
  // Cancel a registration
  cancelRegistration: async (req, res) => {
    try {
      const registrationId = parseInt(req.params.registrationId);
      const userId = parseInt(req.body.userId);
      
      if (isNaN(registrationId) || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid registration ID or user ID'
        });
      }
      
      const result = await secondMajorModel.cancelRegistration(registrationId, userId);
      
      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'Unable to cancel registration. It may already be processed or does not exist.'
        });
      }
      
      return res.json({
        success: true,
        message: 'Registration cancelled successfully'
      });
    } catch (error) {
      console.error('Error in cancelRegistration controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while cancelling registration'
      });
    }
  }
};

module.exports = secondMajorController; 
