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