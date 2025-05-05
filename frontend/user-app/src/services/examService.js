import { api, examServices } from './api';
import axios from 'axios';

// Feature flags for development
export const BYPASS_PERMISSIONS = false; // Set to false in production
export const DISABLE_FULLSCREEN_ENFORCEMENT = true; // Set to false in production

// Helper function to format answers based on question type
export const formatAnswerByType = (type, answer) => {
  if (!type || answer === undefined || answer === null) return '';
  
  // Standardize type to lowercase for comparison
  const questionType = (type || '').toLowerCase();
  
  switch(questionType) {
    case 'multiple_choice':
      // For multiple choice, return the selected answer as is
      return answer;
    case 'essay':
      // For essay questions, trim whitespace but preserve line breaks
      return answer.trim();
    case 'coding':
      // For coding questions, preserve formatting but trim excessive whitespace
      return answer.trim();
    default:
      // Default case - just return the answer
      console.warn(`Unknown question type: ${type}, treating as essay`);
      return answer.trim();
  }
};

const examService = {
  // Get all available exams
  getAllExams: async () => {
    console.log('Getting all available exams');
    return api.get('/api/exams/all');
  },

  // Get all exams for a course
  getCourseExams: (courseId) => {
    console.log(`Getting exams for course ${courseId}`);
    return api.get(`/api/exams/course/${courseId}`);
  },

  // Get a specific exam
  getExam: (examId) => {
    const numericId = parseInt(examId, 10);
    const id = isNaN(numericId) ? examId : numericId;
    console.log(`Getting exam details for exam ${id} (type: ${typeof id})`);
    
    return api.get(`/api/exams/${id}`).catch(error => {
      console.error(`Error getting exam ${id}:`, error);
      // Thêm xử lý lỗi cụ thể 
      if (error.response && error.response.status === 500) {
        console.log('Server error getting exam, retrying with a different approach...');
        
        // Thử phương pháp khác: lấy dữ liệu từ danh sách bài thi của người dùng
        return api.get('/api/exams/user')
          .then(response => {
            if (response.data && response.data.exams) {
              const userExams = response.data.exams;
              const targetExam = userExams.find(exam => 
                exam.ExamID === numericId || exam.examId === numericId
              );
              
              if (targetExam) {
                console.log('Found exam in user exams list:', targetExam);
                return {
                  data: {
                    exam: targetExam,
                    registrationStatus: {
                      isRegistered: true,
                      status: targetExam.ParticipantStatus || 'registered'
                    },
                    note: 'Recovered from user exams list'
                  }
                };
              }
            }
            // Nếu không tìm thấy, throw lỗi ban đầu
            throw error;
          })
          .catch(fallbackError => {
            console.error('Fallback approach also failed:', fallbackError);
            // Thử lại không có prefix /api nếu lần thứ nhất thất bại
            return api.get(`/exams/${id}`)
              .then(response => {
                console.log('Successfully retrieved exam without /api prefix');
                return response;
              })
              .catch(secondFallbackError => {
                console.error('Second fallback approach also failed:', secondFallbackError);
                throw error; // Throw lỗi ban đầu để giữ tính nhất quán
              });
          });
      }
      // Thử lại không có prefix /api nếu có lỗi
      return api.get(`/exams/${id}`)
        .then(response => {
          console.log('Successfully retrieved exam without /api prefix');
          return response;
        })
        .catch(secondError => {
          console.error(`Second attempt also failed:`, secondError);
          throw error; // Ném lỗi ban đầu để component xử lý
        });
    });
  },

  // Get user's registered exams with better authentication handling
  getUserExams: async () => {
    console.log('Getting all available exams from database');
    
    try {
      console.log('Attempting API call to get exams from database');
      
      // Check for authentication token in localStorage with fallback
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        console.log('No authentication token found');
        throw new Error('Vui lòng đăng nhập để xem danh sách bài thi');
      }
      
      // Add prefix /api to the endpoint to match backend structure
      console.log('Calling API endpoint /api/exams/user');
      const response = await api.get('/api/exams/user');
      console.log('Raw API response:', response);
      
      if (!response || !response.data) {
        console.error('Invalid response format - no data property');
        throw new Error('Invalid response format from server');
      }
      
      // Log the structure of the response to debug
      console.log('Response data structure:', JSON.stringify(response.data).substring(0, 200) + '...');
      
      // Try different ways to extract the exams array
      let examsData;
      if (Array.isArray(response.data)) {
        console.log('Response data is directly an array');
        examsData = response.data;
      } else if (response.data.exams && Array.isArray(response.data.exams)) {
        console.log('Found exams array in response.data.exams');
        examsData = response.data.exams;
      } else {
        console.warn('Could not find exams array in response, using empty array');
        examsData = [];
      }
      
      console.log(`Extracted ${examsData.length} exams from API response`);
      
      return { 
        ...response, 
        data: examsData 
      };
    } catch (error) {
      console.error('Error fetching exams from database:', error);
      
      // Provide more specific error information
      if (error.response) {
        if (error.response.status === 401) {
          console.log('Authentication failed. Please log in again.');
          // Force logout and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        } else if (error.response.status === 403) {
          console.log('User does not have permission to view exams');
        } else if (error.response.status === 404) {
          console.log('Endpoint not found. The API route may have changed.');
          // Try again with endpoint without /api prefix if server returns 404
          try {
            console.log('Trying fallback endpoint /exams/user');
            const fallbackResponse = await api.get('/exams/user');
            if (fallbackResponse && fallbackResponse.data) {
              let examsData;
              if (Array.isArray(fallbackResponse.data)) {
                examsData = fallbackResponse.data;
              } else if (fallbackResponse.data.exams && Array.isArray(fallbackResponse.data.exams)) {
                examsData = fallbackResponse.data.exams;
              } else {
                examsData = [];
              }
              
              return {
                ...fallbackResponse,
                data: examsData
              };
            }
          } catch (fallbackError) {
            console.error('Fallback attempt also failed:', fallbackError);
          }
        } else if (error.response.status === 500) {
          console.log('Server error:', error.response.data);
        }
      }
      
      // Rethrow the error to be handled by the calling component
      throw error;
    }
  },

  // Create a new exam (instructor only)
  createExam: (examData) => api.post('/api/exams', examData),

  // Update an exam (instructor only)
  updateExam: (examId, examData) => api.put(`/api/exams/${examId}`, examData),

  // Delete an exam (instructor only)
  deleteExam: (examId) => api.delete(`/api/exams/${examId}`),

  // Add a question to an exam (instructor only)
  addExamQuestion: (examId, questionData) => api.post(`/api/exams/${examId}/questions`, questionData),

  // Update a question (instructor only)
  updateExamQuestion: (examId, questionId, questionData) => 
    api.put(`/api/exams/${examId}/questions/${questionId}`, questionData),

  // Delete a question (instructor only)
  deleteExamQuestion: (examId, questionId) => api.delete(`/api/exams/${examId}/questions/${questionId}`),

  // Register for an exam
  registerForExam: (examId) => api.post(`/api/exams/${examId}/register`),

  /**
   * Start an exam attempt with proper database field handling
   * @param {number|string} examId - Exam ID
   * @returns {Promise<object>} - Exam session data
   */
  startExam: async (examId) => {
    try {
      // Use api instance instead of axios directly to include the auth token
      const response = await api.post(`/api/exams/${examId}/start`);
      return response.data;
    } catch (error) {
      console.error('Failed to start exam:', error);
      
      // Check for specific error types
      if (error.response) {
        const { status, data } = error.response;
        
        // Handle unauthorized errors
        if (status === 401) {
          console.log('Authentication error when starting exam');
          return {
            error: 'UNAUTHORIZED',
            message: data?.message || 'Authentication required. Please log in and try again.'
          };
        }

        // Handle forbidden errors (e.g., not enrolled in course)
        if (status === 403) {
          console.log('Permission error when starting exam:', data?.message);
          return {
            error: 'FORBIDDEN',
            message: data?.message || 'Bạn không có quyền làm bài thi này'
          };
        }

        // Handle rate limiting (429 Too Many Requests)
        if (status === 429) {
          console.log('Rate limited when starting exam:', data);
          const retryAfter = parseInt(error.response.headers['retry-after'] || '30', 10);
          return {
            error: 'RATE_LIMITED',
            message: data?.message || `Quá nhiều yêu cầu, vui lòng thử lại sau ${retryAfter} giây`,
            retryAfter: retryAfter
          };
        }

        // Handle internal server errors
        if (status === 500) {
          console.error('Server error when starting exam:', data);
          return {
            error: 'API_ERROR',
            message: data?.message || 'Đã xảy ra lỗi khi bắt đầu bài thi',
            status: 500
          };
        }
      }
      
      // Default error return for any other errors
      return {
        error: 'UNKNOWN_ERROR',
        message: error.message || 'Không thể kết nối đến máy chủ'
      };
    }
  },

  /**
   * Submit an answer with validation and bypass handling
   * @param {number|string} examId - Exam ID 
   * @param {number|string} questionId - Question ID
   * @param {any} answer - Answer content
   * @returns {Promise<object>} - Response
   */
  submitAnswer: async (examId, questionId, answer) => {
    if (!examId || !questionId) {
      console.error('Missing required parameters for submitAnswer');
      return Promise.reject(new Error('Missing examId or questionId'));
    }
    
    console.log(`Submitting answer for question ${questionId} in exam ${examId}`);
    
    // For essay questions, trim whitespace
    let formattedAnswer = answer;
    if (typeof answer === 'string') {
      formattedAnswer = answer.trim();
    }
    
    // Add retry and timeout handling
    const config = {
      timeout: 15000, // 15 second timeout
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': `answer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }
    };
    
    // Check if we're in bypass mode
    if (localStorage.getItem('bypassMode') === 'true') {
      console.log('Operating in bypass mode, not actually sending answer to server');
      // Store answer locally
      try {
        const bypassAnswers = JSON.parse(localStorage.getItem('bypassAnswers') || '{}');
        bypassAnswers[`${examId}-${questionId}`] = {
          answer: formattedAnswer,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('bypassAnswers', JSON.stringify(bypassAnswers));
        
        // Return a mock success response
        return Promise.resolve({
          data: {
            success: true,
            message: 'Answer saved in bypass mode',
            bypassMode: true
          }
        });
      } catch (error) {
        console.error('Error saving bypass answer to localStorage:', error);
        return Promise.reject(new Error('Failed to save bypass answer locally'));
      }
    }
    
    // Function to handle retry logic
    const submitWithRetry = async (attempt = 1, maxAttempts = 3) => {
      try {
        // Attempt to submit via API
        const response = await api.post(
          `/api/exams/${examId}/questions/${questionId}/answer`, 
          { 
            answer: formattedAnswer,
            timestamp: new Date().toISOString()
          },
          config
        );
        return response;
      } catch (error) {
        console.error(`Error submitting answer (attempt ${attempt}):`, error);
        
        // Check for specific error conditions
        if (error.response) {
          // Rate limiting - handle with proper delay
          if (error.response.status === 429) {
            const retryAfter = parseInt(error.response.headers['retry-after'] || '5', 10);
            console.log(`Rate limited. Waiting ${retryAfter}s before retry...`);
            
            if (attempt < maxAttempts) {
              // Wait for the retry-after time plus some jitter
              const jitter = Math.random() * 1000;
              await new Promise(resolve => setTimeout(resolve, (retryAfter * 1000) + jitter));
              return submitWithRetry(attempt + 1, maxAttempts);
            }
          }
          
          // Server error - retry with backoff
          if (error.response.status === 500) {
            if (attempt < maxAttempts) {
              const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
              console.log(`Server error. Retrying in ${backoff}ms...`);
              await new Promise(resolve => setTimeout(resolve, backoff));
              return submitWithRetry(attempt + 1, maxAttempts);
            }
          }
          
          // Check if we're getting CORS errors or endpoint not found
          if (error.response.status === 404) {
            // Try alternative endpoint without /api prefix
            try {
              console.log('Trying alternative endpoint without /api prefix');
              const altResponse = await api.post(
                `/exams/${examId}/questions/${questionId}/answer`, 
                { 
                  answer: formattedAnswer,
                  timestamp: new Date().toISOString() 
                },
                config
              );
              return altResponse;
            } catch (altError) {
              console.error('Alternative endpoint also failed:', altError);
              
              // If we're at max attempts, check if bypass is possible
              if (attempt >= maxAttempts && BYPASS_PERMISSIONS) {
                console.log('Switching to bypass mode due to persistent API failures');
                localStorage.setItem('bypassMode', 'true');
                
                // Store the answer locally
                const bypassAnswers = JSON.parse(localStorage.getItem('bypassAnswers') || '{}');
                bypassAnswers[`${examId}-${questionId}`] = {
                  answer: formattedAnswer,
                  timestamp: new Date().toISOString()
                };
                localStorage.setItem('bypassAnswers', JSON.stringify(bypassAnswers));
                
                // Return a mock response
                return {
                  data: {
                    success: true,
                    message: 'Answer saved in bypass mode (switched due to API errors)',
                    bypassMode: true
                  }
                };
              }
              
              // Otherwise rethrow the original error
              throw error;
            }
          }
        }
        
        // For network errors, retry if attempts remain
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || !error.response) {
          if (attempt < maxAttempts) {
            const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            console.log(`Network error. Retrying in ${backoff}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return submitWithRetry(attempt + 1, maxAttempts);
          }
        }
        
        // Check if we should switch to bypass mode after max attempts
        if (attempt >= maxAttempts && BYPASS_PERMISSIONS) {
          console.log('Maximum retry attempts reached. Switching to bypass mode.');
          localStorage.setItem('bypassMode', 'true');
          
          // Store the answer locally
          const bypassAnswers = JSON.parse(localStorage.getItem('bypassAnswers') || '{}');
          bypassAnswers[`${examId}-${questionId}`] = {
            answer: formattedAnswer,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('bypassAnswers', JSON.stringify(bypassAnswers));
          
          // Return a mock success response
          return {
            data: {
              success: true,
              message: 'Answer saved in bypass mode (after API failures)',
              bypassMode: true
            }
          };
        }
        
        // If all retries failed and bypass isn't enabled, rethrow the original error
        throw error;
      }
    };
    
    // Start the retry process
    return submitWithRetry();
  },

  // Submit the entire exam with validation and result handling
  submitExam: async (examId) => {
    // Ensure examId is a number
    const numericExamId = parseInt(examId, 10);
    if (isNaN(numericExamId)) {
      console.error(`Invalid exam ID: ${examId}`);
      return Promise.reject(new Error('Invalid exam ID'));
    }
    
    console.log(`Submitting exam with ID: ${numericExamId}`);
    
    // Check if we're in bypass mode
    if (localStorage.getItem('bypassMode') === 'true') {
      console.log('Operating in bypass mode, submitting exam locally');
      
      try {
        // Get all locally stored answers
        const bypassAnswers = JSON.parse(localStorage.getItem('bypassAnswers') || '{}');
        
        // Create mock response data
        const mockResponse = {
          data: {
            success: true,
            message: 'Exam submitted successfully in bypass mode',
            submitTime: new Date().toISOString(),
            bypassMode: true,
            answers: Object.entries(bypassAnswers)
              .filter(([key]) => key.startsWith(`${numericExamId}-`))
              .map(([key, value]) => {
                const questionId = key.split('-')[1];
                return {
                  questionId,
                  answer: value.answer,
                  submittedAt: value.timestamp,
                  score: null, // Will be reviewed later
                  isCorrect: null
                };
              })
          }
        };
        
        return Promise.resolve(mockResponse);
      } catch (error) {
        console.error('Error creating bypass exam submission:', error);
        return Promise.reject(new Error('Failed to submit exam in bypass mode'));
      }
    }
    
    // Include client time to help with timezone issues
    const data = { 
      clientTime: Date.now(),
      timezoneOffset: new Date().getTimezoneOffset(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    // Function to delay retry
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Add retry logic with exponential backoff
    const trySubmitExam = async (attemptNumber = 1) => {
      try {
        // Add a unique request ID for tracing
        const config = {
          headers: {
            'X-Request-ID': `exam-submit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          },
          timeout: 20000 // 20 second timeout for submissions
        };
        
        const response = await api.post(`/api/exams/${numericExamId}/submit`, data, config);
        console.log(`Successfully submitted exam on attempt ${attemptNumber}`);
        
        // Validate response before returning
        if (response && response.data) {
          // Check if the response has answers and score data
          if (!response.data.answers && !response.data.totalScore && !response.data.isError) {
            console.warn('Warning: Exam submitted but response may be missing score data');
          }
        }
        
        return response;
      } catch (error) {
        console.error(`Error submitting exam (attempt ${attemptNumber}):`, error);
        
        // Check for specific errors
        if (error.response) {
          // 404 error - try alternative endpoint
          if (error.response.status === 404) {
            // Try an alternative endpoint without the /api prefix
            console.log('Attempting alternative endpoint without /api prefix');
            try {
              const altResponse = await api.post(`/exams/${numericExamId}/submit`, data);
              return altResponse;
            } catch (altError) {
              console.error('Alternative endpoint also failed:', altError);
              // Continue with retry logic
            }
          }
          // Rate limiting
          else if (error.response.status === 429) {
            // Rate limiting error, wait and retry
            if (attemptNumber < 3) {
              const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
              const waitTime = retryAfter * 1000;
              console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
              await delay(waitTime);
              return trySubmitExam(attemptNumber + 1);
            }
          }
          // Server error
          else if (error.response.status === 500) {
            // Server error, retry a couple of times
            if (attemptNumber < 3) {
              const waitTime = 1000 * Math.pow(2, attemptNumber);
              console.log(`Server error. Waiting ${waitTime}ms before retry...`);
              await delay(waitTime);
              return trySubmitExam(attemptNumber + 1);
            }
          }
          // Forbidden or unauthorized
          else if (error.response.status === 403 || error.response.status === 401) {
            console.error(`Authentication/authorization error: ${error.response.status}`);
            
            // If bypass is enabled, switch to bypass mode after auth failure
            if (BYPASS_PERMISSIONS) {
              console.log('Switching to bypass mode due to auth failure');
              localStorage.setItem('bypassMode', 'true');
              
              // Get any locally stored answers
              const bypassAnswers = JSON.parse(localStorage.getItem('bypassAnswers') || '{}');
              
              // Create mock response
              return {
                data: {
                  success: true,
                  message: 'Exam submitted successfully in bypass mode (after auth failure)',
                  submitTime: new Date().toISOString(),
                  bypassMode: true,
                  answers: Object.entries(bypassAnswers)
                    .filter(([key]) => key.startsWith(`${numericExamId}-`))
                    .map(([key, value]) => {
                      const questionId = key.split('-')[1];
                      return {
                        questionId,
                        answer: value.answer,
                        submittedAt: value.timestamp,
                        score: null,
                        isCorrect: null
                      };
                    })
                }
              };
            }
          }
        }
        
        // Network errors - retry with backoff
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || !error.response) {
          if (attemptNumber < 3) {
            const waitTime = 1000 * Math.pow(2, attemptNumber);
            console.log(`Network error. Waiting ${waitTime}ms before retry...`);
            await delay(waitTime);
            return trySubmitExam(attemptNumber + 1);
          }
        }
        
        // Max retries exceeded - check if we should switch to bypass mode
        if (attemptNumber >= 3 && BYPASS_PERMISSIONS) {
          console.log('Maximum retry attempts reached. Switching to bypass mode for exam submission.');
          localStorage.setItem('bypassMode', 'true');
          
          // Get any locally stored answers
          const bypassAnswers = JSON.parse(localStorage.getItem('bypassAnswers') || '{}');
          
          // Create mock response
          return {
            data: {
              success: true,
              message: 'Exam submitted successfully in bypass mode (after API failures)',
              submitTime: new Date().toISOString(),
              bypassMode: true,
              answers: Object.entries(bypassAnswers)
                .filter(([key]) => key.startsWith(`${numericExamId}-`))
                .map(([key, value]) => {
                  const questionId = key.split('-')[1];
                  return {
                    questionId,
                    answer: value.answer,
                    submittedAt: value.timestamp,
                    score: null,
                    isCorrect: null
                  };
                })
            }
          };
        }
        
        // If we've reached here, all retries and bypasses have failed
        throw error;
      }
    };
    
    return trySubmitExam();
  },

  // Log monitoring event
  logMonitoringEvent: (examId, eventType, eventData) => 
    api.post(`/api/exams/${examId}/monitoring`, { eventType, eventData }),

  // Handle fullscreen exit/return/timeout
  handleFullscreenExit: (examId, action) => {
    // Ensure examId is a number
    const numericExamId = parseInt(examId, 10);
    if (isNaN(numericExamId)) {
      console.error(`Invalid exam ID: ${examId}`);
      return Promise.reject(new Error('Invalid exam ID'));
    }
    
    console.log(`Handling fullscreen ${action} for exam ${numericExamId}`);
    
    return api.post(`/api/exams/${numericExamId}/fullscreen`, { action })
      .catch(error => {
        console.error(`Error with fullscreen ${action} API call:`, error);
        
        // Try again without /api prefix as fallback
        return api.post(`/exams/${numericExamId}/fullscreen`, { action })
          .catch(secondError => {
            console.error(`Second attempt for fullscreen ${action} also failed:`, secondError);
            throw error; // Throw original error
          });
      });
  },

  // Get exam results with proper validation
  getExamResults: async (examId) => {
    const numericId = parseInt(examId, 10);
    const id = isNaN(numericId) ? examId : numericId;
    console.log(`Getting results for exam ${id}`);
    
    try {
      const response = await api.get(`/api/exams/${id}/results`);
      
      // Validate the response data
      if (response && response.data) {
        // Check for expected fields
        if (!response.data.answers && !response.data.totalScore && !response.data.isError) {
          console.warn('Warning: Exam results may be incomplete - missing score data');
        }
        
        // Convert any string options to arrays for multiple choice questions
        if (response.data.answers && Array.isArray(response.data.answers)) {
          response.data.answers.forEach(answer => {
            if (answer.question && answer.question.Type === 'multiple_choice' && 
                typeof answer.question.Options === 'string') {
              try {
                answer.question.Options = JSON.parse(answer.question.Options);
              } catch (e) {
                console.error('Failed to parse Options JSON for question', answer.question.QuestionID);
              }
            }
          });
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Error getting exam results:`, error);
      
      // Handle specific error cases
      if (error.response) {
        if (error.response.status === 403 && error.response.data?.errorCode === 'NOT_PARTICIPATED') {
          // User has not participated in this exam
          console.log('User has not participated in this exam');
          const errorData = error.response.data;
          return {
            data: {
              isError: true,
              errorCode: 'NOT_PARTICIPATED',
              message: errorData.message,
              examInfo: errorData.examInfo
            }
          };
        } else if (error.response.status === 400 && error.response.data?.errorCode === 'EXAM_NOT_COMPLETED') {
          // Exam not completed yet
          console.log('Exam has not been completed yet');
          return {
            data: {
              isError: true,
              errorCode: 'EXAM_NOT_COMPLETED',
              message: error.response.data.message,
              status: error.response.data.status
            }
          };
        } else if (error.response.status === 404) {
          // Try again without /api prefix
          try {
            const fallbackResponse = await api.get(`/exams/${id}/results`);
              console.log('Successfully retrieved exam results without /api prefix');
            return fallbackResponse;
          } catch (fallbackError) {
              console.error('Fallback approach failed:', fallbackError);
            throw error; // Throw original error if both methods fail
          }
        }
      }
      
      throw error; // Throw error for component to handle
    }
  },

  // Grade an essay answer (instructor only)
  gradeEssayAnswer: (answerId, score, comments) => 
    api.post(`/api/exams/answers/${answerId}/grade`, { score, comments }),

  // Add answer template (instructor only)
  addAnswerTemplate: (examId, templateData) => api.post(`/api/exams/${examId}/template`, templateData),

  // Auto register for all exams (for testing)
  autoRegisterForAllExams: () => {
    console.log('Auto registering for all exams...');
    return api.post('/api/exams/auto-register');
  },

  /**
   * Get questions for a specific exam
   * @param {number|string} examId - Exam ID
   * @returns {Promise<Array>} - Array of questions
   */
  getExamQuestions: async (examId) => {
    console.log(`Getting questions for exam ${examId}`);
    try {
      const response = await api.get(`/api/exams/${examId}/questions`);
      return response;
    } catch (error) {
      console.error('Error getting exam questions:', error);
      
      // Try alternative endpoint without /api prefix
      if (error.response && error.response.status === 404) {
        try {
          return await api.get(`/exams/${examId}/questions`);
        } catch (fallbackError) {
          console.error('Fallback attempt to get questions failed:', fallbackError);
          throw error; // Throw original error
        }
      }
      throw error;
    }
  },

  /**
   * Submit an exam with all answers in a single API call
   * This function is used to submit all answers and the exam at the end of the session
   * 
   * @param {number|string} examId - The exam ID
   * @param {object} data - Object containing all answers and exam data
   * @returns {Promise<object>} - Response with exam results and scores
   */
  submitExamWithAnswers: async (examId, data) => {
    // Validate input
    const numericExamId = parseInt(examId, 10);
    if (isNaN(numericExamId) || !data || !data.answers) {
      console.error('Invalid input for submitExamWithAnswers:', { examId, data });
      return Promise.reject(new Error('Invalid input parameters'));
    }
    
    console.log(`Submitting exam ${numericExamId} with ${data.answers.length} answers`);
    
    // Check if we're in bypass mode
    if (localStorage.getItem('bypassMode') === 'true' || BYPASS_PERMISSIONS) {
      console.log('Operating in bypass mode, submitting answers locally');
      
      try {
        // Get any previously stored answers
        const bypassAnswers = JSON.parse(localStorage.getItem('bypassAnswers') || '{}');
        
        // Add new answers to storage
        data.answers.forEach(answer => {
          const key = `${numericExamId}-${answer.questionId}`;
          bypassAnswers[key] = {
            answer: answer.answer,
            timestamp: answer.timestamp || new Date().toISOString()
          };
        });
        
        // Update local storage
        localStorage.setItem('bypassAnswers', JSON.stringify(bypassAnswers));
        
        // Make a request to get exam details to score multiple choice questions
        try {
          const examResponse = await api.get(`/api/exams/${numericExamId}`);
          const examData = examResponse.data.exam || examResponse.data;
          
          // Get questions with correct answers if available
          let questions = [];
          
          if (examData.ExamQuestions && examData.ExamQuestions.length > 0) {
            questions = examData.ExamQuestions;
          } else if (examData.questions && examData.questions.length > 0) {
            questions = examData.questions;
          }
          
          // Score the answers
          const scoredAnswers = data.answers.map(answer => {
            // Find matching question
            const question = questions.find(q => q.QuestionID === answer.questionId);
            
            // Create result object
            const result = {
              questionId: answer.questionId,
              question,
              answer: answer.answer,
              submittedAt: answer.timestamp || new Date().toISOString(),
              isCorrect: null,
              score: null,
              feedback: 'Đang chờ chấm điểm'
            };
            
            // Auto-grade multiple choice if we have the correct answer
            if (question && question.Type === 'multiple_choice' && question.CorrectAnswer) {
              const isCorrect = answer.answer === question.CorrectAnswer;
              result.isCorrect = isCorrect;
              result.score = isCorrect ? question.Points : 0;
              result.feedback = isCorrect ? 'Đúng' : 'Sai';
            }
            
            return result;
          });
          
          // Calculate total score for multiple choice questions
          let totalPoints = 0;
          let earnedPoints = 0;
          
          scoredAnswers.forEach(answer => {
            if (answer.question && answer.question.Points) {
              totalPoints += answer.question.Points;
              
              if (answer.score) {
                earnedPoints += answer.score;
              }
            }
          });
          
          // Create mock response
          return {
            data: {
              success: true,
              message: 'Exam submitted successfully in bypass mode',
              submitTime: new Date().toISOString(),
              bypassMode: true,
              answers: scoredAnswers,
              totalScore: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : null
            }
          };
        } catch (examError) {
          console.error('Error getting exam data for scoring:', examError);
          
          // Return simplified response without scoring
          return {
            data: {
              success: true,
              message: 'Exam submitted successfully in bypass mode',
              submitTime: new Date().toISOString(),
              bypassMode: true,
              answers: data.answers.map(answer => ({
                questionId: answer.questionId,
                answer: answer.answer,
                submittedAt: answer.timestamp || new Date().toISOString(),
                score: null,
                isCorrect: null,
                feedback: 'Chưa chấm điểm'
              }))
            }
          };
        }
      } catch (error) {
        console.error('Error in bypass mode exam submission:', error);
        return Promise.reject(new Error('Failed to submit exam in bypass mode'));
      }
    }
    
    // If not in bypass mode, submit to server
    try {
      // Enhanced submission data with metadata
      const submissionData = {
        ...data,
        clientTime: Date.now(),
        timezoneOffset: new Date().getTimezoneOffset(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        deviceInfo: getDeviceInfo()
      };
      
      // Unique request ID for debugging
      const config = {
        headers: {
          'X-Request-ID': `exam-submit-full-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        },
        timeout: 30000 // 30 second timeout for full submissions
      };
      
      // Try with primary endpoint first
      try {
        const response = await api.post(`/api/exams/${numericExamId}/submit-with-answers`, submissionData, config);
        console.log('Successfully submitted exam with all answers');
        return response;
      } catch (primaryError) {
        console.error('Error with primary endpoint:', primaryError);
        
        // Try alternatives if primary fails
        if (primaryError.response && primaryError.response.status === 404) {
          // Try alternative endpoints
          try {
            // Try without /api prefix
            const altResponse = await api.post(`/exams/${numericExamId}/submit-with-answers`, submissionData, config);
            return altResponse;
          } catch (altError) {
            console.error('Alternative endpoint also failed:', altError);
            
            // Try submitting to regular endpoint as fallback
            try {
              // Just submit the exam without answers (answers might have been saved individually)
              const fallbackResponse = await api.post(`/api/exams/${numericExamId}/submit`, {
                clientTime: Date.now()
              }, config);
              
              console.log('Used fallback endpoint for exam submission');
              return fallbackResponse;
            } catch (fallbackError) {
              console.error('All submission endpoints failed:', fallbackError);
              
              // If bypass is enabled, switch to bypass mode after all failed attempts
              if (BYPASS_PERMISSIONS) {
                console.log('Switching to bypass mode after API failures');
                localStorage.setItem('bypassMode', 'true');
                
                // Try again with bypass mode
                return examService.submitExamWithAnswers(examId, data);
              }
              
              throw primaryError; // Rethrow original error
            }
          }
        }
        
        // If status is not 404, check for other conditions
        if (primaryError.response && (primaryError.response.status === 401 || primaryError.response.status === 403)) {
          if (BYPASS_PERMISSIONS) {
            console.log('Authentication/authorization issue, switching to bypass mode');
            localStorage.setItem('bypassMode', 'true');
            
            // Try again with bypass mode
            return examService.submitExamWithAnswers(examId, data);
          }
        }
        
        throw primaryError; // Rethrow original error if none of the conditions applied
      }
    } catch (error) {
      console.error('Failed to submit exam with answers:', error);
      
      // If bypass is enabled and we've exhausted all options, use it
      if (BYPASS_PERMISSIONS) {
        console.log('Final attempt with bypass mode');
        localStorage.setItem('bypassMode', 'true');
        return examService.submitExamWithAnswers(examId, data);
      }
      
      throw error; // Rethrow if bypass is not enabled
    }
  },
};

/**
 * Get basic device information for exam monitoring
 * @returns {Object} Device information 
 */
const getDeviceInfo = () => {
  try {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      devicePixelRatio: window.devicePixelRatio || 1,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    return {
      userAgent: 'Unknown',
      timestamp: new Date().toISOString()
    };
  }
};

export default examService; 