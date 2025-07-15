import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/authSlice';

const OtpLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const initialEmail = location.state?.email || '';

  const [stage, setStage] = useState(1); // 1: enter email, 2: enter OTP
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Refs and handlers for OTP input boxes
  const inputsRef = useRef([]);
  const verifyOtp = async (code) => {
    setLoading(true);
    setError('');
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login-otp/verify`,
        { email, otp: code }
      );
      const { token, refreshToken, user } = response.data;
      const processedUser = {
        ...user,
        token,
        UserID: user.id,
        username: user.username,
        role: (user.role || 'STUDENT').toUpperCase()
      };
      dispatch(setUser(processedUser));
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(processedUser));
      toast.success('Đăng nhập thành công');
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('Verify OTP Error:', err);
      toast.error(err.response?.data?.message || 'Không thể xác thực OTP');
      // Clear OTP inputs on invalid
      setOtp('');
      if (inputsRef.current[0]) inputsRef.current[0].focus();
    } finally {
      setLoading(false);
    }
  };
  const handleOtpInput = (e, idx) => {
    const raw = e.target.value;
    const val = raw.replace(/\D/g, '');
    const codeArr = otp.split('');
    if (!val) {
      // Clear this box on invalid entry
      codeArr[idx] = '';
      setOtp(codeArr.join(''));
      return;
    }
    codeArr[idx] = val;
    const newOtp = codeArr.join('').slice(0, 6);
    setOtp(newOtp);
    if (inputsRef.current[idx + 1]) inputsRef.current[idx + 1].focus();
    if (newOtp.length === 6) verifyOtp(newOtp);
  };
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp) {
      setError('OTP là bắt buộc');
      toast.error('Vui lòng nhập OTP');
      return;
    }
    verifyOtp(otp);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email là bắt buộc');
      toast.error('Vui lòng nhập email');
      return;
    }
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      await axios.post(`${API_BASE_URL}/api/auth/login-otp`, { email });
      toast.success('OTP đã được gửi đến email của bạn');
      setStage(2);
    } catch (err) {
      console.error('Send OTP Error:', err);
      toast.error(err.response?.data?.message || 'Không thể gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex min-h-screen">
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="max-w-md w-full px-6 py-12">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
              Đăng nhập bằng OTP
            </h2>
            {error && <p className="text-sm text-red-600 text-center mb-4">{error}</p>}
            {stage === 1 ? (
              <form className="space-y-6" onSubmit={handleSendOtp}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Email của bạn"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white font-medium transition duration-200 ${
                    loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Đang gửi OTP...' : 'Gửi OTP'}
                </button>
              </form>
            ) : (
              <div className="mt-8">
                <label className="block text-sm font-semibold text-gray-700 text-center">OTP</label>
                <div className="mt-2 flex justify-center space-x-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[idx] || ''}
                      onChange={(e) => handleOtpInput(e, idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                          inputsRef.current[idx - 1].focus();
                        }
                      }}
                      ref={(el) => (inputsRef.current[idx] = el)}
                      className="w-10 h-10 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setStage(1)}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Quay lại nhập email
                  </button>
                </div>
              </div>
            )}
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-blue-600 hover:underline">
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpLogin; 