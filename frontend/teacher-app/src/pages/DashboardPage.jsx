/*-----------------------------------------------------------------
* File: DashboardPage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  ClockIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { selectCurrentUser } from '../store/slices/authSlice';
import { useGetCoursesQuery } from '../api/courseApi';
import { useGetStudentsQuery } from '../api/studentApi';
import { useGetAssignmentsQuery } from '../api/assignmentApi';
import { useGetNotificationsQuery } from '../api/notificationApi';

const DashboardPage = () => {
  const user = useSelector(selectCurrentUser);
  const [stats, setStats] = useState({
    courseCount: 0,
    activeStudentCount: 0,
    pendingAssignmentCount: 0,
    unreadNotificationCount: 0,
  });

  const { data: courseData } = useGetCoursesQuery({ limit: 5 });
  const { data: studentData } = useGetStudentsQuery({ limit: 5 });
  const { data: assignmentData } = useGetAssignmentsQuery({ status: 'active', limit: 5 });
  const { data: notificationData } = useGetNotificationsQuery({ limit: 5 });

  useEffect(() => {
    if (courseData) {
      const courseCount = courseData.pagination?.totalCount || 
                         (courseData.courses?.length || 0);
      setStats(prev => ({ ...prev, courseCount }));
    }
    
    if (studentData) {
      const activeStudentCount = studentData.pagination?.totalCount || 
                                (studentData.students?.length || 0);
      setStats(prev => ({ ...prev, activeStudentCount }));
    }
    
    if (assignmentData) {
      const pendingAssignmentCount = assignmentData.pagination?.totalCount || 
                                    assignmentData.totalCount ||
                                    (assignmentData.assignments?.length || 0);
      setStats(prev => ({ ...prev, pendingAssignmentCount }));
    }
    
    if (notificationData) {
      const unreadNotificationCount = notificationData.unreadCount || 
                                     (notificationData.notifications?.filter(n => !n.IsRead)?.length || 0);
      setStats(prev => ({ ...prev, unreadNotificationCount }));
    }
  }, [courseData, studentData, assignmentData, notificationData]);

  const statsCards = [
    {
      title: 'Khóa Học Của Tôi',
      value: stats.courseCount,
      icon: <AcademicCapIcon className="w-12 h-12 text-primary-500" />,
      color: 'bg-primary-50',
      link: '/courses',
    },
    {
      title: 'Học Viên Hoạt Động',
      value: stats.activeStudentCount,
      icon: <UserGroupIcon className="w-12 h-12 text-blue-500" />,
      color: 'bg-blue-50',
      link: '/students',
    },
    {
      title: 'Bài Tập Đang Chờ',
      value: stats.pendingAssignmentCount,
      icon: <DocumentTextIcon className="w-12 h-12 text-amber-500" />,
      color: 'bg-amber-50',
      link: '/assignments',
    },
    {
      title: 'Thông Báo Chưa Đọc',
      value: stats.unreadNotificationCount,
      icon: <BellIcon className="w-12 h-12 text-red-500" />,
      color: 'bg-red-50',
      link: '/notifications',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Xin chào, {user?.FullName || 'Giảng Viên'}</h1>
        <p className="text-gray-600">Dưới đây là thông tin về các khóa học của bạn hôm nay.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className={`${card.color} p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 font-medium">{card.title}</p>
                <h3 className="text-3xl font-bold mt-1">{card.value}</h3>
              </div>
              {card.icon}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Khóa Học Gần Đây</h2>
            <Link to="/courses" className="text-primary-600 hover:text-primary-700">
              Xem Tất Cả
            </Link>
          </div>
          {courseData?.courses?.length ? (
            <div className="space-y-4">
              {courseData.courses.map((course) => (
                <Link
                  key={course.CourseID}
                  to={`/courses/${course.CourseID}`}
                  className="block p-4 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      {course.ImageUrl ? (
                        <img
                          src={course.ImageUrl}
                          alt={course.Title}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary-100 rounded-md flex items-center justify-center">
                          <AcademicCapIcon className="w-6 h-6 text-primary-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-md font-medium text-gray-900">{course.Title}</h3>
                      <p className="text-sm text-gray-500">
                        {course.EnrollmentsCount} học viên
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-4 text-center">Không tìm thấy khóa học nào</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Bài Tập Sắp Tới</h2>
            <Link to="/assignments" className="text-primary-600 hover:text-primary-700">
              Xem Tất Cả
            </Link>
          </div>
          {assignmentData?.assignments?.length ? (
            <div className="space-y-4">
              {assignmentData.assignments.map((assignment) => (
                <Link
                  key={assignment.AssignmentID}
                  to={`/assignments/${assignment.AssignmentID}`}
                  className="block p-4 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-md flex items-center justify-center">
                        <ClockIcon className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-md font-medium text-gray-900">
                        {assignment.Title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Hạn: {new Date(assignment.DueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {assignment.SubmissionsCount} bài nộp
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-4 text-center">Không có bài tập sắp tới</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
