/**
 * VNPay jQuery Compatibility Fix v2.0
 * 
 * This script fixes jQuery.Deferred timer issues in VNPay integration.
 * Add this script before any VNPay scripts or include it in your HTML.
 * 
 * Updated to handle all known edge cases with VNPay integration.
 */

// Define timer globals that VNPay scripts expect
window.timer = window.timer || null;
window.remainingSeconds = window.remainingSeconds || 900; // 15 minutes

// Implement updateTime function to avoid errors
window.updateTime = window.updateTime || function() {
  try {
    if (window.remainingSeconds <= 0) {
      clearInterval(window.timer);
      window.timer = null;
      return;
    }

    window.remainingSeconds--;

    // Update timer display if available
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (minutesEl && secondsEl) {
      const minutes = Math.floor(window.remainingSeconds / 60);
      const seconds = window.remainingSeconds % 60;
      
      minutesEl.textContent = minutes < 10 ? '0' + minutes : minutes;
      secondsEl.textContent = seconds < 10 ? '0' + seconds : seconds;
    }
  } catch (e) {
    // Silent catch - prevent errors from bubbling up
  }
};

// Implement startTimer if not defined
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

// Implement stopTimer if not defined
window.stopTimer = window.stopTimer || function() {
  if (window.timer) {
    clearInterval(window.timer);
    window.timer = null;
  }
};

// Create hidden timer elements if they don't exist
function createTimerElements() {
  if (!document.getElementById('minutes') || !document.getElementById('seconds')) {
    const timerContainer = document.createElement('div');
    timerContainer.id = 'vnpay-timer-container';
    timerContainer.style.display = 'none';
    
    const minutesSpan = document.createElement('span');
    minutesSpan.id = 'minutes';
    minutesSpan.textContent = '15';
    
    const separator = document.createTextNode(':');
    
    const secondsSpan = document.createElement('span');
    secondsSpan.id = 'seconds';
    secondsSpan.textContent = '00';
    
    timerContainer.appendChild(minutesSpan);
    timerContainer.appendChild(separator);
    timerContainer.appendChild(secondsSpan);
    
    document.body.appendChild(timerContainer);
  }
}

// Fix VNPay navigation issue
function patchVNPayNavigation() {
  // Fix for VNPay redirect issues
  if (window.history && window.history.pushState) {
    // Store the original pushState
    const originalPushState = window.history.pushState;
    window.history.pushState = function() {
      try {
        return originalPushState.apply(this, arguments);
      } catch (e) {
        console.warn('VNPay history pushState error handled');
      }
    };
  }
}

// Try to create timer elements when DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  createTimerElements();
  patchVNPayNavigation();
} else {
  document.addEventListener('DOMContentLoaded', function() {
    createTimerElements();
    patchVNPayNavigation();
  });
}

// Add error handler for timer-related errors
window.addEventListener('error', function(event) {
  if (event.message && (
    event.message.includes('timer is not defined') ||
    event.message.includes('updateTime') ||
    event.message.includes('vnp') ||
    event.message.includes('VNP')
  )) {
    // Prevent the error from appearing in console
    event.preventDefault();
    return true;
  }
  return false;
}, true);

// Patch jQuery when it's loaded
(function patchjQuery() {
  if (window.jQuery) {
    try {
      const $ = window.jQuery;
      
      // Fix jQuery.Deferred timer error
      if ($.Deferred && $.Deferred.prototype.then) {
        const originalThen = $.Deferred.prototype.then;
        $.Deferred.prototype.then = function(success, failure) {
          try {
            const wrappedSuccess = success ? function(data) {
              try {
                // Ensure timer is defined before callback runs
                if (typeof window.timer === 'undefined') {
                  window.timer = null;
                }
                if (typeof window.updateTime === 'undefined') {
                  window.updateTime = function() {};
                }
                return success(data);
              } catch (e) {
                console.warn('VNPay jQuery Deferred success error handled:', e.message);
                return data;
              }
            } : success;
            
            const wrappedFailure = failure ? function(error) {
              try {
                // Ensure timer is defined before callback runs
                if (typeof window.timer === 'undefined') {
                  window.timer = null;
                }
                if (typeof window.updateTime === 'undefined') {
                  window.updateTime = function() {};
                }
                return failure(error);
              } catch (e) {
                console.warn('VNPay jQuery Deferred failure error handled:', e.message);
                return error;
              }
            } : failure;
            
            return originalThen.call(this, wrappedSuccess, wrappedFailure);
          } catch (e) {
            return originalThen.call(this, success, failure);
          }
        };
      }
      
      // Fix jQuery ready
      const originalReady = $.fn.ready;
      if (originalReady) {
        $.fn.ready = function(fn) {
          return originalReady.call(this, function() {
            try {
              // Ensure timer is defined before ready callback runs
              if (typeof window.timer === 'undefined') {
                window.timer = null;
              }
              if (typeof window.updateTime === 'undefined') {
                window.updateTime = function() {};
              }
              return fn.apply(this, arguments);
            } catch (e) {
              console.warn('VNPay jQuery ready error handled:', e.message);
            }
          });
        };
      }
      
      // Fix ajax error handling for VNPay
      if ($.ajax) {
        const originalAjax = $.ajax;
        $.ajax = function(options) {
          if (options && options.url && options.url.includes('vnpay')) {
            const originalError = options.error;
            options.error = function(xhr, status, error) {
              console.warn('VNPay AJAX error handled:', status);
              if (originalError) {
                try {
                  return originalError.apply(this, arguments);
                } catch (e) {
                  console.warn('VNPay AJAX error callback error:', e.message);
                }
              }
            };
          }
          return originalAjax.apply($, arguments);
        };
      }
      
      console.info('VNPay jQuery compatibility patch applied');
    } catch (e) {
      // Silent catch to prevent errors
      console.warn('VNPay patch error:', e.message);
    }
  } else {
    // Retry in 100ms
    setTimeout(patchjQuery, 100);
  }
})();

// Start a timer with default 15-minute countdown
window.startTimer(900);

console.info('VNPay compatibility script v2.0 loaded'); 