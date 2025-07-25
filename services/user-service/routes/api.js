/*-----------------------------------------------------------------
* File: api.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const userController = require('../controllers/userController');
const lessonController = require('../controllers/lessonController');
const courseController = require('../controllers/courseController');
const codeExecutionController = require('../controllers/codeExecutionController');

// Code execution endpoint
router.post('/execute-code', authMiddleware, codeExecutionController.executeCode); 
