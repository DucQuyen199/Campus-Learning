/*-----------------------------------------------------------------
* File: CodeServerEditor.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useEffect, useRef, useState } from 'react';
import { startCodeServer, injectCommunicationScript, configureCodeServer, createFile, createFolder } from './code-server-bridge';
import { setupWorkspaceForCodeServer } from './create-workspace';
import WorkspaceErrorHandler from './WorkspaceErrorHandler';

const CodeServerEditor = ({ code, language, onChange }) => {
  const iframeRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [serverStatus, setServerStatus] = useState({ loading: true, success: false, message: 'Checking code-server status...' });
  const [isEditorReady, setIsEditorReady] = useState(false);
  const initialLoadTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Initialize code-server when the component mounts
  useEffect(() => {
    const initCodeServer = async () => {
      try {
        const result = await startCodeServer({ port: 8080 });
        setServerStatus({
          loading: false,
          success: result.success,
          message: result.message
        });
        
        if (result.success) {
          setServerUrl(result.url);
        }
      } catch (error) {
        console.error('Failed to initialize code-server:', error);
        setServerStatus({
          loading: false,
          success: false,
          message: 'Failed to connect to code-server. Please make sure it is running.'
        });
      }
    };

    initCodeServer();
    
    // Set a timeout to show the editor even if it's not fully loaded - reduced to 2 seconds
    initialLoadTimeoutRef.current = setTimeout(() => {
      if (!isLoaded) {
        console.log('Timeout reached, setting editor as loaded anyway');
        setIsLoaded(true);
      }
    }, 2000);
    
    return () => {
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current);
      }
    };
  }, []);

  // Set up communication with code-server iframe
  useEffect(() => {
    if (!serverUrl) return;

    const handleMessage = (event) => {
      // Accept messages from any origin since we're communicating through postMessage
      // and have our own message type validation
      const { type, data } = event.data || {};
      
      if (type === 'code-changed' && data?.code) {
        onChange(data.code);
      } else if (type === 'editor-ready') {
        console.log('Editor is ready, sending initial code');
        setIsLoaded(true);
        setIsEditorReady(true);
        
        // Clear the initial load timeout if editor is ready
        if (initialLoadTimeoutRef.current) {
          clearTimeout(initialLoadTimeoutRef.current);
          initialLoadTimeoutRef.current = null;
        }
        
        // Send initial code to editor
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'set-code',
            data: { code, language }
          }, '*');
        }
        
        // Create sample files after editor is ready
        createSampleFiles();
      } else if (type === 'workspace-error') {
        console.log('Workspace error detected, attempting to fix...');
        handleWorkspaceError();
      } else if (type === 'workspace-setup') {
        console.log('Setting up workspace directory');
        // Handle workspace setup message
        if (event.data.script && iframeRef.current && iframeRef.current.contentWindow) {
          try {
            const evalScript = `
              (function() {
                try {
                  ${event.data.script}
                } catch (error) {
                  console.error('Error executing workspace setup script:', error);
                }
              })();
            `;
            
            try {
              iframeRef.current.contentWindow.eval(evalScript);
            } catch (err) {
              console.error('Direct workspace setup script eval failed:', err);
            }
          } catch (err) {
            console.error('Error processing workspace-setup message:', err);
          }
        }
      } else if (type === 'inject-script' && event.data.script) {
        // Handle script injection request
        try {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            // Create a function that evaluates the script in the iframe's context
            const evalScript = `
              (function() {
                try {
                  ${event.data.script}
                } catch (error) {
                  console.error('Error executing injected script:', error);
                }
              })();
            `;
            
            // This code will be manually added to the page via Developer Console
            console.log('Please run this script in the iframe console if editor fails to load:');
            console.log(evalScript);
            
            // Try to eval directly (might fail due to CORS)
            try {
              const frame = iframeRef.current;
              if (frame && frame.contentWindow) {
                frame.contentWindow.eval(evalScript);
              }
            } catch (err) {
              console.error('Direct eval failed:', err);
            }
          }
        } catch (err) {
          console.error('Error processing inject-script message:', err);
        }
      } else if (type === 'configure-editor') {
        // Handle editor configuration
        try {
          if (iframeRef.current && iframeRef.current.contentWindow) {
            const { theme, fontSize, options } = event.data.settings || {};
            const configScript = `
              (function() {
                try {
                  if (window.monaco) {
                    monaco.editor.setTheme('${theme || "vs"}');
                    
                    const editor = monaco.editor.getEditors()[0];
                    if (editor) {
                      editor.updateOptions(${JSON.stringify({
                        fontSize: fontSize || 14,
                        ...(options || {})
                      })});
                    }
                  }
                } catch (error) {
                  console.error('Error configuring editor:', error);
                }
              })();
            `;
            
            console.log('Please run this configuration script in the iframe console if needed:');
            console.log(configScript);
            
            // Try to eval directly (might fail due to CORS)
            try {
              const frame = iframeRef.current;
              if (frame && frame.contentWindow) {
                frame.contentWindow.eval(configScript);
              }
            } catch (err) {
              console.error('Direct config eval failed:', err);
            }
          }
        } catch (err) {
          console.error('Error processing configure-editor message:', err);
        }
      } else if (type === 'file-creation-result' || type === 'folder-creation-result') {
        // Log file/folder creation results
        console.log(`${type === 'file-creation-result' ? 'File' : 'Folder'} creation result:`, data);
        
        if (data.success) {
          console.log(`Successfully created ${type === 'file-creation-result' ? 'file' : 'folder'} at: ${data.path}`);
        } else {
          console.error(`Failed to create ${type === 'file-creation-result' ? 'file' : 'folder'}:`, data.error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onChange, serverUrl, code, language]);

  // Handle workspace error by reloading the iframe or creating workspace
  const handleWorkspaceError = () => {
    console.log(`Handling workspace error (attempt ${retryCountRef.current + 1}/${maxRetries})`);
    
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++;
      
      // Try to create workspace directly
      if (iframeRef.current && iframeRef.current.contentWindow) {
        setupWorkspaceForCodeServer(iframeRef.current);
        
        // Reload the iframe after a short delay
        setTimeout(() => {
          if (iframeRef.current) {
            const currentSrc = iframeRef.current.src;
            iframeRef.current.src = currentSrc;
          }
        }, 1000);
      }
    } else {
      console.error(`Failed to fix workspace after ${maxRetries} attempts`);
    }
  };

  // Create sample files to demonstrate file creation functionality
  const createSampleFiles = async () => {
    if (!iframeRef.current || !isEditorReady) return;
    
    try {
      // Create a CampusLearning examples directory
      await createFolder(iframeRef.current, 'CampusLearning-examples');
      console.log('Created CampusLearning-examples folder');
      
      // Create example file types with syntax highlighting
      const fileContents = {
        'html-example.html': `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CampusLearning Demo Page</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 40px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    h1 {
      color: #2c3e50;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Chào mừng đến với CampusLearning</h1>
    <p>Đây là một ví dụ trang HTML đơn giản được tạo bởi CampusLearning Code Editor.</p>
    <p>Bạn có thể chỉnh sửa tệp này để học HTML và CSS.</p>
  </div>
</body>
</html>`,
        'js-example.js': `// Ví dụ JavaScript
class CampusLearningDemo {
  constructor(name) {
    this.name = name;
  }
  
  sayHello() {
    return \`Xin chào, tôi là \${this.name} từ CampusLearning!\`;
  }
  
  createList(items) {
    return items.map((item, index) => {
      return \`Item \${index + 1}: \${item}\`;
    });
  }
}

// Tạo đối tượng demo mới
const demo = new CampusLearningDemo('Học viên');
console.log(demo.sayHello());

// Tạo danh sách
const items = ['HTML', 'CSS', 'JavaScript', 'Python'];
const formattedItems = demo.createList(items);
console.log('Các khóa học:', formattedItems);`,
        'python-example.py': `# Ví dụ Python

class CampusLearningDemo:
    def __init__(self, name):
        self.name = name
    
    def say_hello(self):
        return f"Xin chào, tôi là {self.name} từ CampusLearning!"
    
    def create_list(self, items):
        return [f"Item {i+1}: {item}" for i, item in enumerate(items)]

# Tạo đối tượng demo mới
demo = CampusLearningDemo("Học viên")
print(demo.say_hello())

# Tạo danh sách
items = ["HTML", "CSS", "JavaScript", "Python"]
formatted_items = demo.create_list(items)
print("Các khóa học:")
for item in formatted_items:
    print(item)`
      };
      
      // Create each file
      for (const [filename, content] of Object.entries(fileContents)) {
        const filePath = `CampusLearning-examples/${filename}`;
        const result = await createFile(iframeRef.current, filePath, content);
        console.log(`Created file: ${filePath}`, result);
      }
      
      // Create a README.md file in the examples folder
      await createFile(iframeRef.current, 'CampusLearning-examples/README.md', 
        `# CampusLearning Code Examples
        
## Hướng dẫn sử dụng

Thư mục này chứa các ví dụ mã nguồn để giúp bạn làm quen với trình soạn thảo code CampusLearning:

1. **html-example.html** - Ví dụ về cú pháp HTML và CSS cơ bản
2. **js-example.js** - Ví dụ về JavaScript với class và các hàm
3. **python-example.py** - Ví dụ về Python với class và các phương thức

## Cách tạo tệp mới

Để tạo một tệp mới:
1. Nhấp chuột phải vào explorer bên trái
2. Chọn "New File" hoặc "New Folder"
3. Nhập tên tệp và nhấn Enter

## Tính năng chính

- Làm việc với nhiều loại tệp khác nhau
- Tự động highlight cú pháp
- Autocompletion (gợi ý hoàn thành mã)
- Mở nhiều tệp cùng lúc với tabs`
      );
    } catch (error) {
      console.error('Error creating sample files:', error);
    }
  };

  // Check for workspace error in iframe
  const checkForWorkspaceError = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    
    try {
      const iframeDoc = iframeRef.current.contentWindow.document;
      if (iframeDoc && iframeDoc.body && iframeDoc.body.innerText) {
        if (iframeDoc.body.innerText.includes('Workspace does not exist')) {
          console.log('Detected workspace error in iframe');
          handleWorkspaceError();
        }
      }
    } catch (err) {
      // Ignore cross-origin errors
    }
  };

  // Resend code to editor when it changes externally
  useEffect(() => {
    if (isEditorReady && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'set-code',
        data: { code, language }
      }, '*');
    }
  }, [code, language, isEditorReady]);

  // Inject communication script when iframe loads
  const handleIframeLoad = () => {
    if (!iframeRef.current) return;
    
    console.log('Code-server iframe loaded, injecting communication script');
    
    // Check for workspace error
    setTimeout(checkForWorkspaceError, 500);
    setTimeout(checkForWorkspaceError, 1500);
    
    // Set up workspace directory
    setupWorkspaceForCodeServer(iframeRef.current);
    
    // Reduced timeout to make the editor appear faster
    setTimeout(() => {
      // Inject script to handle communication
      injectCommunicationScript(iframeRef.current);
      
      // Configure editor settings
      configureCodeServer(iframeRef.current, {
        theme: 'vs', // Use light theme
        fontSize: 14
      });
      
      // Send initial code to the editor
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'set-code',
          data: { code, language }
        }, '*');
      }
    }, 500); // Reduced from 1000 to 500ms
  };

  if (serverStatus.loading) {
    return (
      <div className="h-full w-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700">Đang kết nối tới không gian làm việc...</p>
        </div>
      </div>
    );
  }

  if (!serverStatus.success) {
    return (
      <div className="h-full w-full bg-white flex flex-col items-center justify-center p-4">
        <div className="text-red-500 text-xl mb-4">⚠️ Không thể kết nối tới code-server</div>
        <p className="text-gray-700 mb-4 text-center">{serverStatus.message}</p>
        <div className="bg-gray-100 p-4 rounded-lg w-full max-w-2xl text-sm">
          <p className="font-bold mb-2">Khởi động code-server với lệnh:</p>
          <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto">
            code-server --auth none --port 8080
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-700">Đang tải không gian làm việc...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={`${serverUrl}/`}
        className="w-full h-full"
        title="CampusLearning Code Editor"
        onLoad={handleIframeLoad}
        style={{ border: 'none' }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
      <WorkspaceErrorHandler 
        iframeRef={iframeRef}
        onError={() => {
          console.log('Workspace error detected by handler');
          handleWorkspaceError();
        }}
        onFixed={() => {
          console.log('Workspace error fixed by handler');
          setTimeout(() => {
            setupWorkspaceForCodeServer(iframeRef.current);
          }, 1000);
        }}
      />
    </div>
  );
};

export default CodeServerEditor; 
