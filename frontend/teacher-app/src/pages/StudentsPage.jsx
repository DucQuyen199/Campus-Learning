import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGetStudentsQuery, useSearchStudentsQuery } from '../api/studentsApi';
import { useGetCoursesQuery } from '../api/courseApi';
import NotificationForm from '../components/students/NotificationForm';
import { 
  MagnifyingGlassIcon, 
  UserGroupIcon, 
  BellIcon,
  FunnelIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

const StudentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Get courses for filter
  const { data: coursesData } = useGetCoursesQuery();
  
  // Use search query if search term exists, otherwise use regular query
  const { data: searchData, isLoading: isSearchLoading } = useSearchStudentsQuery(debouncedSearch, {
    skip: !debouncedSearch
  });
  
  const { data, isLoading, error } = useGetStudentsQuery(undefined, {
    skip: !!debouncedSearch
  });
  
  // Combine data from both queries
  const studentsData = debouncedSearch ? searchData : data;
  const isDataLoading = debouncedSearch ? isSearchLoading : isLoading;
  
  // Setup debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        setDebouncedSearch(searchTerm);
      } else {
        setDebouncedSearch('');
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Handle selection changes
  useEffect(() => {
    if (selectAll && studentsData) {
      setSelectedStudents(studentsData.students);
    } else if (!selectAll) {
      setSelectedStudents([]);
    }
  }, [selectAll, studentsData]);
  
  // Toggle student selection
  const toggleStudentSelection = (student) => {
    if (selectedStudents.some(s => s.UserID === student.UserID)) {
      setSelectedStudents(selectedStudents.filter(s => s.UserID !== student.UserID));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Filter students by course if a course is selected
  const filteredStudents = studentsData?.students?.filter(student => {
    if (!selectedCourse) return true;
    return student.courses?.some(course => course.CourseID.toString() === selectedCourse);
  });
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <UserGroupIcon className="w-7 h-7 text-primary-500 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Quản lý học viên</h1>
        </div>
        
        {selectedStudents.length > 0 && (
          <button
            onClick={() => setShowNotification(true)}
            className="btn btn-primary flex items-center"
          >
            <BellIcon className="w-5 h-5 mr-2" />
            Gửi thông báo ({selectedStudents.length})
          </button>
        )}
      </div>
      
      {/* Filters and search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="md:flex space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Tìm kiếm học viên theo tên hoặc email"
            />
          </div>
          
          <div className="md:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 appearance-none"
              >
                <option value="">Tất cả khóa học</option>
                {coursesData?.courses?.map(course => (
                  <option key={course.CourseID} value={course.CourseID}>
                    {course.Title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Students list */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isDataLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải danh sách học viên...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-500 text-center">
            <p>Không thể tải danh sách học viên. Vui lòng thử lại.</p>
            <p className="mt-2">{error.message || 'Lỗi không xác định'}</p>
          </div>
        ) : studentsData?.students?.length > 0 ? (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={() => setSelectAll(!selectAll)}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Học viên
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khóa học đăng ký
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đăng ký gần nhất
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents?.map(student => (
                    <tr key={student.UserID}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedStudents.some(s => s.UserID === student.UserID)}
                            onChange={() => toggleStudentSelection(student)}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {student.ImageUrl ? (
                              <img className="h-10 w-10 rounded-full object-cover" src={student.ImageUrl} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-600 font-medium">
                                  {student.FullName?.substring(0, 2).toUpperCase() || 'ST'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.FullName}</div>
                            <div className="text-sm text-gray-500">{student.Email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          student.Status === 'ONLINE' ? 'bg-green-100 text-green-800' : 
                          student.Status === 'OFFLINE' ? 'bg-gray-100 text-gray-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {student.Status === 'ONLINE' ? 'Trực tuyến' : 
                           student.Status === 'OFFLINE' ? 'Ngoại tuyến' : 'Vắng mặt'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.EnrolledCoursesCount || 0} khóa học
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.LastEnrolledAt ? formatDate(student.LastEnrolledAt) : 'Chưa đăng ký'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          to={`/students/${student.UserID}`}
                          className="text-primary-600 hover:text-primary-800 flex items-center justify-end"
                        >
                          Xem chi tiết
                          <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredStudents?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Không tìm thấy học viên nào phù hợp với bộ lọc.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Chưa có học viên nào đăng ký khóa học của bạn.
            </p>
          </div>
        )}
      </div>
      
      {/* Notification modal */}
      {showNotification && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg">
            <NotificationForm
              selectedStudents={selectedStudents}
              onClose={() => {
                setShowNotification(false);
                setSelectedStudents([]);
                setSelectAll(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage; 