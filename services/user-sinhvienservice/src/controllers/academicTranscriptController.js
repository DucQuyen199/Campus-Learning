const academicTranscriptModel = require('../models/academicTranscript');

const academicTranscriptController = {
  /**
   * Get academic summary for a student
   */
  getAcademicSummary: async (req, res) => {
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
      
      const summary = await academicTranscriptModel.getAcademicSummary(userId);
      
      return res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error in getAcademicSummary controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while fetching academic summary' 
      });
    }
  },
  
  /**
   * Get all semesters with grades for a student
   */
  getStudentSemesters: async (req, res) => {
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
      
      const semesters = await academicTranscriptModel.getStudentSemesters(userId);
      
      return res.json({
        success: true,
        data: semesters
      });
    } catch (error) {
      console.error('Error in getStudentSemesters controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while fetching student semesters' 
      });
    }
  },
  
  /**
   * Get grades for a specific semester
   */
  getSemesterGrades: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const semesterId = parseInt(req.params.semesterId);
      
      if (isNaN(userId) || isNaN(semesterId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID or semester ID' 
        });
      }
      
      // Verify user has access to this data
      if (req.user.id !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to view this data' 
        });
      }
      
      const grades = await academicTranscriptModel.getSemesterGrades(userId, semesterId);
      
      return res.json({
        success: true,
        data: grades
      });
    } catch (error) {
      console.error('Error in getSemesterGrades controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while fetching semester grades' 
      });
    }
  },
  
  /**
   * Get all grades for a student across all semesters
   */
  getAllGrades: async (req, res) => {
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
      
      const grades = await academicTranscriptModel.getAllGrades(userId);
      
      return res.json({
        success: true,
        data: grades
      });
    } catch (error) {
      console.error('Error in getAllGrades controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while fetching all grades' 
      });
    }
  }
};

module.exports = academicTranscriptController; 