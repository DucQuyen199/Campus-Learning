/*-----------------------------------------------------------------
* File: ResetPassword.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  // Check if token exists on page load
  useEffect(() => {
    if (!token) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.');
    }
  }, [token]);

  const validatePassword = (password) => {
    // Password must be at least 8 characters with at least 1 uppercase, 1 lowercase, and 1 number
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    const errors = {};
    if (!minLength) errors.minLength = 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!hasUppercase) errors.hasUppercase = 'Mật khẩu phải có ít nhất 1 chữ hoa';
    if (!hasLowercase) errors.hasLowercase = 'Mật khẩu phải có ít nhất 1 chữ thường';
    if (!hasNumber) errors.hasNumber = 'Mật khẩu phải có ít nhất 1 chữ số';
    
    return { isValid: Object.keys(errors).length === 0, errors };
  };
  
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setFormData({...formData, password: newPassword});
    
    // Clear confirmation password if it doesn't match
    if (formData.confirmPassword && formData.confirmPassword !== newPassword) {
      setFormErrors({...formErrors, confirmPassword: 'Mật khẩu không khớp'});
    } else if (formData.confirmPassword && formData.confirmPassword === newPassword) {
      const { confirmPassword, ...rest } = formErrors;
      setFormErrors(rest);
    }

    // Validate password as user types
    if (newPassword) {
      const { isValid, errors } = validatePassword(newPassword);
      if (!isValid) {
        setFormErrors({...formErrors, password: errors});
      } else {
        const { password, ...rest } = formErrors;
        setFormErrors(rest);
      }
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const confirmPassword = e.target.value;
    setFormData({...formData, confirmPassword});
    
    if (confirmPassword && confirmPassword !== formData.password) {
      setFormErrors({...formErrors, confirmPassword: 'Mật khẩu không khớp'});
    } else {
      const { confirmPassword, ...rest } = formErrors;
      setFormErrors(rest);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password
    const { isValid, errors } = validatePassword(formData.password);
    if (!isValid) {
      setFormErrors({...formErrors, password: errors});
      return;
    }
    
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setFormErrors({...formErrors, confirmPassword: 'Mật khẩu không khớp'});
      return;
    }
    
    // Check if token exists
    if (!token) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
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
        body: JSON.stringify({ 
          token, 
          newPassword: formData.password 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể đặt lại mật khẩu');
      }

      // Show success message
      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.' } 
        });
      }, 3000);
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo và tiêu đề */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center">
            <LockClosedIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {success ? 'Đặt lại mật khẩu thành công!' : 'Đặt lại mật khẩu'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {success 
              ? 'Mật khẩu của bạn đã được đặt lại. Bạn sẽ được chuyển hướng đến trang đăng nhập...' 
              : 'Nhập mật khẩu mới của bạn'
            }
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

        {/* Success message */}
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <div className="mt-2 text-sm text-green-700">
                  <p>Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!success && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              {/* Mật khẩu mới */}
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
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handlePasswordChange}
                    className={`appearance-none relative block w-full px-3 py-2 pl-10 border ${
                      formErrors.password ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Nhập mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <div className="mt-2 text-sm text-red-600">
                    <ul className="list-disc pl-5 space-y-1">
                      {formErrors.password.minLength && <li>{formErrors.password.minLength}</li>}
                      {formErrors.password.hasUppercase && <li>{formErrors.password.hasUppercase}</li>}
                      {formErrors.password.hasLowercase && <li>{formErrors.password.hasLowercase}</li>}
                      {formErrors.password.hasNumber && <li>{formErrors.password.hasNumber}</li>}
                    </ul>
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.
                </p>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`appearance-none relative block w-full px-3 py-2 pl-10 border ${
                      formErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                    placeholder="Xác nhận mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !token}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  (loading || !token) ? 'opacity-50 cursor-not-allowed' : ''
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
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword; 
