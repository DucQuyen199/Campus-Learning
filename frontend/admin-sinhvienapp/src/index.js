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

// Handle browser errors before anything else
try {
  // Patch for 'browser is not defined' error in onpage-dialog.preload.js
  if (typeof window !== 'undefined' && typeof window.browser === 'undefined') {
    window.browser = {
      runtime: {
        sendMessage: () => Promise.resolve({}),
        onMessage: {
          addListener: () => {},
          removeListener: () => {}
        }
      }
    };
  }
} catch (error) {
  console.error('Error patching browser object:', error);
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // Specifically handle the browser not defined error
  if (event.error && event.error.message && event.error.message.includes('browser is not defined')) {
    console.log('Handling browser not defined error');
    if (typeof window !== 'undefined') {
      window.browser = window.browser || {
        runtime: {
          sendMessage: () => Promise.resolve({}),
          onMessage: {
            addListener: () => {},
            removeListener: () => {}
          }
        }
      };
    }
  }
});

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
