import axios from 'axios';

// Tạo API client với cấu hình mặc định
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5004',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true
});

// Thêm interceptor để đính kèm token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Fix for reports endpoint - redirect any direct /api/reports GET requests to /api/reports/me
    if (config.method === 'get' && config.url === '/api/reports') {
      console.log('Intercepting reports request, redirecting to /api/reports/me');
      config.url = '/api/reports/me';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor để xử lý các lỗi response
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      // Token hết hạn, xóa token và thông báo đăng nhập lại
      localStorage.removeItem('token');
      console.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    // Xử lý lỗi 403 (Forbidden)
    if (error.response && error.response.status === 403) {
      console.error('Bạn không có quyền truy cập tài nguyên này.');
    }
    
    // Xử lý lỗi 404 (Not Found)
    if (error.response && error.response.status === 404) {
      console.error('Không tìm thấy tài nguyên yêu cầu.');
    }
    
    // Xử lý lỗi Network/CORS
    if (error.message === 'Network Error') {
      console.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet hoặc CORS.');
    }
    
    // Customize lỗi để hiển thị thông báo cho người dùng
    const customError = new Error(
      (error.response && error.response.data && error.response.data.message) || 
      error.message ||
      'Đã xảy ra lỗi khi giao tiếp với máy chủ.'
    );
    
    // Thêm thông tin từ response gốc
    customError.response = error.response;
    customError.status = error.response ? error.response.status : null;
    
    return Promise.reject(customError);
  }
);

// Import và export các API modules
export * from './userApi';
export * from './courseApi';
export * from './chatApi';
export * from './reports';
export * from './settings';
export * from './competitionApi';
export * from './examApi';

export default api; 