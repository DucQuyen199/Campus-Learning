/*-----------------------------------------------------------------
* File: wasmRunner.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import api from '../services/api';

class CodeRunner {
  constructor() {
    this.initialized = {
      python: true,
      javascript: true,
      cpp: true,
      java: true,
      csharp: true,
      rust: true
    };
  }

  // Initialize the runner
  async initialize() {
    console.log("CodeRunner initialized (using Docker backend)");
    return true;
  }

  // Run code in Docker container on the backend
  async runCode({ code, language, stdin = '', args = [], timeout = 10000 }) {
    console.log(`Running ${language} code using Docker backend`);
    
    try {
      // Call the backend API to execute code in Docker
      const response = await api.executeCode(code, language, null, stdin);
      
      if (response && response.data && response.data.data) {
        const result = response.data.data;
        
        return {
          success: true,
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          error: null,
          language
        };
      } else {
        throw new Error('Invalid response from code execution API');
      }
    } catch (error) {
      console.error('Error executing code on Docker backend:', error);
      
      return {
        success: false,
        stdout: '',
        stderr: error.response?.data?.message || error.message || 'Unknown error executing code',
        error: error.message || 'Unknown error',
        language
      };
    }
  }

  // Methods to maintain API compatibility with the old implementation
  async runPython(code, stdin = '') {
    return this.runCode({ code, language: 'python', stdin });
  }
  
  async runJavaScript(code, stdin = '') {
    return this.runCode({ code, language: 'javascript', stdin });
  }
  
  async runCpp(code, stdin = '') {
    return this.runCode({ code, language: 'cpp', stdin });
  }
  
  async runJava(code, stdin = '') {
    return this.runCode({ code, language: 'java', stdin });
  }
  
  async runRust(code, stdin = '') {
    return this.runCode({ code, language: 'rust', stdin });
  }

  // Get supported languages
  getSupportedLanguages() {
    return [
      { id: 'javascript', name: 'JavaScript', extension: 'js', value: 'javascript' },
      { id: 'python', name: 'Python', extension: 'py', value: 'python' },
      { id: 'cpp', name: 'C++', extension: 'cpp', value: 'cpp' },
      { id: 'java', name: 'Java', extension: 'java', value: 'java' },
      { id: 'csharp', name: 'C#', extension: 'cs', value: 'csharp' }
    ];
  }

  isLanguageSupported(language) {
    return Object.keys(this.initialized).includes(language.toLowerCase());
  }

  isLanguageFullySupported(language) {
    return this.initialized[language.toLowerCase()] === true;
  }
}

// Export singleton instance
const codeRunner = new CodeRunner();
export default codeRunner; 
