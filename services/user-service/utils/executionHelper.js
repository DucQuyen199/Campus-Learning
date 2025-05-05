/**
 * Execution Service Helper
 * 
 * Provides helper functions to communicate with the code execution service
 */

const axios = require('axios');

// Default configuration
const EXECUTION_SERVICE_URL = process.env.EXECUTION_SERVICE_URL || 'http://localhost:3001';
const EXECUTION_TIMEOUT = process.env.EXECUTION_TIMEOUT || 30000;

// Configure axios with timeout
const executionServiceClient = axios.create({
  baseURL: EXECUTION_SERVICE_URL,
  timeout: EXECUTION_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Execute code via the execution service
 * 
 * @param {string} code - Source code to execute
 * @param {string} language - Programming language
 * @param {string} stdin - Input to provide to the program
 * @returns {Object} Execution result
 */
async function executeCode(code, language, stdin = '') {
  try {
    // Check if code is likely to be interactive (contains input functions)
    const isLikelyInteractive = 
      (language === 'python' && code.includes('input(')) ||
      (language === 'javascript' && (code.includes('readline') || code.includes('prompt'))) ||
      (language === 'cpp' && (code.includes('cin >>') || code.includes('getline'))) ||
      (language === 'java' && (code.includes('Scanner') || code.includes('readLine')));

    console.log(`Executing ${language} code - interactive: ${isLikelyInteractive}`);
    
    // Try connecting to execution service
    try {
      const response = await executionServiceClient.post('/execute', {
        code,
        language,
        stdin
      });
      
      const result = response.data;
      
      // Add additional checks to detect if program is waiting for input
      if (result.success && result.data.stdout) {
        const lastLine = result.data.stdout.split('\n').pop();
        const isWaitingForInput = 
          result.data.isWaitingForInput ||
          lastLine.includes('?') || 
          lastLine.includes(':') ||
          lastLine.toLowerCase().includes('input') ||
          lastLine.toLowerCase().includes('enter') ||
          lastLine.toLowerCase().includes('nhập') ||
          (lastLine.trim().length > 0 && !lastLine.endsWith('\n'));
        
        if (isLikelyInteractive && isWaitingForInput) {
          result.data.isWaitingForInput = true;
          result.data.waitingPrompt = lastLine;
        }
      }
      
      return result;
    } catch (serviceError) {
      console.error('Execution service error:', serviceError.message);
      
      // Fall back to local execution if available and enabled
      if (process.env.ENABLE_LOCAL_FALLBACK === 'true') {
        console.log('Falling back to local execution');
        
        // Import the controller directly for fallback execution
        const { executeCodeWithFallback } = require('../controllers/codeExecutionController');
        const fallbackResult = await executeCodeWithFallback(code, language, stdin);
        
        return {
          success: true,
          data: fallbackResult,
          executionMethod: 'fallback'
        };
      }
      
      // If no fallback or fallback disabled, throw the original error
      throw serviceError;
    }
  } catch (error) {
    console.error('Error executing code:', error);
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Error executing code',
        error: error.response.data.error
      };
    }
    
    return {
      success: false,
      message: error.message || 'Error connecting to execution service',
      error: error.toString()
    };
  }
}

/**
 * Send input to a running execution
 * 
 * @param {string} executionId - ID of the running execution
 * @param {string} input - Input to send
 * @returns {Object} Updated execution state
 */
async function sendInput(executionId, input) {
  try {
    console.log(`Sending input to execution ${executionId}: "${input}"`);
    
    const response = await axios.post(`${EXECUTION_SERVICE_URL}/send-input`, {
      executionId,
      input
    });
    
    const result = response.data;
    
    // Add additional checks to detect if program is still waiting for input
    if (result.success && result.data) {
      // If there's no explicit flag, check the stdout for indications
      if (result.data.isWaitingForInput === undefined) {
        const stdout = result.data.stdout || '';
        const lastLine = stdout.split('\n').pop();
        
        const isWaitingForInput = 
          lastLine.includes('?') || 
          lastLine.includes(':') ||
          lastLine.toLowerCase().includes('input') ||
          lastLine.toLowerCase().includes('enter') ||
          lastLine.toLowerCase().includes('nhập') ||
          (lastLine.trim().length > 0 && !lastLine.endsWith('\n'));
          
        result.data.isWaitingForInput = isWaitingForInput;
        result.data.waitingPrompt = lastLine;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error sending input:', error);
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Error sending input',
        error: error.response.data.error
      };
    }
    
    return {
      success: false,
      message: error.message || 'Error connecting to execution service',
      error: error.toString()
    };
  }
}

/**
 * Stop a running execution
 * 
 * @param {string} executionId - ID of the running execution
 * @returns {Object} Final execution state
 */
async function stopExecution(executionId) {
  try {
    console.log(`Stopping execution ${executionId}`);
    
    const response = await axios.post(`${EXECUTION_SERVICE_URL}/stop`, {
      executionId
    });
    
    return response.data;
  } catch (error) {
    console.error('Error stopping execution:', error);
    
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Error stopping execution',
        error: error.response.data.error
      };
    }
    
    return {
      success: false,
      message: error.message || 'Error connecting to execution service',
      error: error.toString()
    };
  }
}

/**
 * Check if the execution service is healthy
 * 
 * @returns {Object} Health status
 */
async function checkHealth() {
  try {
    const response = await axios.get(`${EXECUTION_SERVICE_URL}/health`);
    
    return response.data;
  } catch (error) {
    console.error('Error checking execution service health:', error);
    
    return {
      success: false,
      message: error.message || 'Execution service is not available',
      error: error.toString()
    };
  }
}

module.exports = {
  executeCode,
  sendInput,
  stopExecution,
  checkHealth
}; 