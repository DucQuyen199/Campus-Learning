// Browser compatibility polyfill
// This script helps ensure 'browser' is defined for extensions or scripts that expect it

(function() {
  if (typeof window !== 'undefined' && typeof browser === 'undefined') {
    // If chrome exists but browser doesn't, use chrome as browser (for extensions)
    if (typeof chrome !== 'undefined') {
      window.browser = chrome;
    } else {
      // Create a minimal browser object to prevent errors
      window.browser = {
        runtime: {
          sendMessage: function() {
            console.warn('browser.runtime.sendMessage called but browser is not available');
            return Promise.resolve();
          },
          onMessage: {
            addListener: function() {
              console.warn('browser.runtime.onMessage.addListener called but browser is not available');
            }
          }
        },
        storage: {
          local: {
            get: function() {
              console.warn('browser.storage.local.get called but browser is not available');
              return Promise.resolve({});
            },
            set: function() {
              console.warn('browser.storage.local.set called but browser is not available');
              return Promise.resolve();
            }
          }
        }
      };
    }
    console.log('Browser polyfill loaded');
  }
})(); 