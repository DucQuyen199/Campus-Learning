/*-----------------------------------------------------------------
* File: Register.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dateOfBirth: '',
    school: ''
  });
  const [error, setError] = useState('');
  const [schools, setSchools] = useState([]);
  const [isOtherSchool, setIsOtherSchool] = useState(false);

  useEffect(() => {
    // Load school list from CSV
    fetch('/data.csv')
      .then(res => res.text())
      .then(text => {
        const list = text.split(/\r?\n/).filter(line => line.trim() !== '');
        list.sort((a, b) => a.localeCompare(b, 'vi'));
        setSchools(list);
      })
      .catch(err => console.error('Error loading school list:', err));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      // Chuyển hướng đến trang đăng nhập sau khi đăng ký thành công
      navigate('/login', { state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' } });
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng ký tài khoản CampusLearning
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tham gia cộng đồng học tập trực tuyến lớn nhất
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Tên đăng nhập"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                name="fullName"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Họ và tên"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                name="dateOfBirth"
                type="date"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="schoolSelect" className="block text-sm font-medium text-gray-700 mb-1">Trường học</label>
              <div className="relative">
                <select
                  id="schoolSelect"
                  className="appearance-none block w-full rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3 pr-8 sm:text-sm bg-white"
                  value={isOtherSchool ? 'other' : formData.school}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'other') {
                      setIsOtherSchool(true);
                      setFormData({ ...formData, school: '' });
                    } else if (val !== '') {
                      setIsOtherSchool(false);
                      setFormData({ ...formData, school: val });
                    }
                  }}
                >
                  <option value="" disabled>Chọn trường học</option>
                  {schools.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="other">Khác (nhập tên trường)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ChevronDownIcon className="h-4 w-4" />
                </div>
              </div>
              {isOtherSchool && (
                <input
                  name="school"
                  type="text"
                  className="mt-2 appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm animate-fadeIn"
                  placeholder="Nhập trường khác"
                  value={formData.school}
                  onChange={handleChange}
                  autoFocus
                />
              )}
              {formData.school && !isOtherSchool && (
                <p className="mt-1 text-sm text-gray-500">
                  Đã chọn: <span className="font-medium text-gray-900">{formData.school}</span>
                </p>
              )}
            </div>
            <div>
              <input
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Xác nhận mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Đăng ký
            </button>
          </div>

          <div className="text-sm text-center">
            <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Đã có tài khoản? Đăng nhập
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

// Add a small CSS snippet for animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn 0.3s ease-out; }
`;
document.head.appendChild(style);
