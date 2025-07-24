/*-----------------------------------------------------------------
* File: codeExecutionController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');
const { docker, dockerAvailable, canExecuteLanguage } = require('../utils/dockerManager');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const unlinkAsync = promisify(fs.unlink);
const rmdirAsync = promisify(fs.rmdir);
const vm = require('vm');
const { execSync } = require('child_process');

// Base directory for temp code files
const BASE_TEMP_DIR = path.join(__dirname, '../temp');

// Make sure temp directory exists
if (!fs.existsSync(BASE_TEMP_DIR)) {
  fs.mkdirSync(BASE_TEMP_DIR, { recursive: true });
}

// Docker image configurations for each language
const LANGUAGE_CONFIGS = {
  javascript: {
    image: 'node:18-alpine',
    workDir: '/app',
    runCommand: ['node', 'code.js'],
    extension: 'js',
    memoryLimit: '512m',
    cpuLimit: '2',
    timeout: 10000
  },
  python: {
    image: 'python:3.10-slim',
    workDir: '/app',
    runCommand: ['python', '-u', 'code.py'],
    extension: 'py',
    memoryLimit: '512m',
    cpuLimit: '2',
    timeout: 60000,
    dns: ['8.8.8.8', '8.8.4.4']
  },
  java: {
    image: 'openjdk:17-slim',
    workDir: '/app',
    runCommand: ['/bin/sh', '-c', 'cd /app && javac -encoding UTF-8 Main.java && java -Dfile.encoding=UTF-8 -Xmx256m -Xms128m Main'],
    extension: 'java',
    memoryLimit: '512m',
    cpuLimit: '2',
    timeout: 30000,
    dns: ['8.8.8.8', '8.8.4.4'],
    HostConfig: {
      Memory: 512 * 1024 * 1024,
      MemorySwap: 1024 * 1024 * 1024,
      CpuShares: 2048,
      CpuPeriod: 100000,
      CpuQuota: 200000,
      PidsLimit: 100,
      OomKillDisable: false,
      RestartPolicy: { Name: 'no' },
      OpenStdin: true,
      StdinOnce: false,
      Tty: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true
    }
  },
  cpp: {
    image: 'gcc:latest',
    workDir: '/app',
    runCommand: ['/bin/sh', '-c', 'g++ -o output code.cpp -std=c++11 && ./output'],
    extension: 'cpp',
    memoryLimit: '512m',
    cpuLimit: '2',
    timeout: 15000
  },
  csharp: {
    image: 'mcr.microsoft.com/dotnet/sdk:6.0',
    workDir: '/app',
    runCommand: ['/bin/sh', '-c', 'dotnet new console -o . --force && mv code.cs Program.cs && dotnet run'],
    extension: 'cs',
    memoryLimit: '512m',
    cpuLimit: '2',
    timeout: 15000
  }
};

/**
 * Execute code snippet with custom input
 * This endpoint executes a code snippet with custom input and returns the result
 */
exports.executeCode = async (req, res) => {
  try {
    const { code, language, input } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: 'Code and language are required'
      });
    }
    
    console.log(`Executing ${language} code...`);
    
    // Validate language support
    if (!isSupportedLanguage(language)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`
      });
    }
    
    // Execute code
    const result = await executeCodeInternal(code, language, input);
    
    return res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error executing code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error executing code',
      error: error.message
    });
  }
};

/**
 * Execute code submission for course lesson
 * This endpoint handles code submissions for course lessons
 */
exports.executeCodeSubmission = async (req, res) => {
  try {
    const { code, language, lessonId } = req.body;
    const userId = req.user.id;
    
    if (!code || !language || !lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Code, language, and lessonId are required'
      });
    }
    
    console.log(`Executing ${language} code submission for lesson ${lessonId}...`);
    
    // Validate language support
    if (!isSupportedLanguage(language)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`
      });
    }
    
    // Get lesson details
    const { CourseLesson, LessonProgress } = require('../models');
    const lesson = await CourseLesson.findByPk(lessonId);
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }
    
    // Check if lesson has test cases
    if (!lesson.TestCases || lesson.TestCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lesson has no test cases'
      });
    }
    
    const testCases = JSON.parse(lesson.TestCases);
    let allTestsPassed = true;
    let results = [];
    
    // Run each test case
    for (const testCase of testCases) {
      const input = testCase.input || '';
      const expectedOutput = testCase.output ? testCase.output.trim() : '';
      
      // Execute code with test case input
      const result = await executeCodeInternal(code, language, input);
      
      const actualOutput = result.output ? result.output.trim() : '';
      const testPassed = actualOutput === expectedOutput;
      
      // If this test case failed, the overall submission fails
      if (!testPassed) {
        allTestsPassed = false;
      }
      
      results.push({
        ...result,
        input,
        expectedOutput,
        passed: testPassed
      });
    }
    
    // Update lesson progress
    await updateLessonProgress(userId, lessonId, allTestsPassed);
    
    return res.status(200).json({
      success: true,
      passed: allTestsPassed,
      results
    });
  } catch (error) {
    console.error('Error executing code submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Error executing code submission',
      error: error.message
    });
  }
};

