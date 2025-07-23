/**
 * Code Execution Service
 * 
 * This service handles code execution in a sandboxed environment.
 * It runs as a separate process that can be containerized and isolated.
 */

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { spawn, exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

// Promisify functions
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const unlinkAsync = promisify(fs.unlink);
const rmdirAsync = promisify(fs.rmdir);
const execAsync = promisify(exec);

// Configuration
const PORT = process.env.EXECUTION_SERVICE_PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';  // Listen on all interfaces
const MAX_EXECUTION_TIME = parseInt(process.env.MAX_EXECUTION_TIME || 30000);
const MAX_MEMORY_LIMIT = parseInt(process.env.MAX_MEMORY_LIMIT || 512);
const TEMP_DIR = path.join('/tmp', 'CampusLearning-code-execution');

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Initialize Express app
const app = express();
app.use(cors());  // Enable CORS for all routes
app.use(bodyParser.json({ limit: '5mb' }));

// Add API prefix for all execution routes
const apiRouter = express.Router();
app.use('/api/code-execution', apiRouter);

// Map to track running executions
const runningExecutions = new Map();

// Configuration for supported languages
const LANGUAGE_CONFIGS = {
    javascript: {
        extension: 'js',
        runCommand: (file) => `node ${file}`,
    },
    python: {
        extension: 'py',
        runCommand: (file) => `python3 ${file}`,
    },
    cpp: {
        extension: 'cpp',
        // First compile, then run the executable
        compileCommand: (file, output) => `g++ -o ${output} ${file}`,
        runCommand: (file) => `./${path.basename(file, '.cpp')}`,
    },
    java: {
        extension: 'java',
        // Compile Java file with main class
        compileCommand: (file) => `javac ${file}`,
        // Run Java class
        runCommand: (file) => `java -Xmx256m -cp ${path.dirname(file)} ${path.basename(file, '.java')}`,
    }
};

// Execute code endpoint
apiRouter.post('/execute', async (req, res) => {
    const { code, language, stdin = '', testCases = [] } = req.body;
    
    if (!code || !language) {
        return res.status(400).json({
            success: false,
            message: 'Code and language are required'
        });
    }
    
    // Check if language is supported
    if (!LANGUAGE_CONFIGS[language]) {
        return res.status(400).json({
            success: false,
            message: `Language '${language}' is not supported`
        });
    }
    
    try {
        // Generate unique ID for this execution
        const executionId = uuidv4();
        
        // Create execution directory
        const executionDir = path.join(TEMP_DIR, executionId);
        try {
            await mkdirAsync(executionDir, { recursive: true });
        } catch (dirError) {
            console.error(`Failed to create temp directory: ${dirError.message}`);
            return res.status(500).json({
                success: false,
                message: 'Failed to create execution environment',
                error: dirError.message
            });
        }
        
        // Get language configuration
        const config = LANGUAGE_CONFIGS[language];
        
        // Create code file
        const fileName = `code.${config.extension}`;
        const filePath = path.join(executionDir, fileName);
        
        await writeFileAsync(filePath, code);
        
        // Create input file if stdin is provided
        let stdinFilePath = null;
        if (stdin) {
            stdinFilePath = path.join(executionDir, 'input.txt');
            await writeFileAsync(stdinFilePath, stdin);
        }
        
        // Compile code if needed
        if (config.compileCommand) {
            const outputFile = path.basename(filePath, `.${config.extension}`);
            const outputPath = path.join(executionDir, outputFile);
            
            const compileCommand = config.compileCommand(filePath, outputPath);
            try {
                await execAsync(compileCommand, { cwd: executionDir });
            } catch (compileError) {
                // Clean up
                await cleanupExecution(executionId, executionDir);
                
                return res.status(200).json({
                    success: false,
                    executionId,
                    data: {
                        stdout: '',
                        stderr: compileError.stderr || 'Compilation error',
                        exitCode: 1,
                        language,
                        executionMethod: 'sandbox'
                    }
                });
            }
        }
        
        // Execute code
        const runCommand = config.runCommand(filePath);
        
        // Run command with timeout and memory limits
        let executionProcess;
        
        // Check if code likely contains input functions - used for interactive detection
        const containsInputFunctions = 
            (language === 'python' && code.includes('input(')) ||
            (language === 'javascript' && (code.includes('readline') || code.includes('process.stdin'))) ||
            (language === 'cpp' && (code.includes('cin >>') || code.includes('getline'))) ||
            (language === 'java' && (code.includes('Scanner') || code.includes('readLine')));
        
        // For Python programs, we'll pipe stdin directly to allow real-time interaction
        // instead of using input files
        if (language === 'python' && containsInputFunctions) {
            executionProcess = spawn('python3', [filePath], {
                cwd: executionDir,
                timeout: MAX_EXECUTION_TIME
            });
        } else if (stdinFilePath) {
            // Run with stdin from file
            executionProcess = spawn('sh', ['-c', `${runCommand} < ${stdinFilePath}`], {
                cwd: executionDir,
                timeout: MAX_EXECUTION_TIME
            });
        } else {
            // Run without stdin
            executionProcess = spawn('sh', ['-c', runCommand], {
                cwd: executionDir,
                timeout: MAX_EXECUTION_TIME
            });
        }
        
        // Store process in running executions map
        runningExecutions.set(executionId, {
            process: executionProcess,
            stdout: '',
            stderr: '',
            exitCode: null,
            language,
            startTime: Date.now(),
            isInteractive: containsInputFunctions,
            lastOutputLine: ''
        });
        
        // Collect output
        let stdout = '';
        let stderr = '';
        
        executionProcess.stdout.on('data', (data) => {
            const chunk = data.toString();
            stdout += chunk;
            
            // Update stored output
            const execution = runningExecutions.get(executionId);
            if (execution) {
                execution.stdout += chunk;
                // Keep track of the last line for input detection
                const lines = chunk.split('\n');
                if (lines.length > 0) {
                  const lastLine = lines[lines.length - 1];
                  if (lastLine !== '') {
                    execution.lastOutputLine = lastLine;
                    
                    // Explicitly check for input patterns
                    const isInputPrompt = lastLine.includes('?') || 
                                          lastLine.includes(':') ||
                                          lastLine.toLowerCase().includes('input') ||
                                          lastLine.toLowerCase().includes('enter') ||
                                          lastLine.toLowerCase().includes('nhập') ||
                                          lastLine.trim().length > 0;
                    
                    if (isInputPrompt && containsInputFunctions) {
                      execution.isInteractive = true;
                      isWaitingForInput = true;
                    }
                  }
                }
            }
        });
        
        executionProcess.stderr.on('data', (data) => {
            const chunk = data.toString();
            stderr += chunk;
            
            // Update stored output
            const execution = runningExecutions.get(executionId);
            if (execution) {
                execution.stderr += chunk;
            }
        });
        
        // Handle completion
        executionProcess.on('close', async (code) => {
            // Update exit code
            const execution = runningExecutions.get(executionId);
            if (execution) {
                execution.exitCode = code;
            }
            
            // Clean up if this was a one-time execution and not interactive
            if (!containsInputFunctions) {
                // Delete from running executions
                runningExecutions.delete(executionId);
                
                // Clean up files
                await cleanupExecution(executionId, executionDir);
            }
        });
        
        // Check if this is likely an interactive program or a simple program
        const isInteractiveExecution = containsInputFunctions || 
            stdin.includes('input(') || 
            stdin.includes('Enter') || 
            stdin.includes('enter') ||
            stdin.includes('Input:');
        
        // For non-interactive code, wait for completion
        if (!isInteractiveExecution) {
            // Wait for process to complete
            const exitCode = await new Promise((resolve) => {
                executionProcess.on('close', (code) => resolve(code));
                
                // Set timeout to kill the process if it takes too long
                setTimeout(() => {
                    if (executionProcess && !executionProcess.killed) {
                        executionProcess.kill();
                        resolve(124); // 124 is the timeout exit code
                    }
                }, MAX_EXECUTION_TIME);
            });
            
            // Return final output
            res.status(200).json({
                success: true,
                executionId,
                data: {
                    stdout,
                    stderr,
                    exitCode,
                    language,
                    executionMethod: 'sandbox',
                    executionTime: Date.now() - runningExecutions.get(executionId)?.startTime || 0
                }
            });
            
            // Delete from running executions
            runningExecutions.delete(executionId);
            
            // Clean up files
            await cleanupExecution(executionId, executionDir);
        } else {
            // For interactive code, we need to wait a bit to capture initial output
            // before responding to the client
            setTimeout(() => {
                const execution = runningExecutions.get(executionId);
                const currentOutput = execution ? execution.stdout : stdout;
                
                // Check if the last line looks like an input prompt
                const lastLine = execution?.lastOutputLine || '';
                const isWaitingForInput = 
                    lastLine.includes('?') || 
                    lastLine.includes(':') ||
                    lastLine.toLowerCase().includes('input') ||
                    lastLine.toLowerCase().includes('enter') ||
                    lastLine.toLowerCase().includes('nhập') ||
                    lastLine.trim().length > 0 && !lastLine.trim().endsWith('\n');
                
                // For interactive code, return execution ID for further interaction
                res.status(200).json({
                    success: true,
                    executionId,
                    data: {
                        stdout: currentOutput,
                        stderr,
                        isWaitingForInput,
                        waitingPrompt: lastLine,
                        isInteractive: true,
                        language,
                        executionMethod: 'sandbox'
                    }
                });
            }, 300); // Wait 300ms to capture initial output
        }
    } catch (error) {
        console.error('Execution error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error executing code',
            error: error.message
        });
    }
});

