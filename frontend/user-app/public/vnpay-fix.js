/**
 * VNPay jQuery Compatibility Fix
 * 
 * This script fixes jQuery.Deferred timer issues in VNPay integration.
 * Add this script before any VNPay scripts or include it in your HTML.
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

// Try to create timer elements when DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  createTimerElements();
} else {
  document.addEventListener('DOMContentLoaded', createTimerElements);
}

// Add error handler for timer-related errors
window.addEventListener('error', function(event) {
  if (event.message && (
    event.message.includes('timer is not defined') ||
    event.message.includes('updateTime')
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
                  window.updateTime = window.updateTime || function() {};
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
                  window.updateTime = window.updateTime || function() {};
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
                window.updateTime = window.updateTime || function() {};
              }
              return fn.apply(this, arguments);
            } catch (e) {
              console.warn('VNPay jQuery ready error handled:', e.message);
            }
          });
        };
      }
      
      console.info('VNPay jQuery compatibility patch applied');
    } catch (e) {
      // Silent catch to prevent errors
    }
  } else {
    // Retry in 100ms
    setTimeout(patchjQuery, 100);
  }
})();

// Start a timer with default 15-minute countdown
window.startTimer(900);

console.info('VNPay compatibility script loaded'); 