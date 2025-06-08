import React, { useState, useEffect, useRef } from 'react';
import { 
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const EmailVerification = ({ onClose }) => {
  const [step, setStep] = useState('request'); // 'request', 'verify', 'success', 'error'
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6-digit OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  
  const inputRefs = useRef([]);
  
  // Request OTP when component mounts
  useEffect(() => {
    requestOTP();
  }, []);
  
  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  const requestOTP = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      const response = await fetch('/api/verification/email/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi mã xác thực.');
      }
      
      setEmail(data.email);
      setStep('verify');
      setCountdown(60); // 1 minute countdown for resend
      setSuccess('Mã xác thực đã được gửi đến email của bạn.');
      
      // Focus on first input field
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
      
    } catch (error) {
      console.error('Error requesting OTP:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const resendOTP = async () => {
    if (countdown > 0) return;
    
    try {
      setIsResending(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      const response = await fetch('/api/verification/email/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi lại mã xác thực.');
      }
      
      setCountdown(60); // Reset countdown
      setSuccess('Mã xác thực mới đã được gửi đến email của bạn.');
      
    } catch (error) {
      console.error('Error resending OTP:', error);
      setError(error.message);
    } finally {
      setIsResending(false);
    }
  };
  
  const verifyOTP = async () => {
    // Validate OTP - make sure all fields are filled
    if (otp.some(digit => digit === '')) {
      setError('Vui lòng nhập đầy đủ mã xác thực.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      
      const response = await fetch('/api/verification/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          otp: otp.join('')
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Không thể xác thực email.');
      }
      
      setStep('success');
      setSuccess('Email của bạn đã được xác thực thành công!');
      
      // Update user state
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.EmailVerified = true;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Dispatch an event to notify other components
        window.dispatchEvent(new CustomEvent('userUpdated', {
          detail: { user: currentUser }
        }));
      } catch (storageError) {
        console.error('Error updating user in localStorage:', storageError);
      }
      
      // Close the verification dialog after 2 seconds
      setTimeout(() => {
        if (onClose) onClose(true); // Pass true to indicate success
      }, 2000);
      
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (index, value) => {
    if (value.length > 1) {
      // If pasting multiple digits, distribute them
      const digits = value.split('');
      const newOtp = [...otp];
      
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        if (/^\d$/.test(digits[i])) {
          newOtp[index + i] = digits[i];
        }
      }
      
      setOtp(newOtp);
      
      // Focus on next available input or last input
      const nextIndex = Math.min(index + digits.length, 5);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
      
    } else if (/^\d$/.test(value) || value === '') {
      // For single digit or empty input
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // If typed a digit and not the last input, focus on next input
      if (value !== '' && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };
  
  const handleKeyDown = (index, e) => {
    // Handle backspace - move to previous input if current is empty
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // If pasted data is a 6-digit number, fill all inputs
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5].focus();
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          {step === 'success' ? (
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          ) : (
            <EnvelopeIcon className="h-6 w-6 text-blue-600" />
          )}
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900">
          {step === 'request' && 'Xác thực Email'}
          {step === 'verify' && 'Nhập mã xác thực'}
          {step === 'success' && 'Xác thực thành công'}
          {step === 'error' && 'Xác thực thất bại'}
        </h2>
        
        {step !== 'success' && (
          <p className="mt-2 text-gray-600">
            {step === 'request' && 'Chúng tôi sẽ gửi mã xác thực đến email của bạn.'}
            {step === 'verify' && `Vui lòng nhập mã 6 số đã được gửi đến ${email}`}
            {step === 'error' && 'Đã có lỗi xảy ra trong quá trình xác thực.'}
          </p>
        )}
      </div>
      
      {/* Success and Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start">
          <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
          <XCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* OTP Input */}
      {step === 'verify' && (
        <div className="my-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mã xác thực
          </label>
          
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                ref={el => inputRefs.current[index] = el}
                value={digit}
                onChange={e => handleInputChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                className="w-10 h-12 border border-gray-300 rounded-md text-center text-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={1}
                disabled={loading}
              />
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={resendOTP}
              disabled={countdown > 0 || loading || isResending}
              className={`text-sm ${countdown > 0 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'} flex items-center justify-center mx-auto`}
            >
              {isResending ? (
                <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại mã'
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Success State */}
      {step === 'success' && (
        <div className="my-6 text-center">
          <div className="flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="h-16 w-16 text-green-500" />
          </div>
          <p className="text-gray-700">
            Email của bạn đã được xác thực thành công. Bạn có thể tiếp tục sử dụng đầy đủ tính năng của hệ thống.
          </p>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-center">
        {step === 'verify' && (
          <button
            type="button"
            onClick={verifyOTP}
            disabled={loading || otp.some(digit => digit === '')}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              loading || otp.some(digit => digit === '')
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } flex items-center justify-center`}
          >
            {loading ? (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              'Xác thực'
            )}
          </button>
        )}
        
        {step === 'request' && (
          <button
            type="button"
            onClick={requestOTP}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            } flex items-center justify-center`}
          >
            {loading ? (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                Đang gửi...
              </>
            ) : (
              'Gửi mã xác thực'
            )}
          </button>
        )}
        
        {step === 'success' && (
          <button
            type="button"
            onClick={() => onClose && onClose(true)}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
          >
            Đóng
          </button>
        )}
        
        {step === 'error' && (
          <button
            type="button"
            onClick={() => setStep('request')}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
          >
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
};

export default EmailVerification; 