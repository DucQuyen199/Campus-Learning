/*-----------------------------------------------------------------
* File: index.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  XMarkIcon,
  InformationCircleIcon,
  UserIcon,
  BookOpenIcon,
  FlagIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import reportsAPI from '../../api/reports.new';
import Loading from '@/components/common/Loading';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStatus, setActiveStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReports, setFilteredReports] = useState([]);

  const [reportForm, setReportForm] = useState({
    title: '',
    content: '',
    category: '',
    targetId: '',
    targetType: 'CONTENT'
  });

  useEffect(() => {
    fetchReports();
  }, [activeStatus]);

  useEffect(() => {
    if (reports.length > 0) {
      let filtered = [...reports];
      
      // Filter based on search term
      if (searchTerm) {
        filtered = filtered.filter(report => 
          report.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.Content.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filter based on status
      if (activeStatus !== 'all') {
        filtered = filtered.filter(report => report.Status.toLowerCase() === activeStatus.toLowerCase());
      }
      
      setFilteredReports(filtered);
    } else {
      setFilteredReports([]);
    }
  }, [reports, searchTerm, activeStatus]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Bạn cần đăng nhập để xem báo cáo của mình');
        setLoading(false);
        return;
      }
      
      console.log('Fetching reports with status:', activeStatus);
      
      const data = await reportsAPI.getMyReports(activeStatus);
      
      if (!data || !data.success) {
        throw new Error(data?.message || 'Có lỗi xảy ra khi tải báo cáo');
      }
      
      setReports(data.reports || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching reports:', error);
      
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      
      if (error.response?.status === 403) {
        setError('Bạn không có quyền truy cập. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError(error.message || 'Không thể tải danh sách báo cáo của bạn');
      }
      
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportForm.title.trim() || !reportForm.content.trim() || !reportForm.category) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Bạn cần đăng nhập để gửi báo cáo');
        setSubmitting(false);
        return;
      }

      const reportData = {
        ...reportForm,
        targetId: reportForm.targetId || '1',
        targetType: reportForm.targetType || 'CONTENT'
      };
      
      await reportsAPI.createReport(reportData);
      
      setOpenDialog(false);
      setReportForm({
        title: '',
        content: '',
        category: '',
        targetId: '',
        targetType: 'CONTENT'
      });
      
      fetchReports();
      
      alert('Báo cáo đã được gửi thành công! Hệ thống sẽ xử lý yêu cầu của bạn trong thời gian sớm nhất.');
    } catch (error) {
      console.error('Error creating report:', error);
      
      if (error.status === 403) {
        alert('Bạn không có quyền gửi báo cáo. Vui lòng đăng nhập lại.');
      } else if (error.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        alert(error.message || 'Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại sau.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setReportForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancelReport = async (reportId, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn hủy báo cáo này?')) {
      return;
    }
    
    try {
      await reportsAPI.cancelReport(reportId);
      fetchReports();
      alert('Đã hủy báo cáo thành công');
    } catch (error) {
      console.error('Error canceling report:', error);
      alert(error.message || 'Không thể hủy báo cáo. Vui lòng thử lại sau.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RESOLVED': return 'text-green-600';
      case 'PENDING': return 'text-amber-600';
      case 'REJECTED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'RESOLVED': return 'Đã giải quyết';
      case 'PENDING': return 'Đang xử lý';
      case 'REJECTED': return 'Đã từ chối';
      default: return 'Không xác định';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'RESOLVED': return 'bg-green-100';
      case 'PENDING': return 'bg-amber-100';
      case 'REJECTED': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'RESOLVED': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'PENDING': return <ClockIcon className="w-5 h-5 text-amber-600" />;
      case 'REJECTED': return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default: return <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryText = (category) => {
    switch(category) {
      case 'USER': return 'Người dùng';
      case 'CONTENT': return 'Nội dung';
      case 'COURSE': return 'Khóa học';
      case 'EVENT': return 'Sự kiện';
      case 'COMMENT': return 'Bình luận';
      default: return category;
    }
  };
  
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'USER': return <UserIcon className="w-5 h-5" />;
      case 'CONTENT': return <DocumentTextIcon className="w-5 h-5" />;
      case 'COURSE': return <BookOpenIcon className="w-5 h-5" />;
      case 'EVENT': return <CalendarIcon className="w-5 h-5" />;
      case 'COMMENT': return <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />;
      default: return <FlagIcon className="w-5 h-5" />;
    }
  };
  
  const getCategoryColor = (category) => {
    switch(category) {
      case 'USER': return 'bg-red-500';
      case 'CONTENT': return 'bg-blue-500';
      case 'COURSE': return 'bg-green-500';
      case 'EVENT': return 'bg-purple-500';
      case 'COMMENT': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header section */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Báo Cáo & Phản Hồi</h1>
          
          {/* Mobile-optimized layout */}
          <div className="flex flex-col space-y-4 mt-6">
            {/* Horizontally scrollable status tabs */}
            <div className="overflow-x-auto -mx-4 px-4 pb-1">
              <div className="flex space-x-3 min-w-max">
                <button
                  onClick={() => setActiveStatus('all')}
                  className={`px-4 py-2.5 font-medium rounded-md whitespace-nowrap ${
                    activeStatus === 'all'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setActiveStatus('pending')}
                  className={`px-4 py-2.5 font-medium rounded-md whitespace-nowrap ${
                    activeStatus === 'pending'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  Đang xử lý
                </button>
                <button
                  onClick={() => setActiveStatus('resolved')}
                  className={`px-4 py-2.5 font-medium rounded-md whitespace-nowrap ${
                    activeStatus === 'resolved'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  Đã giải quyết
                </button>
                <button
                  onClick={() => setActiveStatus('rejected')}
                  className={`px-4 py-2.5 font-medium rounded-md whitespace-nowrap ${
                    activeStatus === 'rejected'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  Đã từ chối
                </button>
              </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative w-full sm:w-auto">
                <select
                  value={reportForm.category || 'all'}
                  onChange={(e) => setReportForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-md text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                >
                  <option value="all">Tất cả danh mục</option>
                  <option value="CONTENT">Nội dung</option>
                  <option value="USER">Người dùng</option>
                  <option value="COMMENT">Bình luận</option>
                  <option value="COURSE">Khóa học</option>
                  <option value="EVENT">Sự kiện</option>
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>

              <div className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm báo cáo..."
                    className="w-full px-4 py-2.5 rounded-md text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                
                <button
                  onClick={() => setOpenDialog(true)}
                  className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                  title="Gửi báo cáo mới"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {loading ? (
          <Loading message="Đang tải báo cáo..." />
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="flex flex-col items-center">
              <XMarkIcon className="w-16 h-16 text-red-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Đã xảy ra lỗi</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <button 
                onClick={fetchReports}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Thử lại
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredReports.map((report) => (
              <div 
                key={report.ReportID}
                className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${getCategoryColor(report.Category)} bg-opacity-10`}>
                      {getCategoryIcon(report.Category)}
                      <span className="text-sm font-medium">{getCategoryText(report.Category)}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${getStatusBgColor(report.Status)} ${getStatusColor(report.Status)}`}>
                      {getStatusIcon(report.Status)}
                      <span className="text-sm font-medium">{getStatusText(report.Status)}</span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{report.Title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{report.Content}</p>

                  {report.Notes && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-2">{report.Notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                    <span>#{report.ReportID}</span>
                    <span>{formatDate(report.CreatedAt)}</span>
                  </div>
                </div>

                {report.Status === 'PENDING' && (
                  <div className="px-6 py-3 bg-gray-50 border-t">
                    <button 
                      onClick={() => handleCancelReport(report.ReportID)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Hủy báo cáo
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Empty State */}
            {filteredReports.length === 0 && (
              <div className="col-span-full py-8 sm:py-12 text-center">
                <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md mx-auto shadow-sm">
                  <div className="bg-gray-50 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4">
                    <DocumentTextIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    Không tìm thấy báo cáo
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-5 sm:mb-6">
                    {searchTerm 
                      ? `Không có báo cáo nào phù hợp với từ khóa "${searchTerm}". Vui lòng thử tìm kiếm với từ khóa khác.` 
                      : 'Hiện tại chưa có báo cáo nào trong danh mục này.'}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Xóa tìm kiếm
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Report Dialog - Keep existing dialog code */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Gửi báo cáo mới</h3>
              <button 
                onClick={() => setOpenDialog(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-5">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề báo cáo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={reportForm.title}
                  onChange={handleFormChange}
                  disabled={submitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  required
                  placeholder="Mô tả ngắn gọn vấn đề"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Loại báo cáo <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={reportForm.category}
                    onChange={handleFormChange}
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    required
                  >
                    <option value="">Chọn loại báo cáo</option>
                    <option value="CONTENT">Nội dung không phù hợp</option>
                    <option value="USER">Người dùng vi phạm</option>
                    <option value="COMMENT">Bình luận vi phạm</option>
                    <option value="COURSE">Khóa học có vấn đề</option>
                    <option value="EVENT">Sự kiện vi phạm</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="targetType" className="block text-sm font-medium text-gray-700 mb-1">
                    Đối tượng báo cáo
                  </label>
                  <select
                    id="targetType"
                    name="targetType"
                    value={reportForm.targetType}
                    onChange={handleFormChange}
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  >
                    <option value="CONTENT">Bài viết</option>
                    <option value="USER">Người dùng</option>
                    <option value="COMMENT">Bình luận</option>
                    <option value="COURSE">Khóa học</option>
                    <option value="EVENT">Sự kiện</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows="5"
                  value={reportForm.content}
                  onChange={handleFormChange}
                  disabled={submitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  required
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                ></textarea>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5 mr-3" />
                  <p className="text-sm text-blue-700">
                    Báo cáo của bạn sẽ được xử lý trong thời gian sớm nhất. Vui lòng cung cấp đầy đủ thông tin để hỗ trợ việc xử lý hiệu quả.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpenDialog(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reportForm.title || !reportForm.content || !reportForm.category}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all duration-300 shadow-sm"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                      <span>Đang gửi...</span>
                    </div>
                  ) : 'Gửi báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 
