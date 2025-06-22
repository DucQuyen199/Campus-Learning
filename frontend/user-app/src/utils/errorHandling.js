/**
 * Utility functions for handling network and connection errors
 */

/**
 * Suppress specific console errors based on patterns
 * @param {boolean} enabled - Whether to enable suppression
 */
export const suppressConsoleErrors = (enabled = true) => {
  if (!enabled || typeof window === 'undefined') return;
  
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Patterns to suppress
  const suppressPatterns = [
    'WebSocket connection to',
    'Socket connected',
    'failed: WebSocket is closed',
    '404 (Not Found)',
    '/calls/active',
    'Removing unpermitted intrinsics',
    'Chrome is moving towards',
    'third-party cookies',
    'paypalobjects.com',
    'datadoghq.com',
    'Access to XMLHttpRequest',
    'preload but not used',
    'blocked by CORS policy',
    'Content Security Policy',
    "'unsafe-eval' is not an allowed source",
    'unsafe-eval',
    'CSP',
    'Datadog Browser SDK',
    'datadog-rum.js',
    'preload for',
    'is found, but is not used because the request credentials mode does not match',
    'Refused to create a worker',
    'checkoutnow?token'
  ];
  
  // Override console.error
  console.error = function(...args) {
    // Check if any argument matches patterns to suppress
    const shouldSuppress = args.some(arg => {
      if (typeof arg === 'string') {
        return suppressPatterns.some(pattern => arg.includes(pattern));
      }
      if (arg instanceof Error) {
        return suppressPatterns.some(pattern => arg.message.includes(pattern));
      }
      return false;
    });
    
    if (!shouldSuppress) {
      originalConsoleError.apply(console, args);
    }
  };
  
  // Override console.warn
  console.warn = function(...args) {
    // Check if any argument matches patterns to suppress
    const shouldSuppress = args.some(arg => {
      if (typeof arg === 'string') {
        return suppressPatterns.some(pattern => arg.includes(pattern));
      }
      if (arg instanceof Error) {
        return suppressPatterns.some(pattern => arg.message.includes(pattern));
      }
      return false;
    });
    
    if (!shouldSuppress) {
      originalConsoleWarn.apply(console, args);
    }
  };
  
  // Return cleanup function
  return () => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  };
};

/**
 * Safe fetch wrapper that gracefully handles network errors
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise} - Promise that resolves even if network fails
 */
export const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // Log error only in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Network request failed: ${url}`, error);
    }
    // Return a fake response object that won't break code expecting a response
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      json: async () => ({ error: 'Network Error', message: error.message }),
      text: async () => 'Network Error',
    };
  }
};

/**
 * Graceful socket connection handler
 * @param {Object} socket - Socket.io instance
 * @param {Function} onError - Function to call on error
 */
export const handleSocketGracefully = (socket, onError = null) => {
  if (!socket) return;
  
  // Store original connect method
  const originalConnect = socket.connect;
  
  // Override connect to catch errors
  socket.connect = function() {
    try {
      return originalConnect.apply(socket, arguments);
    } catch (error) {
      // Silent fail for socket connections
      if (onError && typeof onError === 'function') {
        onError(error);
      }
      return socket;
    }
  };
  
  // Suppress connection errors
  socket.on('connect_error', (error) => {
    // Silent fail, optionally call handler
    if (onError && typeof onError === 'function') {
      onError(error);
    }
  });
  
  return socket;
}; 