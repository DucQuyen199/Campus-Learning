import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetCourseByIdQuery } from '../api/courseApi';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const CourseDetailPage = () => {
  const { id } = useParams();
  const { data, error, isLoading } = useGetCourseByIdQuery(id);
  const [activeTab, setActiveTab] = useState('overview');
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải thông tin khóa học...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-500 text-center">
        <p>Không thể tải thông tin khóa học. Vui lòng thử lại.</p>
        <p className="mt-2">{error.message || 'Lỗi không xác định'}</p>
      </div>
    );
  }

  if (!data || !data.course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy khóa học.</p>
        <Link to="/courses" className="mt-4 inline-block text-primary-600 hover:underline">
          Quay lại danh sách khóa học
        </Link>
      </div>
    );
  }

  const { course, modules, recentEnrollments, announcements } = data;
  
  return (
    <div>
      {/* Back button and actions */}
      <div className="flex justify-between items-center mb-6">
        <Link to="/courses" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Quay lại danh sách
        </Link>
        <div className="flex gap-2">
          <Link to={`/courses/${id}/edit`} className="btn btn-outline-primary flex items-center">
            <PencilIcon className="w-4 h-4 mr-2" />
            Chỉnh sửa
          </Link>
        </div>
      </div>
      
      {/* Course header */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="h-48 bg-gray-200 relative">
          {course.ImageUrl ? (
            <img
              src={course.ImageUrl}
              alt={course.Title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-100">
              <AcademicCapIcon className="w-20 h-20 text-primary-300" />
            </div>
          )}
          <div className="absolute top-4 right-4 bg-white text-xs font-medium px-2 py-1 rounded-full">
            {course.Status}
          </div>
        </div>
        
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800">{course.Title}</h1>
          <p className="mt-2 text-gray-600">{course.Description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-md text-center">
              <UserGroupIcon className="w-6 h-6 mx-auto text-primary-500" />
              <p className="mt-1 text-gray-600 text-sm">Học viên đăng ký</p>
              <p className="text-xl font-semibold text-gray-800">{course.EnrollmentsCount || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md text-center">
              <BookOpenIcon className="w-6 h-6 mx-auto text-primary-500" />
              <p className="mt-1 text-gray-600 text-sm">Mô-đun</p>
              <p className="text-xl font-semibold text-gray-800">{course.ModulesCount || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md text-center">
              <ClipboardDocumentListIcon className="w-6 h-6 mx-auto text-primary-500" />
              <p className="mt-1 text-gray-600 text-sm">Bài tập</p>
              <p className="text-xl font-semibold text-gray-800">{course.AssignmentsCount || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md text-center">
              <AcademicCapIcon className="w-6 h-6 mx-auto text-primary-500" />
              <p className="mt-1 text-gray-600 text-sm">Cập nhật gần đây</p>
              <p className="text-xl font-semibold text-gray-800">
                {course.UpdatedAt ? new Date(course.UpdatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`mr-8 py-4 text-sm font-medium ${
              activeTab === 'overview'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`mr-8 py-4 text-sm font-medium ${
              activeTab === 'modules'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mô-đun ({modules?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`mr-8 py-4 text-sm font-medium ${
              activeTab === 'students'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Học viên ({recentEnrollments?.length || 0})
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Thông tin khóa học</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <h3 className="font-medium text-gray-900">Yêu cầu</h3>
                <p className="text-gray-600 mt-1">{course.Requirements || 'Không có yêu cầu cụ thể'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Mục tiêu học tập</h3>
                <p className="text-gray-600 mt-1">{course.Objectives || 'Chưa có mục tiêu cụ thể'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Cấp độ</h3>
                <p className="text-gray-600 mt-1">{course.Level || 'Cơ bản'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Thời lượng</h3>
                <p className="text-gray-600 mt-1">{course.Duration ? `${course.Duration} giờ` : 'Chưa xác định'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Danh mục</h3>
                <p className="text-gray-600 mt-1">{course.Category || 'Không có danh mục'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Ngày tạo</h3>
                <p className="text-gray-600 mt-1">
                  {course.CreatedAt ? new Date(course.CreatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Recent announcements */}
            {announcements?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Thông báo gần đây</h3>
                <div className="space-y-4">
                  {announcements.map(announcement => (
                    <div key={announcement.AnnouncementID} className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium text-gray-900">{announcement.Title}</h4>
                      <p className="text-gray-600 mt-1">{announcement.Content}</p>
                      <div className="mt-2 text-sm text-gray-500 flex justify-between">
                        <span>{announcement.CreatorName}</span>
                        <span>{new Date(announcement.CreatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'modules' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Mô-đun khóa học</h2>
              <Link to={`/courses/${id}/modules/create`} className="btn btn-sm btn-primary">
                Thêm mô-đun
              </Link>
            </div>
            
            {modules?.length > 0 ? (
              <div className="space-y-4">
                {modules.map(module => (
                  <div key={module.ModuleID} className="border border-gray-200 rounded-lg">
                    <div className="p-4 flex justify-between items-center bg-gray-50 rounded-t-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{module.Title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{module.Description || 'Không có mô tả'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {module.LessonsCount} bài học | {module.AssignmentsCount} bài tập
                        </div>
                        <Link 
                          to={`/courses/${id}/modules/${module.ModuleID}`}
                          className="text-primary-600 text-sm hover:underline"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Khóa học này chưa có mô-đun nào. Hãy thêm mô-đun đầu tiên!
              </p>
            )}
          </div>
        )}
        
        {activeTab === 'students' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Học viên đăng ký</h2>
              <Link to={`/courses/${id}/enrollments`} className="text-primary-600 hover:underline">
                Xem tất cả
              </Link>
            </div>
            
            {recentEnrollments?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Học viên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiến độ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày đăng ký
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentEnrollments.map(enrollment => (
                      <tr key={enrollment.EnrollmentID}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                {enrollment.FullName ? (
                                  <span className="text-lg font-medium text-primary-600">
                                    {enrollment.FullName.charAt(0).toUpperCase()}
                                  </span>
                                ) : (
                                  <UserGroupIcon className="h-5 w-5 text-primary-600" />
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {enrollment.FullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {enrollment.Email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${enrollment.Progress || 0}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 text-center">
                            {enrollment.Progress || 0}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(enrollment.EnrollmentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            to={`/courses/${id}/students/${enrollment.UserID}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Khóa học này chưa có học viên đăng ký.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage; 