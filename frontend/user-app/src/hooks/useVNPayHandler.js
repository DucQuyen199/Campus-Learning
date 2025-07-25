/*-----------------------------------------------------------------
* File: useVNPayHandler.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { useEffect } from 'react';
import { 
  initializeVNPayTimer, 
  patchVNPayJQuery, 
  monitorVNPayScripts
} from '../utils/vnpayUtils';

/**
 * Custom hook that handles VNPay integration issues
 * Fixes the 'timer is not defined' error in VNPay's script
 */
const useVNPayHandler = () => {
  useEffect(() => {
    // Initialize the VNPay timer to prevent "timer is not defined" errors
    const { updateTime, startTimer, stopTimer } = initializeVNPayTimer();
    
    // Patch jQuery for VNPay if jQuery is available
    patchVNPayJQuery();
    
    // Monitor for VNPay scripts being dynamically added to the page
    const observer = monitorVNPayScripts();
    
    // Intercept potential errors from VNPay scripts
    const originalConsoleError = console.error;
    console.error = function(message) {
      // Suppress VNPay related errors specifically
      if (message && 
          (typeof message === 'string' && (
            message.includes('timer is not defined') ||
            message.includes('updateTime')
          )) || 
          (message instanceof Error && (
            message.message.includes('timer is not defined') ||
            message.message.includes('updateTime')
          ))) {
        // Don't log these errors, retry the operation if possible
        if (typeof updateTime === 'function') {
          try {
            updateTime();
          } catch (e) {
            // Silent catch
          }
        }
        return;
      }
      originalConsoleError.apply(console, arguments);
    };
    
    // Suppress timer errors from jQuery and other third-party scripts
    const originalWindowError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      if (message && (
        message.includes('timer is not defined') ||
        message.includes('updateTime') ||
        (source && source.includes('custom.min.js'))
      )) {
        // Prevent the error from propagating
        return true;
      }
      
      // Call original handler
      if (typeof originalWindowError === 'function') {
        return originalWindowError.apply(window, arguments);
      }
      
      return false;
    };
    
    // Start a timer automatically to satisfy VNPay scripts
    if (typeof startTimer === 'function') {
      startTimer(900); // 15 minutes
    }
    
    return () => {
      // Restore original console.error
      console.error = originalConsoleError;
      
      // Restore original window.onerror
      window.onerror = originalWindowError;
      
      // Disconnect the observer
      if (observer) {
        observer.disconnect();
      }
      
      // Clean up timer if it exists
      if (typeof stopTimer === 'function') {
        stopTimer();
      } else if (window.timer) {
        clearTimeout(window.timer);
        window.timer = null;
      }
    };
  }, []);
};

export default useVNPayHandler; 
