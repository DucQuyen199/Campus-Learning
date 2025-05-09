const express = require('express');
const router = express.Router();
const codeExecutionController = require('../controllers/codeExecutionController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkDockerStatus } = require('../utils/dockerManager');
const { authenticateToken } = require('../middleware/auth');

// Code execution endpoints
router.post('/execute-code', authMiddleware, codeExecutionController.executeCode);
router.post('/execute', authMiddleware, codeExecutionController.executeCode);
router.post('/code-execution/execute', authMiddleware, codeExecutionController.executeCode);
router.post('/send-input', authMiddleware, codeExecutionController.sendInput);
router.post('/code-execution/send-input', authMiddleware, codeExecutionController.sendInput);
router.post('/stop-execution', authMiddleware, codeExecutionController.stopExecution);
router.post('/code-execution/stop-execution', authMiddleware, codeExecutionController.stopExecution);
router.get('/health', codeExecutionController.healthCheck);
router.get('/code-execution/health', codeExecutionController.healthCheck);

// Test execution endpoint without auth (for testing purposes only)
router.post('/code-execution/test-execute', codeExecutionController.executeCode);
router.post('/code-execution/test-input', codeExecutionController.sendInput);

// Docker execution health/status endpoint - use Docker-specific health check
router.get('/code-execution/docker-status', codeExecutionController.checkDockerAvailability);
router.get('/docker-status', codeExecutionController.checkDockerAvailability);

// Endpoint to start Docker execution service
router.post('/code-execution/start', async (req, res) => {
  try {
    const { initializeDocker } = require('../utils/dockerManager');
    const result = await initializeDocker();

    return res.status(200).json({
      success: result.success,
      message: result.message,
      details: result.status
    });
  } catch (error) {
    console.error('Error starting Docker execution service:', error);
    return res.status(500).json({
      success: false,
      message: 'Error starting Docker execution service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint to start Docker execution service (alternative path)
router.post('/docker-status/start', async (req, res) => {
  try {
    const { initializeDocker } = require('../utils/dockerManager');
    const result = await initializeDocker();

    return res.status(200).json({
      success: result.success,
      message: result.message,
      details: result.status
    });
  } catch (error) {
    console.error('Error starting Docker execution service:', error);
    return res.status(500).json({
      success: false,
      message: 'Error starting Docker execution service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get supported languages endpoint
router.get('/code-execution/supported-languages', async (req, res) => {
  try {
    const status = await checkDockerStatus();
    // If Docker is available, all languages are supported
    if (status.available) {
      return res.status(200).json({
        success: true,
        languages: ['javascript', 'python', 'cpp', 'java'],
        message: 'All languages are supported via Docker'
      });
    } else {
      // If Docker is not available, only JavaScript is supported via VM
      return res.status(200).json({
        success: true,
        languages: ['javascript'],
        message: 'Only JavaScript is supported in fallback mode'
      });
    }
  } catch (error) {
    console.error('Error checking supported languages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking supported languages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test endpoint to verify Docker execution (no auth required for testing)
router.get('/code-execution/test', async (req, res) => {
  try {
    const language = req.query.language || 'python';
    let code;

    // Sample code for each language
    switch (language) {
      case 'python':
        code = `
for i in range(1, 11):
    print(f"{i}. Hello, Python Docker World!")
print("Stdin input:", input("Enter something: "))
`;
        break;
      case 'javascript':
        code = `
console.log("Hello from Node.js Docker!");
for (let i = 1; i <= 10; i++) {
  console.log(\`\${i}. JavaScript is running in Docker\`);
}
`;
        break;
      case 'cpp':
        code = `
#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++ Docker!" << endl;
    for (int i = 1; i <= 10; i++) {
        cout << i << ". C++ is running in Docker" << endl;
    }
    return 0;
}
`;
        break;
      default:
        code = 'print("Hello from Docker!")';
    }

    // Execute the test code
    await codeExecutionController.executeCode({
      body: {
        code,
        language,
        stdin: 'Test input from Docker'
      }
    }, res);

  } catch (error) {
    console.error('Error in Docker test execution:', error);
    return res.status(500).json({
      success: false,
      message: 'Error in Docker test execution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Execute arbitrary code
router.post('/execute-code', authMiddleware, codeExecutionController.executeCode);

// Get language options
router.get('/languages', codeExecutionController.getSupportedLanguages);

// Get exercise details by lesson
router.get('/courses/:courseId/lessons/:lessonId/code-exercise', authMiddleware, codeExecutionController.getCodeExercise);

// Run code for a specific exercise (run tests)
router.post('/courses/:courseId/lessons/:lessonId/run-code', authMiddleware, codeExecutionController.runCode);

// Execution endpoint for general code execution with input
router.post('/execute', authenticateToken, codeExecutionController.executeCode);

// Code submission for course lessons
router.post('/lessons/:lessonId/submit', authenticateToken, codeExecutionController.executeCodeSubmission);

module.exports = router;