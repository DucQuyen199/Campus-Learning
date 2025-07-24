/*-----------------------------------------------------------------
* File: geminiService.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';

// Default system prompt for the AI testcase generator
const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant that helps users by creating test cases for programming problems. 
Please follow these guidelines:

1. Given a problem description, create comprehensive test cases that cover various edge cases, normal inputs, and special situations.
2. For each test case, provide an input and the expected output.
3. Format your test cases as a JSON array with "input" and "expected" fields.
4. Keep your explanations clear and in Vietnamese when possible.
5. Format the test cases in this exact format:

\`\`\`json
[
  {
    "input": <input value (can be number, string, array, or object)>,
    "expected": <expected output (can be number, string, array, or object)>
  },
  // more test cases...
]
\`\`\`

For example, if the problem is to sum two numbers:

\`\`\`json
[
  {
    "input": [1, 2],
    "expected": 3
  },
  {
    "input": [-1, 5],
    "expected": 4
  }
]
\`\`\`

If you're asked to generate test cases for an algorithm problem, provide 5-10 diverse test cases that adequately test the solution.`;

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyD5MLI0_km4T5XdoFzdF6izDoFfgPiBp_g';
const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Initialize a chat session with Gemini AI
 * @returns {Object} Chat session object
 */
export const initGeminiChat = async () => {
  try {
    console.log('Initializing Gemini chat session');
    
    // Return a placeholder chat session
    return {
      id: `gemini-${Date.now()}`,
      created: new Date().toISOString(),
      messages: []
    };
  } catch (error) {
    console.error('Error initializing Gemini chat:', error);
    throw error;
  }
};

/**
 * Send a message to Gemini AI
 * @param {string} message - The user's message
 * @param {Array} prevMessages - Previous messages in the conversation
 * @returns {string} AI response
 */
export const sendMessageToGemini = async (message, prevMessages = []) => {
  try {
    // Format conversation history for the Gemini API
    const formattedPrevMessages = prevMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Create a proper payload based on Gemini API requirements
    const requestData = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${DEFAULT_SYSTEM_PROMPT}\n\nConversation History:\n${prevMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${message}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192
      }
    };
    
    // Call the Gemini API directly
    console.log('Sending request to Gemini API:', JSON.stringify(requestData));
    const response = await axios.post(GEMINI_API_URL, requestData);
    
    // Extract and return the response text
    if (response.data.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }
    }
    
    throw new Error('No valid response from Gemini API');
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    
    // Provide a fallback response if the API call fails
    return `Xin lỗi, có lỗi khi kết nối với AI. Error: ${error.message || 'Unknown error'}`;
  }
};

/**
 * Generate test cases for a programming problem
 * @param {string} problemDescription - Description of the programming problem
 * @returns {Array} Array of test cases
 */
export const generateTestCases = async (problemDescription) => {
  try {
    const prompt = `Tạo test cases cho bài toán sau: ${problemDescription}. 
    Hãy đảm bảo bao gồm các test cases phổ biến và cả các edge cases.`;
    
    const response = await sendMessageToGemini(prompt);
    
    // Extract test cases from the response
    const testCasesRegex = /```(json|javascript)?\s*\[{[\s\S]*?\}\]\s*```/g;
    const matches = response.match(testCasesRegex);
    
    if (matches && matches.length > 0) {
      try {
        // Extract the JSON content from the markdown code block
        const jsonString = matches[0].replace(/```(json|javascript)?\s*|\s*```/g, '');
        const parsedTestCases = JSON.parse(jsonString);
        
        // Validate that it's an array of test cases with input and expected output
        if (Array.isArray(parsedTestCases) && 
            parsedTestCases.length > 0 && 
            parsedTestCases[0].hasOwnProperty('input') && 
            parsedTestCases[0].hasOwnProperty('expected')) {
          return parsedTestCases;
        }
      } catch (e) {
        console.error('Failed to parse test cases from response', e);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error generating test cases:', error);
    throw error;
  }
}; 
