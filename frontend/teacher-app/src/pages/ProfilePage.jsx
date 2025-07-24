/*-----------------------------------------------------------------
* File: ProfilePage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectToken } from '../store/slices/authSlice';
import axios from 'axios';

// Define API URL with fallback
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

const ProfilePage = () => {
  const user = useSelector(selectCurrentUser);
  const authToken = useSelector(selectToken); // Get token from Redux store
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    FullName: user?.FullName || '',
    Email: user?.Email || '',
    Bio: user?.Bio || '',
    DateOfBirth: user?.DateOfBirth || '',
    School: user?.School || '',
    PhoneNumber: user?.PhoneNumber || '',
    Address: user?.Address || '',
    City: user?.City || '',
    Country: user?.Country || '',
  });
  
  // Fetch detailed profile information when component mounts
  useEffect(() => {
    if (user?.UserID || user?.userId) {
      fetchUserDetails();
    }
  }, [user]);
  
  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      // Get token from localStorage or Redux store
      const token = localStorage.getItem('teacherToken') || authToken || user?.token;
      
      if (!token) {
        // Only show warning in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Using basic profile data from Redux store - no token available');
        }
        setLoading(false);
        return;
      }
      
      // Get user details from the API
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetching teacher profile from:', `${API_URL}/api/v1/teachers/profile`);
      }
      
      const response = await axios.get(`${API_URL}/api/v1/teachers/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Profile API response received');
      }
      
      if (response.data && response.data.teacher) {
        const teacherData = response.data.teacher;
        // Update profile data with fetched details
        setProfileData({
          FullName: teacherData.FullName || user?.FullName || '',
          Email: teacherData.Email || user?.Email || '',
          Bio: teacherData.Bio || '',
          DateOfBirth: teacherData.DateOfBirth ? new Date(teacherData.DateOfBirth).toISOString().split('T')[0] : '',
          School: teacherData.School || '',
          PhoneNumber: teacherData.PhoneNumber || '',
          Address: teacherData.Address || '',
          City: teacherData.City || '',
          Country: teacherData.Country || ''
        });
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching user details:', err?.response?.data || err.message);
      }
      // Don't show error to user for profile fetch failures, just use Redux data
      setProfileData({
        FullName: user?.FullName || '',
        Email: user?.Email || '',
        Bio: user?.Bio || '',
        DateOfBirth: user?.DateOfBirth || '',
        School: user?.School || '',
        PhoneNumber: user?.PhoneNumber || '',
        Address: user?.Address || '',
        City: user?.City || '',
        Country: user?.Country || '',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('teacherToken') || authToken || user?.token;
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }
      
      await axios.put(`${API_URL}/api/v1/teachers/profile`, profileData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local user data with new profile information
      if (dispatch) {
        // If you have an action to update the user in Redux store:
        // dispatch(updateUserProfile(profileData));
      }
      
      setIsEditing(false);
      // Show success message or refresh data
      setError(null);
      fetchUserDetails(); // Refresh the profile data
    } catch (err) {
      console.error('Error updating profile:', err?.response?.data || err.message);
      setError('Cập nhật thông tin thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Use fallback to user data if profileData fields are empty
  const displayData = {
    FullName: profileData.FullName || user?.FullName || 'Giáo viên',
    Email: profileData.Email || user?.Email || '',
    Role: user?.Role || 'TEACHER',
    Status: user?.Status || 'OFFLINE',
    AccountStatus: user?.AccountStatus || 'ACTIVE',
    // Other fields use profileData directly
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Hồ Sơ Của Tôi</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="w-32 h-32 rounded-full bg-primary-100 mx-auto flex items-center justify-center">
            {user?.Image || user?.Avatar ? (
              <img 
                src={user.Image || user.Avatar} 
                alt={displayData.FullName} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-primary-600">
                {displayData.FullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <h2 className="text-xl font-semibold mt-4">{displayData.FullName}</h2>
          <p className="text-gray-600">{displayData.Email}</p>
          
          <div className="mt-4 space-y-1 text-left">
            <p><span className="font-medium">Vai trò:</span> {displayData.Role === 'TEACHER' ? 'Giáo viên' : displayData.Role === 'ADMIN' ? 'Quản trị viên' : displayData.Role}</p>
            <p><span className="font-medium">Trạng thái:</span> <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${displayData.Status === 'ONLINE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {displayData.Status === 'ONLINE' ? 'Trực tuyến' : 'Ngoại tuyến'}
            </span></p>
            <p><span className="font-medium">Tài khoản:</span> <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${displayData.AccountStatus === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
              {displayData.AccountStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Không hoạt động'}
            </span></p>
          </div>
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            disabled={loading}
            className={`mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : (
              isEditing ? 'Hủy Chỉnh Sửa' : 'Chỉnh Sửa Hồ Sơ'
            )}
          </button>
        </div>
        
        {/* Profile Content */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6">
          {!isEditing ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Thông Tin Cá Nhân</h3>
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Họ và tên</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profileData.FullName || 'Chưa cập nhật'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profileData.Email || 'Chưa cập nhật'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Ngày sinh</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {profileData.DateOfBirth ? new Date(profileData.DateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Trường học</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profileData.School || 'Chưa cập nhật'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Số điện thoại</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profileData.PhoneNumber || 'Chưa cập nhật'}</dd>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Giới thiệu</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {profileData.Bio || 'Chưa có thông tin giới thiệu.'}
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Địa chỉ</h3>
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Địa chỉ</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profileData.Address || 'Chưa cập nhật'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Thành phố</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profileData.City || 'Chưa cập nhật'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Quốc gia</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profileData.Country || 'Chưa cập nhật'}</dd>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Thông Tin Cá Nhân</h3>
                  <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                    <div>
                      <label htmlFor="FullName" className="block text-sm font-medium text-gray-700">Họ và tên</label>
                      <input
                        type="text"
                        name="FullName"
                        id="FullName"
                        value={profileData.FullName}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="Email" className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        name="Email"
                        id="Email"
                        value={profileData.Email}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="DateOfBirth" className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                      <input
                        type="date"
                        name="DateOfBirth"
                        id="DateOfBirth"
                        value={profileData.DateOfBirth}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="School" className="block text-sm font-medium text-gray-700">Trường học</label>
                      <input
                        type="text"
                        name="School"
                        id="School"
                        value={profileData.School}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="PhoneNumber" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                      <input
                        type="tel"
                        name="PhoneNumber"
                        id="PhoneNumber"
                        value={profileData.PhoneNumber}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Giới thiệu</h3>
                  <textarea
                    name="Bio"
                    id="Bio"
                    rows={3}
                    value={profileData.Bio}
                    onChange={handleChange}
                    className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Địa chỉ</h3>
                  <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
                    <div>
                      <label htmlFor="Address" className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                      <input
                        type="text"
                        name="Address"
                        id="Address"
                        value={profileData.Address}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="City" className="block text-sm font-medium text-gray-700">Thành phố</label>
                      <input
                        type="text"
                        name="City"
                        id="City"
                        value={profileData.City}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="Country" className="block text-sm font-medium text-gray-700">Quốc gia</label>
                      <input
                        type="text"
                        name="Country"
                        id="Country"
                        value={profileData.Country}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
                  disabled={loading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      <div className="flex justify-center mt-8">
        <Link 
          to="/dashboard" 
          className="btn btn-primary"
        >
          Quay lại Bảng điều khiển
        </Link>
      </div>
    </div>
  );
};

export default ProfilePage; 
