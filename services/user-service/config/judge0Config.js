/*-----------------------------------------------------------------
* File: judge0Config.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
/**
 * Judge0 API Configuration
 * 
 * This file provides configuration for the Judge0 Code Execution API.
 * For production, set these values in environment variables.
 */

// To use Judge0 API:
// 1. Sign up for a free RapidAPI account at https://rapidapi.com
// 2. Subscribe to the Judge0 CE API at https://rapidapi.com/judge0-official/api/judge0-ce/
// 3. Get your API key from the "Security" tab
// 4. Set it in your environment variables or update the fallback value below

module.exports = {
  // API URL for Judge0
  JUDGE0_API_URL: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
  
  // API Host for RapidAPI
  JUDGE0_API_HOST: process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com',
  
  // Your RapidAPI Key - replace this with your actual key for production
  // ONLY FOR LOCAL DEVELOPMENT, don't commit real keys to source control
  JUDGE0_API_KEY: process.env.JUDGE0_API_KEY || '', 

  // If using the local solution without RapidAPI
  USE_LOCAL_EVALUATION: process.env.USE_LOCAL_EVALUATION === 'true' || !process.env.JUDGE0_API_KEY
}; 
