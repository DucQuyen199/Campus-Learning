/*-----------------------------------------------------------------
* File: Header.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { selectSidebarOpen } from '../../store/slices/uiSlice';
import { selectCurrentUser, logout } from '../../store/slices/authSlice';
import { selectUnreadCount } from '../../store/slices/uiSlice';
import { useGetCurrentUserQuery } from '../../api/authApi';
import { useGetNotificationsQuery } from '../../api/notificationApi';

const Header = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isSidebarOpen = useSelector(selectSidebarOpen);
  const unreadCount = useSelector(selectUnreadCount);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Khởi tạo tải dữ liệu thông báo
  useGetNotificationsQuery({ status: 'unread', limit: 5 });
  const { data: userData } = useGetCurrentUserQuery();
  
  // Đóng menu người dùng khi nhấp chuột ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);
  
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  const handleLogout = () => {
    setUserMenuOpen(false);
    dispatch(logout());
  };
  
  return (
    <header className={`bg-white shadow-sm h-16 fixed top-0 z-30 transition-all duration-300 ${
      isSidebarOpen ? 'left-64' : 'left-20'
    } right-0`}>
      <div className="h-full flex justify-end items-center">        
        <div className="flex items-center space-x-4 mr-4">
          <div className="relative">
            <button 
              className="p-2 rounded-full hover:bg-gray-100 relative"
              aria-label={`${unreadCount} thông báo chưa đọc`}
            >
              <BellIcon className="h-6 w-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
          
          <div className="relative user-menu-container">
            <button 
              className="flex items-center text-gray-700 hover:text-primary-600 focus:outline-none"
              onClick={toggleUserMenu}
            >
              {userData?.user?.Avatar ? (
                <img 
                  src={userData.user.Avatar} 
                  alt={userData.user.FullName} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="w-8 h-8 text-gray-500" />
              )}
              <span className="ml-2 font-medium hidden md:block">
                {userData?.user?.FullName || user?.FullName || 'Giáo viên'}
              </span>
            </button>
            
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-20">
                <a 
                  href="/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Hồ sơ của bạn
                </a>
                <a 
                  href="/profile/settings" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cài đặt
                </a>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 
