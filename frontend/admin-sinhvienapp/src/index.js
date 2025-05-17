import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './styles/theme';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';
// Import browser polyfill
import './utils/browserPolyfill';
// Import axios config 
import './utils/axiosConfig';
// Import MUI Date Pickers Provider and adapter
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import viLocale from 'date-fns/locale/vi';

// Browser compatibility polyfill
if (typeof window !== 'undefined' && typeof window.browser === 'undefined') {
  window.browser = window.browser || window.chrome || {};
  
  // Ensure browser.runtime is defined
  if (!window.browser.runtime) {
    window.browser.runtime = {
      sendMessage: () => Promise.resolve({}),
      onMessage: {
        addListener: () => {},
        removeListener: () => {}
      }
    };
  }
  
  // Define global start function for external dialog scripts
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
}

// Suppress browser-related errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('browser is not defined') ||
      event.message.includes('start is not defined')
    )) {
      console.warn('Suppressing browser error:', event.message);
      event.preventDefault();
      return true;
    }
    return false;
  }, true);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={viLocale}>
              <CssBaseline />
              <Toaster position="top-center" />
              <App />
            </LocalizationProvider>
          </ThemeProvider>
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);
