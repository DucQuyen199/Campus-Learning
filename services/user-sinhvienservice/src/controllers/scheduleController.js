const scheduleModel = require('../models/schedule');

// Controller for schedule operations
const scheduleController = {
  // Get class schedule
  getClassSchedule: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const semesterId = req.query.semesterId ? parseInt(req.query.semesterId) : null;
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const classSchedule = await scheduleModel.getClassSchedule(userId, semesterId);
      
      return res.json({
        success: true,
        data: classSchedule
      });
    } catch (error) {
      console.error('Error in getClassSchedule controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching class schedule' 
      });
    }
  },
  
  // Get exam schedule
  getExamSchedule: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const semesterId = req.query.semesterId ? parseInt(req.query.semesterId) : null;
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const examSchedule = await scheduleModel.getExamSchedule(userId, semesterId);
      
      return res.json({
        success: true,
        data: examSchedule
      });
    } catch (error) {
      console.error('Error in getExamSchedule controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching exam schedule' 
      });
    }
  },
  
  // Get day schedule (for a specific date)
  getDaySchedule: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const date = req.query.date; // Expected format: YYYY-MM-DD
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      // If date is not provided, use current date
      const targetDate = date ? new Date(date) : new Date();
      
      // Check if the date is valid
      if (targetDate.toString() === 'Invalid Date') {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
      
      // Get day schedule by combining class and exam schedules for the date
      // We'll first check if this function exists in the model, if not use a fallback approach
      let daySchedule;
      if (typeof scheduleModel.getDaySchedule === 'function') {
        daySchedule = await scheduleModel.getDaySchedule(userId, targetDate);
      } else {
        // Fallback implementation if model doesn't have the function
        // Get both class and exam schedules and filter for the date
        const classSchedule = await scheduleModel.getClassSchedule(userId);
        const examSchedule = await scheduleModel.getExamSchedule(userId);
        
        // Process classes for the day
        const dayClasses = (classSchedule || []).filter(cls => {
          // We should check if this class occurs on the target date
          // This assumes each class has scheduleDetails with a day property
          if (!cls.scheduleDetails) return false;
          
          const targetDay = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
          return cls.scheduleDetails.some(schedule => 
            schedule.day === targetDay || 
            schedule.day.toLowerCase() === targetDay.toLowerCase()
          );
        });
        
        // Process exams for the day
        const dayExams = (examSchedule || []).filter(exam => {
          if (!exam.ExamDate) return false;
          
          const examDate = new Date(exam.ExamDate);
          return examDate.toDateString() === targetDate.toDateString();
        });
        
        // Combine schedules
        daySchedule = {
          classes: dayClasses,
          exams: dayExams,
          date: targetDate.toISOString().split('T')[0]
        };
      }
      
      return res.json({
        success: true,
        data: daySchedule
      });
    } catch (error) {
      console.error('Error in getDaySchedule controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching day schedule' 
      });
    }
  }
};

module.exports = scheduleController; 