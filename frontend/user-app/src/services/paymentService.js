import axios from 'axios';
import { API_URL } from '../config';
import { cleanupVNPayResources, initializeVNPayTimer } from '../utils/vnpayUtils';

/**
 * Initialize global jQuery compatibility for VNPay
 * This fixes the jQuery Deferred timer issues
 */
const initializeJQueryVNPayCompat = () => {
  if (typeof window === 'undefined') return;

  // Wait for jQuery to load (VNPay loads it)
  const checkJQuery = setInterval(() => {
    if (window.jQuery) {
      clearInterval(checkJQuery);
      const $ = window.jQuery;

      // Fix jQuery.Deferred timer error
      if ($.Deferred && $.Deferred.prototype.then) {
        const originalThen = $.Deferred.prototype.then;
        $.Deferred.prototype.then = function(success, failure) {
          const wrappedSuccess = success ? function(data) {
            try {
              // Make sure timer is defined before callbacks run
              if (typeof window.timer === 'undefined') {
                window.timer = null;
                window.updateTime = window.updateTime || function() {};
              }
              return success(data);
            } catch (e) {
              console.warn('VNPay jQuery Deferred success error handled:', e.message);
              return $.Deferred().resolve(data).promise();
            }
          } : success;

          const wrappedFailure = failure ? function(error) {
            try {
              // Make sure timer is defined before callbacks run
              if (typeof window.timer === 'undefined') {
                window.timer = null;
                window.updateTime = window.updateTime || function() {};
              }
              return failure(error);
            } catch (e) {
              console.warn('VNPay jQuery Deferred failure error handled:', e.message);
              return $.Deferred().reject(error).promise();
            }
          } : failure;

          return originalThen.call(this, wrappedSuccess, wrappedFailure);
        };
      }

      // Fix jQuery document ready
      const originalReady = $.fn.ready;
      $.fn.ready = function(fn) {
        return originalReady.call(this, function() {
          try {
            // Make sure timer is defined before ready callbacks run
            if (typeof window.timer === 'undefined') {
              window.timer = null;
              window.updateTime = window.updateTime || function() {};
            }
            return fn.apply(this, arguments);
          } catch (e) {
            console.warn('VNPay jQuery ready error handled:', e.message);
          }
        });
      };
    }
  }, 100);

  // Clean up interval after 10 seconds
  setTimeout(() => clearInterval(checkJQuery), 10000);
};

/**
 * Inject jQuery timer fix to iframe or popup
 * @param {Window} targetWindow - Window to inject fix into
 */
const injectTimerFixToWindow = (targetWindow) => {
  try {
    if (!targetWindow) return;
    
    // Don't inject if already injected
    if (targetWindow._vnpayTimerFixed) return;
    
    // Set timer variables
    targetWindow.timer = targetWindow.timer || null;
    targetWindow.remainingSeconds = targetWindow.remainingSeconds || 900;
    
    // Implement updateTime function
    targetWindow.updateTime = targetWindow.updateTime || function() {
      try {
        if (targetWindow.remainingSeconds <= 0) {
          clearInterval(targetWindow.timer);
          targetWindow.timer = null;
          return;
        }
        
        targetWindow.remainingSeconds--;
        
        // Find timer elements
        const minutesElement = targetWindow.document.getElementById('minutes');
        const secondsElement = targetWindow.document.getElementById('seconds');
        
        if (minutesElement && secondsElement) {
          const minutes = Math.floor(targetWindow.remainingSeconds / 60);
          const seconds = targetWindow.remainingSeconds % 60;
          
          minutesElement.textContent = minutes < 10 ? '0' + minutes : minutes;
          secondsElement.textContent = seconds < 10 ? '0' + seconds : seconds;
        }
      } catch (error) {
        // Silent catch
      }
    };
    
    // Mark as fixed
    targetWindow._vnpayTimerFixed = true;
  } catch (error) {
    // Silently catch cross-origin errors
  }
};

/**
 * Payment service handles payment-related operations including VNPay integration
 */
const paymentService = {
  /**
   * Create a payment URL for the specified course
   * @param {object} paymentData - Payment data
   * @returns {Promise<string>} Payment URL
   */
  createPaymentUrl: async (paymentData) => {
    try {
      // Initialize VNPay timer fix
      initializeVNPayTimer();
      initializeJQueryVNPayCompat();
      
      const response = await axios.post(`${API_URL}/payments/create-payment-url`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment URL:', error);
      throw error.response?.data || { message: 'Could not create payment URL' };
    }
  },
  
  /**
   * Process a course payment via VNPay
   * @param {string} courseId - Course ID
   * @param {number} amount - Payment amount
   * @returns {Promise<object>} Payment result
   */
  processPayment: async (courseId, amount) => {
    try {
      // Initialize VNPay timer fix
      initializeVNPayTimer();
      initializeJQueryVNPayCompat();
      
      const paymentData = {
        courseId,
        amount,
        bankCode: '',
        language: 'vn',
        returnUrl: `${window.location.origin}/payment-callback?courseId=${courseId}`
      };
      
      const response = await axios.post(`${API_URL}/payments/process`, paymentData);
      
      // Open payment URL in new window if provided
      if (response.data && response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
        
        // This is a fix for redirection - can be uncommented if issues persist
        /*
        const paymentWindow = window.open(response.data.paymentUrl, '_blank');
        
        if (paymentWindow) {
          // Try to inject timer fix
          setTimeout(() => {
            try {
              injectTimerFixToWindow(paymentWindow);
            } catch (error) {
              // Silent catch for cross-origin issues
            }
          }, 1000);
        }
        */
      }
      
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error.response?.data || { message: 'Could not process payment' };
    }
  },
  
  /**
   * Verify a payment after callback
   * @param {object} queryParams - Query parameters from callback URL
   * @returns {Promise<object>} Verification result
   */
  verifyPayment: async (queryParams) => {
    try {
      // Clean up VNPay resources
      cleanupVNPayResources();
      
      const response = await axios.post(`${API_URL}/payments/verify`, { queryParams });
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error.response?.data || { message: 'Could not verify payment' };
    }
  },
  
  /**
   * Fix VNPay iframe or popup timer issues
   * Call this when opening a VNPay payment page
   * @param {string} paymentUrl - VNPay payment URL
   * @returns {Window|null} Payment window
   */
  openPaymentWindow: (paymentUrl) => {
    // Make sure timer is defined globally
    initializeVNPayTimer();
    initializeJQueryVNPayCompat();
    
    // Open payment in new window
    const paymentWindow = window.open(paymentUrl, '_blank');
    
    // Inject timer fix
    if (paymentWindow) {
      setTimeout(() => {
        try {
          injectTimerFixToWindow(paymentWindow);
        } catch (error) {
          // Silent catch for cross-origin issues
        }
      }, 1000);
      
      // Add unload handler to clean up resources
      window.addEventListener('unload', () => {
        if (!paymentWindow.closed) {
          paymentWindow.close();
        }
      });
    }
    
    return paymentWindow;
  }
};

export default paymentService; 