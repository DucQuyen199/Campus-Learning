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
  EyeIcon,
  ChatBubbleBottomCenterTextIcon,
  CalendarIcon,
  UserIcon,
  BookOpenIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import reportsAPI from '../../api/reports.new';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStatus, setActiveStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewDetailsId, setViewDetailsId] = useState(null);

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
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 pt-8 pb-6">
        <div className="px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium mb-3">
                <FlagIcon className="h-4 w-4" />
                <span>Hệ thống báo cáo</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Theo dõi trạng thái báo cáo</h1>
              <p className="text-blue-100 mt-2">
                Tại đây, bạn có thể theo dõi trạng thái xử lý các báo cáo và gửi báo cáo mới
              </p>
            </div>

            <button 
              onClick={() => setOpenDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200 shadow-md"
            >
              <PaperAirplaneIcon className="h-5 w-5 rotate-90" />
              Gửi báo cáo mới
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-6">
            <button
              onClick={() => setActiveStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeStatus === 'all'
                  ? 'bg-white text-blue-600'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeStatus === 'pending'
                  ? 'bg-white text-amber-600'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" />
                Đang xử lý
              </div>
            </button>
            <button
              onClick={() => setActiveStatus('resolved')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeStatus === 'resolved'
                  ? 'bg-white text-green-600'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <CheckCircleIcon className="h-4 w-4" />
                Đã giải quyết
              </div>
            </button>
            <button
              onClick={() => setActiveStatus('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeStatus === 'rejected'
                  ? 'bg-white text-red-600'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <XCircleIcon className="h-4 w-4" />
                Đã từ chối
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="px-6 py-6">
          {/* Report count */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Hiển thị {reports.length} báo cáo
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Đã xảy ra lỗi</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={fetchReports}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Thử lại
              </button>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có báo cáo nào</h3>
              <p className="text-gray-600 mb-4">Bạn chưa gửi báo cáo nào hoặc không có báo cáo phù hợp với bộ lọc.</p>
              <button 
                onClick={() => setOpenDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PaperAirplaneIcon className="h-5 w-5 rotate-90" />
                Tạo báo cáo mới
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report) => (
                <div 
                  key={report.ReportID}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Left side - Category and Status */}
                    <div className="w-full md:w-64 p-6 bg-gray-50 flex flex-col justify-between">
                      <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${getCategoryColor(report.Category)} bg-opacity-10 mb-3`}>
                          {getCategoryIcon(report.Category)}
                          <span className="text-sm font-medium">{getCategoryText(report.Category)}</span>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${getStatusBgColor(report.Status)} ${getStatusColor(report.Status)}`}>
                          {getStatusIcon(report.Status)}
                          <span className="text-sm font-medium">{getStatusText(report.Status)}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-4">
                        #{report.ReportID}
                      </div>
                    </div>

                    {/* Right side - Content */}
                    <div className="flex-1 p-6 flex flex-col">
                      <h3 className="font-semibold text-lg mb-2">{report.Title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{report.Content}</p>
                      
                      {report.Notes && (
                        <div className="mt-auto p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700">{report.Notes}</p>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {formatDate(report.CreatedAt)}
                        </div>
                        
                        {report.Status === 'PENDING' && (
                          <button 
                            onClick={(e) => handleCancelReport(report.ReportID, e)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Hủy báo cáo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Report Dialog */}
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