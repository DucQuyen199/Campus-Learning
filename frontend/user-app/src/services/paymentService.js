/*-----------------------------------------------------------------
* File: paymentService.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
   * Create VNPay payment URL for a specific course.
   * @param {string|number} courseId - Course ID.
   * @param {string|null} bankCode   - Optional VNPay bank code (e.g. "NCB", "VCB"). If null/undefined, VNPay will show bank selector.
   * @returns {Promise<object>}      - Response from backend containing paymentUrl & transactionId.
   */
  createPaymentUrl: async (courseId, bankCode = null) => {
    if (!courseId) throw new Error('courseId is required');

    try {
      // Init VNPay timer fixes in advance (applies when page redirects)
      initializeVNPayTimer();
      initializeJQueryVNPayCompat();

      // Build payload – only send bankCode when provided
      const payload = {};
      if (bankCode) payload.bankCode = bankCode;

      const response = await axios.post(`${API_URL}/courses/${courseId}/create-payment`, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating VNPay payment URL:', error);
      throw error.response?.data || { message: 'Could not create payment URL' };
    }
  },

  /**
   * Fetch list of supported banks from VNPay via backend.
   * @returns {Promise<Array>} List of banks (each object depends on VNPay spec).
   */
  getVNPayBankList: async () => {
    try {
      const response = await axios.get(`${API_URL}/vnpay/banks`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching VNPay bank list:', error);
      throw error.response?.data || { message: 'Could not fetch bank list' };
    }
  },
  
  /**
   * Deprecated API kept for backward-compat: now delegates to createPaymentUrl.
   * @param {string|number} courseId
   * @param {string|null} bankCode
   */
  processPayment: async (courseId, bankCode = null) => {
    try {
      // Generate payment URL via new endpoint
      const { paymentUrl } = await paymentService.createPaymentUrl(courseId, bankCode);
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
      return { paymentUrl };
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
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
   * Create VietQR payment for a specific course.
   * @param {string|number} courseId - Course ID.
   * @returns {Promise<object>} - Response from backend containing payment details.
   */
  createVietQRPayment: async (courseId) => {
    if (!courseId) throw new Error('courseId is required');

    try {
      const response = await axios.post(`${API_URL}/courses/${courseId}/create-vietqr`);
      return response.data;
    } catch (error) {
      console.error('Error creating VietQR payment:', error);
      throw error.response?.data || { message: 'Could not create VietQR payment' };
    }
  },

  /**
   * Verify a VietQR payment transaction.
   * @param {string} transactionCode - Transaction code to verify.
   * @returns {Promise<object>} - Response from backend with verification result.
   */
  verifyVietQRPayment: async (transactionCode) => {
    if (!transactionCode) throw new Error('transactionCode is required');

    try {
      const response = await axios.post(`${API_URL}/payments/verify-vietqr`, { transactionCode });
      return response.data;
    } catch (error) {
      console.error('Error verifying VietQR payment:', error);
      throw error.response?.data || { message: 'Could not verify VietQR payment' };
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
