/*-----------------------------------------------------------------
* File: codeRunner.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { courseServices } from '../services/api';
import axios from 'axios';

class CodeRunner {
  constructor() {
    this.initialized = false;
    this.dockerAvailable = false;
    this.supportedLanguages = {
      javascript: { runtime: 'Node.js', status: 'fully supported', version: '18.x' },
      python: { runtime: 'Python', status: 'fully supported', version: '3.10' },
      cpp: { runtime: 'GCC', status: 'fully supported', version: 'latest' },
      java: { runtime: 'OpenJDK', status: 'fully supported', version: '17' },
      csharp: { runtime: '.NET SDK', status: 'fully supported', version: '6.0' },
      rust: { runtime: 'Rust', status: 'partially supported', version: 'latest' }
    };
  }

  // Initialize the runner by checking Docker availability
  async initialize() {
    try {
      console.log("Initializing code execution environment...");
      
      // Check if Docker execution is available on the backend
      const response = await axios.get(`${process.env.VITE_API_URL || ''}/api/code-execution/health`);
      
      if (response.data && response.data.success === true) {
        console.log("Docker code execution is available:", response.data.details);
        this.dockerAvailable = true;
        
        // Update supported languages based on Docker availability
        const dockerDetails = response.data.details || {};
        
        // Log Docker details for debugging
        if (dockerDetails.version) {
          console.log(`Docker version: ${dockerDetails.version}`);
        }
      } else {
        console.warn("Docker code execution is NOT available. Using fallback methods.");
        this.dockerAvailable = false;
        
        // Update language support status for languages requiring Docker
        this.supportedLanguages.cpp.status = 'not supported';
        this.supportedLanguages.java.status = 'not supported';
        this.supportedLanguages.csharp.status = 'not supported';
        this.supportedLanguages.rust.status = 'not supported';
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize code execution environment:", error);
      
      // Default to fallback mode on error
      this.dockerAvailable = false;
      this.initialized = true;
      
      // Update language support status
      Object.keys(this.supportedLanguages).forEach(lang => {
        if (lang !== 'javascript' && lang !== 'python') {
          this.supportedLanguages[lang].status = 'not supported';
        }
      });
      
      return false;
    }
  }

  // Run code using backend API (Docker)
  async runCode({ code, language, stdin = '', args = [], timeout = 30000 }) {
    console.log(`Running ${language} code using execution service`);
    
    try {
      // If code contains input() calls but no stdin provided, use a default value
      if (code.includes('input(') && !stdin) {
        stdin = 'Test User';
        console.log('Input detected but no stdin provided, using default value:', stdin);
      }

      // Call the backend API to execute code
      const response = await courseServices.executeCode(code, language, null, stdin);
      
      if (response && response.data && response.data.data) {
        const result = response.data.data;
        
        // Add execution method for clarity in logs
        const executionMethod = result.executionMethod || (this.dockerAvailable ? 'docker' : 'fallback');
        console.log(`Code executed using ${executionMethod} method`);
        
        return {
          success: true,
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          error: null,
          language,
          executionMethod,
          inputProvided: !!stdin
        };
      } else {
        throw new Error('Invalid response from code execution API');
      }
    } catch (error) {
      console.error('Error executing code:', error);
      
      // Try to extract meaningful error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Unknown error executing code';
      
      // Check if it's a timeout error
      if (error.code === 'ECONNABORTED' || errorMessage.includes('timeout')) {
        return {
          success: false,
          stdout: '',
          stderr: 'Code execution timed out. If your code requires input, please provide it in the stdin field.',
          error: 'Timeout Error',
          language
        };
      }
      
      return {
        success: false,
        stdout: '',
        stderr: errorMessage,
        error: errorMessage,
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
    return this.supportedLanguages;
  }

  isLanguageSupported(language) {
    return !!this.supportedLanguages[language.toLowerCase()];
  }

  isLanguageFullySupported(language) {
    const lang = this.supportedLanguages[language.toLowerCase()];
    return lang && lang.status === 'fully supported';
  }
  
  // Get detailed language support info
  getLanguageSupportInfo(language) {
    if (!language || !this.supportedLanguages[language.toLowerCase()]) {
      return {
        supported: false,
        runtime: 'Unknown',
        dockerRequired: true,
        available: false
      };
    }
    
    const lang = this.supportedLanguages[language.toLowerCase()];
    const dockerRequired = language.toLowerCase() !== 'javascript';
    
    return {
      supported: lang.status !== 'not supported',
      runtime: lang.runtime,
      version: lang.version,
      dockerRequired,
      available: lang.status !== 'not supported' && (this.dockerAvailable || !dockerRequired)
    };
  }
}

// Export singleton instance
const codeRunner = new CodeRunner();
export default codeRunner; 