/**
 * Execute code in a Docker container or fallback to alternative methods
 */
async function executeCodeInDocker(code, language, stdin = '') {
  const langConfig = LANGUAGE_CONFIGS[language.toLowerCase()];
  if (!langConfig) {
    throw new Error(`Language '${language}' is not supported`);
  }

  // Check if Docker is available and can execute this language
  if (!dockerAvailable || !canExecuteLanguage(language.toLowerCase())) {
    console.log(`Docker unavailable or cannot execute ${language}, using fallback execution method`);
    return executeCodeWithFallback(code, language, stdin);
  }

  // Create unique session ID
  const sessionId = uuidv4();
  const sessionDir = path.join(BASE_TEMP_DIR, sessionId);
  let container = null;
  let output = '';
  let isWaitingForInput = false;
  let currentInput = '';
  let inputBuffer = '';
  let memoryUsage = 0;

  try {
    console.log(`Creating session directory: ${sessionDir}`);
    // Create session directory
    await mkdirAsync(sessionDir, { recursive: true });

    // Write code file
    let filename = 'code';
    if (language.toLowerCase() === 'java') {
      filename = 'Main'; // Java requires class name to match filename
    }

    // Add UTF-8 BOM for C++ files to ensure correct encoding of Vietnamese characters
    if (language.toLowerCase() === 'cpp') {
      // Add appropriate includes and encoding for C++ files
      if (!code.includes('#include <iostream>')) {
        code = '#include <iostream>\n' + code;
      }
      if (!code.includes('setlocale')) {
        // Add locale settings right after the includes
        const includeIndex = code.lastIndexOf('#include');
        const nextLineIndex = code.indexOf('\n', includeIndex) + 1;
        code = code.substring(0, nextLineIndex) +
              'int main() {\n' +
              '    setlocale(LC_ALL, "en_US.UTF-8");\n' +
              '    std::cout.imbue(std::locale("en_US.UTF-8"));\n' +
              '    std::cin.imbue(std::locale("en_US.UTF-8"));\n\n' +
              '    // Viết code hiển thị "Hello, C++ World!"\n' +
              '    std::cout << "Hello, C++ World!" << std::endl;\n' +
              '    \n' +
              '    // Tính và hiển thị tổng của 10 và 25\n' +
              '    int sum = 10 + 25;\n' +
              '    std::cout << "Tổng của 10 và 25 là: " << sum << std::endl;\n' +
              '    \n' +
              '    return 0;\n' +
              '}';
      }
    }

    const filePath = path.join(sessionDir, `${filename}.${langConfig.extension}`);
    await writeFileAsync(filePath, code, 'utf8');
    console.log(`Code file written to: ${filePath}`);

    // For C++ specifically update the container creation with locale support
    if (language.toLowerCase() === 'cpp') {
      // Modify C++ command to include proper locale support
      langConfig.runCommand = ['/bin/sh', '-c',
        'apt-get update -y && ' +
        'apt-get install -y locales && ' +
        'localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8 && ' +
        'export LANG=en_US.UTF-8 && ' +
        'export LC_ALL=en_US.UTF-8 && ' +
        'g++ -o output code.cpp -std=c++11 && ' +
        './output'
      ];
    }

    // Write stdin file if provided
    let stdinPath = null;
    if (stdin) {
      stdinPath = path.join(sessionDir, 'stdin.txt');
      // Ensure each input line ends with a newline
      const formattedStdin = stdin.split('\n').map(line => line.trim()).join('\n') + '\n';
      await writeFileAsync(stdinPath, formattedStdin);
    }

    // Create container with proper stdin handling
    container = await docker.createContainer({
      Image: langConfig.image,
      Cmd: langConfig.runCommand,
      WorkingDir: langConfig.workDir,
      HostConfig: {
        Binds: [`${sessionDir}:${langConfig.workDir}`],
        Memory: parseInt(langConfig.memoryLimit.replace('m', '')) * 1024 * 1024,
        CpuShares: Math.floor(1024 * parseFloat(langConfig.cpuLimit)),
        AutoRemove: true,
        NetworkMode: 'bridge',
        Dns: langConfig.dns || ['8.8.8.8', '8.8.4.4'],
        OpenStdin: true,
        StdinOnce: false,
        Tty: true
      },
      Tty: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      StdinOnce: false
    });

    // Start container
    console.log(`Starting Docker container...`);
    await container.start();

    // Attach to container streams
    const stream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true
    });

    // Handle input/output streams
    stream.on('data', (chunk) => {
      const data = chunk.toString();
      output += data;
      inputBuffer += data;

      // Check for Python input prompts
      if (language.toLowerCase() === 'python') {
        // Check for input() function prompts
        if (data.includes('input(') || data.includes('input (')) {
          isWaitingForInput = true;
        }
        // Check for raw_input() function prompts (Python 2)
        if (data.includes('raw_input(') || data.includes('raw_input (')) {
          isWaitingForInput = true;
        }
        // Check for common input prompts
        if (data.includes('Enter') || data.includes('Nhập') || data.includes('nhập') ||
            data.includes('choice') || data.includes('lựa chọn') || data.includes('chọn')) {
          isWaitingForInput = true;
        }
      }
    });

    // If initial stdin is provided, send it
    if (stdin) {
      const stdinLines = stdin.split('\n').map(line => line.trim());
      for (const line of stdinLines) {
        if (line) {
          stream.write(line + '\n');
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    // Set up input handling
    const handleInput = async (input) => {
      if (isWaitingForInput) {
        stream.write(input + '\n');
        isWaitingForInput = false;
        currentInput = input;
        inputBuffer = '';
      }
    };

    // Wait for container to finish with timeout
    const executionTimeout = setTimeout(async () => {
      try {
        if (container) {
          console.log(`Execution timeout reached (${langConfig.timeout}ms), stopping container...`);
          await container.stop();
        }
      } catch (err) {
        console.error('Error stopping container after timeout:', err);
      }
    }, langConfig.timeout);

    // Wait for container to exit
    console.log(`Waiting for container to finish execution...`);
    const result = await container.wait();
    clearTimeout(executionTimeout);
    console.log(`Container exited with status code: ${result.StatusCode}`);

    // Get container memory stats if available
    try {
      const stats = await container.stats({ stream: false });
      if (stats && stats.memory_stats && stats.memory_stats.usage) {
        memoryUsage = Math.round(stats.memory_stats.usage / 1024); // Convert to KB
      }
    } catch (err) {
      // Just log the error but don't fail the operation
      console.log('Warning: Unable to get container stats:', err.message);
    }

    // Clean up container - check if it's still running first to avoid the 304 error
    if (container) {
      try {
        // Check container state before stopping
        const containerInfo = await container.inspect();
        const isRunning = containerInfo.State.Running;

        if (isRunning) {
          // Only try to stop if it's still running
          await container.stop();
        }

        try {
          // Try to remove container regardless of state
          await container.remove({ force: true });
        } catch (removeError) {
          // Container was likely already auto-removed, log and continue
          console.log('Note: Container may have been auto-removed:', removeError.message);
        }
      } catch (inspectError) {
        // If we can't inspect, container might be gone already
        console.log('Note: Unable to inspect container state:', inspectError.message);
      }
    }

    // Clean up temp files
    await cleanupSession(sessionDir);

    // Extract the last prompt if waiting for input
    let lastPrompt = '';
    if (isWaitingForInput) {
      const lines = inputBuffer.split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() && !lines[i].includes('input(') && !lines[i].includes('raw_input(')) {
          lastPrompt = lines[i].trim();
          break;
        }
      }
    }

    return {
      stdout: output.trim(),
      stderr: '',
      exitCode: result.StatusCode,
      language,
      isWaitingForInput,
      currentInput,
      lastPrompt,
      memoryUsage
    };
  } catch (error) {
    console.error('Error executing code in Docker:', error);

    // Attempt to clean up container if it exists
    if (container) {
      try {
        try {
          // Check if container still exists and is running
          const containerInfo = await container.inspect();
          const isRunning = containerInfo.State.Running;

          if (isRunning) {
            // Only try to stop if it's still running
            await container.stop().catch(err => console.log('Note: Unable to stop container:', err.message));
          }
        } catch (inspectError) {
          // Container might be gone already, just log and continue
          console.log('Note: Unable to inspect container state:', inspectError.message);
        }

        // Always try to remove with force option
        await container.remove({ force: true }).catch(err => console.log('Note: Unable to remove container:', err.message));
      } catch (cleanupError) {
        console.log('Note: Container cleanup failed:', cleanupError.message);
      }
    }

    // Clean up temp files
    if (sessionDir) {
      await cleanupSession(sessionDir).catch(err => console.log('Note: Session cleanup failed:', err.message));
    }

    throw error;
  }
}

