/*-----------------------------------------------------------------
* File: browserPolyfill.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
// Browser environment detection and polyfill
try {
  // Only execute in browser environment
  if (typeof window !== 'undefined') {
    // Check if browser object is not defined
    if (typeof window.browser === 'undefined') {
      // Create a mock browser object
      window.browser = {
        runtime: {
          sendMessage: () => Promise.resolve({}),
          onMessage: {
            addListener: () => {},
            removeListener: () => {}
          }
        }
      };
      console.log('Browser polyfill applied');
    }
  }
} catch (error) {
  console.error('Error applying browser polyfill:', error);
}

// No export needed, this is a side-effect only module 
