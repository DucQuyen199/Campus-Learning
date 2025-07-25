/*-----------------------------------------------------------------
* File: profileController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
    
    // Determine which type of information is being updated based on request data
    let updateType = 'profile'; // Default type
    const updateData = {};
    
    // Process basic information fields
    if (req.body.FullName !== undefined || req.body.DateOfBirth !== undefined || 
        req.body.Gender !== undefined || req.body.BirthPlace !== undefined || 
        req.body.HomeTown !== undefined || req.body.Ethnicity !== undefined || 
        req.body.Religion !== undefined) {
      updateType = 'basicInfo';
      updateData.FullName = req.body.FullName;
      updateData.DateOfBirth = req.body.DateOfBirth;
      updateData.Gender = req.body.Gender;
      updateData.BirthPlace = req.body.BirthPlace;
      updateData.HomeTown = req.body.HomeTown;
      updateData.Ethnicity = req.body.Ethnicity;
      updateData.Religion = req.body.Religion;
    }
    
    // Process document information fields
    else if (req.body.IdentityCardNumber !== undefined || req.body.IdentityCardIssueDate !== undefined || 
             req.body.IdentityCardIssuePlace !== undefined || req.body.HealthInsuranceNumber !== undefined ||
             req.body.BankAccountNumber !== undefined || req.body.BankName !== undefined) {
      updateType = 'documents';
      updateData.IdentityCardNumber = req.body.IdentityCardNumber;
      updateData.IdentityCardIssueDate = req.body.IdentityCardIssueDate;
      updateData.IdentityCardIssuePlace = req.body.IdentityCardIssuePlace;
      updateData.HealthInsuranceNumber = req.body.HealthInsuranceNumber;
      updateData.BankAccountNumber = req.body.BankAccountNumber;
      updateData.BankName = req.body.BankName;
    }
    
    // Process contact information fields
    else if (req.body.PhoneNumber !== undefined || req.body.Email !== undefined ||
             req.body.Address !== undefined || req.body.City !== undefined || 
             req.body.Country !== undefined) {
      updateType = 'contactInfo';
      updateData.PhoneNumber = req.body.PhoneNumber;
      updateData.Email = req.body.Email;
      updateData.Address = req.body.Address;
      updateData.City = req.body.City;
      updateData.Country = req.body.Country;
    }
    
    // Process family information fields
    else if (req.body.ParentName !== undefined || req.body.ParentPhone !== undefined ||
             req.body.ParentEmail !== undefined || req.body.EmergencyContact !== undefined ||
             req.body.EmergencyPhone !== undefined) {
      updateType = 'familyInfo';
      updateData.ParentName = req.body.ParentName;
      updateData.ParentPhone = req.body.ParentPhone;
      updateData.ParentEmail = req.body.ParentEmail;
      updateData.EmergencyContact = req.body.EmergencyContact;
      updateData.EmergencyPhone = req.body.EmergencyPhone;
    }
    
    // Handle general profile updates (for backward compatibility)
    else {
      updateData.PhoneNumber = req.body.phoneNumber;
      updateData.Address = req.body.address;
      updateData.City = req.body.city;
      updateData.Country = req.body.country;
      updateData.Bio = req.body.bio;
    }
    
    // Update profile with specified data
    const result = await profileModel.updateProfile(userId, updateData, updateType);
    
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in updateProfile controller:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while updating profile',
      error: error.message 
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
