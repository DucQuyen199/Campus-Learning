/**
 * Polyfills for browser-related functionality
 */

// Polyfill for browser if it doesn't exist
if (typeof window !== 'undefined') {
  // Global browser polyfill
  window.browser = window.browser || window.chrome || {};
  
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
  
  // Add start function to window object
  // This is used by onpage-dialog.preload.js
  if (typeof window.start === 'undefined') {
    window.start = function() {
      console.log('Polyfill for window.start called');
      return {
        browser: window.browser,
        init: () => {},
        dispose: () => {},
        connect: () => {}
      };
    };
  }
  
  // Set the browser variable globally to avoid "browser is not defined" error
  if (typeof browser === 'undefined') {
    window.browser = window.browser;
    try {
      // This is a hack to make browser available in the global scope
      // It won't work in strict mode, but the try/catch will prevent errors
      browser = window.browser;
    } catch (e) {
      console.warn('Could not set global browser variable:', e);
    }
  }
  
  // Handle onpage-dialog.preload.js error
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