import React from 'react';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-primary-600 to-secondary-600 flex justify-center items-center p-4">
      <div className="w-full max-w-5xl flex overflow-hidden rounded-lg shadow-2xl">
        <div className="hidden md:block md:w-1/2 bg-white p-10 flex flex-col justify-center items-center text-center">
          <div className="flex flex-col items-center justify-center">
            <img
              src="https://img.freepik.com/free-vector/online-certification-illustration_23-2148575636.jpg"
              alt="Cổng Thông Tin Giáo Viên"
              className="w-72 h-auto mb-8 rounded-lg shadow-md mx-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://cdn-icons-png.flaticon.com/512/3771/3771417.png";
              }}
            />
            <h2 className="text-2xl font-bold text-gray-800 mb-4 w-full text-center">Cổng Thông Tin Giáo Viên</h2>
            <p className="text-gray-600 text-center max-w-md mx-auto">
              Quản lý lớp học, học sinh và bài tập tại một nơi duy nhất.
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 bg-white py-12 px-6 sm:px-8 flex items-center justify-center">
          <div className="w-full max-w-md mx-auto">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 