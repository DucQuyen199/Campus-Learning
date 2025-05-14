const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/studentsController');

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