const tuitionModel = require('../models/tuition');

// Controller for tuition operations
const tuitionController = {
  // Get current semester tuition
  getCurrentTuition: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const tuition = await tuitionModel.getCurrentTuition(userId);
      
      return res.json({
        success: true,
        data: tuition
      });
    } catch (error) {
      console.error('Error in getCurrentTuition controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching current tuition' 
      });
    }
  },
  
  // Get tuition history
  getTuitionHistory: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const tuitionHistory = await tuitionModel.getTuitionHistory(userId);
      
      return res.json({
        success: true,
        data: tuitionHistory
      });
    } catch (error) {
      console.error('Error in getTuitionHistory controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching tuition history' 
      });
    }
  }
};

module.exports = tuitionController; 