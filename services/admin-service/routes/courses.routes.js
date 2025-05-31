const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/courses.controller');
const { verifyAdmin, authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes in this router
router.use(authenticateToken);

// Course management routes
router.get('/', coursesController.getAllCourses);
router.post('/', coursesController.createCourse);
router.get('/:id', coursesController.getCourseById);
router.put('/:id', coursesController.updateCourse);
router.delete('/:id', coursesController.deleteCourse);
router.get('/:id/enrollments', coursesController.getEnrolledStudents);

// Course validation and publishing routes
router.get('/:id/validation', coursesController.validateCourse);
router.post('/:id/publish', coursesController.publishCourse);

// Image and video update routes
router.patch('/:id/image', coursesController.updateCourseImage);
router.patch('/:id/video', coursesController.updateCourseVideo);

// Course modules routes
router.get('/:courseId/modules', coursesController.getCourseModules);
router.post('/:courseId/modules', coursesController.createModule);
router.get('/:courseId/modules/:moduleId', coursesController.getModuleById);
router.put('/:courseId/modules/:moduleId', coursesController.updateModule);
router.delete('/:courseId/modules/:moduleId', coursesController.deleteModule);

// Module lessons routes
router.get('/:courseId/modules/:moduleId/lessons', coursesController.getModuleLessons);
router.post('/:courseId/modules/:moduleId/lessons', coursesController.createLesson);
router.get('/:courseId/modules/:moduleId/lessons/:lessonId', coursesController.getLessonById);
router.put('/:courseId/modules/:moduleId/lessons/:lessonId', coursesController.updateLesson);
router.delete('/:courseId/modules/:moduleId/lessons/:lessonId', coursesController.deleteLesson);

module.exports = router;