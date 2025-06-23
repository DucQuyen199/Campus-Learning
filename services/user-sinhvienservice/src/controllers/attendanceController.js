const attendanceModel = require('../models/attendance');

// Controller for attendance operations
const attendanceController = {
  // Get semesters with attendance for a user
  getSemesters: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }
      const semesters = await attendanceModel.getSemesters(userId);
      return res.json({ success: true, data: semesters });
    } catch (error) {
      console.error('Error in getSemesters controller:', error);
      return res.json({ success: true, data: [] });
    }
  },

  // Get courses for a user (by optional semester)
  getCourses: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }
      const semesterId = req.query.semesterId ? parseInt(req.query.semesterId) : null;
      const courses = await attendanceModel.getCourses(userId, semesterId);
      return res.json({ success: true, data: courses });
    } catch (error) {
      console.error('Error in getCourses controller:', error);
      return res.json({ success: true, data: [] });
    }
  },

  // Get attendance records for a user (filter by class or semester)
  getAttendance: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }
      const classId = req.query.classId ? parseInt(req.query.classId) : null;
      const semesterId = req.query.semesterId ? parseInt(req.query.semesterId) : null;

      const attendance = await attendanceModel.getAttendance(userId, classId, semesterId);
      return res.json({ success: true, data: attendance });
    } catch (error) {
      console.error('Error in getAttendance controller:', error);
      return res.json({ success: true, data: [] });
    }
  }
};

module.exports = attendanceController; 