/**
 * VNPay jQuery Compatibility Fix
 * 
 * This script fixes jQuery.Deferred timer issues in VNPay integration.
 * Add this script before any VNPay scripts or include it in your HTML.
 */

(function() {
  // Define timer globals that VNPay scripts expect
  window.timer = window.timer || null;
  window.remainingSeconds = window.remainingSeconds || 900; // 15 minutes
  
  // Implement updateTime function
  window.updateTime = window.updateTime || function() {
    try {
      if (window.remainingSeconds <= 0) {
        clearInterval(window.timer);
        window.timer = null;
        return;
      }
      
      window.remainingSeconds--;
      
      // Update timer display if available
      var minutesEl = document.getElementById('minutes');
      var secondsEl = document.getElementById('seconds');
      if (minutesEl && secondsEl) {
        var minutes = Math.floor(window.remainingSeconds / 60);
        var seconds = window.remainingSeconds % 60;
        minutesEl.textContent = minutes < 10 ? '0' + minutes : minutes;
        secondsEl.textContent = seconds < 10 ? '0' + seconds : seconds;
      }
    } catch (e) {
      // Silent catch
    }
  };
  
  // Define startTimer function
  window.startTimer = window.startTimer || function(seconds) {
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
  
  // Define stopTimer function
  window.stopTimer = window.stopTimer || function() {
    if (window.timer) {
      clearInterval(window.timer);
      window.timer = null;
    }
  };
  
  // Create timer elements if they don't exist
  function createTimerElements() {
    if (!document.getElementById('minutes') || !document.getElementById('seconds')) {
      var timerContainer = document.createElement('div');
      timerContainer.style.display = 'none';
      timerContainer.id = 'vnpay-timer-container';
      
      var minutesElement = document.createElement('span');
      minutesElement.id = 'minutes';
      minutesElement.textContent = '15';
      
      var secondsElement = document.createElement('span');
      secondsElement.id = 'seconds';
      secondsElement.textContent = '00';
      
      timerContainer.appendChild(minutesElement);
      timerContainer.appendChild(document.createTextNode(':'));
      timerContainer.appendChild(secondsElement);
      
      document.body.appendChild(timerContainer);
    }
  }
  
  // Ensure timer elements exist when DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    createTimerElements();
  } else {
    document.addEventListener('DOMContentLoaded', createTimerElements);
  }
  
  // Wait for jQuery to load and patch it
  function patchJQuery() {
    if (window.jQuery) {
      var $ = window.jQuery;
      
      // Fix jQuery.Deferred timer error
      if ($.Deferred && $.Deferred.prototype.then) {
        var originalThen = $.Deferred.prototype.then;
        $.Deferred.prototype.then = function(success, failure) {
          var wrappedSuccess = success ? function(data) {
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
          
          var wrappedFailure = failure ? function(error) {
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
      var originalReady = $.fn.ready;
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
      
      console.info('VNPay jQuery compatibility patch applied');
    } else {
      // jQuery not loaded yet, check again later
      setTimeout(patchJQuery, 100);
    }
  }
  
  // Start patching jQuery
  patchJQuery();
  
  // Add global error handler to catch timer errors
  window.addEventListener('error', function(event) {
    if (event.message && (
      event.message.includes('timer is not defined') ||
      event.message.includes('updateTime')
    )) {
      event.preventDefault();
      return true; // Prevents the error from propagating
    }
    return false;
  }, true); // Use capture phase to catch errors early
  
  console.info('VNPay compatibility script loaded');
})(); 