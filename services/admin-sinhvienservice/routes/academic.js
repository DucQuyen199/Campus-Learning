const express = require('express');
const router = express.Router();

// Mock academic data
const programs = [
  { id: 1, name: 'Computer Science', code: 'CS', department: 'Engineering' },
  { id: 2, name: 'Business Administration', code: 'BA', department: 'Business' },
  { id: 3, name: 'Electrical Engineering', code: 'EE', department: 'Engineering' }
];

const subjects = [
  { id: 1, code: 'CS101', name: 'Introduction to Programming', credits: 3, program: 'Computer Science' },
  { id: 2, code: 'CS201', name: 'Data Structures', credits: 4, program: 'Computer Science' },
  { id: 3, code: 'BA101', name: 'Principles of Management', credits: 3, program: 'Business Administration' }
];

const semesters = [
  { id: 1, name: 'Spring 2023', startDate: '2023-01-10', endDate: '2023-05-20' },
  { id: 2, name: 'Fall 2023', startDate: '2023-08-15', endDate: '2023-12-20' }
];

// Programs routes
router.get('/programs', (req, res) => {
  res.json({ success: true, data: programs });
});

router.get('/programs/:id', (req, res) => {
  const program = programs.find(p => p.id === parseInt(req.params.id));
  if (!program) {
    return res.status(404).json({ success: false, message: 'Program not found' });
  }
  res.json({ success: true, data: program });
});

// Subjects routes
router.get('/subjects', (req, res) => {
  res.json({ success: true, data: subjects });
});

router.get('/subjects/:id', (req, res) => {
  const subject = subjects.find(s => s.id === parseInt(req.params.id));
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }
  res.json({ success: true, data: subject });
});

// Semesters routes
router.get('/semesters', (req, res) => {
  res.json({ success: true, data: semesters });
});

router.get('/semesters/:id', (req, res) => {
  const semester = semesters.find(s => s.id === parseInt(req.params.id));
  if (!semester) {
    return res.status(404).json({ success: false, message: 'Semester not found' });
  }
  res.json({ success: true, data: semester });
});

// Academic results
router.get('/results', (req, res) => {
  const results = [
    { id: 1, studentId: '2020001', studentName: 'Nguyen Van A', semester: 'Spring 2023', subject: 'Introduction to Programming', grade: 8.5 },
    { id: 2, studentId: '2020002', studentName: 'Tran Thi B', semester: 'Spring 2023', subject: 'Principles of Management', grade: 7.8 }
  ];
  res.json({ success: true, data: results });
});

module.exports = router; 