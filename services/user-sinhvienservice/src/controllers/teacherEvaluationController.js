const teacherEvaluationModel = require('../models/teacherEvaluation');

const teacherEvaluationController = {
  /**
   * Get classes pending teacher evaluation for a student
   */
  getPendingEvaluations: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      // Verify user has access to this data
      if (req.user.id !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to view this data' 
        });
      }
      
      const pendingEvaluations = await teacherEvaluationModel.getPendingEvaluations(userId);
      
      return res.json({
        success: true,
        data: pendingEvaluations
      });
    } catch (error) {
      console.error('Error in getPendingEvaluations controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while fetching pending evaluations' 
      });
    }
  },
  
  /**
   * Get submitted teacher evaluations by a student
   */
  getSubmittedEvaluations: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      // Verify user has access to this data
      if (req.user.id !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to view this data' 
        });
      }
      
      const submittedEvaluations = await teacherEvaluationModel.getSubmittedEvaluations(userId);
      
      return res.json({
        success: true,
        data: submittedEvaluations
      });
    } catch (error) {
      console.error('Error in getSubmittedEvaluations controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while fetching submitted evaluations' 
      });
    }
  },
  
  /**
   * Submit a new teacher evaluation
   */
  submitEvaluation: async (req, res) => {
    try {
      const { 
        classId, 
        userId, 
        teachingScore, 
        contentScore, 
        attitudeScore, 
        comments, 
        isAnonymous 
      } = req.body;
      
      // Basic validation
      if (!classId || !userId || !teachingScore || !contentScore || !attitudeScore) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      // Verify user has access
      if (req.user.id !== parseInt(userId) && req.user.role !== 'ADMIN') {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to submit this evaluation' 
        });
      }
      
      // Calculate overall score
      const overallScore = (teachingScore + contentScore + attitudeScore) / 3;
      
      // Submit the evaluation
      const result = await teacherEvaluationModel.submitEvaluation({
        classId,
        userId,
        teachingScore,
        contentScore,
        attitudeScore,
        overallScore,
        comments: comments || '',
        isAnonymous: isAnonymous || false
      });
      
      return res.json({
        success: true,
        message: 'Evaluation submitted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in submitEvaluation controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while submitting evaluation' 
      });
    }
  }
};

module.exports = teacherEvaluationController; 