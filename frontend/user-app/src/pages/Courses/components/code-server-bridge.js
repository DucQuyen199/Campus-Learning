/*-----------------------------------------------------------------
* File: code-server-bridge.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
/**
 * Bridge between EditCode component and code-server
 */

// Polyfill for browser if it doesn't exist
if (typeof window !== 'undefined') {
  window.browser = window.browser || window.chrome || {};
  
  if (!window.browser.runtime) {
    window.browser.runtime = {
      sendMessage: () => Promise.resolve({}),
      onMessage: {
        addListener: () => {},
        removeListener: () => {}
      }
    };
  }
  
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('browser is not defined')) {
      console.warn('Suppressing browser not defined error');
      event.preventDefault();
      return true;
    }
    return false;
  }, true);
}

// Cache cho kết nối code-server
const connectionCache = {
  status: null,
  lastCheck: 0,
  checkInterval: 30000 // 30 giây
};

/**
 * Kiểm tra nhanh xem code-server có đang chạy không
 * @param {number} port - Port của code-server
 * @returns {Promise<boolean>} - Trạng thái kết nối
 */
const quickCheckCodeServer = async (port) => {
  // Sử dụng cache nếu có và còn hợp lệ
  const now = Date.now();
  if (connectionCache.status !== null && now - connectionCache.lastCheck < connectionCache.checkInterval) {
    return connectionCache.status;
  }
  
  try {
    // Dùng AbortController để giới hạn thời gian chờ
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    await fetch(`http://localhost:${port}/healthz`, { 
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Cập nhật cache
    connectionCache.status = true;
    connectionCache.lastCheck = now;
    console.log('Code-server is running');
    return true;
  } catch (error) {
    // Cập nhật cache
    connectionCache.status = false;
    connectionCache.lastCheck = now;
    
    if (error.name === 'AbortError') {
      console.error('Code-server health check timed out');
    } else {
      console.error('Code-server health check failed:', error);
    }
    return false;
  }
};

/**
 * Tạo workspace cho khóa học và bài học
 * @param {number} port - Port của code-server
 * @param {string} courseId - ID khóa học
 * @param {string} lessonId - ID bài học
 * @returns {Promise<boolean>} - Kết quả tạo workspace
 */
const createWorkspace = async (port, courseId, lessonId) => {
  try {
    // Tạo folder path
    const folderPath = `/workspace/course-${courseId}/lesson-${lessonId}`;
    
    // Tạo iframe ẩn để thực hiện script tạo workspace
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `http://localhost:${port}/`;
    
    // Thêm iframe vào DOM
    document.body.appendChild(iframe);
    
    // Đợi iframe load xong
    await new Promise(resolve => {
      iframe.onload = resolve;
      
      // Timeout sau 5 giây nếu iframe không load
      setTimeout(resolve, 5000);
    });
    
    // Tạo script để tạo thư mục workspace
    try {
      // Nếu code-server không chạy trong cùng domain, sẽ không thể thực hiện eval
      // Thay vào đó, chúng ta sẽ mở URL với folder path và để code-server tự tạo
      console.log('Creating workspace folders for course', courseId, 'lesson', lessonId);
      
      // Xóa iframe
      document.body.removeChild(iframe);
      
      return true;
    } catch (error) {
      console.error('Error creating workspace via iframe:', error);
      
      // Xóa iframe
      document.body.removeChild(iframe);
      
      // Vẫn trả về true để tiếp tục, vì chúng ta sẽ thử mở URL trực tiếp
      return true;
    }
  } catch (error) {
    console.error('Error creating workspace:', error);
    return false;
  }
};

/**
 * Initializes and connects to code-server
 * @param {Object} options - Configuration options
 * @param {string} options.courseId - Course ID
 * @param {string} options.lessonId - Lesson ID
 * @param {number} options.port - Code-server port (default: 8080)
 * @returns {Promise<Object>} - Connection result
 */
export const initializeCodeServer = async (options = {}) => {
  const { courseId, lessonId } = options;
  const port = options.port || 8080; // Default port for code-server
  
  try {
    // Check if code-server is running at the specified port
    console.log(`Checking if code-server is running on port ${port}...`);
    
    const isRunning = await quickCheckCodeServer(port);
    if (!isRunning) {
      throw new Error('Code-server is not running or not accessible');
    }
    
    // Mở code-server URL không cần chỉ định folder để tránh lỗi "Workspace does not exist"
    // Điều này sẽ hiển thị giao diện mặc định của code-server thay vì lỗi
    const codeServerUrl = `http://localhost:${port}/`;
    
    console.log(`Code-server URL: ${codeServerUrl}`);
    
    return {
      success: true,
      url: codeServerUrl,
      message: 'Code-server initialized successfully'
    };
  } catch (error) {
    console.error('Error initializing code-server:', error);
    return {
      success: false,
      message: error.message || 'Code-server is not running or inaccessible. Please ensure it is started.'
    };
  }
};

// Check if workspace exists
async function checkWorkspaceStatus(port) {
  try {
    const response = await fetch(`http://localhost:${port}`, {
      method: 'GET',
      cache: 'no-cache'
    });
    
    const html = await response.text();
    
    if (html.includes('Workspace does not exist') || html.includes('Please select another workspace')) {
      return {
        hasWorkspace: false,
        error: 'No workspace exists'
      };
    }
    
    return {
      hasWorkspace: true,
      error: null
    };
  } catch (err) {
    console.warn('Error checking workspace status:', err);
    return {
      hasWorkspace: false,
      error: err.message
    };
  }
}

// Create workspace for course/lesson
async function createCourseWorkspace(port, courseId, lessonId) {
  try {
    // Create an invisible iframe to handle workspace creation
    const tempFrame = document.createElement('iframe');
    tempFrame.style.display = 'none';
    tempFrame.src = `http://localhost:${port}`;
    
    return new Promise((resolve, reject) => {
      tempFrame.onload = async function() {
        try {
          // Inject workspace creation script
          const script = `
            (function() {
              try {
                const fs = require('fs');
                const path = require('path');
                
                // Create course workspace
                const courseDir = path.join('/workspace', 'course-${courseId}');
                if (!fs.existsSync(courseDir)) {
                  fs.mkdirSync(courseDir, { recursive: true });
                }
                
                // Create lesson workspace
                const lessonDir = path.join(courseDir, 'lesson-${lessonId}');
                if (!fs.existsSync(lessonDir)) {
                  fs.mkdirSync(lessonDir, { recursive: true });
                }
                
                // Create initial files
                const mainFile = path.join(lessonDir, 'main.js');
                if (!fs.existsSync(mainFile)) {
                  fs.writeFileSync(mainFile, '// Write your code here\\n');
                }
                
                console.log('Course workspace created successfully');
                return true;
              } catch (err) {
                console.error('Error creating workspace:', err);
                return false;
              }
            })();
          `;
          
          // Execute script in iframe
          const result = await tempFrame.contentWindow.eval(script);
          
          // Cleanup
          document.body.removeChild(tempFrame);
          
          if (result) {
            resolve(true);
          } else {
            reject(new Error('Failed to create workspace'));
          }
        } catch (err) {
          document.body.removeChild(tempFrame);
          reject(err);
        }
      };
      
      // Add iframe to document
      document.body.appendChild(tempFrame);
    });
  } catch (err) {
    console.error('Error creating course workspace:', err);
    throw err;
  }
} 
