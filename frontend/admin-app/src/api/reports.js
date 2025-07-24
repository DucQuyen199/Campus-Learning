/*-----------------------------------------------------------------
* File: reports.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { axiosInstance } from './index';

// Hàm helper để lấy token xác thực từ localStorage
const getAuthToken = () => {
  return localStorage.getItem('admin_token') || localStorage.getItem('token');
};

// Hàm helper để tạo config cho request có xác thực
const getAuthConfig = (additionalConfig = {}) => {
  const token = getAuthToken();
  return {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    ...additionalConfig
  };
};

/**
 * Get all reports with pagination, filtering, and sorting
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Number of items per page
 * @param {string} params.status - Filter by status
 * @param {string} params.category - Filter by category
 * @param {string} params.search - Search term
 * @param {string} params.sortBy - Sort by field
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @returns {Promise} Promise object with reports data and pagination info
 */
export const getReports = async (params = {}) => {
  try {
    const config = getAuthConfig({ params });
    const response = await axiosInstance.get('/reports', config);
    return response;
  } catch (error) {
    console.error('Error fetching reports:', error);
    // Check if it's an auth error
    if (error.response && error.response.status === 403) {
      console.error('Authentication error: Please log in again');
      // Allow redirection to login page if needed
      if (window.confirm('Your session has expired. Please log in again.')) {
        window.location.href = '/login';
      }
    }
    throw error;
  }
};

/**
 * Get report statistics
 * @returns {Promise} Promise object with report statistics
 */
export const getReportStats = async () => {
  try {
    const config = getAuthConfig();
    const response = await axiosInstance.get('/reports/stats', config);
    return response;
  } catch (error) {
    console.error('Error fetching report statistics:', error);
    if (error.response && error.response.status === 403) {
      console.error('Authentication error: Please log in again');
    }
    throw error;
  }
};

/**
 * Get report by ID
 * @param {number} reportId - The ID of the report to fetch
 * @returns {Promise} Promise object with report data
 */
export const getReportById = async (reportId) => {
  try {
    const config = getAuthConfig();
    const response = await axiosInstance.get(`/reports/${reportId}`, config);
    return response;
  } catch (error) {
    console.error(`Error fetching report ${reportId}:`, error);
    if (error.response && error.response.status === 403) {
      console.error('Authentication error: Please log in again');
    }
    throw error;
  }
};

/**
 * Update report status
 * @param {number} reportId - The ID of the report to update
 * @param {string} status - The new status
 * @param {string} notes - Optional notes
 * @returns {Promise} Promise object with updated report data
 */
export const updateReportStatus = async (reportId, status, notes) => {
  try {
    const config = getAuthConfig();
    const response = await axiosInstance.put(
      `/reports/${reportId}/status`, 
      { status, notes },
      config
    );
    return response;
  } catch (error) {
    console.error(`Error updating report ${reportId}:`, error);
    if (error.response && error.response.status === 403) {
      console.error('Authentication error: Please log in again');
    }
    throw error;
  }
};

/**
 * Delete report (soft delete)
 * @param {number} reportId - The ID of the report to delete
 * @returns {Promise} Promise object with success message
 */
export const deleteReport = async (reportId) => {
  try {
    const config = getAuthConfig();
    const response = await axiosInstance.delete(`/reports/${reportId}`, config);
    return response;
  } catch (error) {
    console.error(`Error deleting report ${reportId}:`, error);
    if (error.response && error.response.status === 403) {
      console.error('Authentication error: Please log in again');
    }
    throw error;
  }
};

/**
 * Export reports as CSV
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status
 * @param {string} params.category - Filter by category
 * @param {string} params.startDate - Start date for date range
 * @param {string} params.endDate - End date for date range
 * @returns {Promise} Promise object with CSV data
 */
export const exportReportsAsCsv = async (params = {}) => {
  try {
    const config = getAuthConfig({
      params,
      responseType: 'blob'
    });
    
    const response = await axiosInstance.get('/reports/export/csv', config);
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reports.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error exporting reports:', error);
    if (error.response && error.response.status === 403) {
      console.error('Authentication error: Please log in again');
    }
    throw error;
  }
};

/**
 * Delete reported content
 * @param {number} reportId - The ID of the report
 * @param {Object} data - Data for deletion
 * @returns {Promise} Promise object with success message
 */
export const deleteReportedContent = async (reportId, data = {}) => {
  try {
    const config = getAuthConfig();
    const response = await axiosInstance.post(
      `/reports/${reportId}/delete-content`, 
      data,
      config
    );
    return response;
  } catch (error) {
    console.error(`Error deleting reported content ${reportId}:`, error);
    if (error.response && error.response.status === 403) {
      console.error('Authentication error: Please log in again');
    }
    throw error;
  }
};

/**
 * Flag reported content
 * @param {number} reportId - The ID of the report
 * @param {Object} data - Data for flagging
 * @returns {Promise} Promise object with success message
 */
export const flagReportedContent = async (reportId, data = {}) => {
  try {
    const config = getAuthConfig();
    const response = await axiosInstance.post(
      `/reports/${reportId}/flag-content`, 
      data,
      config
    );
    return response;
  } catch (error) {
    console.error(`Error flagging reported content ${reportId}:`, error);
    if (error.response && error.response.status === 403) {
      console.error('Authentication error: Please log in again');
    }
    throw error;
  }
};

// Thêm API để lấy nội dung bài viết được báo cáo
export const getReportedContent = async (reportId) => {
  try {
    const config = getAuthConfig();
    const response = await axiosInstance.get(
      `/reports/${reportId}/content`,
      config
    );
    return response;
  } catch (error) {
    console.error(`Error fetching reported content ${reportId}:`, error);
    throw error;
  }
}; 
