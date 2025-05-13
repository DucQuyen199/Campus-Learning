/**
 * Polyfills for browser-related functionality
 */

// Immediately define browser in global scope
if (typeof globalThis === 'undefined') {
  window.globalThis = window;
}

if (typeof browser === 'undefined') {
  globalThis.browser = window.browser || window.chrome || {};
}

// Polyfill for browser if it doesn't exist
if (typeof window !== 'undefined') {
  // Define browser in global scope first - ensure it exists BEFORE any code tries to use it
  window.browser = window.browser || globalThis.browser || window.chrome || {};
  
  // Global polyfill for browser.runtime
  if (!window.browser.runtime) {
    window.browser.runtime = {
      sendMessage: () => Promise.resolve({}),
      onMessage: {
        addListener: () => {},
        removeListener: () => {}
      },
      connect: () => ({
        onMessage: {
          addListener: () => {}
        },
        postMessage: () => {},
        disconnect: () => {}
      })
    };
  }
  
  // Add start function to global object - this is what onpage-dialog.preload.js uses
  if (typeof window.start === 'undefined') {
    window.start = function() {
      console.log('Polyfill for window.start called');
      // Return a reference to browser to avoid "browser is not defined" in onpage-dialog.preload.js
      return {
        browser: window.browser,
        init: () => {},
        dispose: () => {},
        connect: () => {}
      };
    };
  }
  
  // Handle onpage-dialog.preload.js errors more aggressively
  window.addEventListener('error', (event) => {
    if (event.message && 
        (event.message.includes('browser is not defined') || 
         event.message.includes('cannot read properties of null (reading') ||
         event.message.includes('start is not defined'))) {
      console.warn('Suppressing browser-related error:', event.message);
      event.preventDefault();
      return true;
    }
    return false;
  }, true);
}

export default {};