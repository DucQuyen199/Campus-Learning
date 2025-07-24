/*-----------------------------------------------------------------
* File: codeExecutionApi.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';
import { API_URL } from './config';

/**
 * Execute code with the given language and stdin input
 * @param {string} code - Source code to execute
 * @param {string} language - Programming language (javascript, python, cpp, java)
 * @param {string} stdin - Input to provide to the program
 * @returns {Object} Execution result
 */
export const executeCode = async (code, language, stdin = '') => {
  try {
    const response = await axios.post(`${API_URL}/api/code-execution/execute`, {
      code,
      language,
      stdin
    });
    
    return response.data;
  } catch (error) {
    console.error('Error executing code:', error);
    throw error;
  }
};

/**
 * Send input to a running code execution
 * @param {string} executionId - ID of the running code execution
 * @param {string} input - Input to send to the running program
 * @returns {Object} Updated execution state
 */
export const sendInput = async (executionId, input) => {
  try {
    const response = await axios.post(`${API_URL}/api/code-execution/send-input`, {
      executionId,
      input
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending input:', error);
    throw error;
  }
};

/**
 * Stop a running code execution
 * @param {string} executionId - ID of the running code execution
 * @returns {Object} Final execution state
 */
export const stopExecution = async (executionId) => {
  try {
    const response = await axios.post(`${API_URL}/api/code-execution/stop-execution`, {
      executionId
    });
    
    return response.data;
  } catch (error) {
    console.error('Error stopping execution:', error);
    throw error;
  }
};

/**
 * Get supported programming languages
 * @returns {Array} List of supported languages
 */
export const getSupportedLanguages = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/code-execution/supported-languages`);
    
    return response.data.languages || [];
  } catch (error) {
    console.error('Error getting supported languages:', error);
    // Default languages if API fails
    return ['javascript', 'python', 'cpp', 'java'];
  }
};

/**
 * Execute code against a set of test cases
 * @param {string} code - Source code to execute
 * @param {string} language - Programming language
 * @param {Array} testCases - Array of test cases with input and expected output
 * @returns {Array} Test execution results
 */
export const runTestCases = async (code, language, testCases) => {
  try {
    // Run each test case individually
    const results = await Promise.all(testCases.map(async (testCase, index) => {
      const input = JSON.stringify(testCase.input);
      const testResult = await executeCode(code, language, input);
      
      const output = testResult.success ? testResult.data.stdout.trim() : 'Error';
      const expected = JSON.stringify(testCase.expected);
      const passed = output.includes(expected) || output === expected;
      
      return {
        id: index,
        input: testCase.input,
        expected: testCase.expected,
        actual: output,
        passed
      };
    }));
    
    return results;
  } catch (error) {
    console.error('Error running test cases:', error);
    throw error;
  }
}; 
