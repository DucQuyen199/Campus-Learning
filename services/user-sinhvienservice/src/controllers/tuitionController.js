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
        message: error.message || 'Server error while fetching current tuition' 
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
        message: error.message || 'Server error while fetching tuition history' 
      });
    }
  },
  
  // Get tuition by ID
  getTuitionById: async (req, res) => {
    try {
      const tuitionId = parseInt(req.params.tuitionId);
      
      if (isNaN(tuitionId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid tuition ID' 
        });
      }
      
      const tuition = await tuitionModel.getTuitionById(tuitionId);
      
      return res.json({
        success: true,
        data: tuition
      });
    } catch (error) {
      console.error('Error in getTuitionById controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while fetching tuition details' 
      });
    }
  },
  
  // Get payments for a specific tuition
  getTuitionPayments: async (req, res) => {
    try {
      const tuitionId = parseInt(req.params.tuitionId);
      
      if (isNaN(tuitionId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid tuition ID' 
        });
      }
      
      const payments = await tuitionModel.getTuitionPayments(tuitionId);
      
      return res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error in getTuitionPayments controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while fetching tuition payments' 
      });
    }
  },
  
  // Make a tuition payment
  makePayment: async (req, res) => {
    try {
      const { tuitionId, userId, amount, paymentMethod, transactionCode } = req.body;
      
      // Validate required fields
      if (!tuitionId || !userId || !amount || !paymentMethod) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields' 
        });
      }
      
      // Validate numeric fields
      if (isNaN(parseInt(tuitionId)) || isNaN(parseInt(userId)) || isNaN(parseFloat(amount))) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid numeric values provided' 
        });
      }
      
      // Validate payment amount
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Payment amount must be greater than 0' 
        });
      }
      
      // Process payment
      const payment = await tuitionModel.makePayment(
        parseInt(tuitionId),
        parseInt(userId),
        parseFloat(amount),
        paymentMethod,
        transactionCode
      );
      
      // Get updated tuition details
      const updatedTuition = await tuitionModel.getTuitionById(parseInt(tuitionId));
      
      return res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          payment,
          tuition: updatedTuition
        }
      });
    } catch (error) {
      console.error('Error in makePayment controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while processing payment' 
      });
    }
  }
};

module.exports = tuitionController; 