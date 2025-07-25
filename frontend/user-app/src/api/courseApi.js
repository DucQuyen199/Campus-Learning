/*-----------------------------------------------------------------
* File: courseApi.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axiosClient from './config';
import axios from 'axios';
import { toast } from 'react-toastify';

const courseApi = {
  // Get all published courses
  getAllCourses: () => {
    return axiosClient.get('/courses')
      .catch(error => {
        console.error('Error fetching courses:', error);
        throw error;
      });
  },
  
  // Get course details by ID or slug
  getCourseDetails: (identifier) => {
    if (!identifier) {
      return Promise.reject(new Error('Course identifier is required'));
    }
    
    const cleanIdentifier = String(identifier).trim();
    
    return new Promise((resolve, reject) => {
      const apiUrl = process.env.VITE_API_URL || 'http://localhost:5001';
      const xhr = new XMLHttpRequest();
      
      xhr.open('GET', `${apiUrl}/api/courses/${cleanIdentifier}`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Thêm token vào header nếu có
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            
            // Kiểm tra nếu đây là dữ liệu fallback
            if (response.data && response.data.isFallbackData) {
              console.warn('Received fallback data from server');
            }
            
            resolve(response);
          } catch (err) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`API returned error status: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Lỗi kết nối đến máy chủ'));
      };
      
      xhr.send();
    });
  },
  
  // Lấy danh sách khóa học đã đăng ký
  getEnrolledCourses: () => {
    return axiosClient.get('/courses/enrolled');
  },
  
  // Thêm phương thức checkEnrollment
  checkEnrollment: (courseId) => {
    if (!courseId) {
      return Promise.reject(new Error('Course ID is required'));
    }
    
    return new Promise((resolve, reject) => {
      const apiUrl = process.env.VITE_API_URL || 'http://localhost:5001';
      const xhr = new XMLHttpRequest();
      
      xhr.open('GET', `${apiUrl}/api/courses/${courseId}/check-enrollment`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Thêm token vào header nếu có
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (err) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`API returned error status: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Lỗi kết nối đến máy chủ'));
      };
      
      xhr.send();
    });
  },
  
  // Thêm phương thức enrollFreeCourse (nếu cần)
  enrollFreeCourse: (courseId) => {
    if (!courseId) {
      console.error('Course ID is required for enrolling');
      return Promise.reject(new Error('Course ID is required'));
    }
    
    console.log('Enrolling in free course:', courseId);
    
    return new Promise((resolve, reject) => {
      const apiUrl = process.env.VITE_API_URL || 'http://localhost:5001';
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', `${apiUrl}/api/courses/${courseId}/enroll/free`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Thêm token vào header
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      } else {
        reject(new Error('Bạn cần đăng nhập để đăng ký khóa học'));
        return;
      }
      
      xhr.onload = function() {
        console.log('Enrollment API response status:', xhr.status);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('Enrollment API response:', response);
            resolve(response);
          } catch (err) {
            console.error('Error parsing enrollment response:', err);
            reject(new Error('Invalid response format'));
          }
        } else {
          console.error('HTTP error status:', xhr.status);
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            const errorMessage = errorResponse.message || `Lỗi đăng ký khóa học (${xhr.status})`;
            // Nếu người dùng đã đăng ký, coi như thành công và trả về phản hồi để frontend xử lý
            if (xhr.status === 400 && errorMessage.toLowerCase().includes('already enrolled')) {
              console.warn('User already enrolled – treating as success');
              resolve({ ...errorResponse, alreadyEnrolled: true });
            } else {
              console.error('Error details:', errorResponse);
              reject(new Error(errorMessage));
            }
          } catch (e) {
            // Nếu không thể phân tích phản hồi, trả về mã lỗi HTTP
            reject(new Error(`Lỗi đăng ký khóa học: Mã lỗi ${xhr.status}`));
          }
        }
      };
      
      xhr.onerror = function() {
        console.error('Network error occurred during enrollment');
        reject(new Error('Lỗi kết nối đến máy chủ khi đăng ký khóa học'));
      };
      
      xhr.timeout = 10000; // 10 seconds timeout
      
      xhr.ontimeout = function() {
        console.error('Request timeout for enrollment');
        reject(new Error('Yêu cầu đăng ký đã hết thời gian chờ, vui lòng thử lại'));
      };
      
      xhr.send();
    });
  },
  
  // Create payment URL for VNPay
  createPayment: (courseId, bankCode) => {
    return axiosClient.post(`/courses/${courseId}/create-payment`, { bankCode });
  },
  
  // Create VietQR payment
  createVietQRPayment: (courseId) => {
    return axiosClient.post(`/courses/${courseId}/create-vietqr`);
  },
  
  // Verify VietQR payment status
  verifyVietQRPayment: (transactionCode) => {
    return axiosClient.post('/payments/verify-vietqr', { transactionCode });
  },
  
  // Process VNPay transaction details
  processVNPayTransaction: (transactionId) => {
    if (!transactionId) {
      return Promise.reject(new Error('Transaction ID is required'));
    }
    
    return axiosClient.get(`/payment/vnpay/transaction/${transactionId}`)
      .catch(error => {
        console.error('Error processing VNPay transaction:', error);
        throw error;
      });
  },
  
  // Create PayPal order for course payment
  createPayPalOrder: (courseId) => {
    return axiosClient.post(`/courses/${courseId}/create-paypal-order`);
  },
  
  // Process PayPal payment success
  processPayPalSuccess: ({ transactionId, PayerID, courseId }) => {
    return axiosClient.post('/payment/paypal/success', { transactionId, PayerID, courseId });
  },
  
  // Process PayPal payment cancel
  processPayPalCancel: (transactionId) => {
    return axiosClient.post(`/payment/paypal/cancel?transactionId=${transactionId}`);
  },
  
  // Get payment history
  getPaymentHistory: () => {
    return axiosClient.get('/user/payment-history');
  },
  
  // Delete payment transaction
  deletePayment: (paymentId) => {
    if (!paymentId) {
      return Promise.reject(new Error('Payment ID is required'));
    }
    return axiosClient.delete(`/payments/${paymentId}`);
  },
  
  // Delete multiple payment transactions
  deleteManyPayments: (paymentIds) => {
    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return Promise.reject(new Error('Valid payment IDs array is required'));
    }
    return axiosClient.post('/payments/delete-many', { paymentIds });
  },
  
  // Get payment history for a specific course
  getCoursePaymentHistory: (courseId) => {
    if (!courseId) {
      return Promise.reject(new Error('Course ID is required'));
    }
    return axiosClient.get(`/courses/${courseId}/payment-history`);
  },
  
  // Get course print details
  getCoursePrintDetails: (courseId) => {
    if (!courseId) {
      return Promise.reject(new Error('Course ID is required'));
    }
    return axiosClient.get(`/courses/${courseId}/print-details`);
  },
  
  // Get course content (lectures and materials)
  getCourseContent: (courseId) => {
    if (!courseId) {
      return Promise.reject(new Error('Course ID is required'));
    }
    
    return new Promise((resolve, reject) => {
      const apiUrl = process.env.VITE_API_URL || 'http://localhost:5001';
      const xhr = new XMLHttpRequest();
      
      xhr.open('GET', `${apiUrl}/api/courses/${courseId}/content`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Add token to header if available
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        console.log('Using authentication token:', token.substring(0, 10) + '...');
      } else {
        console.warn('No authentication token found. User might not be logged in.');
      }
      
      // Increase timeout for the request
      xhr.timeout = 15000; // 15 seconds - more time for slow connections
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('Course content response:', response);
            
            // Check if this is a preview mode response
            if (response.success && response.data.IsPreview) {
              console.log('User is viewing course in preview mode');
            }
            
            resolve({ data: response });
          } catch (err) {
            console.error('Error parsing JSON response:', err);
            reject(new Error('Invalid response format'));
          }
        } else if (xhr.status === 401) {
          // User is not authenticated - clear token as it might be invalid
          console.warn('Authentication failed when accessing course content (401)');
          localStorage.removeItem('token');
          toast.info('Bạn cần đăng nhập để xem đầy đủ nội dung khóa học.');
          reject(new Error('Authentication required'));
        } else if (xhr.status === 403) {
          // User is authenticated but not authorized (not enrolled)
          console.warn('User not authorized to access this course (403)');
          toast.info('Bạn chưa đăng ký khóa học này. Không thể xem nội dung khóa học.');
          reject(new Error('Not enrolled in this course'));
        } else if (xhr.status >= 500) {
          // Server error
          console.error('Server error when fetching course content:', xhr.status, xhr.responseText);
          let errorDetails = 'Unknown server error';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            errorDetails = errorResponse.message || errorResponse.code || 'Unknown server error';
            console.error('Error details:', errorResponse);
          } catch (e) {
            // If parsing fails, use the raw text
            errorDetails = xhr.responseText || 'Unknown server error';
          }
          
          // Show a more specific error toast
          toast.error(`Lỗi máy chủ: ${errorDetails}`);
          reject(new Error(`Server error: ${errorDetails}`));
        } else {
          console.error('HTTP error status:', xhr.status);
          reject(new Error(`API returned error status: ${xhr.status}`));
        }
      };
      
      xhr.ontimeout = function() {
        console.warn('Request timeout: Server is not responding');
        toast.warning('Máy chủ phản hồi chậm. Vui lòng thử lại sau.');
        reject(new Error('Request timeout'));
      };
      
      xhr.onerror = function() {
        console.error('Network error occurred');
        toast.warning('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
        reject(new Error('Network error'));
      };
      
      xhr.send();
    });
  },
  
  // Get user progress for a specific course
  getUserCourseProgress: (courseId) => {
    if (!courseId) {
      return Promise.reject(new Error('Course ID is required'));
    }
    
    return new Promise((resolve, reject) => {
      const apiUrl = process.env.VITE_API_URL || 'http://localhost:5001';
      const xhr = new XMLHttpRequest();
      
      xhr.open('GET', `${apiUrl}/api/courses/${courseId}/progress`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Add token to header if available
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (err) {
            reject(new Error('Invalid response format'));
          }
        } else if (xhr.status === 404) {
          // Instead of rejecting, return a success response with empty data
          // This prevents errors from breaking the UI flow
          console.warn('No progress found for course. Using default empty progress.');
          resolve({
            success: true,
            message: 'No progress data found yet',
            data: {
              overallProgress: 0,
              completedLessons: []
            }
          });
        } else {
          reject(new Error(`API returned error status: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        console.error('Connection error while fetching course progress');
        // Still resolve with empty data to not break the UI
        resolve({
          success: true,
          message: 'Connection error while fetching progress. Using default empty progress.',
          data: {
            overallProgress: 0,
            completedLessons: []
          }
        });
      };
      
      xhr.send();
    });
  },
  
  // Mark a lesson as complete
  markLessonAsComplete: (courseId, lessonId) => {
    if (!lessonId) {
      return Promise.reject(new Error('Lesson ID is required'));
    }

    // Use axios client for simplicity
    return axiosClient.post(`/lessons/${lessonId}/progress`, { status: 'completed' })
      .then(res => res.data)
      .catch(err => {
        console.error('Error marking lesson as complete:', err);
        throw err;
      });
  },
  
  // Get code exercise data for a lesson
  getCodeExercise: (courseId, lessonId) => {
    if (!courseId || !lessonId) {
      return Promise.reject(new Error('Course ID and Lesson ID are required'));
    }
    
    return new Promise((resolve, reject) => {
      const apiUrl = process.env.VITE_API_URL || 'http://localhost:5001';
      const xhr = new XMLHttpRequest();
      
      xhr.open('GET', `${apiUrl}/api/courses/${courseId}/lessons/${lessonId}/code-exercise`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Add token to header if available
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (err) {
            reject(new Error('Invalid response format'));
          }
        } else {
          // No fallback, just return the error
          reject(new Error(`API returned error status: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Lỗi kết nối đến máy chủ'));
      };
      
      xhr.send();
    });
  },
  
  // Run code exercise with tests
  runCodeExercise: (courseId, lessonId, code) => {
    if (!courseId || !lessonId || !code) {
      return Promise.reject(new Error('Course ID, Lesson ID, and code are required'));
    }
    
    return new Promise((resolve, reject) => {
      const apiUrl = process.env.VITE_API_URL || 'http://localhost:5001';
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', `${apiUrl}/api/courses/${courseId}/lessons/${lessonId}/run-code`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Add token to header if available
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (err) {
            reject(new Error('Invalid response format'));
          }
        } else {
          // No fallback, just return the error
          reject(new Error(`API returned error status: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Lỗi kết nối đến máy chủ'));
      };
      
      // Send the code in the request body
      xhr.send(JSON.stringify({ code }));
    });
  },
  
  // Execute code and handle result (safe - less failure prone)
  executeCode: async (code, language, stdin = '') => {
    if (!code || !language) {
      console.error('Code and language must be provided');
      return { success: false, message: 'Code và ngôn ngữ lập trình là bắt buộc' };
    }
    
    try {
      console.log(`Executing code with language: ${language}`);
      const response = await axiosClient.post('/code-execution/execute', {
        code,
        language,
        stdin
      });
      
      console.log('Code execution response:', response);
      return response.data;
    } catch (error) {
      console.error('Error executing code:', error);
      if (error.response) {
        return { 
          success: false, 
          message: error.response.data.message || 'Lỗi khi thực thi code',
          error: error.response.data.error
        };
      }
      return { 
        success: false, 
        message: error.message || 'Không thể kết nối đến dịch vụ thực thi code' 
      };
    }
  },
  
  // Send input to a running execution
  sendInput: async (executionId, input) => {
    if (!executionId) {
      console.error('Execution ID must be provided');
      return { success: false, message: 'ID thực thi là bắt buộc' };
    }
    
    try {
      console.log(`Sending input to execution ${executionId}: ${input}`);
      const response = await axiosClient.post('/code-execution/send-input', {
        executionId,
        input
      });
      
      console.log('Send input response:', response);
      return response.data;
    } catch (error) {
      console.error('Error sending input:', error);
      if (error.response) {
        return { 
          success: false, 
          message: error.response.data.message || 'Lỗi khi gửi dữ liệu đầu vào',
          error: error.response.data.error
        };
      }
      return { 
        success: false, 
        message: error.message || 'Không thể kết nối đến dịch vụ thực thi code' 
      };
    }
  },
  
  // Stop a running execution
  stopExecution: async (executionId) => {
    if (!executionId) {
      console.error('Execution ID must be provided');
      return { success: false, message: 'ID thực thi là bắt buộc' };
    }
    
    try {
      console.log(`Stopping execution ${executionId}`);
      const response = await axiosClient.post('/code-execution/stop', {
        executionId
      });
      
      console.log('Stop execution response:', response);
      return response.data;
    } catch (error) {
      console.error('Error stopping execution:', error);
      if (error.response) {
        return { 
          success: false, 
          message: error.response.data.message || 'Lỗi khi dừng thực thi',
          error: error.response.data.error
        };
      }
      return { 
        success: false, 
        message: error.message || 'Không thể kết nối đến dịch vụ thực thi code' 
      };
    }
  },
  
  // Submit code for a lesson/exercise
  submitCodeExercise: async (courseId, lessonId, code, language) => {
    console.log(`Submitting code for course ${courseId}, lesson ${lessonId}`);
    
    return new Promise((resolve, reject) => {
      try {
        const apiUrl = process.env.VITE_API_URL || 'http://localhost:5001';
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', `${apiUrl}/api/courses/${courseId}/lessons/${lessonId}/submit-code`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        // Add token to header if available
        const token = localStorage.getItem('token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (err) {
              reject(new Error('Invalid response format'));
            }
          } else {
            // Try to extract error message from response
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(errorResponse);
            } catch (e) {
              // If can't parse response, return HTTP status code
              reject(new Error(`API returned error status: ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = function() {
          reject({
            isNetworkError: true,
            message: 'Lỗi kết nối đến máy chủ'
          });
        };
        
        // Send the code in the request body
        xhr.send(JSON.stringify({ 
          code,
          language,
          courseId
        }));
      } catch (error) {
        console.error('Error in submitCodeExercise:', error);
        reject(error);
      }
    });
  },
  
  // Initialize a new code-server session for a specific exercise
  initializeCodeServer: async (courseId, lessonId) => {
    try {
      const response = await axiosClient.post(`/courses/${courseId}/lessons/${lessonId}/code-server`);
      return response.data;
    } catch (error) {
      console.error('Error initializing code-server:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể khởi tạo môi trường code'
      };
    }
  },
};

export default courseApi;
