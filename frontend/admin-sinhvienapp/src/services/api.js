import axios from 'axios';

// Base API client
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
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
    return apiClient.get('/auth/validate-token');
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

// Finance/Tuition service
export const tuitionService = {
  getAllTuition: (page = 1, limit = 10, search = '', semesterId = '', status = '') => {
    return apiClient.get('/finance/tuition', {
      params: { page, limit, search, semesterId, status },
    });
  },
  getTuitionById: (id) => {
    return apiClient.get(`/finance/tuition/${id}`);
  },
  getTuitionStudents: (params) => {
    return apiClient.get('/finance/tuition/students', { params });
  },
  generateTuition: (tuitionData) => {
    return apiClient.post('/finance/tuition/generate', tuitionData);
  },
  getTuitionPrograms: () => {
    return apiClient.get('/finance/programs');
  },
  updateTuitionStatus: (id, statusData) => {
    return apiClient.put(`/finance/tuition/${id}/status`, statusData);
  },
  addTuitionPayment: (tuitionId, paymentData) => {
    return apiClient.post(`/finance/tuition/${tuitionId}/payment`, paymentData);
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
  getAllSubjects: (faculty = '', department = '', search = '', isActive = null, programId = '') => {
    console.log('API getAllSubjects params:', { faculty, department, search, isActive, programId });
    return apiClient.get('/academic/subjects', {
      params: { faculty, department, search, isActive, programId },
    });
  },
  createSubject: (subjectData) => {
    console.log('API createSubject data:', subjectData);
    return apiClient.post('/academic/subjects', subjectData);
  },
  getSubjectById: (id) => {
    console.log('API getSubjectById:', id);
    return apiClient.get(`/academic/subjects/${id}`);
  },
  updateSubject: (id, subjectData) => {
    console.log('API updateSubject:', { id, subjectData });
    return apiClient.put(`/academic/subjects/${id}`, subjectData);
  },
  deleteSubject: (id) => {
    console.log('API deleteSubject:', id);
    return apiClient.delete(`/academic/subjects/${id}`);
  },
  getProgramSubjects: (programId) => {
    console.log('API getProgramSubjects for program:', programId);
    // Use a direct query focused on program subjects
    return apiClient.get(`/academic/programs/${programId}/subjects`);
  },
  
  // Subject-Program relationships
  addSubjectToProgram: (programId, subjectId, data) => {
    console.log('API addSubjectToProgram:', { programId, subjectId, data });
    return apiClient.post(`/academic/programs/${programId}/subjects/${subjectId}`, data);
  },
  removeSubjectFromProgram: (programId, subjectId) => {
    console.log('API removeSubjectFromProgram:', { programId, subjectId });
    return apiClient.delete(`/academic/programs/${programId}/subjects/${subjectId}`);
  },
  
  // Semesters
  getAllSemesters: async () => {
    try {
      const response = await apiClient.get('/academic/semesters');
      console.log('Raw API response from semesters:', response);
      return response; // Return the entire response object
    } catch (error) {
      console.error('Error fetching semesters:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },
  getSemesterById: async (id) => {
    try {
      const response = await apiClient.get(`/academic/semesters/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching semester ${id}:`, error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },
  createSemester: (semesterData) => {
    return apiClient.post('/academic/semesters', semesterData);
  },
  updateSemester: (id, semesterData) => {
    return apiClient.put(`/academic/semesters/${id}`, semesterData);
  },
};