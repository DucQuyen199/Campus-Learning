import api from './index';

// API functions for reports
const reportsAPI = {
  // Lấy báo cáo của người dùng hiện tại
  getMyReports: async (status = 'all') => {
    try {
      // Always use the /me endpoint explicitly to avoid admin-only route
      const url = '/api/reports/me' + (status !== 'all' ? `?status=${status.toUpperCase()}` : '');
      
      console.log('Fetching reports from URL:', url);
      
      const response = await api.get(url);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },
  
  // Tạo báo cáo mới
  createReport: async (reportData) => {
    try {
      const response = await api.post('/api/reports', reportData);
      return response.data;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },
  
  // Hủy báo cáo
  cancelReport: async (reportId) => {
    try {
      const response = await api.post(`/api/reports/${reportId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Error canceling report ${reportId}:`, error);
      throw error;
    }
  },
  
  // Lấy chi tiết báo cáo
  getReportDetails: async (reportId) => {
    try {
      const response = await api.get(`/api/reports/me/${reportId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching report details ${reportId}:`, error);
      throw error;
    }
  },
  
  // Lấy các danh mục báo cáo
  getReportCategories: async () => {
    try {
      const response = await api.get('/api/reports/categories');
      return response.data;
    } catch (error) {
      // Return default categories if endpoint is not available
      console.error('Error fetching report categories:', error);
      return {
        success: true,
        categories: [
          { value: 'USER', label: 'Người dùng vi phạm' },
          { value: 'CONTENT', label: 'Nội dung vi phạm' },
          { value: 'COURSE', label: 'Khóa học có vấn đề' },
          { value: 'EVENT', label: 'Sự kiện vi phạm' },
          { value: 'COMMENT', label: 'Bình luận xúc phạm' }
        ]
      };
    }
  }
};

export default reportsAPI; 