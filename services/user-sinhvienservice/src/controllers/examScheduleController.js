const examScheduleModel = require('../models/examSchedule');

const examScheduleController = {
  /**
   * Get all semesters that have exams
   */
  getExamSemesters: async (req, res) => {
    try {
      const semesters = await examScheduleModel.getExamSemesters();
      
      return res.json({
        success: true,
        data: semesters
      });
    } catch (error) {
      console.error('Error in getExamSemesters controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while fetching exam semesters' 
      });
    }
  },

  /**
   * Get current semester exam schedule for a student
   */
  getCurrentExamSchedule: async (req, res) => {
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
      
      // Get current semester and exam schedule
      const examSchedule = await examScheduleModel.getCurrentExamSchedule(userId);
      
      return res.json({
        success: true,
        data: examSchedule
      });
    } catch (error) {
      console.error('Error in getCurrentExamSchedule controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while fetching exam schedule' 
      });
    }
  },

  /**
   * Get exam schedule for a specific semester
   */
  getSemesterExamSchedule: async (req, res) => {
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
      
      // Get exam schedule for the specified semester
      const examSchedule = await examScheduleModel.getSemesterExamSchedule(userId, semesterId);
      
      return res.json({
        success: true,
        data: examSchedule
      });
    } catch (error) {
      console.error('Error in getSemesterExamSchedule controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Server error while fetching exam schedule' 
      });
    }
  }
};

module.exports = examScheduleController; 