/**
 * Execute code using fallback methods when Docker is not available
 */
async function executeCodeWithFallback(code, language, stdin = '') {
  console.log(`Using fallback execution for ${language}`);

  try {
    let result = { stdout: '', stderr: '', exitCode: null };

    switch (language.toLowerCase()) {
      case 'javascript':
        // Execute JS code in Node.js VM
        result = executeJavaScriptInVM(code, stdin);
        break;

      case 'python':
        // Check if Python is installed on the host system
        try {
          // Create temp file
          const tempFile = path.join(BASE_TEMP_DIR, `python_${uuidv4()}.py`);
          await writeFileAsync(tempFile, code);

          // Execute using Python interpreter if available
          try {
            const stdout = execSync(`python3 ${tempFile}`, {
              input: stdin || undefined,
              timeout: 5000,
              encoding: 'utf8'
            });
            result.stdout = stdout;
          } catch (err) {
            result.stderr = err.stderr?.toString() || err.message;
            result.exitCode = err.status || 1;
          }

          // Clean up
          await unlinkAsync(tempFile);
        } catch (err) {
          result.stderr = 'Failed to execute Python code: ' + err.message;
        }
        break;

      case 'java':
        // Thêm kiểm tra cú pháp Java
        if (!code.includes('public class Main') || !code.includes('public static void main')) {
          throw new Error('Java code must contain a Main class with main method');
        }

        // Tạo file Main.java
        const javaFilePath = path.join(sessionDir, 'Main.java');
        await writeFileAsync(javaFilePath, code);
        console.log(`Java file created at: ${javaFilePath}`);

        // Biên dịch và chạy Java
        try {
          // Biên dịch
          const compileResult = await container.exec({
            Cmd: ['javac', '/app/Main.java'],
            AttachStdout: true,
            AttachStderr: true
          });

          const compileStream = await compileResult.start();
          let compileOutput = '';
          for await (const chunk of compileStream.output) {
            compileOutput += chunk.toString();
          }

          if (compileOutput) {
            throw new Error(`Compilation error: ${compileOutput}`);
          }

          // Chạy chương trình Java
          const runResult = await container.exec({
            Cmd: ['java', '-Xmx256m', '-Xms128m', '-cp', '/app', 'Main'],
            AttachStdout: true,
            AttachStderr: true
          });

          const runStream = await runResult.start();
          let runOutput = '';
          for await (const chunk of runStream.output) {
            runOutput += chunk.toString();
          }

          return {
            stdout: runOutput.trim(),
            stderr: '',
            exitCode: 0,
            language
          };
        } catch (error) {
          throw new Error(`Java execution error: ${error.message}`);
        }
        break;

      default:
        result.stderr = `Language ${language} is not supported in fallback mode. Docker is required for this language.`;
        result.exitCode = 1;
    }

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode,
      language,
      executionMethod: 'fallback'
    };
  } catch (error) {
    console.error('Error in fallback execution:', error);
    return {
      stdout: '',
      stderr: error.message || 'Unknown error in fallback execution',
      exitCode: 1,
      language,
      executionMethod: 'fallback',
      error: true
    };
  }
}

