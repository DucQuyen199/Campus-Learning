import axios from 'axios';
import { settingsAPI } from './settingsApi';
import { profileAPI } from './profileApi';

// Safely access environment variables
const getEnvVar = (key, fallback) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || fallback;
  }
  return fallback;
};

// Tạo instance axios với config mặc định
const API = axios.create({
  baseURL: getEnvVar('VITE_API_URL', 'http://localhost:5002/api'), // Safe access with fallback
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // Giúp phân biệt AJAX request
  },
  timeout: 10000, // 10 giây timeout
  withCredentials: true // Cho phép gửi cookies và headers xác thực cross-origin
});

// Export the axios instance for direct use
export const axiosInstance = API;

// Thêm biến để theo dõi refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Thêm header cho CORS preflight request
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with improved error handling
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Kiểm tra lỗi mạng hoặc CORS
    if (error.message && error.message.includes('Network Error')) {
      console.error('Network error detected. Possible CORS issue or server unavailable');
      // Hiển thị thông báo cho người dùng
      if (originalRequest.baseURL) {
        console.error(`Failed to connect to server: ${originalRequest.baseURL}`);
      }
      return Promise.reject(
        new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.')
      );
    }

    // Xử lý lỗi 403 Forbidden
    if (error.response?.status === 403) {
      console.warn('Access forbidden (403). You may not have sufficient permissions.');
      return Promise.reject(
        new Error('Bạn không có quyền truy cập vào tài nguyên này. Vui lòng liên hệ quản trị viên.')
      );
    }

    // Handle 401 and refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        try {
          // Wait for the other refresh call
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('admin_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await API.post('/auth/refresh', { refreshToken });
        
        if (response.data?.token) {
          localStorage.setItem('admin_token', response.data.token);
          localStorage.setItem('admin_refresh_token', response.data.refreshToken);
          
          API.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          
          processQueue(null, response.data.token);
          return API(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        
        // Hiển thị thông báo đăng nhập lại và chuyển hướng
        console.error('Authentication failed. Redirecting to login page...');
        if (window.confirm('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => API.post('/auth/login', {
    ...credentials,
    role: 'ADMIN' // Thêm role vào request
  }),
  refreshToken: () => API.post('/auth/refresh', {
    refreshToken: localStorage.getItem('admin_refresh_token')
  }),
  checkSession: () => API.get('/auth/session'),
  logout: () => API.post('/auth/logout')
};

// Users API endpoints
export const usersAPI = {
  getUsers: () => API.get('/users').catch(error => {
    console.error('Error fetching users:', error);
    return { 
      data: {
        users: [],
        totalCount: 0
      }
    };
  }),
  getUserActivity: () => API.get('/users/activity').catch(error => {
    console.error('Error fetching user activity:', error);
    return { data: [] };
  }),
  getUser: (id) => API.get(`/users/${id}`),
  createUser: (userData) => API.post('/users', userData),
  updateUser: (id, userData) => {
    // Ensure school field is included in the update
    const { fullName, email, school, bio, ...rest } = userData;
    return API.put(`/users/${id}`, {
      fullName, 
      email, 
      school,
      bio,
      ...rest
    });
  },
  deleteUser: (id) => API.delete(`/users/${id}`),
  getRoles: () => API.get('/users/roles/all'),
  createRole: (roleData) => API.post('/users/roles', roleData),
  updateRole: (id, roleData) => API.put(`/users/roles/${id}`, roleData),
  deleteRole: (id) => API.delete(`/users/roles/${id}`),
  updateUserRole: (id, role) => API.put(`/users/${id}/role`, { role }),
  lockUser: (id, duration) => API.post(`/users/${id}/lock`, { 
    duration,
    reason: 'Khóa bởi Admin'
  }),
  unlockUser: (id) => API.post(`/users/${id}/unlock`),
  updateUserStatus: (id, status, duration) => API.post(`/users/update-status`, {
    userId: id,
    accountStatus: status,
    duration: duration,
    reason: status === 'LOCKED' ? 'Khóa bởi Admin' : null
  }),
  updateAccountStatus: (id, status) => API.post(`/users/update-status`, {
    userId: id,
    accountStatus: status
  }),
  exportUsers: (filters = {}) => API.get('/users/export', { 
    params: filters,
    responseType: 'blob'
  }).catch(error => {
    console.error('Error exporting users:', error);
    throw new Error('Failed to export users data');
  }),
};

// Courses API endpoints
export const coursesAPI = {
  getCourses: () => API.get('/courses').catch(error => {
    console.error('Error fetching courses:', error);
    return { 
      data: { 
        courses: [],
        message: error.response?.data?.message || 'Không thể tải danh sách khóa học'
      } 
    };
  }),
  getCourseStats: () => API.get('/courses/stats').catch(error => {
    console.error('Error fetching course stats:', error);
    return { 
      data: { 
        active: 0, 
        change: 0, 
        changeType: 'increase',
        error: error.response?.data?.message || 'Không thể tải thống kê khóa học'
      } 
    };
  }),
  getCourse: (id) => API.get(`/courses/${id}`),
  createCourse: (courseData) => API.post('/courses', courseData),
  updateCourse: (id, courseData) => API.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => API.delete(`/courses/${id}`),
  createModule: (courseId, moduleData) => API.post(`/courses/${courseId}/modules`, moduleData),
  getModule: (moduleId) => API.get(`/courses/modules/${moduleId}`),
  updateModule: (moduleId, moduleData) => API.put(`/courses/modules/${moduleId}`, moduleData),
  createLesson: (moduleId, lessonData) => API.post(`/courses/modules/${moduleId}/lessons`, lessonData),
};

// Events API endpoints
export const eventsAPI = {
  getEvents: () => API.get('/events/stats').catch(error => {
    console.error('Error fetching events stats:', error);
    return { 
      data: { 
        upcoming: 0, 
        change: 0, 
        changeType: 'increase',
        error: error.response?.data?.message || 'Không thể tải thống kê sự kiện'
      } 
    };
  }),
  getUpcomingEvents: () => API.get('/events/upcoming'),
  getEvent: (id) => API.get(`/events/${id}`),
  createEvent: (eventData) => API.post('/events', eventData),
  updateEvent: (id, eventData) => API.put(`/events/${id}`, eventData),
  deleteEvent: (id) => API.delete(`/events/${id}`),
  createRound: (eventId, roundData) => API.post(`/events/${eventId}/rounds`, roundData),
  createPrize: (eventId, prizeData) => API.post(`/events/${eventId}/prizes`, prizeData),
  createScheduleItem: (eventId, itemData) => API.post(`/events/${eventId}/schedule`, itemData),
  getParticipants: (eventId) => API.get(`/events/${eventId}/participants`),
};

// Exams API
export const examsAPI = {
  getExams: () => API.get('/exams'),
  getExam: (id) => API.get(`/exams/${id}`),
  createExam: (examData) => API.post('/exams', examData),
  updateExam: (id, examData) => API.put(`/exams/${id}`, examData),
  cancelExam: (id) => API.put(`/exams/${id}/cancel`),
  addQuestion: (examId, questionData) => API.post(`/exams/${examId}/questions`, questionData),
  updateQuestion: (questionId, questionData) => API.put(`/exams/questions/${questionId}`, questionData),
  deleteQuestion: (questionId) => API.delete(`/exams/questions/${questionId}`),
  addAnswerTemplate: (examId, templateData) => API.post(`/exams/${examId}/template`, templateData),
  getParticipants: (examId) => API.get(`/exams/${examId}/participants`),
  getParticipantAnswers: (participantId) => API.get(`/exams/participants/${participantId}/answers`),
  reviewAnswer: (answerId, reviewData) => API.post(`/exams/answers/${answerId}/review`, reviewData),
};

// Competitions API
export const competitionsAPI = {
  getCompetitions: () => API.get('/competitions'),
  getCompetition: (id) => API.get(`/competitions/${id}`),
  createCompetition: (competitionData) => API.post('/competitions', competitionData),
  updateCompetition: (id, competitionData) => API.put(`/competitions/${id}`, competitionData),
  addRound: (competitionId, roundData) => API.post(`/competitions/${competitionId}/rounds`, roundData),
  updateRound: (roundId, roundData) => API.put(`/competitions/rounds/${roundId}`, roundData),
  addPrize: (competitionId, prizeData) => API.post(`/competitions/${competitionId}/prizes`, prizeData),
  updatePrize: (prizeId, prizeData) => API.put(`/competitions/prizes/${prizeId}`, prizeData),
  getParticipants: (competitionId) => API.get(`/competitions/${competitionId}/participants`),
  recordAchievement: (competitionId, achievementData) => API.post(`/competitions/${competitionId}/achievements`, achievementData),
  updateStatus: (id, statusData) => API.put(`/competitions/${id}/status`, statusData),
};

// Reports API endpoints
export const reportsAPI = {
  getStats: () => API.get('/reports/stats').catch(error => {
    console.error('Error fetching reports stats:', error);
    
    // Return a structure that matches what the component expects
    return { 
      data: { 
        data: {
          total: 42,
          pending: 15,
          resolved: 20,
          rejected: 7,
          change: 12.5,
          changeType: 'increase'
        }
      }
    };
  }),
  getAllReports: (options = {}) => {
    const { page = 1, limit = 10, status, sortBy, sortOrder } = options;
    let url = `/reports?page=${page}&limit=${limit}`;
    
    if (status) url += `&status=${status}`;
    if (sortBy) url += `&sortBy=${sortBy}`;
    if (sortOrder) url += `&sortOrder=${sortOrder}`;
    
    return API.get(url).catch(error => {
      console.error('Error fetching reports:', error);
      
      // Return mock data in the expected structure
      return { 
        data: {
          reports: [
            {
              id: 1,
              title: 'Người dùng đăng bài không phù hợp',
              content: 'Người dùng này đã đăng một bài viết có nội dung không phù hợp với tiêu chuẩn cộng đồng.',
              category: 'USER',
              reporterName: 'Nguyễn Văn A',
              reporterID: 101,
              targetID: 201,
              targetType: 'USER',
              createdAt: '2023-05-15T08:30:00Z',
              status: 'PENDING',
              resolvedAt: null,
              notes: null
            },
            {
              id: 2,
              title: 'Nội dung khóa học không chính xác',
              content: 'Khóa học này chứa thông tin kỹ thuật không chính xác về React.',
              category: 'COURSE',
              reporterName: 'Trần Thị B',
              reporterID: 102,
              targetID: 301,
              targetType: 'COURSE',
              createdAt: '2023-05-10T14:20:00Z',
              status: 'RESOLVED',
              resolvedAt: '2023-05-12T09:15:00Z',
              notes: 'Đã cập nhật nội dung khóa học với thông tin chính xác.'
            },
            {
              id: 3,
              title: 'Bình luận xúc phạm',
              content: 'Người dùng đã bình luận với ngôn từ xúc phạm trên bài đăng của tôi.',
              category: 'COMMENT',
              reporterName: 'Lê Văn C',
              reporterID: 103,
              targetID: 401,
              targetType: 'COMMENT',
              createdAt: '2023-05-14T18:45:00Z',
              status: 'REJECTED',
              resolvedAt: '2023-05-15T10:30:00Z',
              notes: 'Bình luận không vi phạm quy định cộng đồng.'
            },
            {
              id: 4,
              title: 'Sự kiện thiếu thông tin',
              content: 'Sự kiện này không cung cấp đủ thông tin về địa điểm và thời gian.',
              category: 'EVENT',
              reporterName: 'Phạm Thị D',
              reporterID: 104,
              targetID: 501,
              targetType: 'EVENT',
              createdAt: '2023-05-16T09:10:00Z',
              status: 'PENDING',
              resolvedAt: null,
              notes: null
            },
            {
              id: 5,
              title: 'Bài viết chứa thông tin sai lệch',
              content: 'Bài viết này chứa thông tin sai lệch về công nghệ AI hiện tại.',
              category: 'CONTENT',
              reporterName: 'Hoàng Văn E',
              reporterID: 105,
              targetID: 601,
              targetType: 'POST',
              createdAt: '2023-05-17T11:20:00Z',
              status: 'PENDING',
              resolvedAt: null,
              notes: null
            }
          ],
          totalCount: 5
        }
      };
    });
  },
  getReportById: (id) => API.get(`/reports/${id}`),
  updateReportStatus: (id, status, notes) => API.put(`/reports/${id}/status`, { status, notes }),
  deleteReport: (id) => API.delete(`/reports/${id}`),
  exportReports: (filters) => API.post('/reports/export', filters, { responseType: 'blob' }),
};

// Dashboard API endpoints
export const dashboardAPI = {
  getStats: () => API.get('/dashboard/stats').catch(error => {
    console.error('Dashboard Stats API Error:', error);
    // Mock data for dashboard stats
    return {
      data: {
        userStats: {
          totalUsers: 120,
          activeUsers: 95,
          newUsers: 28,
          recentActiveUsers: 42
        },
        courseStats: {
          totalCourses: 25,
          publishedCourses: 18,
          totalEnrollments: 320,
          coursesWithEnrollments: 15
        },
        eventStats: {
          totalEvents: 8,
          upcomingEvents: 3,
          pastEvents: 5,
          totalParticipants: 150
        },
        examStats: {
          totalExams: 12,
          upcomingExams: 2,
          completedExams: 10,
          totalParticipants: 220
        },
        reportStats: {
          totalReports: 42,
          pendingReports: 15,
          resolvedReports: 20,
          rejectedReports: 7
        },
        registrationTrend: [
          { Month: 1, Year: 2023, Count: 18 },
          { Month: 2, Year: 2023, Count: 22 },
          { Month: 3, Year: 2023, Count: 15 },
          { Month: 4, Year: 2023, Count: 25 },
          { Month: 5, Year: 2023, Count: 30 },
          { Month: 6, Year: 2023, Count: 28 }
        ],
        enrollmentTrend: [
          { Month: 1, Year: 2023, Count: 35 },
          { Month: 2, Year: 2023, Count: 42 },
          { Month: 3, Year: 2023, Count: 38 },
          { Month: 4, Year: 2023, Count: 45 },
          { Month: 5, Year: 2023, Count: 52 },
          { Month: 6, Year: 2023, Count: 48 }
        ],
        rolesDistribution: [
          { Role: 'STUDENT', Count: 85 },
          { Role: 'INSTRUCTOR', Count: 15 },
          { Role: 'ADMIN', Count: 5 },
          { Role: 'MODERATOR', Count: 10 }
        ],
        popularCourses: [
          { CourseID: 1, Title: 'Introduction to Web Development', Category: 'Development', EnrollmentCount: 45 },
          { CourseID: 2, Title: 'Advanced JavaScript', Category: 'Programming', EnrollmentCount: 38 },
          { CourseID: 3, Title: 'React Fundamentals', Category: 'Frontend', EnrollmentCount: 32 },
          { CourseID: 4, Title: 'Node.js Backend', Category: 'Backend', EnrollmentCount: 28 },
          { CourseID: 5, Title: 'Database Design', Category: 'Database', EnrollmentCount: 25 }
        ]
      }
    };
  }),
  getChartData: (chartType, timeRange = 'month') => API.get(`/dashboard/charts/${chartType}`, {
    params: { timeRange }
  }).catch(error => {
    console.error(`Dashboard Chart API Error (${chartType}):`, error);
    // Mock chart data based on chart type
    const mockData = {
      'user-registrations': [
        { Date: '2023-01-01', Count: 5 },
        { Date: '2023-01-02', Count: 7 },
        { Date: '2023-01-03', Count: 3 },
        { Date: '2023-01-04', Count: 8 },
        { Date: '2023-01-05', Count: 12 }
      ],
      'course-enrollments': [
        { Date: '2023-01-01', Count: 10 },
        { Date: '2023-01-02', Count: 15 },
        { Date: '2023-01-03', Count: 8 },
        { Date: '2023-01-04', Count: 12 },
        { Date: '2023-01-05', Count: 20 }
      ],
      'event-registrations': [
        { Date: '2023-01-01', Count: 2 },
        { Date: '2023-01-02', Count: 4 },
        { Date: '2023-01-03', Count: 1 },
        { Date: '2023-01-04', Count: 5 },
        { Date: '2023-01-05', Count: 8 }
      ]
    };
    return { data: mockData[chartType] || [] };
  }),
  getRecentActivities: () => API.get('/dashboard/activities').catch(error => {
    console.error('Dashboard Activities API Error:', error);
    // Mock activities data
    return {
      data: [
        {
          type: 'user_registration',
          id: 1001,
          name: 'Nguyễn Văn A',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          description: 'New user registration',
          category: 'user'
        },
        {
          type: 'course_enrollment',
          id: 2001,
          name: 'Trần Thị B',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Enrolled in course: Introduction to React',
          category: 'course'
        },
        {
          type: 'event_registration',
          id: 3001,
          name: 'Lê Văn C',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Registered for event: Tech Conference 2023',
          category: 'event'
        },
        {
          type: 'exam_completion',
          id: 4001,
          name: 'Phạm Thị D',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Completed exam: JavaScript Fundamentals',
          category: 'exam'
        },
        {
          type: 'course_completion',
          id: 5001,
          name: 'Hoàng Văn E',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Completed course: Advanced CSS Techniques',
          category: 'course'
        }
      ]
    };
  }),
  getUserActivity: () => API.get('/dashboard/user-activity').catch(error => {
    console.error('User Activity API Error:', error);
    return { data: [] };
  }),
  getSystemNotifications: () => API.get('/dashboard/notifications').catch(error => {
    console.error('System Notifications API Error:', error);
    // Mock notifications data
    return {
      data: [
        {
          type: 'report',
          id: 101,
          title: 'Inappropriate content in forum',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          message: 'New report: Inappropriate content in forum',
          priority: 'warning'
        },
        {
          type: 'user_account',
          id: 201,
          title: 'Phạm Thị D',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'New user registered: Phạm Thị D',
          priority: 'info'
        },
        {
          type: 'event',
          id: 301,
          title: 'Web Development Workshop',
          timestamp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Upcoming event: Web Development Workshop',
          priority: 'info'
        },
        {
          type: 'system',
          id: 401,
          title: 'System Maintenance',
          timestamp: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Scheduled maintenance: The system will be down for updates on Saturday night',
          priority: 'warning'
        },
        {
          type: 'course',
          id: 501,
          title: 'New Course Available',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'New course published: Docker for Beginners',
          priority: 'info'
        }
      ]
    };
  })
};

// Export settings and profile APIs
export { settingsAPI, profileAPI };

export default API;