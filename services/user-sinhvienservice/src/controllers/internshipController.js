/*-----------------------------------------------------------------
* File: internshipController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const internshipModel = require('../models/internship');

const internshipController = {
  getInternships: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ success:false, message:'Invalid user ID'});
      }
      const internships = await internshipModel.getInternships(userId);
      return res.json({ success:true, data: internships });
    } catch (error) {
      console.error('Error in getInternships controller:', error);
      return res.json({ success:true, data: [] });
    }
  }
};

module.exports = internshipController; 