/**
 * Execute code using fallback methods when Docker is not available
 */
async function executeJavaScriptInVM(code, stdin = '') {
  console.log(`Using fallback execution for JavaScript`);

  try {
    let result = { stdout: '', stderr: '', exitCode: null };

    // Create a new context for the VM
    const context = vm.createContext({});

    // Create a new script for the code
    const script = new vm.Script(code);

    // Execute the script
    const scriptResult = script.runInContext(context, {
      timeout: 5000,
      displayErrors: true
    });

    if (scriptResult instanceof Error) {
      result.stderr = scriptResult.message;
      result.exitCode = 1;
    } else {
      result.stdout = scriptResult.toString();
      result.exitCode = 0;
    }

    return result;
  } catch (error) {
    console.error('Error executing JavaScript in VM:', error);
    return {
      stdout: '',
      stderr: error.message || 'Unknown error in JavaScript execution',
      exitCode: 1,
      language: 'javascript',
      executionMethod: 'fallback',
      error: true
    };
  }
}

/**
 * Clean up session files and directories
 */
async function cleanupSession(sessionDir) {
  try {
    // Remove all files and directories in the session directory
    const files = await fs.promises.readdir(sessionDir);
    for (const file of files) {
      const filePath = path.join(sessionDir, file);
      await fs.promises.unlink(filePath);
    }

    // Remove the session directory itself
    await fs.promises.rmdir(sessionDir);

    return true;
  } catch (error) {
    console.error('Error cleaning up session:', error);
    throw error;
  }
}

