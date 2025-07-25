/*-----------------------------------------------------------------
* File: StudentDetailPage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetStudentByIdQuery } from '../api/studentsApi';
import { 
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const StudentDetailPage = () => {
  const { id } = useParams();
  const { data, error, isLoading } = useGetStudentByIdQuery(id);
  const [activeTab, setActiveTab] = useState('courses');
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải thông tin học viên...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-500 text-center">
        <p>Không thể tải thông tin học viên. Vui lòng thử lại.</p>
        <p className="mt-2">{error.message || 'Lỗi không xác định'}</p>
      </div>
    );
  }

  if (!data || !data.student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy học viên.</p>
        <Link to="/students" className="mt-4 inline-block text-primary-600 hover:underline">
          Quay lại danh sách học viên
        </Link>
      </div>
    );
  }

  const { student, enrollments, progress } = data;
  
  return (
    <div>
      {/* Back button */}
      <div className="flex items-center mb-6">
        <Link to="/students" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Quay lại danh sách học viên
        </Link>
      </div>
      
      {/* Student profile */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="md:flex">
          <div className="md:w-1/3 bg-gray-50 p-6">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                {student.ImageUrl ? (
                  <img 
                    src={student.ImageUrl} 
                    alt={student.FullName} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-16 h-16 text-primary-500" />
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-800">{student.FullName}</h1>
              <p className="text-gray-600 mt-1">{student.Email}</p>
              
              <div className="mt-4 flex justify-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  student.Status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                  student.Status === 'OFFLINE' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {student.Status === 'ONLINE' ? 'Trực tuyến' : 
                   student.Status === 'OFFLINE' ? 'Ngoại tuyến' : 'Vắng mặt'}
                </span>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              {student.PhoneNumber && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Số điện thoại</h3>
                  <p className="mt-1">{student.PhoneNumber}</p>
                </div>
              )}
              
              {student.School && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Trường học</h3>
                  <p className="mt-1">{student.School}</p>
                </div>
              )}
              
              {student.DateOfBirth && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ngày sinh</h3>
                  <p className="mt-1">{new Date(student.DateOfBirth).toLocaleDateString()}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tham gia từ</h3>
                <p className="mt-1">{new Date(student.CreatedAt).toLocaleDateString()}</p>
              </div>
              
              {student.LastLoginAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Đăng nhập gần đây</h3>
                  <p className="mt-1">{new Date(student.LastLoginAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:w-2/3 p-6">
            <h2 className="text-xl font-semibold mb-4">Tổng quan học tập</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-md text-center">
                <AcademicCapIcon className="w-6 h-6 mx-auto text-primary-500 mb-1" />
                <p className="text-sm text-gray-600">Khóa học đăng ký</p>
                <p className="text-xl font-semibold">{enrollments?.length || 0}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md text-center">
                <BookOpenIcon className="w-6 h-6 mx-auto text-primary-500 mb-1" />
                <p className="text-sm text-gray-600">Bài học đã hoàn thành</p>
                <p className="text-xl font-semibold">
                  {progress?.filter(p => p.LessonStatus === 'completed').length || 0}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md text-center">
                <CalendarIcon className="w-6 h-6 mx-auto text-primary-500 mb-1" />
                <p className="text-sm text-gray-600">Thời gian học</p>
                <p className="text-xl font-semibold">
                  {Math.round((progress?.reduce((sum, p) => sum + (p.TimeSpent || 0), 0) || 0) / 60)} phút
                </p>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`mr-8 py-4 text-sm font-medium ${
                    activeTab === 'courses'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Khóa học ({enrollments?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('progress')}
                  className={`mr-8 py-4 text-sm font-medium ${
                    activeTab === 'progress'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Tiến độ học tập
                </button>
              </nav>
            </div>
            
            {/* Tab content */}
            {activeTab === 'courses' && (
              <div>
                {enrollments?.length > 0 ? (
                  <div className="space-y-4">
                    {enrollments.map(enrollment => (
                      <div key={enrollment.EnrollmentID} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="md:flex">
                          <div className="md:w-1/3 bg-gray-50">
                            {enrollment.CourseImageUrl ? (
                              <img 
                                src={enrollment.CourseImageUrl} 
                                alt={enrollment.CourseTitle} 
                                className="w-full h-40 object-cover"
                              />
                            ) : (
                              <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                                <AcademicCapIcon className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4 md:w-2/3">
          <Link 
                              to={`/courses/${enrollment.CourseID}`}
                              className="text-lg font-medium text-gray-900 hover:text-primary-600"
          >
                              {enrollment.CourseTitle}
          </Link>
                            
                            <div className="mt-2 text-sm text-gray-600">
                              <p>Đăng ký: {new Date(enrollment.EnrolledAt).toLocaleDateString()}</p>
                              {enrollment.CompletedAt && (
                                <p>Hoàn thành: {new Date(enrollment.CompletedAt).toLocaleDateString()}</p>
                              )}
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex items-center">
                                <span className="text-sm text-gray-600 mr-2">Tiến độ:</span>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className="bg-primary-600 h-2.5 rounded-full" 
                                    style={{ width: `${enrollment.Progress || 0}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-sm text-gray-600">{enrollment.Progress || 0}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Học viên chưa đăng ký khóa học nào.
                  </p>
                )}
              </div>
            )}
            
            {activeTab === 'progress' && (
              <div>
                {progress?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bài học
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Khóa học
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thời gian học
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hoàn thành
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {progress.map((item, index) => (
                          <tr key={`${item.LessonID}-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.LessonTitle}</div>
                              <div className="text-sm text-gray-500">{item.ModuleTitle}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.CourseTitle}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.LessonStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                item.LessonStatus === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.LessonStatus === 'completed' ? 'Đã hoàn thành' :
                                 item.LessonStatus === 'in_progress' ? 'Đang học' : 'Chưa bắt đầu'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.TimeSpent ? `${Math.round(item.TimeSpent / 60)} phút` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.LessonCompletedAt ? new Date(item.LessonCompletedAt).toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Chưa có dữ liệu tiến độ học tập.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailPage; 
