/*-----------------------------------------------------------------
* File: AssignmentsPage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetCoursesQuery } from '../api/courseApi';
import { 
  useGetAssignmentsQuery, 
  useCreateAssignmentMutation, 
  useUpdateAssignmentMutation, 
  useDeleteAssignmentMutation,
  useAssignToStudentsMutation
} from '../api/assignmentApi';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const AssignmentsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: '',
    totalPoints: 100,
    files: []
  });

  const { data: coursesData, isLoading: isLoadingCourses } = useGetCoursesQuery();
  const { data: assignmentsData, isLoading: isLoadingAssignments, refetch } = useGetAssignmentsQuery({
    search: searchTerm,
    courseId: selectedCourse
  });
  
  const [createAssignment, { isLoading: isCreating }] = useCreateAssignmentMutation();
  const [updateAssignment, { isLoading: isUpdating }] = useUpdateAssignmentMutation();
  const [deleteAssignment, { isLoading: isDeleting }] = useDeleteAssignmentMutation();
  const [assignToStudents, { isLoading: isAssigning }] = useAssignToStudentsMutation();

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    try {
      await createAssignment(formData).unwrap();
      toast.success('Đã tạo bài tập thành công!');
      setShowCreateModal(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error('Lỗi khi tạo bài tập: ' + (error.data?.message || 'Đã xảy ra lỗi'));
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    
    if (!selectedAssignment) return;
    
    try {
      await updateAssignment({
        assignmentId: selectedAssignment.AssignmentID,
        ...formData
      }).unwrap();
      toast.success('Đã cập nhật bài tập thành công!');
      setShowCreateModal(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error('Lỗi khi cập nhật bài tập: ' + (error.data?.message || 'Đã xảy ra lỗi'));
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
      try {
        await deleteAssignment(assignmentId).unwrap();
        toast.success('Đã xóa bài tập thành công!');
        refetch();
      } catch (error) {
        toast.error('Lỗi khi xóa bài tập: ' + (error.data?.message || 'Đã xảy ra lỗi'));
      }
    }
  };

  const handleAssignToStudents = async (e) => {
    e.preventDefault();
    
    if (!selectedAssignment) return;
    
    try {
      await assignToStudents({
        assignmentId: selectedAssignment.AssignmentID,
        courseId: selectedAssignment.CourseID,
        dueDate: formData.dueDate
      }).unwrap();
      
      toast.success('Đã gửi bài tập đến sinh viên thành công!');
      setShowAssignModal(false);
    } catch (error) {
      toast.error('Lỗi khi gửi bài tập: ' + (error.data?.message || 'Đã xảy ra lỗi'));
    }
  };

  const openEditModal = (assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.Title,
      description: assignment.Description,
      courseId: assignment.CourseID.toString(),
      dueDate: assignment.DueDate ? new Date(assignment.DueDate).toISOString().split('T')[0] : '',
      totalPoints: assignment.TotalPoints || 100,
      files: []
    });
    setShowCreateModal(true);
  };

  const openAssignModal = (assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      ...formData,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default: 1 week from now
    });
    setShowAssignModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      courseId: '',
      dueDate: '',
      totalPoints: 100,
      files: []
    });
    setSelectedAssignment(null);
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      files: [...e.target.files]
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa đặt';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý bài tập</h1>
        
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Tạo bài tập mới
        </button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài tập..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        
        <div className="w-full md:w-64">
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="appearance-none pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tất cả khóa học</option>
              {coursesData?.courses?.map(course => (
                <option key={course.CourseID} value={course.CourseID}>{course.Title}</option>
              ))}
            </select>
            <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
        
        <button 
          onClick={refetch}
          className="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          <ArrowPathIcon className="w-5 h-5" />
          Làm mới
        </button>
      </div>
      
      {/* Assignments List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoadingAssignments ? (
          <div className="text-center py-8">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải bài tập...</p>
          </div>
        ) : assignmentsData?.assignments?.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Chưa có bài tập nào</h3>
            <p className="mt-1 text-gray-500">Bắt đầu bằng cách tạo bài tập mới.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên bài tập
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khóa học
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hạn nộp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đã nộp / Tổng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignmentsData?.assignments?.map((assignment) => (
                  <tr key={assignment.AssignmentID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{assignment.Title}</div>
                      <div className="text-sm text-gray-500">{assignment.Description.length > 50 ? assignment.Description.slice(0, 50) + '...' : assignment.Description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coursesData?.courses?.find(c => c.CourseID === assignment.CourseID)?.Title || 'Không xác định'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(assignment.DueDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {assignment.SubmissionsCount || 0} / {assignment.StudentsCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => navigate(`/assignments/${assignment.AssignmentID}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Xem chi tiết"
                        >
                          Xem
                        </button>
                        
                        <button 
                          onClick={() => openAssignModal(assignment)}
                          className="text-green-600 hover:text-green-900"
                          title="Gửi cho sinh viên"
                        >
                          <UserGroupIcon className="w-5 h-5" />
                        </button>
                        
                        <button 
                          onClick={() => openEditModal(assignment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Chỉnh sửa"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteAssignment(assignment.AssignmentID)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Create/Edit Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {selectedAssignment ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
              </h2>
              
              <form onSubmit={selectedAssignment ? handleUpdateAssignment : handleCreateAssignment}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Nhập tiêu đề bài tập"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Khóa học <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.courseId}
                      onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Chọn khóa học</option>
                      {coursesData?.courses?.map(course => (
                        <option key={course.CourseID} value={course.CourseID}>{course.Title}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Nhập mô tả bài tập"
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Điểm tối đa
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.totalPoints}
                        onChange={(e) => setFormData({...formData, totalPoints: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày hết hạn
                      </label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tệp đính kèm
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">Tải lên các tài liệu hoặc bài tập.</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isCreating || isUpdating ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </span>
                    ) : selectedAssignment ? 'Cập nhật' : 'Tạo bài tập'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Assign to Students Modal */}
      {showAssignModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Gửi bài tập cho sinh viên
              </h2>
              
              <div className="mb-4">
                <h3 className="font-medium">Bài tập: {selectedAssignment.Title}</h3>
                <p className="text-gray-600">
                  Khóa học: {coursesData?.courses?.find(c => c.CourseID === selectedAssignment.CourseID)?.Title || 'Không xác định'}
                </p>
              </div>
              
              <form onSubmit={handleAssignToStudents}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày hết hạn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Lưu ý</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Bài tập sẽ được gửi đến tất cả sinh viên đã đăng ký khóa học này.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isAssigning ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </span>
                    ) : 'Gửi bài tập'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage; 
