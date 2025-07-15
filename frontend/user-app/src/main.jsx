// Polyfill for WebRTC compatibility
window.global = window;
window.process = { env: {} };

// Polyfill for browser API
if (typeof window !== 'undefined' && typeof window.browser === 'undefined') {
  window.browser = window.browser || window.chrome || {};
  
  // Add browser.runtime
  if (!window.browser.runtime) {
    window.browser.runtime = {
      sendMessage: () => Promise.resolve({}),
      onMessage: {
        addListener: () => {},
        removeListener: () => {}
      }
    };
  }
}

import { Buffer } from 'buffer';
window.Buffer = Buffer;

import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import store from './store'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import error handling utilities
import { suppressConsoleErrors } from './utils/errorHandling';

// Suppress common network errors in console
suppressConsoleErrors();

// Fix for VNPay script errors - must be defined before any scripts load
window.timer = null;
window.remainingSeconds = 900; // Default 15 minutes (typical VNPay timeout)

// Properly implement updateTime function that VNPay script is looking for
window.updateTime = function() {
  try {
    if (window.remainingSeconds <= 0) {
      // If timer has expired
      clearInterval(window.timer);
      window.timer = null;
      return;
    }
    
    window.remainingSeconds--;
    
    // Update any timer display elements that might exist
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    if (minutesElement && secondsElement) {
      const minutes = Math.floor(window.remainingSeconds / 60);
      const seconds = window.remainingSeconds % 60;
      
      minutesElement.textContent = minutes < 10 ? '0' + minutes : minutes;
      secondsElement.textContent = seconds < 10 ? '0' + seconds : seconds;
    }
  } catch (error) {
    // Silently catch any errors to prevent script crashes
    console.warn('VNPay timer error handled:', error.message);
  }
};

// Start timer function that VNPay might call
window.startTimer = function(seconds) {
  window.remainingSeconds = seconds || 900;
  
  if (window.timer) {
    clearInterval(window.timer);
  }
  
  window.timer = setInterval(function() {
    if (typeof window.updateTime === 'function') {
      window.updateTime();
    }
  }, 1000);
  
  return window.timer;
};

// Global error handler specifically for VS Code/code-server 
window.addEventListener('error', (event) => {
  if (event.message && (
    event.message.includes('browser is not defined') ||
    event.message.includes('vsda') ||
    event.message.includes('Workspace does not exist') ||
    event.message.includes('404 (Not Found)')
  )) {
    console.warn('Suppressing VS Code/code-server error:', event.message);
    event.preventDefault();
    return true;
  }
  return false;
}, true);

// Create a React Query client
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ 
        v7_startTransition: true, 
        v7_relativeSplatPath: true 
      }}>
        <QueryClientProvider client={queryClient}>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '890586528678-d33nj5dfqbptc5j5773g9mgkfsd45413.apps.googleusercontent.com'}>
            <AuthProvider>
              <SocketProvider>
                <ThemeProvider>
                  <App />
                </ThemeProvider>
              </SocketProvider>
            </AuthProvider>
          </GoogleOAuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
) 