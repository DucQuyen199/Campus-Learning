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
      }
    };
  }
  
  // Handle onpage-dialog.preload.js error
  window.addEventListener('error', (event) => {
    if (event.message && 
        (event.message.includes('browser is not defined') || 
         event.message.includes('cannot read properties of null (reading'))) {
      console.warn('Suppressing browser-related error:', event.message);
      event.preventDefault();
      return true;
    }
    return false;
  }, true);
}

export default {};