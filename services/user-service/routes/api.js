const userController = require('../controllers/userController');
const lessonController = require('../controllers/lessonController');
const courseController = require('../controllers/courseController');
const codeExecutionController = require('../controllers/codeExecutionController');

// Code execution endpoint
router.post('/execute-code', authMiddleware, codeExecutionController.executeCode); 