// Send input to running process
apiRouter.post('/send-input', (req, res) => {
    const { executionId, input } = req.body;
    
    if (!executionId || input === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Execution ID and input are required'
        });
    }
    
    // Get execution from map
    const execution = runningExecutions.get(executionId);
    
    if (!execution || !execution.process || execution.process.killed) {
        return res.status(404).json({
            success: false,
            message: 'Execution not found or already completed'
        });
    }
    
    try {
        // Reset the last output line to detect new prompts
        execution.lastOutputLine = '';
        
        // Track the stdout length before sending input, to identify new output
        const stdoutLengthBefore = execution.stdout.length;
        
        // Send input to process
        execution.process.stdin.write(input + '\n');
        
        // Collect new output (give it a moment to process)
        setTimeout(() => {
            // Extract only the new output that appeared after sending input
            const newStdout = execution.stdout.substring(stdoutLengthBefore);
            
            // Check if the last line looks like another input prompt
            const lastLine = execution.lastOutputLine || '';
            const isWaitingForInput = 
                lastLine.includes('?') || 
                lastLine.includes(':') ||
                lastLine.toLowerCase().includes('input') ||
                lastLine.toLowerCase().includes('enter') ||
                lastLine.toLowerCase().includes('nhập') ||
                lastLine.trim().length > 0;
            
            // Check if more inputs are expected based on the detected input count
            // and the inputs already provided
            const moreInputsExpected = execution.isInteractive && isWaitingForInput;
            
            // Set the needsInput flag for the response
            const needsInput = moreInputsExpected;
            
            res.status(200).json({
                success: true,
                data: {
                    stdout: newStdout || '',  // Return only the new output
                    fullStdout: execution.stdout, // Also include the full output
                    stderr: execution.stderr,
                    isWaitingForInput,
                    needsInput,
                    waitingPrompt: lastLine,
                    isInteractive: execution.isInteractive,
                    language: execution.language,
                    executionMethod: 'sandbox'
                }
            });
        }, 500);
    } catch (error) {
        console.error('Error sending input:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error sending input',
            error: error.message
        });
    }
});

