import adminApi from './config';

// Courses API endpoints
export const coursesAPI = {
  // Fetch all courses
  getCourses: async () => {
    try {
      const response = await adminApi.get('/courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  // Get a single course by ID
  getCourse: async (id) => {
    try {
      const response = await adminApi.get(`/courses/${id}`);
      const moduleResponse = await adminApi.get(`/courses/${id}/modules`);
      
      return {
        course: response.data,
        modules: moduleResponse.data
      };
    } catch (error) {
      console.error(`Error fetching course with ID ${id}:`, error);
      throw error;
    }
  },

  // Get all enrolled students for a course
  getEnrolledStudents: async (courseId, page = 1, limit = 10) => {
    try {
      const response = await adminApi.get(`/courses/${courseId}/enrollments`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching enrolled students for course ${courseId}:`, error);
      
      // Help debugging by showing endpoint details
      if (error.response && error.response.status === 404) {
        console.info(`API endpoint not available: GET /courses/${courseId}/enrollments?page=${page}&limit=${limit}`);
      }
      
      throw error;
    }
  },

  // Create a new course
  createCourse: async (courseData) => {
    try {
      const response = await adminApi.post('/courses', courseData);
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  // Update an existing course
  updateCourse: async (id, courseData) => {
    try {
      const response = await adminApi.put(`/courses/${id}`, courseData);
      return response.data;
    } catch (error) {
      console.error(`Error updating course with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a course
  deleteCourse: async (id) => {
    try {
      const response = await adminApi.delete(`/courses/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting course with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new module for a course
  createModule: async (courseId, moduleData) => {
    try {
      const response = await adminApi.post(`/courses/${courseId}/modules`, moduleData);
      return response.data;
    } catch (error) {
      console.error(`Error creating module for course ${courseId}:`, error);
      throw error;
    }
  },

  // Update an existing module
  updateModule: async (courseId, moduleId, moduleData) => {
    try {
      const response = await adminApi.put(`/courses/${courseId}/modules/${moduleId}`, moduleData);
      return response.data;
    } catch (error) {
      console.error(`Error updating module ${moduleId}:`, error);
      throw error;
    }
  },

  // Delete a module
  deleteModule: async (courseId, moduleId) => {
    try {
      const response = await adminApi.delete(`/courses/${courseId}/modules/${moduleId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting module ${moduleId}:`, error);
      throw error;
    }
  },

  // Get a single module by ID
  getModule: async (courseId, moduleId) => {
    try {
      const moduleResponse = await adminApi.get(`/courses/${courseId}/modules/${moduleId}`);
      const lessonsResponse = await adminApi.get(`/courses/${courseId}/modules/${moduleId}/lessons`);
      
      return {
        module: moduleResponse.data,
        lessons: lessonsResponse.data || []
      };
    } catch (error) {
      console.error(`Error fetching module with ID ${moduleId}:`, error);
      throw error;
    }
  },

  // Get a single lesson by ID
  getLesson: async (courseId, moduleId, lessonId) => {
    try {
      const response = await adminApi.get(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching lesson with ID ${lessonId}:`, error);
      throw error;
    }
  },

  // Create a new lesson for a module
  createLesson: async (courseId, moduleId, lessonData) => {
    try {
      const response = await adminApi.post(`/courses/${courseId}/modules/${moduleId}/lessons`, lessonData);
      return response.data;
    } catch (error) {
      console.error(`Error creating lesson for module ${moduleId}:`, error);
      throw error;
    }
  },

  // Update an existing lesson
  updateLesson: async (courseId, moduleId, lessonId, lessonData) => {
    try {
      const response = await adminApi.put(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, lessonData);
      return response.data;
    } catch (error) {
      console.error(`Error updating lesson ${lessonId}:`, error);
      throw error;
    }
  },

  // Delete a lesson
  deleteLesson: async (courseId, moduleId, lessonId) => {
    try {
      const response = await adminApi.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting lesson ${lessonId}:`, error);
      throw error;
    }
  }
}; 