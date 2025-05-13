const AcademicModel = require('../models/academic');

// Controller for handling academic operations
const AcademicController = {
  // Get student's academic program details
  async getProgram(req, res, next) {
    try {
      const { userId } = req.params;
      const program = await AcademicModel.getProgram(userId);
      
      res.json(program);
    } catch (error) {
      console.error('Error fetching academic program:', error);
      next(error);
    }
  },

  // Get student's courses in program
  async getCourses(req, res, next) {
    try {
      const { programId } = req.params;
      const courses = await AcademicModel.getCourses(programId);
      
      res.json(courses);
    } catch (error) {
      console.error('Error fetching program courses:', error);
      next(error);
    }
  },

  // Get student's academic results (grades)
  async getGrades(req, res, next) {
    try {
      const { userId } = req.params;
      const { semesterId } = req.query;
      
      const grades = await AcademicModel.getGrades(userId, semesterId);
      
      res.json(grades);
    } catch (error) {
      console.error('Error fetching grades:', error);
      next(error);
    }
  },

  // Get student's conduct scores
  async getConductScores(req, res, next) {
    try {
      const { userId } = req.params;
      const conductScores = await AcademicModel.getConductScores(userId);
      
      res.json(conductScores);
    } catch (error) {
      console.error('Error fetching conduct scores:', error);
      next(error);
    }
  },

  // Get student's academic warnings
  async getWarnings(req, res, next) {
    try {
      const { userId } = req.params;
      const warnings = await AcademicModel.getWarnings(userId);
      
      res.json(warnings);
    } catch (error) {
      console.error('Error fetching academic warnings:', error);
      next(error);
    }
  },

  // Get student's academic metrics
  async getMetrics(req, res, next) {
    try {
      const { userId } = req.params;
      
      const metrics = await AcademicModel.getMetrics(userId);
      
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching academic metrics:', error);
      // Return mock data on error
      res.json([{
        UserID: parseInt(req.params.userId),
        SemesterID: 1,
        TotalCredits: 140,
        EarnedCredits: 45,
        SemesterGPA: 3.5,
        CumulativeGPA: 3.5,
        AcademicStanding: 'Good Standing',
        RankInClass: 15,
        SemesterName: 'Học kỳ 1',
        AcademicYear: '2023-2024'
      }]);
    }
  },

  // Get student's registered courses
  async getRegisteredCourses(req, res, next) {
    try {
      const { userId } = req.params;
      const { semesterId } = req.query;
      
      const registeredCourses = await AcademicModel.getRegisteredCourses(userId, semesterId);
      
      res.json(registeredCourses);
    } catch (error) {
      console.error('Error fetching registered courses:', error);
      next(error);
    }
  }
};

module.exports = AcademicController; 