// Stop execution
apiRouter.post('/stop', async (req, res) => {
    const { executionId } = req.body;
    
    if (!executionId) {
        return res.status(400).json({
            success: false,
            message: 'Execution ID is required'
        });
    }
    
    // Get execution from map
    const execution = runningExecutions.get(executionId);
    
    if (!execution) {
        return res.status(404).json({
            success: false,
            message: 'Execution not found'
        });
    }
    
    try {
        // Kill process if it's still running
        if (execution.process && !execution.process.killed) {
            execution.process.kill();
        }
        
        // Remove from map
        runningExecutions.delete(executionId);
        
        // Clean up files
        const executionDir = path.join(TEMP_DIR, executionId);
        await cleanupExecution(executionId, executionDir);
        
        res.status(200).json({
            success: true,
            message: 'Execution stopped',
            data: {
                stdout: execution.stdout,
                stderr: execution.stderr,
                exitCode: execution.exitCode || 1,
                language: execution.language,
                executionMethod: 'sandbox'
            }
        });
    } catch (error) {
        console.error('Error stopping execution:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error stopping execution',
            error: error.message
        });
    }
});

// Helper function to clean up execution files
async function cleanupExecution(executionId, executionDir) {
    try {
        // Delete all files in the directory
        const files = fs.readdirSync(executionDir);
        for (const file of files) {
            await unlinkAsync(path.join(executionDir, file)).catch(err => 
                console.log(`Warning: Unable to delete file ${file}:`, err.message)
            );
        }
        
        // Delete directory
        await rmdirAsync(executionDir).catch(err => 
            console.log(`Warning: Unable to delete directory ${executionDir}:`, err.message)
        );
        
        console.log(`Cleaned up execution ${executionId}`);
        return true;
    } catch (error) {
        console.error(`Error cleaning up execution ${executionId}:`, error);
        return false;
    }
}

