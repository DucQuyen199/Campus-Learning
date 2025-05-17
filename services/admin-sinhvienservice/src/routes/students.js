const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/studentsController');

// Get all students directly without pagination (for admin use)
router.get('/all', studentsController.getAllStudentsDirectly);

// Alternative endpoint for getting all users
router.get('/users/all', async (req, res) => {
  try {
    // Create a direct connection to avoid any middleware issues
    const { getPool } = require('../config/db');
    const pool = await getPool();
    
    // Simple query that just pulls all students with minimal joins
    const query = `
      SELECT * FROM Users 
    `;
    
    const result = await pool.request().query(query);
    
    return res.status(200).json({
      success: true,
      data: result.recordset,
      totalCount: result.recordset.length
    });
  } catch (error) {
    console.error('Error in alternative endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not retrieve student data'
    });
  }
});

// Get all students with pagination and filtering
router.get('/', studentsController.getAllStudents);

// Get student by ID with detailed information
router.get('/:id', studentsController.getStudentById);

// Create a new student
router.post('/', studentsController.createStudent);

// Update student information
router.put('/:id', studentsController.updateStudent);

// Reset student password
router.post('/:id/reset-password', studentsController.resetPassword);

// Get student's academic results
router.get('/:id/results', studentsController.getStudentResults);

module.exports = router; 