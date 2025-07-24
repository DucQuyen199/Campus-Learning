/*-----------------------------------------------------------------
* File: browser-polyfill.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
// Browser compatibility polyfill
// This script helps ensure 'browser' is defined for extensions or scripts that expect it

(function() {
  // Create browser variable early in the global scope
  if (typeof browser === 'undefined') {
    // If chrome exists but browser doesn't, use chrome as browser (for extensions)
    if (typeof chrome !== 'undefined') {
      window.browser = chrome;
    } else {
      // Create a minimal browser object to prevent errors
      window.browser = {
        runtime: {
          sendMessage: function() {
            console.log('browser.runtime.sendMessage polyfill called');
            return Promise.resolve({});
          },
          onMessage: {
            addListener: function() {},
            removeListener: function() {}
          },
          connect: function() {
            return {
              onMessage: { addListener: function() {} },
              postMessage: function() {},
              disconnect: function() {}
            };
          }
        },
        storage: {
          local: {
            get: function() { return Promise.resolve({}); },
            set: function() { return Promise.resolve(); }
          }
        }
      };
    }
  }
  
  // Define it on all possible objects to ensure it's always available
  window.browser = window.browser || {};
  window.globalThis = window;
  window.globalThis.browser = window.browser;
  
  // Define a global start function to catch onpage-dialog.preload.js calls
  window.start = function() {
    console.log('Browser polyfill start() called');
    return {
      browser: window.browser,
      init: function() { return {}; },
      dispose: function() { return {}; },
      connect: function() { return {}; }
    };
  };
  
  // Add comprehensive error handling for browser-related errors
  window.addEventListener('error', function(event) {
    if (event && event.message && (
      event.message.includes('browser is not defined') ||
      event.message.includes('start is not defined') ||
      event.message.includes('cannot read properties of undefined')
    )) {
      console.warn('Suppressing browser compatibility error:', event.message);
      event.preventDefault();
      return true;
    }
    return false;
  }, true);
  
  console.log('Browser polyfill loaded');
})(); 
