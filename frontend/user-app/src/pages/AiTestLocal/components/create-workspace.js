/**
 * Utility for creating a workspace directory for code-server
 */

/**
 * Create a workspace directory in the code-server environment
 * @param {Window} targetWindow - The target window or iframe contentWindow
 * @returns {boolean} - Success status
 */
export const createWorkspaceDirectory = (targetWindow) => {
  if (!targetWindow) return false;
  
  try {
    // Create script to execute in code-server context
    const script = `
      (function() {
        try {
          // Fix workspace error if present
          if (document.body.innerText && document.body.innerText.includes('Workspace does not exist')) {
            console.log('Detected workspace error, attempting to fix...');
            
            // Try to reload to the root
            setTimeout(() => {
              window.location.href = window.location.origin;
            }, 500);
            
            return; // Exit and let the reload handle it
          }
          
          // Try to access node modules in code-server environment
          if (typeof require === 'function') {
            const fs = require('fs');
            const path = require('path');
            
            // Try multiple possible workspace paths
            const workspacePaths = ['/workspace', '/home/coder/project', '/tmp/workspace'];
            let workspaceCreated = false;
            let workspacePath = '';
            
            for (const wsPath of workspacePaths) {
              try {
                if (!fs.existsSync(wsPath)) {
                  fs.mkdirSync(wsPath, { recursive: true });
                  console.log('Created workspace directory at ' + wsPath);
                  workspaceCreated = true;
                  workspacePath = wsPath;
                  break;
                } else {
                  console.log('Workspace directory already exists at ' + wsPath);
                  workspaceCreated = true;
                  workspacePath = wsPath;
                  break;
                }
              } catch (err) {
                console.error('Error creating workspace at ' + wsPath + ':', err);
              }
            }
            
            if (!workspaceCreated) {
              // If all paths failed, create in home directory
              try {
                const homeDir = require('os').homedir();
                workspacePath = path.join(homeDir, 'workspace');
                
                if (!fs.existsSync(workspacePath)) {
                  fs.mkdirSync(workspacePath, { recursive: true });
                  console.log('Created fallback workspace at ' + workspacePath);
                  workspaceCreated = true;
                } else {
                  console.log('Fallback workspace already exists at ' + workspacePath);
                  workspaceCreated = true;
                }
              } catch (homeErr) {
                console.error('Error creating home workspace:', homeErr);
                
                // Last attempt: try to create in /tmp
                try {
                  workspacePath = '/tmp/codeserver-workspace';
                  fs.mkdirSync(workspacePath, { recursive: true });
                  console.log('Created emergency workspace at ' + workspacePath);
                  workspaceCreated = true;
                } catch (tmpErr) {
                  console.error('Failed to create any workspace directory:', tmpErr);
                }
              }
            }
            
            if (workspaceCreated && workspacePath) {
              // Create a welcome README file
              try {
                fs.writeFileSync(path.join(workspacePath, 'README.md'), 
                  '# CHÀO MỪNG BẠN ĐẾN VỚI CampusLearning\n\n' +
                  '## Nền tảng học tập lập trình hiện đại\n\n' +
                  'Đây là không gian làm việc của bạn để thực hành lập trình và giải quyết các bài toán.\n\n' +
                  '### Lợi ích khi học tập tại CampusLearning\n\n' +
                  '- Trải nghiệm học tập thực tế với môi trường lập trình chuyên nghiệp\n' +
                  '- Hỗ trợ nhiều ngôn ngữ: JavaScript, Python, C++, Java\n' +
                  '- Bài tập đa dạng từ cơ bản đến nâng cao\n' +
                  '- Hướng dẫn và kiểm tra tự động giúp bạn nhanh chóng cải thiện kỹ năng\n\n' +
                  '### Bắt đầu ngay\n\n' +
                  '1. Chọn ngôn ngữ lập trình bạn muốn học\n' +
                  '2. Làm quen với giao diện editor và các công cụ hỗ trợ\n' +
                  '3. Thử sức với các bài tập từ cơ bản đến nâng cao\n\n' +
                  '**Chúc bạn học tập hiệu quả!**\n',
                  { flag: 'w' }
                );
                console.log('Created README.md file');
                
                // Try to open the README file automatically
                setTimeout(() => {
                  try {
                    // Get all VS Code commands
                    const vscode = window.vscodeApi || window.acquireVsCodeApi();
                    vscode.postMessage({ 
                      command: 'openFile', 
                      path: path.join(workspacePath, 'README.md') 
                    });
                  } catch (cmdErr) {
                    console.error('Error sending open command:', cmdErr);
                  }
                }, 1000);
              } catch (fileErr) {
                console.error('Error creating README file:', fileErr);
              }

              // Create a sample JavaScript file
              try {
                fs.writeFileSync(path.join(workspacePath, 'example.js'), 
                  '// Ví dụ code JavaScript tại CampusLearning\n\n' +
                  'function helloCampusLearning() {\n' +
                  '  console.log("Chào mừng bạn đến với CampusLearning!");\n' +
                  '  console.log("Nơi học tập lập trình hiện đại nhất");\n' +
                  '}\n\n' +
                  'helloCampusLearning();\n\n' +
                  '// Hãy thử chỉnh sửa code này và quan sát kết quả!',
                  { flag: 'w' }
                );
                console.log('Created example.js file');
              } catch (fileErr) {
                console.error('Error creating JavaScript example file:', fileErr);
              }

              // Create a sample Python file
              try {
                fs.writeFileSync(path.join(workspacePath, 'example.py'), 
                  '# Ví dụ code Python tại CampusLearning\n\n' +
                  'def hello_CampusLearning():\n' +
                  '    print("Chào mừng bạn đến với CampusLearning!")\n' +
                  '    print("Nơi học tập lập trình hiện đại nhất")\n\n' +
                  'hello_CampusLearning()\n\n' +
                  '# Hãy thử chỉnh sửa code này và quan sát kết quả!',
                  { flag: 'w' }
                );
                console.log('Created example.py file');
              } catch (fileErr) {
                console.error('Error creating Python example file:', fileErr);
              }
              
              // Create a sample C++ file
              try {
                fs.writeFileSync(path.join(workspacePath, 'example.cpp'), 
                  '// Ví dụ code C++ tại CampusLearning\n\n' +
                  '#include <iostream>\n\n' +
                  'int main() {\n' +
                  '    std::cout << "Chào mừng bạn đến với CampusLearning!" << std::endl;\n' +
                  '    std::cout << "Nơi học tập lập trình hiện đại nhất" << std::endl;\n' +
                  '    return 0;\n' +
                  '}\n\n' +
                  '// Hãy thử chỉnh sửa code này và quan sát kết quả!',
                  { flag: 'w' }
                );
                console.log('Created example.cpp file');
              } catch (fileErr) {
                console.error('Error creating C++ example file:', fileErr);
              }
              
              // Create a sample Java file
              try {
                fs.writeFileSync(path.join(workspacePath, 'Main.java'), 
                  '// Ví dụ code Java tại CampusLearning\n\n' +
                  'public class Main {\n' +
                  '    public static void main(String[] args) {\n' +
                  '        System.out.println("Chào mừng bạn đến với CampusLearning!");\n' +
                  '        System.out.println("Nơi học tập lập trình hiện đại nhất");\n' +
                  '    }\n' +
                  '}\n\n' +
                  '// Hãy thử chỉnh sửa code này và quan sát kết quả!',
                  { flag: 'w' }
                );
                console.log('Created Main.java file');
              } catch (fileErr) {
                console.error('Error creating Java example file:', fileErr);
              }
            }
          } else {
            console.warn('Node.js require function not available');
            
            // Notify parent about the problem
            window.parent.postMessage({
              type: 'workspace-error',
              error: 'node-unavailable'
            }, '*');
          }
        } catch (error) {
          console.error('Error in workspace directory creation:', error);
          
          // Notify parent about the error
          window.parent.postMessage({
            type: 'workspace-error',
            error: error.toString()
          }, '*');
        }
      })();
    `;
    
    // Try to execute the script in the target window context
    if (targetWindow.postMessage) {
      // Use postMessage for iframe communication
      targetWindow.postMessage({
        type: 'workspace-setup',
        script: script
      }, '*');
      
      return true;
    } else if (targetWindow.eval) {
      // Direct eval if allowed (rarely works due to CORS)
      try {
        targetWindow.eval(script);
        return true;
      } catch (evalError) {
        console.error('Direct eval failed:', evalError);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error setting up workspace directory:', error);
    return false;
  }
};

/**
 * Handle workspace directory creation for code-server iframe
 * @param {HTMLIFrameElement} iframeElement - The iframe element containing code-server
 */
export const setupWorkspaceForCodeServer = (iframeElement) => {
  if (!iframeElement || !iframeElement.contentWindow) {
    console.error('Invalid iframe element for workspace setup');
    return;
  }
  
  try {
    // First try to create workspace directly
    createWorkspaceDirectory(iframeElement.contentWindow);
    
    // Also set up message listener to handle workspace creation when the iframe is ready
    const messageHandler = (event) => {
      const { type } = event.data || {};
      
      if (type === 'editor-ready') {
        // Try creating workspace directory again when editor is ready
        createWorkspaceDirectory(iframeElement.contentWindow);
        
        // Remove this listener after handling
        window.removeEventListener('message', messageHandler);
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // Set a timeout to clean up the listener if editor-ready never happens
    setTimeout(() => {
      window.removeEventListener('message', messageHandler);
    }, 10000);
    
    // Check for workspace error periodically and recreate if needed
    const checkInterval = setInterval(() => {
      if (iframeElement.contentWindow) {
        try {
          const doc = iframeElement.contentWindow.document;
          if (doc.body && doc.body.innerText && doc.body.innerText.includes('Workspace does not exist')) {
            console.log('Periodic check found workspace error, attempting to fix...');
            createWorkspaceDirectory(iframeElement.contentWindow);
          }
        } catch (err) {
          // Ignore cross-origin errors
        }
      } else {
        clearInterval(checkInterval);
      }
    }, 2000);
    
    // Clean up the interval after 30 seconds
    setTimeout(() => clearInterval(checkInterval), 30000);
  } catch (error) {
    console.error('Error in setupWorkspaceForCodeServer:', error);
  }
};

export default { createWorkspaceDirectory, setupWorkspaceForCodeServer }; 