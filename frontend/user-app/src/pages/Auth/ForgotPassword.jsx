import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, ExclamationCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP, Step 3: New Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    
    // Reset error states
    setError('');
    setValidationError('');
    
    // Validate email
    if (!email.trim()) {
      setValidationError('Vui lòng nhập địa chỉ email');
      return;
    }
    
    if (!validateEmail(email)) {
      setValidationError('Địa chỉ email không hợp lệ');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get API URL from environment
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      
      const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể gửi yêu cầu đặt lại mật khẩu');
      }
      
      setUserId(data.userId);
      setSuccessMessage(`Mã OTP đã được gửi đến email ${email}`);
      setStep(2); // Move to OTP input step
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    // Reset error states
    setError('');
    setValidationError('');
    
    // Validate OTP
    if (!otp.trim() || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setValidationError('Mã OTP phải có 6 chữ số');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get API URL from environment
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      
      const response = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, otp })
      });

      const data = await response.json();

      if (!response.ok || !data.verified) {
        throw new Error(data.message || 'Mã OTP không hợp lệ');
      }
      
      // OTP verified, move to password reset step
      setSuccessMessage('Xác thực mã OTP thành công. Vui lòng nhập mật khẩu mới.');
      setStep(3);
    } catch (error) {
      console.error('OTP verification error:', error);
      setError(error.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Reset error states
    setError('');
    setValidationError('');
    
    // Validate password
    if (!password.trim() || password.length < 6) {
      setValidationError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    if (password !== confirmPassword) {
      setValidationError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get API URL from environment
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, otp, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể đặt lại mật khẩu');
      }
      
      // Password reset successful
      setSuccessMessage('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
      setStep(4); // Success message
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: // Email input
        return (
          <form className="mt-8 space-y-6" onSubmit={handleRequestOTP}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setValidationError('');
                  }}
                  className={`appearance-none relative block w-full px-3 py-2 pl-10 border ${
                    validationError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Nhập địa chỉ email"
                />
                {validationError && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                  </div>
                )}
              </div>
              {validationError && (
                <p className="mt-2 text-sm text-red-600" id="email-error">
                  {validationError}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                ← Quay lại trang đăng nhập
              </Link>
            </div>
          </form>
        );
        
      case 2: // OTP verification
        return (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
            {successMessage && (
              <div className="rounded-md bg-green-50 p-4 mb-4">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Mã OTP
              </label>
              <div className="relative">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').substring(0, 6));
                    setValidationError('');
                  }}
                  className={`appearance-none relative block w-full px-3 py-2 border text-center tracking-widest ${
                    validationError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10 sm:text-sm`}
                  placeholder="Nhập mã 6 số"
                />
                {validationError && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                  </div>
                )}
              </div>
              {validationError && (
                <p className="mt-2 text-sm text-red-600">
                  {validationError}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Mã OTP đã được gửi đến email của bạn. Mã có hiệu lực trong 1 giờ.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
              </button>
            </div>

            <div className="text-center flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                ← Quay lại
              </button>
              <button
                type="button"
                onClick={handleRequestOTP}
                disabled={loading}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Gửi lại mã OTP
              </button>
            </div>
          </form>
        );
        
      case 3: // New password
        return (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            {successMessage && (
              <div className="rounded-md bg-green-50 p-4 mb-4">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setValidationError('');
                    }}
                    className={`appearance-none relative block w-full px-3 py-2 pl-10 border ${
                      validationError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10 sm:text-sm`}
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setValidationError('');
                    }}
                    className={`appearance-none relative block w-full px-3 py-2 pl-10 border ${
                      validationError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10 sm:text-sm`}
                    placeholder="Xác nhận mật khẩu mới"
                  />
                  {validationError && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                  )}
                </div>
                {validationError && (
                  <p className="mt-2 text-sm text-red-600">
                    {validationError}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                ← Quay lại
              </button>
            </div>
          </form>
        );
        
      case 4: // Success
        return (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Đặt lại mật khẩu thành công!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Mật khẩu của bạn đã được thay đổi thành công.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-green-600 hover:text-green-500"
                  >
                    ← Quay lại trang đăng nhập
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo và tiêu đề */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center">
            <EnvelopeIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Quên mật khẩu
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 && "Nhập email để nhận mã OTP đặt lại mật khẩu"}
            {step === 2 && "Nhập mã OTP đã được gửi đến email của bạn"}
            {step === 3 && "Tạo mật khẩu mới cho tài khoản của bạn"}
            {step === 4 && "Mật khẩu đã được đặt lại thành công"}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderStepContent()}
      </div>
    </div>
  );
};

export default ForgotPassword; 