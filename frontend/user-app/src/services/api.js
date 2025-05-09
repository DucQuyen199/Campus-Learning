import axios from 'axios';
import { API_URL } from '@/config';

// Create base API instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token in all requests
api.interceptors.request.use(
  (config) => {
    // Try both possible token keys to ensure backward compatibility
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Token added to request:', token.substring(0, 20) + '...');
    } else {
      console.log('No token available for request');
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response || error);
    
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      // Check if the error is not from the login endpoint
      if (!error.config.url.includes('/login') && !error.config.url.includes('/register')) {
        console.log('Session expired, redirecting to login');
        // Clear user data with consistent key names
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Dispatch auth error event
        window.dispatchEvent(new CustomEvent('auth_error', { detail: error }));
      }
    }
    
    return Promise.reject(error);
  }
);

// =================== AUTH SERVICES ===================
const authServices = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh-token'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (oldPassword, newPassword) => api.post('/auth/change-password', { oldPassword, newPassword }),
};

// =================== USER SERVICES ===================
const userServices = {
  getProfile: (userId) => api.get(`/users/${userId}/profile`),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  getProfileSettings: () => api.get('/users/settings'),
  updateProfileSettings: (settings) => api.put('/users/settings', settings),
  getUserRanking: (userId) => api.get(`/users/${userId}/ranking`),
  getAllUsers: (params) => api.get('/users', { params }),
  getUserAchievements: (userId) => api.get(`/users/${userId}/achievements`),
  uploadProfileImage: (formData) => api.post('/users/profile/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

// =================== COURSE SERVICES ===================
const courseServices = {
  getAllCourses: (params) => api.get('/courses', { params }),
  getCourseById: (courseId) => api.get(`/courses/${courseId}`),
  getCourseModules: (courseId) => api.get(`/courses/${courseId}/modules`),
  getCourseModule: (courseId, moduleId) => api.get(`/courses/${courseId}/modules/${moduleId}`),
  getModuleLessons: (moduleId) => api.get(`/modules/${moduleId}/lessons`),
  getLessonById: (lessonId) => api.get(`/lessons/${lessonId}`),
  enrollCourse: (courseId) => api.post(`/courses/${courseId}/enroll`),
  getEnrolledCourses: () => api.get('/courses/enrolled'),
  saveLessonProgress: (lessonId, progress) => api.post(`/lessons/${lessonId}/progress`, progress),
  getLessonProgress: (lessonId) => api.get(`/lessons/${lessonId}/progress`),
  getRecommendedCourses: () => api.get('/courses/recommended'),
  rateCourse: (courseId, rating, review) => api.post(`/courses/${courseId}/ratings`, { rating, review }),
  getCourseRatings: (courseId) => api.get(`/courses/${courseId}/ratings`),
  getPopularCourses: () => api.get('/courses/popular'),
  getNewCourses: () => api.get('/courses/new'),
  searchCourses: (query) => api.get('/courses/search', { params: { query } }),
  getCodingExercises: (lessonId) => api.get(`/lessons/${lessonId}/exercises`),
  submitCodingExercise: (exerciseId, submission) => api.post(`/exercises/${exerciseId}/submissions`, submission),
  getCodingSubmissions: (exerciseId) => api.get(`/exercises/${exerciseId}/submissions`),
  updateLastAccessedLesson: (courseId, lessonId) => api.put(`/courses/${courseId}/last-accessed`, { lessonId }),
  
  // New endpoints for code execution and submission
  executeCode: (code, language, lessonId, stdin = '') => api.post('/api/execute-code', { 
    code, 
    language,
    lessonId,
    stdin: stdin || 'Test User',
    timeout: 30000
  }),
  
  submitCode: (lessonId, code, language, exerciseId = null) => api.post(`/lessons/${lessonId}/submit-code`, {
    code,
    language,
    exerciseId
  }),
  
  getTestCases: (lessonId, exerciseId = null) => api.get(`/lessons/${lessonId}/test-cases`, {
    params: { exerciseId }
  })
};

// =================== EVENT SERVICES ===================
const eventServices = {
  getAllEvents: (params) => api.get('/api/events', { params }),
  getEventById: (eventId) => api.get(`/api/events/${eventId}`),
  registerForEvent: (eventId, userData = {}) => api.post(`/api/events/${eventId}/register`, userData),
  cancelEventRegistration: (eventId) => api.delete(`/api/events/${eventId}/register`),
  getRegisteredEvents: () => api.get('/api/events/registered'),
  getUpcomingEvents: () => api.get('/api/events/upcoming'),
  getOngoingEvents: () => api.get('/api/events/ongoing'),
  getPastEvents: () => api.get('/api/events/past'),
  getEventSchedule: (eventId) => api.get(`/api/events/${eventId}/schedule`),
  getEventParticipants: (eventId) => api.get(`/api/events/${eventId}/participants`),
  getEventRounds: (eventId) => api.get(`/api/events/${eventId}/rounds`),
  getEventPrizes: (eventId) => api.get(`/api/events/${eventId}/prizes`),
  getEventTechnologies: (eventId) => api.get(`/api/events/${eventId}/technologies`),
  getEventProgrammingLanguages: (eventId) => api.get(`/api/events/${eventId}/languages`),
  getEventAchievements: (eventId) => api.get(`/api/events/${eventId}/achievements`),
  getUserEventAchievements: () => api.get(`/api/events/achievements`),
  checkEventRegistration: (eventId) => api.get(`/api/events/${eventId}/registration-status`)
};

// =================== POST SERVICES ===================
const postServices = {
  getAllPosts: (params) => api.get('/posts', { params }),
  getPostById: (postId) => api.get(`/posts/${postId}`),
  createPost: (postData) => api.post('/posts', postData),
  updatePost: (postId, postData) => api.put(`/posts/${postId}`, postData),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  unlikePost: (postId) => api.delete(`/posts/${postId}/like`),
  getPostLikes: (postId) => api.get(`/posts/${postId}/likes`),
  getPostComments: (postId) => api.get(`/posts/${postId}/comments`),
  createComment: (postId, content) => api.post(`/posts/${postId}/comments`, { content }),
  replyToComment: (postId, commentId, content) => api.post(`/posts/${postId}/comments/${commentId}/replies`, { content }),
  updateComment: (commentId, content) => api.put(`/comments/${commentId}`, { content }),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  likeComment: (commentId) => api.post(`/comments/${commentId}/like`),
  unlikeComment: (commentId) => api.delete(`/comments/${commentId}/like`),
  getCommentLikes: (commentId) => api.get(`/comments/${commentId}/likes`),
  getPostsByTag: (tagId) => api.get(`/tags/${tagId}/posts`),
  getTags: () => api.get('/tags'),
  uploadPostMedia: (postId, formData) => api.post(`/posts/${postId}/media`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  reportPost: (postId, reason) => api.post(`/posts/${postId}/report`, { reason }),
};

// =================== NOTIFICATION SERVICES ===================
const notificationServices = {
  getAllNotifications: () => api.get('/notifications'),
  markNotificationAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAllNotificationsAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  getNotificationPreferences: () => api.get('/notifications/preferences'),
  updateNotificationPreferences: (preferences) => api.put('/notifications/preferences', preferences),
  subscribeToEvents: (eventId) => api.post(`/events/${eventId}/subscribe`),
  unsubscribeFromEvents: (eventId) => api.delete(`/events/${eventId}/subscribe`),
  subscribeToCourses: (courseId) => api.post(`/courses/${courseId}/subscribe`),
  unsubscribeFromCourses: (courseId) => api.delete(`/courses/${courseId}/subscribe`),
};

// =================== RANKING SERVICES ===================
const rankingServices = {
  getLeaderboard: (params) => api.get('/rankings/leaderboard', { params }),
  getUserRanking: (userId) => api.get(`/rankings/users/${userId}`),
  getWeeklyRanking: () => api.get('/rankings/weekly'),
  getMonthlyRanking: () => api.get('/rankings/monthly'),
  getAllTimeRanking: () => api.get('/rankings/all-time'),
  getRankingHistory: (userId) => api.get(`/rankings/users/${userId}/history`),
  getRankingStats: (userId, periodType) => api.get(`/rankings/users/${userId}/stats`, { params: { periodType } }),
};

// =================== EXAM SERVICES ===================
const examServices = {
  getAllExams: (params) => api.get('/api/exams', { params }),
  getExamById: (examId) => api.get(`/api/exams/${examId}`),
  registerForExam: (examId) => api.post(`/api/exams/${examId}/register`),
  startExam: (examId) => api.post(`/api/exams/${examId}/start`),
  getExamQuestions: (examId) => api.get(`/api/exams/${examId}/questions`),
  submitExamAnswer: (examId, questionId, answer) => api.post(`/api/exams/${examId}/questions/${questionId}/answer`, { answer }),
  finishExam: (examId) => api.post(`/api/exams/${examId}/finish`),
  getExamResults: (examId) => api.get(`/api/exams/${examId}/results`),
  getUserExams: (status) => api.get('/api/exams/user', { params: { status } }),
  getUpcomingExams: () => api.get('/api/exams/upcoming'),
  autoRegisterForAllExams: () => api.post('/api/exams/auto-register'),
};

// =================== CHAT SERVICES ===================
const chatServices = {
  getConversations: () => api.get('/conversations'),
  getConversationById: (conversationId) => api.get(`/conversations/${conversationId}`),
  sendMessage: (conversationId, message) => api.post(`/conversations/${conversationId}/messages`, { message }),
  getMessages: (conversationId) => api.get(`/conversations/${conversationId}/messages`),
  createConversation: (participantId) => api.post('/conversations', { participantId }),
  deleteConversation: (conversationId) => api.delete(`/conversations/${conversationId}`),
  markConversationAsRead: (conversationId) => api.put(`/conversations/${conversationId}/read`),
  getUnreadCount: () => api.get('/conversations/unread-count')
};

// =================== AI CHAT SERVICES ===================
const aiChatServices = {
  sendMessage: (message) => api.post('/ai-chat/messages', { message }),
  getChatHistory: () => api.get('/ai-chat/history'),
  clearChatHistory: () => api.delete('/ai-chat/history'),
  getSuggestedPrompts: () => api.get('/ai-chat/suggested-prompts'),
  rateResponse: (messageId, rating) => api.post(`/ai-chat/messages/${messageId}/rate`, { rating }),
  getConversationContext: (conversationId) => api.get(`/ai-chat/conversations/${conversationId}/context`),
  saveConversation: (title) => api.post('/ai-chat/conversations', { title }),
  getSavedConversations: () => api.get('/ai-chat/conversations'),
  deleteConversation: (conversationId) => api.delete(`/ai-chat/conversations/${conversationId}`),
  renameConversation: (conversationId, newTitle) => api.put(`/ai-chat/conversations/${conversationId}`, { title: newTitle })
};

// Export all services and api instance
export {
  authServices,
  userServices,
  courseServices,
  eventServices,
  postServices,
  notificationServices,
  rankingServices,
  examServices,
  chatServices,
  aiChatServices,
  api
};