const academicModel = require('../models/academic');

// Controller for academic operations
const academicController = {
  // Get academic program
  getProgram: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const program = await academicModel.getProgram(userId);
      
      return res.json({
        success: true,
        data: program
      });
    } catch (error) {
      console.error('Error in getProgram controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching academic program' 
      });
    }
  },
  
  // Get courses in program
  getCourses: async (req, res) => {
    try {
      const programId = parseInt(req.params.programId);
      
      if (isNaN(programId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid program ID' 
        });
      }
      
      const courses = await academicModel.getCourses(programId);
      
      return res.json({
        success: true,
        data: courses
      });
    } catch (error) {
      console.error('Error in getCourses controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching program courses' 
      });
    }
  },
  
  // Get academic results (grades)
  getResults: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const semesterId = req.query.semesterId ? parseInt(req.query.semesterId) : null;
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const grades = await academicModel.getGrades(userId, semesterId);
      
      return res.json({
        success: true,
        data: grades
      });
    } catch (error) {
      console.error('Error in getResults controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching academic results' 
      });
    }
  },
  
  // Get conduct scores
  getConductScores: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const conductScores = await academicModel.getConductScores(userId);
      
      return res.json({
        success: true,
        data: conductScores
      });
    } catch (error) {
      console.error('Error in getConductScores controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching conduct scores' 
      });
    }
  },
  
  // Get academic warnings
  getWarnings: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const warnings = await academicModel.getWarnings(userId);
      
      return res.json({
        success: true,
        data: warnings
      });
    } catch (error) {
      console.error('Error in getWarnings controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching academic warnings' 
      });
    }
  },
  
  // Get academic metrics
  getMetrics: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
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
  },
  
  // Get registered courses
  getRegisteredCourses: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const semesterId = req.query.semesterId ? parseInt(req.query.semesterId) : null;
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
      
      const registeredCourses = await academicModel.getRegisteredCourses(userId, semesterId);
      
      return res.json({
        success: true,
        data: registeredCourses
      });
    } catch (error) {
      console.error('Error in getRegisteredCourses controller:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching registered courses' 
      });
    }
  }
};

module.exports = academicController; 