// Health check endpoint
apiRouter.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Execution service is running',
        timestamp: new Date().toISOString(),
        dockerAvailable: true,
        features: {
            languages: Object.keys(LANGUAGE_CONFIGS),
            interactive: true,
            testCases: true
        }
    });
});

// Add root health endpoint to fix 404 errors
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Execution service is running',
        timestamp: new Date().toISOString(),
        dockerAvailable: true,
        features: {
            languages: Object.keys(LANGUAGE_CONFIGS),
            interactive: true,
            testCases: true
        }
    });
});

// Execute code against multiple test cases
apiRouter.post('/execute-tests', async (req, res) => {
    const { code, language, testCases } = req.body;
    
    if (!code || !language || !testCases || !Array.isArray(testCases)) {
        return res.status(400).json({
            success: false,
            message: 'Code, language, and testCases array are required'
        });
    }
    
    // Check if language is supported
    if (!LANGUAGE_CONFIGS[language]) {
        return res.status(400).json({
            success: false,
            message: `Language '${language}' is not supported`
        });
    }
    
    try {
        const results = [];
        let passedCount = 0;
        const totalCount = testCases.length;
        
        // Process each test case
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            const { input, output: expectedOutput } = testCase;
            
            // Generate unique ID for this execution
            const executionId = uuidv4();
            
            // Create execution directory
            const executionDir = path.join(TEMP_DIR, executionId);
            await mkdirAsync(executionDir, { recursive: true });
            
            // Get language configuration
            const config = LANGUAGE_CONFIGS[language];
            
            // Create code file
            const fileName = `code.${config.extension}`;
            const filePath = path.join(executionDir, fileName);
            
            await writeFileAsync(filePath, code);
            
            // Create input file if stdin is provided
            let stdinFilePath = null;
            if (input) {
                stdinFilePath = path.join(executionDir, 'input.txt');
                await writeFileAsync(stdinFilePath, input);
            }
            
            // Compile code if needed
            if (config.compileCommand) {
                const outputFile = path.basename(filePath, `.${config.extension}`);
                const outputPath = path.join(executionDir, outputFile);
                
                const compileCommand = config.compileCommand(filePath, outputPath);
                try {
                    await execAsync(compileCommand, { cwd: executionDir });
                } catch (compileError) {
                    // Clean up
                    await cleanupExecution(executionId, executionDir);
                    
                    // Add all test cases as failed due to compilation error
                    const results = testCases.map(() => ({
                        passed: false,
                        actualOutput: '',
                        error: compileError.stderr || 'Compilation error',
                        executionTime: 0
                    }));
                    
                    return res.status(200).json({
                        success: false,
                        data: {
                            passedCount: 0,
                            totalCount,
                            results
                        }
                    });
                }
            }
            
            // Execute code for this test case
            let stdout = '';
            let stderr = '';
            let exitCode = 0;
            const startTime = Date.now();
            
            try {
                let runCommand;
                
                if (stdinFilePath) {
                    // Run with stdin from file
                    runCommand = `${config.runCommand(filePath)} < ${stdinFilePath}`;
                } else {
                    // Run without stdin
                    runCommand = config.runCommand(filePath);
                }
                
                // Execute with timeout
                const { stdout: processStdout, stderr: processStderr } = 
                    await execAsync(runCommand, { 
                            cwd: executionDir,
                        timeout: MAX_EXECUTION_TIME,
                        maxBuffer: 1024 * 1024  // 1MB buffer
                    });
                
                stdout = processStdout;
                stderr = processStderr;
            } catch (runError) {
                stderr = runError.stderr || 'Execution error';
                exitCode = runError.code || 1;
            }
            
            const executionTime = Date.now() - startTime;
            
            // Clean up
            await cleanupExecution(executionId, executionDir);
            
            // Normalize outputs for comparison
            const normalizedActual = normalizeOutput(stdout);
            const normalizedExpected = normalizeOutput(expectedOutput);
            
            // Check if test case passed
            const passed = normalizedActual === normalizedExpected && exitCode === 0 && !stderr;
            
            if (passed) {
                passedCount++;
            }
            
            // Add result with detailed comparison information
            results.push({
                passed,
                input,
                expectedOutput,
                actualOutput: stdout,
                normalizedActual: normalizedActual,  // Include normalized outputs for debugging
                normalizedExpected: normalizedExpected,
                error: stderr,
                executionTime,
                diffInfo: passed ? null : generateDiffInfo(normalizedExpected, normalizedActual)
            });
        }
        
        // Return results
        return res.status(200).json({
            success: true,
            data: {
                passedCount,
                totalCount,
                results
            }
        });
    } catch (error) {
        console.error(`Error executing test cases: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Failed to execute test cases',
            error: error.message
        });
    }
});

// Normalize output for comparison
function normalizeOutput(output) {
    if (!output) return '';
    
    return output
        .trim()
        .replace(/\r\n|\r|\n/g, '\n')  // Normalize line endings
        .replace(/\s+/g, ' ')          // Replace multiple spaces with single space
        .replace(/[ \t]+(\n)/g, '$1')  // Remove trailing spaces before newlines
        .replace(/(\n)[ \t]+/g, '$1')  // Remove leading spaces after newlines
        .replace(/^\s+|\s+$/g, '')     // Remove leading/trailing whitespace again to be safe
        .toLowerCase();                // Case-insensitive comparison
}

// Add helper function to generate diff information
function generateDiffInfo(expected, actual) {
    if (expected === actual) return null;
    
    // If lengths are different, report that
    if (expected.length !== actual.length) {
        return {
            type: 'length_mismatch',
            message: `Expected output length: ${expected.length}, Actual output length: ${actual.length}`
        };
    }
    
    // Find the first position where they differ
    let position = 0;
    for (; position < expected.length; position++) {
        if (expected[position] !== actual[position]) break;
    }
    
    // Extract context around the difference
    const contextStart = Math.max(0, position - 10);
    const contextEnd = Math.min(expected.length, position + 10);
    const expectedContext = expected.substring(contextStart, contextEnd);
    const actualContext = actual.substring(contextStart, contextEnd);
    
    return {
        type: 'content_mismatch',
        message: `Outputs differ at position ${position}`,
        expectedContext,
        actualContext,
        position
    };
}

// Add a global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err);
    res.status(500).json({
        success: false,
        status: 'error',
        message: err.message || 'Internal server error',
        error: err.name || 'UnknownError',
        timestamp: new Date().toISOString()
    });
});

// Add a fallback route handler for 404 errors
app.use((req, res) => {
    res.status(404).json({
        success: false,
        status: 'error',
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString()
    });
});

// Start the server
app.listen(PORT, HOST, () => {
    console.log(`Execution service running on ${HOST}:${PORT}`);
    console.log(`Supported languages: ${Object.keys(LANGUAGE_CONFIGS).join(', ')}`);
    console.log(`Execution timeout: ${MAX_EXECUTION_TIME}ms`);
    console.log(`Temporary directory: ${TEMP_DIR}`);
});

// Handle shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down execution service');
    
    // Kill all running processes
    for (const [executionId, execution] of runningExecutions.entries()) {
        if (execution.process && !execution.process.killed) {
            execution.process.kill();
        }
        
        // Clean up files
        const executionDir = path.join(TEMP_DIR, executionId);
        await cleanupExecution(executionId, executionDir);
    }
    
    process.exit(0);
}); 