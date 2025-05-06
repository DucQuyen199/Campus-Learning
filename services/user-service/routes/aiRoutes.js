const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authMiddleware = require('../middlewares/authMiddleware');

// Initialize Gemini API with the provided API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY');

/**
 * Generate a chat response using Gemini AI
 */
router.post('/gemini-chat', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required'
      });
    }
    
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured'
      });
    }
    
    // Configure the model - Gemini 1.0 Pro
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Start a chat session
    const chat = model.startChat({
      history: messages.filter(msg => msg.role !== 'system'),
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });
    
    // Send the message to Gemini and get the response
    const result = await chat.sendMessage(messages[messages.length - 1].parts[0].text);
    const response = result.response.text();
    
    // Return the response
    return res.status(200).json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Error generating Gemini chat response:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error generating AI response',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Generate test cases for a programming problem
 */
router.post('/generate-testcases', authMiddleware, async (req, res) => {
  try {
    const { problemDescription } = req.body;
    
    if (!problemDescription) {
      return res.status(400).json({
        success: false,
        message: 'Problem description is required'
      });
    }
    
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured'
      });
    }
    
    // Configure the model - Gemini 1.0 Pro
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Create the prompt for test case generation
    const prompt = `
    You are an AI assistant that helps users by creating test cases for programming problems.
    
    Given a problem description, create comprehensive test cases that cover various edge cases, normal inputs, and special situations.
    For each test case, provide an input and the expected output.
    Format your test cases as a JSON array with "input" and "expected" fields.
    
    Problem description: ${problemDescription}
    
    Generate 5-10 test cases that cover various scenarios for this problem.
    Format your response as a JSON array like this:
    
    [
      {
        "input": <input value (can be number, string, array, or object)>,
        "expected": <expected output (can be number, string, array, or object)>
      },
      // more test cases...
    ]
    `;
    
    // Generate test cases
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Try to extract test cases from the response
    const testCasesRegex = /```(json|javascript)?\s*(\[{[\s\S]*?\}\])\s*```/;
    const matches = response.match(testCasesRegex);
    
    if (matches && matches.length > 2) {
      try {
        const jsonString = matches[2];
        const testCases = JSON.parse(jsonString);
        
        return res.status(200).json({
          success: true,
          testCases
        });
      } catch (parseError) {
        console.error('Error parsing test cases JSON:', parseError);
        
        return res.status(500).json({
          success: false,
          message: 'Error parsing generated test cases',
          rawResponse: response
        });
      }
    }
    
    // If we couldn't extract test cases, return the raw response
    return res.status(200).json({
      success: true,
      testCases: [],
      rawResponse: response
    });
  } catch (error) {
    console.error('Error generating test cases:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error generating test cases',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 