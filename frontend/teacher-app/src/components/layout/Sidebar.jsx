/*-----------------------------------------------------------------
* File: Sidebar.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  BellIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { selectSidebarOpen, toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';

const Sidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const isOpen = useSelector(selectSidebarOpen);
  
  const navItems = [
    { name: 'Tổng quan', path: '/dashboard', icon: <AcademicCapIcon className="w-6 h-6" /> },
    { name: 'Khóa học', path: '/courses', icon: <DocumentTextIcon className="w-6 h-6" /> },
    { name: 'Học sinh', path: '/students', icon: <UserGroupIcon className="w-6 h-6" /> },
    { name: 'Bài tập', path: '/assignments', icon: <DocumentTextIcon className="w-6 h-6" /> },
    { name: 'Thông báo', path: '/notifications', icon: <BellIcon className="w-6 h-6" /> },
    { name: 'Hồ sơ', path: '/profile', icon: <Cog6ToothIcon className="w-6 h-6" /> },
  ];
  
  const handleLogout = () => {
    dispatch(logout());
  };

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };
  
  return (
    <div className={`h-screen bg-primary-800 text-white transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-20'
    } fixed left-0 top-0 z-40`}>
      <div className="flex items-center justify-between h-16 border-b border-primary-700 px-4">
        {isOpen ? (
          <h1 className="text-xl font-bold">Teacher Portal</h1>
        ) : (
          <h1 className="text-xl font-bold mx-auto">TP</h1>
        )}
        {isOpen && (
          <button
            onClick={handleToggleSidebar}
            className="p-1 rounded-full hover:bg-primary-700 focus:outline-none"
            aria-label="Thu gọn menu"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <nav className="mt-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.name} className="px-4 py-2">
              <Link
                to={item.path}
                className={`flex items-center py-2 px-3 rounded-md transition-all duration-200 ${
                  location.pathname.startsWith(item.path)
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-200 hover:bg-primary-700 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {isOpen && <span>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Nút mở rộng khi sidebar thu gọn */}
      {!isOpen && (
        <div className="absolute top-20 -right-3">
          <button
            onClick={handleToggleSidebar}
            className="bg-primary-700 rounded-full p-1 shadow-md hover:bg-primary-600 focus:outline-none"
            aria-label="Mở rộng menu"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}
      
      <div className="absolute bottom-4 px-4 w-full">
        <button
          onClick={handleLogout}
          className="flex items-center py-2 px-3 w-full rounded-md transition-all duration-200 text-primary-200 hover:bg-primary-700 hover:text-white"
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6 mr-3" />
          {isOpen && <span>Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 
