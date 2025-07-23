import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation } from '../../api/authApi';
import { toast } from 'react-toastify';

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  
  // Lấy URL trả về từ location state hoặc từ localStorage hoặc mặc định là dashboard
  const redirectPath = localStorage.getItem('auth_redirect') || 
                     location.state?.from?.pathname || 
                     '/dashboard';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Email và mật khẩu là bắt buộc');
      return;
    }
    
    try {
      const result = await login(formData).unwrap();
      // Chỉ chuyển hướng khi nhận được phản hồi thành công
      if (result && result.token) {
        // Clear stored redirect path
        const redirectTo = redirectPath;
        localStorage.removeItem('auth_redirect');
        
        // Độ trễ nhỏ để cho phép cập nhật trạng thái
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 100);
      }
    } catch (error) {
      // Lỗi được xử lý trong API slice
      console.log('Lỗi đăng nhập:', error);
    }
  };
  
  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          {/* Custom Campus Logo with Book Elements and Text */}
          <div className="h-20 flex flex-col items-center">
            <div className="relative">
              <div className="h-14 w-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg rotate-45 flex items-center justify-center shadow-md">
                <div className="h-10 w-10 bg-white rounded-lg rotate-45 absolute"></div>
              </div>
              <div className="absolute -top-2 -right-6 w-16 h-4 bg-green-500 rounded-full transform -rotate-12"></div>
              <div className="absolute -bottom-1 -left-6 w-16 h-4 bg-blue-400 rounded-full transform rotate-12"></div>
              <div className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center -rotate-45">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <span className="mt-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-800">
              CampusLearning
            </span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Chào mừng trở lại</h1>
        <p className="text-gray-600">Đăng nhập vào tài khoản giáo viên của bạn</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700 block">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="nguyen.van@example.com"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 block">Mật khẩu</label>
            <a href="#" className="text-sm text-blue-600 hover:underline">Quên mật khẩu?</a>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            id="remember_me"
            name="remember_me"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-700">
            Ghi nhớ đăng nhập
          </label>
        </div>
        
        <button
          type="submit"
          className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-colors duration-200 ease-in-out"
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Chưa có tài khoản? <a href="#" className="text-blue-600 hover:underline font-medium">Liên hệ quản trị viên</a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
