import axios from 'axios';

// Base API client
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5011',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Redirect to login if 401 error
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  login: (username, password) => {
    return apiClient.post('/auth/login', { username, password });
  },
  getProfile: () => {
    return apiClient.get('/auth/profile');
  },
  changePassword: (currentPassword, newPassword) => {
    return apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },
  validateToken: () => {
    return apiClient.get('/auth/validate-token');
  },
};

// Students service
export const studentsService = {
  getAllStudents: (page = 1, limit = 10, search = '', status = '', programId = '') => {
    return apiClient.get('/students', {
      params: { page, limit, search, status, programId },
    });
  },
  getStudentById: (id) => {
    return apiClient.get(`/students/${id}`);
  },
  createStudent: (studentData) => {
    return apiClient.post('/students', studentData);
  },
  updateStudent: (id, studentData) => {
    return apiClient.put(`/students/${id}`, studentData);
  },
  resetPassword: (id, newPassword) => {
    return apiClient.post(`/students/${id}/reset-password`, { newPassword });
  },
  getStudentResults: (id, semesterId = '') => {
    return apiClient.get(`/students/${id}/results`, {
      params: { semesterId },
    });
  },
};

// Academic service
export const academicService = {
  // Programs
  getAllPrograms: () => {
    return apiClient.get('/academic/programs');
  },
  getProgramById: (id) => {
    return apiClient.get(`/academic/programs/${id}`);
  },
  createProgram: (programData) => {
    return apiClient.post('/academic/programs', programData);
  },
  updateProgram: (id, programData) => {
    return apiClient.put(`/academic/programs/${id}`, programData);
  },
  
  // Subjects
  getAllSubjects: (faculty = '', department = '', search = '', isActive = null) => {
    return apiClient.get('/academic/subjects', {
      params: { faculty, department, search, isActive },
    });
  },
  createSubject: (subjectData) => {
    return apiClient.post('/academic/subjects', subjectData);
  },
  
  // Subject-Program relationships
  addSubjectToProgram: (programId, subjectId, data) => {
    return apiClient.post(`/academic/programs/${programId}/subjects/${subjectId}`, data);
  },
  
  // Semesters
  getAllSemesters: () => {
    return apiClient.get('/academic/semesters');
  },
  createSemester: (semesterData) => {
    return apiClient.post('/academic/semesters', semesterData);
  },

  // Academic Warnings
  getAcademicWarnings: (page = 1, limit = 10, search = '', status = '', semesterId = '') => {
    return apiClient.get('/academic/warnings', {
      params: { page, limit, search, status, semesterId },
    });
  },
  getAcademicWarningById: (id) => {
    return apiClient.get(`/academic/warnings/${id}`);
  },
  createAcademicWarning: (warningData) => {
    return apiClient.post('/academic/warnings', warningData);
  },
  updateAcademicWarning: (id, warningData) => {
    return apiClient.put(`/academic/warnings/${id}`, warningData);
  },
  resolveAcademicWarning: (id, resolutionData) => {
    return apiClient.post(`/academic/warnings/${id}/resolve`, resolutionData);
  },
  getStudentWarnings: (studentId) => {
    return apiClient.get(`/students/${studentId}/warnings`);
  }
};

// Tuition service
export const tuitionService = {
  // Get tuition list with filters
  getAllTuition: (page = 1, limit = 10, search = '', semesterId = '', status = '') => {
    return apiClient.get('/tuition', {
      params: { page, limit, search, semesterId, status },
    });
  },
  
  // Get tuition details
  getTuitionById: (id) => {
    return apiClient.get(`/tuition/${id}`);
  },
  
  // Get tuition by student
  getStudentTuition: (studentId, semesterId = '') => {
    return apiClient.get(`/students/${studentId}/tuition`, {
      params: { semesterId },
    });
  },
  
  // Create new tuition record
  createTuition: (tuitionData) => {
    return apiClient.post('/tuition', tuitionData);
  },
  
  // Update tuition record
  updateTuition: (id, tuitionData) => {
    return apiClient.put(`/tuition/${id}`, tuitionData);
  },
  
  // Process payment
  processPayment: (tuitionId, paymentData) => {
    return apiClient.post(`/tuition/${tuitionId}/payments`, paymentData);
  },
  
  // Get payment history
  getPaymentHistory: (tuitionId) => {
    return apiClient.get(`/tuition/${tuitionId}/payments`);
  },
  
  // Get payment receipt
  getPaymentReceipt: (paymentId) => {
    return apiClient.get(`/tuition/payments/${paymentId}/receipt`);
  },
  
  // Generate tuition invoices for semester
  generateSemesterInvoices: (semesterId, options) => {
    return apiClient.post(`/tuition/generate/${semesterId}`, options);
  },
  
  // Get tuition statistics
  getTuitionStatistics: (semesterId = '') => {
    return apiClient.get('/tuition/statistics', {
      params: { semesterId },
    });
  },
};

export default {
  auth: authService,
  students: studentsService,
  academic: academicService,
  tuition: tuitionService,
}; 