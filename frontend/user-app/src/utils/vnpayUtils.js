/*-----------------------------------------------------------------
* File: vnpayUtils.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
/**
 * VNPay Integration Utilities
 * This file contains utility functions to handle VNPay-specific integration issues
 */

/**
 * Initialize VNPay timer functionality to prevent errors
 * Call this function at the earliest possible point in your application
 */
export const initializeVNPayTimer = () => {
  // Ensure timer variable exists
  if (window.timer === undefined) {
    window.timer = null;
  }
  
  // Ensure remainingSeconds exists
  if (window.remainingSeconds === undefined) {
    window.remainingSeconds = 900; // 15 minutes default
  }
  
  // Implement updateTime function if not already defined
  if (typeof window.updateTime !== 'function') {
    window.updateTime = function() {
      try {
        if (window.remainingSeconds <= 0) {
          // Timer expired
          clearInterval(window.timer);
          window.timer = null;
          return;
        }
        
        window.remainingSeconds--;
        
        // Update any timer display elements
        const minutesElement = document.getElementById('minutes');
        const secondsElement = document.getElementById('seconds');
        
        if (minutesElement && secondsElement) {
          const minutes = Math.floor(window.remainingSeconds / 60);
          const seconds = window.remainingSeconds % 60;
          
          minutesElement.textContent = minutes < 10 ? '0' + minutes : minutes;
          secondsElement.textContent = seconds < 10 ? '0' + seconds : seconds;
        }
      } catch (error) {
        // Silent catch
        console.warn('VNPay timer update error handled:', error.message);
      }
    };
  }
  
  // Implement startTimer function if not already defined
  if (typeof window.startTimer !== 'function') {
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
  }
  
  // Implement stopTimer function if not already defined
  if (typeof window.stopTimer !== 'function') {
    window.stopTimer = function() {
      if (window.timer) {
        clearInterval(window.timer);
        window.timer = null;
      }
    };
  }
  
  return {
    updateTime: window.updateTime,
    startTimer: window.startTimer,
    stopTimer: window.stopTimer
  };
};

/**
 * Patch VNPay jQuery script errors
 * Call this if you're having issues with VNPay jQuery code
 */
export const patchVNPayJQuery = () => {
  // Check if jQuery is loaded
  if (typeof window.jQuery === 'undefined' || !window.jQuery) {
    console.warn('jQuery not detected. VNPay may not function correctly.');
    return false;
  }
  
  const $ = window.jQuery;
  
  // Add a global error handler for jQuery Deferred objects
  if ($.Deferred) {
    const originalThen = $.Deferred.prototype.then;
    $.Deferred.prototype.then = function(success, failure) {
      return originalThen.call(
        this,
        success && function(data) {
          try {
            return success(data);
          } catch (e) {
            console.warn('VNPay jQuery Deferred error handled:', e.message);
            return data;
          }
        },
        failure && function(error) {
          try {
            return failure(error);
          } catch (e) {
            console.warn('VNPay jQuery Deferred error handled:', e.message);
            return error;
          }
        }
      );
    };
  }
  
  return true;
};

/**
 * Cleanup VNPay resources when leaving payment page
 * Call this when navigating away from payment pages
 */
export const cleanupVNPayResources = () => {
  // Clear any running timers
  if (window.timer) {
    clearInterval(window.timer);
    window.timer = null;
  }
  
  // Reset variables
  window.remainingSeconds = 900;
};

/**
 * Initialize VNPay elements and handle missing DOM issues
 * Call this when entering payment pages
 */
export const initializeVNPayElements = () => {
  // Create timer elements if they don't exist
  const createTimerElements = () => {
    // Check if timer elements already exist
    if (!document.getElementById('minutes') || !document.getElementById('seconds')) {
      // Create hidden timer elements to prevent errors
      const timerContainer = document.createElement('div');
      timerContainer.style.display = 'none';
      timerContainer.id = 'vnpay-timer-container';
      
      const minutesElement = document.createElement('span');
      minutesElement.id = 'minutes';
      minutesElement.textContent = '15';
      
      const secondsElement = document.createElement('span');
      secondsElement.id = 'seconds';
      secondsElement.textContent = '00';
      
      timerContainer.appendChild(minutesElement);
      timerContainer.appendChild(document.createTextNode(':'));
      timerContainer.appendChild(secondsElement);
      
      // Append to body
      document.body.appendChild(timerContainer);
    }
  };
  
  // Wait for DOM to be ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    createTimerElements();
  } else {
    document.addEventListener('DOMContentLoaded', createTimerElements);
  }
  
  // Start a new timer
  if (typeof window.startTimer === 'function') {
    window.startTimer(900); // 15 minutes
  }
};

// Monitor for VNPay script errors and fix dynamically
export const monitorVNPayScripts = () => {
  // Create a MutationObserver to watch for VNPay scripts being added
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'SCRIPT' && 
              (node.src.includes('vnpay') || 
               node.src.includes('custom.min.js'))) {
            // Initialize timer functionality
            initializeVNPayTimer();
            // Patch jQuery if needed
            patchVNPayJQuery();
          }
        });
      }
    });
  });
  
  // Start observing
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  return observer;
};

// Automatically initialize
initializeVNPayTimer(); 