/**
 * Send input to a running Docker container execution
 */
exports.sendInput = async (req, res) => {
  const { executionId, input } = req.body;

  if (!executionId || input === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Execution ID and input are required'
    });
  }

  try {
    const executionHelper = require('../utils/executionHelper');
    const result = await executionHelper.sendInput(executionId, input);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error sending input:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending input',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Stop a running Docker container execution
 */
exports.stopExecution = async (req, res) => {
  const { executionId } = req.body;

  if (!executionId) {
    return res.status(400).json({
      success: false,
      message: 'Execution ID is required'
    });
  }

  try {
    const executionHelper = require('../utils/executionHelper');
    const result = await executionHelper.stopExecution(executionId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error stopping execution:', error);
    return res.status(500).json({
      success: false,
      message: 'Error stopping execution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Health check endpoint
 */
exports.healthCheck = async (req, res) => {
  try {
    // Check if execution service is available
    const executionHelper = require('../utils/executionHelper');
    const { checkDockerStatus } = require('../utils/dockerManager');

    // Check Docker status first
    const dockerStatus = await checkDockerStatus();

    try {
      const healthStatus = await executionHelper.checkHealth();

      // The execution service returns { status: 'ok' } when healthy
      if (healthStatus && (healthStatus.status === 'ok' || healthStatus.success)) {
        return res.status(200).json({
          success: true,
          status: 'ok',
          message: 'Code execution service is running',
          dockerAvailable: dockerStatus.available,
          dockerStatus: dockerStatus,
          timestamp: new Date().toISOString()
        });
      } else {
        return res.status(200).json({
          success: false,
          status: 'error',
          message: 'Code execution service is not available',
          dockerAvailable: dockerStatus.available,
          dockerStatus: dockerStatus,
          error: healthStatus.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      // If the call to checkHealth fails, try a direct connection to the execution service
      try {
        const axios = require('axios');
        const EXECUTION_SERVICE_URL = process.env.EXECUTION_SERVICE_URL || 'http://localhost:3001';

        const response = await axios.get(`${EXECUTION_SERVICE_URL}/health`, { timeout: 2000 });

        if (response.data && response.data.status === 'ok') {
          return res.status(200).json({
            success: true,
            status: 'ok',
            message: 'Code execution service is running (direct connection)',
            dockerAvailable: dockerStatus.available,
            dockerStatus: dockerStatus,
            timestamp: new Date().toISOString()
          });
        } else {
          throw new Error('Unexpected response from execution service');
        }
      } catch (directError) {
        return res.status(200).json({
          success: false,
          status: 'error',
          message: 'Code execution service is not available',
          dockerAvailable: dockerStatus.available,
          dockerStatus: dockerStatus,
          error: directError.message || 'Direct connection failed',
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Error checking code execution service',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Check Docker availability
 * This endpoint specifically checks if Docker is available and ready for code execution
 */
exports.checkDockerAvailability = async (req, res) => {
  try {
    const { checkDockerStatus, initializeDocker } = require('../utils/dockerManager');

    // Check if force parameter is provided to force Docker initialization
    const forceInit = req.query.force === 'true' || (req.body && req.body.force === true);

    if (forceInit) {
      console.log('Force initializing Docker...');
      const initResult = await initializeDocker();

      return res.status(initResult.success ? 200 : 503).json({
        success: initResult.success,
        dockerAvailable: initResult.success,
        message: initResult.message,
        details: initResult.status || {},
        timestamp: new Date().toISOString()
      });
    }

    // Regular Docker status check
    const dockerStatus = await checkDockerStatus();

    return res.status(200).json({
      success: true,
      dockerAvailable: dockerStatus.available,
      message: dockerStatus.available
        ? 'Docker is available for code execution'
        : 'Docker is not available, code execution will use fallback methods',
      details: dockerStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Docker availability check error:', error);
    return res.status(500).json({
      success: false,
      dockerAvailable: false,
      message: 'Error checking Docker availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get supported programming languages
 */
exports.getSupportedLanguages = async (req, res) => {
  try {
    // Return the list of supported languages from LANGUAGE_CONFIGS
    const languages = Object.keys(LANGUAGE_CONFIGS).map(key => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
      available: canExecuteLanguage(key)
    }));

    return res.status(200).json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('Error getting supported languages:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving supported languages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get code exercise data for a specific lesson
 */
exports.getCodeExercise = async (req, res) => {
  const { courseId, lessonId } = req.params;
  const userId = req.user ? req.user.UserID : null;

  // Validate parameters
  if (!courseId || !lessonId) {
    return res.status(400).json({
      success: false,
      message: 'Course ID and Lesson ID are required'
    });
  }

  try {
    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Fetch the lesson details from the database
    let lessonTitle = '';
    let lessonContent = '';
    let moduleTitle = '';
    let initialCode = '// Hãy viết code của bạn ở đây\n\n';

    try {
      // Connect to the database using the appropriate method
      const { sql, query } = require('../config/db');

      // Query to get lesson and module details
      // Removed CodeSnippet column since it doesn't exist in the CourseLessons table
      const lessonResults = await query(`
        SELECT l.Title, l.Content, l.Type, l.VideoUrl,
               m.Title as ModuleTitle, c.Title as CourseTitle
        FROM CourseLessons l
        JOIN CourseModules m ON l.ModuleID = m.ModuleID
        JOIN Courses c ON m.CourseID = c.CourseID
        WHERE l.LessonID = @lessonId
      `, {
        lessonId: lessonId
      });

      if (lessonResults && lessonResults.length > 0) {
        const lessonData = lessonResults[0];
        lessonTitle = lessonData.Title || '';
        lessonContent = lessonData.Content || '';
        moduleTitle = lessonData.ModuleTitle || '';

        console.log('Successfully fetched lesson data:', {
          title: lessonTitle,
          moduleTitle: moduleTitle
        });
      } else {
        console.log('No lesson found with ID:', lessonId);
      }
    } catch (dbError) {
      console.error('Error fetching lesson details:', dbError);
      // Fall back to generic titles if DB query fails
      lessonTitle = `Bài học ${lessonId}`;
      lessonContent = 'Nội dung bài học không khả dụng.';
    }

    // Try to get a coding exercise linked to this lesson
    let language = 'javascript';
    let tests = [];

    try {
      // Check if there's a CodingExercise for this lesson
      const { query } = require('../config/db');

      const exerciseResults = await query(`
        SELECT ExerciseID, Title, Description, ProgrammingLanguage,
               InitialCode, TestCases
        FROM CodingExercises
        WHERE LessonID = @lessonId
      `, {
        lessonId: lessonId
      });

      if (exerciseResults && exerciseResults.length > 0) {
        const exerciseData = exerciseResults[0];

        // If we find an exercise, use its data
        if (exerciseData.Title) lessonTitle = exerciseData.Title;
        if (exerciseData.Description) lessonContent = exerciseData.Description;
        if (exerciseData.ProgrammingLanguage) language = exerciseData.ProgrammingLanguage.toLowerCase();
        if (exerciseData.InitialCode) initialCode = exerciseData.InitialCode;

        // Parse test cases if available
        if (exerciseData.TestCases) {
          try {
            tests = JSON.parse(exerciseData.TestCases);
          } catch (e) {
            console.error('Error parsing test cases:', e);
            tests = [];
          }
        }

        console.log('Found coding exercise:', exerciseData.ExerciseID);
      }
    } catch (exError) {
      console.error('Error fetching coding exercise:', exError);
      // Continue with lesson data if exercise fetch fails
    }

    // Create exercise object with the fetched data
    const exercise = {
      title: lessonTitle,
      description: lessonContent || 'Chưa có nội dung chi tiết cho bài học này.',
      language: language,
      initialCode: initialCode,
      moduleTitle: moduleTitle,
      tests: tests
    };

    return res.status(200).json({
      success: true,
      data: exercise
    });
  } catch (error) {
    console.error('Error getting code exercise:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving code exercise',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Run code with tests for a specific exercise
 */
exports.runCode = async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { code, language = 'cpp' } = req.body;
  const userId = req.user ? req.user.UserID : null;

  // Validate parameters
  if (!courseId || !lessonId || !code) {
    return res.status(400).json({
      success: false,
      message: 'Course ID, Lesson ID, and code are required'
    });
  }

  try {
    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log(`Running code execution for user ${userId}, course ${courseId}, lesson ${lessonId}, language ${language}`);

    try {
      // Use the execution helper instead of calling Docker directly
      const executionHelper = require('../utils/executionHelper');
      const result = await executionHelper.executeCode(code, language, '');

      return res.status(200).json({
        success: true,
        data: result.data || {
          stdout: '',
          stderr: '',
          exitCode: 0
        }
      });
    } catch (executionError) {
      console.error('Error executing code:', executionError);
      return res.status(500).json({
        success: false,
        message: 'Error executing code',
        error: executionError.message
      });
    }
  } catch (error) {
    console.error('Error running code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error running code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update lesson progress after a code submission
 */
async function updateLessonProgress(userId, lessonId, passed) {
  const { LessonProgress, sequelize } = require('../models');
  
  try {
    // Find or create progress record
    const [progress, created] = await LessonProgress.findOrCreate({
      where: {
        UserID: userId,
        LessonID: lessonId
      },
      defaults: {
        Status: passed ? 'completed' : 'in-progress',
        LastAttemptAt: new Date(),
        CompletedAt: passed ? new Date() : null
      }
    });
    
    // If not created, update the existing record
    if (!created) {
      await progress.update({
        Status: passed ? 'completed' : 'in-progress',
        LastAttemptAt: new Date(),
        CompletedAt: passed ? new Date() : progress.CompletedAt
      });
    }
    
    console.log(`Updated lesson progress for user ${userId}, lesson ${lessonId}, passed: ${passed}`);
    return true;
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return false;
  }
}
