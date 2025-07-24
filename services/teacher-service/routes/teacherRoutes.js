/*-----------------------------------------------------------------
* File: teacherRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the teacher backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const teacherAuth = require('../middleware/teacherAuth');

// Thông tin giáo viên và khóa học
router.get('/courses', teacherAuth, teacherController.getTeacherCourses);
router.get('/course/:id', teacherAuth, teacherController.getCourseDetail);
router.put('/course/:id', teacherAuth, teacherController.updateCourse);

// Quản lý học sinh trong khóa học
router.get('/course/:id/students', teacherAuth, teacherController.getCourseStudents);
router.get('/course/:id/student/:studentId', teacherAuth, teacherController.getStudentProgress);

// Quản lý bài thi và điểm số
router.get('/exams', teacherAuth, teacherController.getExams);
router.post('/exam/:id/grade', teacherAuth, teacherController.gradeExam);
router.get('/exam/:id/participants', teacherAuth, teacherController.getExamParticipants);

// Thống kê và báo cáo
router.get('/statistics', teacherAuth, teacherController.getTeacherStats);

module.exports = router; 
