/*-----------------------------------------------------------------
* File: AssignmentDetailPage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the teacher application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  useGetAssignmentByIdQuery, 
  useGetAssignmentSubmissionsQuery,
  useGradeSubmissionMutation,
  useDeleteAssignmentMutation 
} from '../api/assignmentApi';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentIcon,
  DocumentTextIcon,
  UserIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const AssignmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeData, setGradeData] = useState({
    score: '',
    feedback: ''
  });
  const [activeTab, setActiveTab] = useState('details');
  
  const { data: assignment, isLoading: isLoadingAssignment, error: assignmentError } = useGetAssignmentByIdQuery(id, {
    // Skip refetching on error to prevent constant error requests
    skip: false
  });
  
  const { data: submissionsData, isLoading: isLoadingSubmissions, error: submissionsError } = useGetAssignmentSubmissionsQuery(id, {
    // Skip fetching submissions if there was an error with the assignment
    skip: !!assignmentError
  });
  
  const [gradeSubmission, { isLoading: isGrading }] = useGradeSubmissionMutation();
  const [deleteAssignment, { isLoading: isDeleting }] = useDeleteAssignmentMutation();
  
  const handleDeleteAssignment = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
      try {
        await deleteAssignment(id).unwrap();
        toast.success('Đã xóa bài tập thành công!');
        navigate('/assignments');
      } catch (error) {
        toast.error('Lỗi khi xóa bài tập: ' + (error.data?.message || 'Đã xảy ra lỗi'));
      }
    }
  };
  
  const openGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      score: submission.Score || '',
      feedback: submission.Feedback || ''
    });
    setShowGradeModal(true);
  };
  
  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    
    if (!selectedSubmission) return;
    
    try {
      await gradeSubmission({
        submissionId: selectedSubmission.SubmissionID,
        score: parseInt(gradeData.score),
        feedback: gradeData.feedback
      }).unwrap();
      
      toast.success('Đã chấm điểm thành công!');
      setShowGradeModal(false);
    } catch (error) {
      toast.error('Lỗi khi chấm điểm: ' + (error.data?.message || 'Đã xảy ra lỗi'));
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa đặt';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (isLoadingAssignment) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải thông tin bài tập...</p>
      </div>
    );
  }
  
  // Check for 403 Forbidden error specifically
  if (assignmentError?.status === 403) {
    return (
      <div className="bg-yellow-50 p-6 rounded-lg shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-yellow-800">Không có quyền truy cập</h3>
            <div className="mt-2 text-yellow-700">
              <p>Bạn không có quyền xem bài tập này. Bài tập có thể thuộc về giảng viên khác hoặc đã bị xóa.</p>
            </div>
            <div className="mt-4">
              <Link to="/assignments" className="inline-flex items-center gap-2 text-sm font-medium text-yellow-700 hover:text-yellow-600">
                <ArrowLeftIcon className="w-4 h-4" />
                Quay lại danh sách bài tập
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (assignmentError) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Đã xảy ra lỗi khi tải thông tin bài tập</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{assignmentError.data?.message || 'Không thể tải thông tin bài tập. Vui lòng thử lại sau.'}</p>
            </div>
            <div className="mt-4">
              <Link to="/assignments" className="inline-flex items-center gap-2 text-sm text-red-700 hover:text-red-600">
                <ArrowLeftIcon className="w-4 h-4" />
                Quay lại danh sách bài tập
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link 
            to="/assignments" 
            className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Quay lại</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{assignment?.Title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            to={`/assignments/${id}/edit`}
            className="btn btn-secondary flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" />
            Chỉnh sửa
          </Link>
          
          <button
            onClick={handleDeleteAssignment}
            disabled={isDeleting}
            className="btn btn-danger flex items-center gap-2"
          >
            {isDeleting ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <TrashIcon className="w-4 h-4" />
            )}
            Xóa
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Chi tiết
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`${
              activeTab === 'submissions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Bài nộp ({submissionsData?.totalCount || 0})
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'details' ? (
          <div className="space-y-6">
            {/* Basic details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin bài tập</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Khóa học</h3>
                    <p className="mt-1 text-sm text-gray-900">{assignment?.CourseName}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Điểm tối đa</h3>
                    <p className="mt-1 text-sm text-gray-900">{assignment?.TotalPoints || 100}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Hạn nộp</h3>
                    <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      {formatDate(assignment?.DueDate)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Ngày tạo</h3>
                    <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      {formatDate(assignment?.CreatedAt)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Số liệu</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Sinh viên đã nộp</p>
                          <p className="mt-1 text-2xl font-semibold text-gray-900">
                            {assignment?.SubmissionsCount || 0}
                          </p>
                        </div>
                        <UserGroupIcon className="w-8 h-8 text-primary-500" />
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Tổng sinh viên</p>
                          <p className="mt-1 text-2xl font-semibold text-gray-900">
                            {assignment?.StudentsCount || 0}
                          </p>
                        </div>
                        <UserIcon className="w-8 h-8 text-primary-500" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {assignment?.files?.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Tài liệu đính kèm</h2>
                    <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                      {assignment.files.map((file) => (
                        <li key={file.FileID} className="px-4 py-3 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <DocumentIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-900">{file.FileName}</span>
                          </div>
                          <a 
                            href={`/api/assignments/files/${file.FileID}/download`}
                            className="text-primary-600 hover:text-primary-500 flex items-center gap-1"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Tải xuống
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Description */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Mô tả</h2>
              <div className="prose prose-sm max-w-none">
                {assignment?.Description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{assignment.Description}</p>
                ) : (
                  <p className="text-gray-500 italic">Không có mô tả</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Show submissions error if present */}
            {submissionsError && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Không thể tải danh sách bài nộp</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{submissionsError.data?.message || 'Đã xảy ra lỗi khi tải danh sách bài nộp.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isLoadingSubmissions ? (
              <div className="text-center py-8">
                <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải danh sách bài nộp...</p>
              </div>
            ) : submissionsError ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Không thể hiển thị danh sách bài nộp.</p>
              </div>
            ) : submissionsData?.submissions?.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Chưa có bài nộp</h3>
                <p className="mt-1 text-gray-500">Sinh viên chưa nộp bài tập này.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sinh viên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày nộp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Điểm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissionsData?.submissions?.map((submission) => (
                      <tr key={submission.SubmissionID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {submission.Avatar ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={submission.Avatar}
                                  alt={submission.FullName}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                  <span className="text-primary-800 font-medium">
                                    {submission.FullName?.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{submission.FullName}</div>
                              <div className="text-sm text-gray-500">{submission.Email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(submission.SubmittedAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            submission.Status === 'graded' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {submission.Status === 'graded' ? 'Đã chấm' : 'Chưa chấm'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.Score !== null ? `${submission.Score}/${assignment?.TotalPoints || 100}` : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => openGradeModal(submission)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {submission.Status === 'graded' ? 'Sửa điểm' : 'Chấm điểm'}
                            </button>
                            <Link
                              to={`/assignments/${id}/submissions/${submission.SubmissionID}`}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Xem chi tiết
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Grade Modal */}
      {showGradeModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Chấm điểm bài nộp
              </h2>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">Sinh viên: {selectedSubmission.FullName}</p>
                <p className="text-xs text-gray-500">Ngày nộp: {formatDate(selectedSubmission.SubmittedAt)}</p>
              </div>
              
              <form onSubmit={handleGradeSubmission}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Điểm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={assignment?.TotalPoints || 100}
                      required
                      value={gradeData.score}
                      onChange={(e) => setGradeData({...gradeData, score: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Nhập điểm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Điểm tối đa: {assignment?.TotalPoints || 100}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nhận xét
                    </label>
                    <textarea
                      value={gradeData.feedback}
                      onChange={(e) => setGradeData({...gradeData, feedback: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Nhập nhận xét cho sinh viên"
                    ></textarea>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowGradeModal(false)}
                    className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isGrading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isGrading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang lưu...
                      </span>
                    ) : 'Lưu điểm'}
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

export default AssignmentDetailPage; 
