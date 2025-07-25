/*-----------------------------------------------------------------
* File: Layout.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { selectSidebarOpen } from '../../store/slices/uiSlice';
import Header from './Header';
import Sidebar from './Sidebar';

// Pages
import DashboardPage from '../../pages/DashboardPage';
import CoursesPage from '../../pages/CoursesPage';
import CourseDetailPage from '../../pages/CourseDetailPage';
import CourseEditPage from '../../pages/CourseEditPage';
import ModuleDetailPage from '../../pages/ModuleDetailPage';
import LessonDetailPage from '../../pages/LessonDetailPage';
import LessonEditPage from '../../pages/LessonEditPage';
import StudentsPage from '../../pages/StudentsPage';
import StudentDetailPage from '../../pages/StudentDetailPage';
import AssignmentsPage from '../../pages/AssignmentsPage';
import AssignmentDetailPage from '../../pages/AssignmentDetailPage';
import NotificationsPage from '../../pages/NotificationsPage';
import ProfilePage from '../../pages/ProfilePage';
import NotFoundPage from '../../pages/NotFoundPage';

const Layout = () => {
  const isSidebarOpen = useSelector(selectSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Header */}
        <Header />
        
        {/* Main Content Area */}
        <main className="flex-1 p-4 mt-16 overflow-auto">
          <div className="container mx-auto">
            <Routes>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Main routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Courses */}
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/courses/:id/edit" element={<CourseEditPage />} />
              <Route path="/courses/:courseId/modules/:moduleId" element={<ModuleDetailPage />} />
              <Route path="/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<LessonDetailPage />} />
              <Route path="/courses/:courseId/modules/:moduleId/lessons/:lessonId/edit" element={<LessonEditPage />} />
              
              {/* Students */}
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/:id" element={<StudentDetailPage />} />
              
              {/* Assignments */}
              <Route path="/assignments" element={<AssignmentsPage />} />
              <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
              
              {/* Others */}
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Catch all for not found */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 
