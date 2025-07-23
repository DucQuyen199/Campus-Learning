/**
 * Helper functions to connect with code-server
 */

// Polyfill for browser if it doesn't exist
if (typeof window !== 'undefined') {
  // Global browser polyfill
  window.browser = window.browser || window.chrome || {};
  
  // Global polyfill for browser.runtime
  if (!window.browser.runtime) {
    window.browser.runtime = {
      sendMessage: () => Promise.resolve({}),
      onMessage: {
        addListener: () => {},
        removeListener: () => {}
      }
    };
  }
  
  // Handle onpage-dialog.preload.js error
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('browser is not defined')) {
      console.warn('Suppressing browser not defined error');
      event.preventDefault();
      return true;
    }
    return false;
  }, true);
}

// Pre-initialize workspace directory for code-server
// This is run immediately when this file is loaded
(async function preInitializeWorkspace() {
  try {
    console.log('Checking for existing workspaces...');
    
    // Instead of automatically creating workspaces, just check if code-server is running
    try {
      // Check if code-server is accessible
      const response = await fetch(`http://localhost:8080/`, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      console.log('Code-server is accessible, but not creating any workspaces automatically');
    } catch (err) {
      console.warn('Code-server is not running:', err);
    }
    
    // Do not create any workspaces here - removed automatic workspace creation
  } catch (err) {
    console.warn('Pre-initialization failed:', err);
  }
})();

// Start the code-server instance
export const startCodeServer = async (options = {}) => {
  const { port = 8080, workspacePath = '/workspace' } = options;
  
  try {
    // Check if code-server is already running
    const response = await fetch(`http://localhost:${port}`, { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    
    console.log('Code-server is already running');
    
    // No longer automatically initialize workspace
    // Only check if there's a workspace error to display appropriate UI
    const workspaceStatus = await checkWorkspaceStatus(port);
    
    return {
      success: true,
      url: `http://localhost:${port}`,
      message: 'Code-server is already running',
      hasWorkspace: workspaceStatus.hasWorkspace,
      workspaceError: workspaceStatus.error
    };
  } catch (error) {
    console.error('Error checking code-server status:', error);
    
    // In a real implementation, you would start code-server here
    // This could be done via a backend API call or WebSocket
    
    // For now, we'll just return an error since we can't start it from the frontend directly
    return {
      success: false,
      message: 'Code-server is not running. Please start it manually with: code-server --auth none --port 8080'
    };
  }
};

// Helper function to check workspace status without creating one
async function checkWorkspaceStatus(port) {
  try {
    // Try to fetch the root page to check for errors
    const htmlResponse = await fetch(`http://localhost:${port}`, {
      method: 'GET',
      cache: 'no-cache'
    });
    
    const html = await htmlResponse.text();
    
    // Check if the HTML has workspace error
    if (html.includes('Workspace does not exist') || html.includes('Please select another workspace')) {
      console.log('Detected workspace error - no workspace exists');
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

// Helper function to create default workspace immediately - ONLY called when explicitly requested
async function createDefaultWorkspace(port, workspacePath) {
  try {
    // Try to fetch the root page to check for errors
    const htmlResponse = await fetch(`http://localhost:${port}`, {
      method: 'GET',
      cache: 'no-cache'
    });
    
    const html = await htmlResponse.text();
    
    // Check if the HTML has workspace error
    if (html.includes('Workspace does not exist') || html.includes('Please select another workspace')) {
      console.log('Creating workspace now...');
      
      // Create an invisible iframe to create workspace
      const tempFrame = document.createElement('iframe');
      tempFrame.style.display = 'none';
      tempFrame.src = `http://localhost:${port}`;
      
      // When the iframe loads, create the workspace
      tempFrame.onload = function() {
        // Create the workspace in the iframe
        createWorkspaceDirectory(tempFrame.contentWindow);
        
        // Remove the iframe after 2 seconds
        setTimeout(() => {
          if (document.body.contains(tempFrame)) {
            document.body.removeChild(tempFrame);
          }
        }, 2000);
      };
      
      // Add the iframe to the document
      document.body.appendChild(tempFrame);
    }
  } catch (err) {
    console.warn('Error creating default workspace:', err);
  }
}

// Create a default workspace directory if missing - improved with multiple attempts
// NOTE: This is only called when explicitly requested by the user
const createWorkspaceDirectory = (iframeElement) => {
  if (!iframeElement || !iframeElement.contentWindow) return;
  
  const script = `
    (function() {
      try {
        // Create workspace directory if it doesn't exist
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        
        // Try both paths - /workspace is for Docker environments, /home/coder/project for direct installs
        const workspacePaths = ['/workspace', '/home/coder/project'];
        
        let workspaceCreated = false;
        let createdWorkspacePath = '';
        
        for (const wsPath of workspacePaths) {
          try {
            if (!fs.existsSync(wsPath)) {
              fs.mkdirSync(wsPath, { recursive: true });
              console.log('Created workspace directory at ' + wsPath);
              workspaceCreated = true;
              createdWorkspacePath = wsPath;
              break;
            } else {
              console.log('Workspace directory already exists at ' + wsPath);
              workspaceCreated = true;
              createdWorkspacePath = wsPath;
              break;
            }
          } catch (err) {
            console.error('Error creating workspace at ' + wsPath + ':', err);
          }
        }
        
        if (!workspaceCreated) {
          // If all paths failed, create in home directory
          const homeDir = os.homedir();
          const fallbackPath = path.join(homeDir, 'workspace');
          
          if (!fs.existsSync(fallbackPath)) {
            fs.mkdirSync(fallbackPath, { recursive: true });
            console.log('Created fallback workspace at ' + fallbackPath);
            createdWorkspacePath = fallbackPath;
          } else {
            console.log('Fallback workspace already exists at ' + fallbackPath);
            createdWorkspacePath = fallbackPath;
          }
        }

        // Create a hidden .user-workspace marker file for this user
        if (createdWorkspacePath) {
          const userId = localStorage.getItem('userId') || 'anonymous-' + Math.random().toString(36).substring(2, 15);
          const userMarkerPath = path.join(createdWorkspacePath, '.user-workspace');
          fs.writeFileSync(userMarkerPath, userId);
          console.log('Added user workspace marker at:', userMarkerPath);
          
          // Store which workspace belongs to this user
          localStorage.setItem('userWorkspacePath', createdWorkspacePath);
        }
      } catch (error) {
        console.error('Error creating workspace directory:', error);
      }
    })();
  `;
  
  try {
    iframeElement.contentWindow.postMessage({
      type: 'create-workspace',
      script: script
    }, '*');
  } catch (err) {
    console.error('Error sending create-workspace message:', err);
  }
};

// Explicitly create a workspace for the current user
export const createUserWorkspace = async (options = {}) => {
  const { port = 8080, workspacePath = '/workspace' } = options;
  
  try {
    // Create the workspace
    await createDefaultWorkspace(port, workspacePath);
    
    // Return success
    return {
      success: true,
      message: 'Workspace created successfully'
    };
  } catch (error) {
    console.error('Error creating user workspace:', error);
    return {
      success: false,
      message: 'Failed to create workspace: ' + error.message
    };
  }
};

// Check if a workspace exists for this user
export const checkUserWorkspace = async (iframeElement) => {
  if (!iframeElement || !iframeElement.contentWindow) {
    return { exists: false, error: 'Invalid iframe' };
  }
  
  return new Promise((resolve) => {
    const script = `
      (function() {
        try {
          const fs = require('fs');
          const path = require('path');
          const os = require('os');
          
          // Possible workspace paths
          const workspacePaths = ['/workspace', '/home/coder/project', path.join(os.homedir(), 'workspace')];
          
          // Get the current user ID
          const userId = localStorage.getItem('userId') || '';
          let workspaceFound = false;
          let userWorkspacePath = '';
          
          // Check each workspace path
          for (const wsPath of workspacePaths) {
            try {
              if (fs.existsSync(wsPath)) {
                // Check if this workspace belongs to the current user
                const markerPath = path.join(wsPath, '.user-workspace');
                if (fs.existsSync(markerPath)) {
                  const workspaceUserId = fs.readFileSync(markerPath, 'utf8').trim();
                  
                  if (workspaceUserId === userId) {
                    workspaceFound = true;
                    userWorkspacePath = wsPath;
                    break;
                  }
                }
              }
            } catch (err) {
              console.warn('Error checking workspace at ' + wsPath + ':', err);
            }
          }
          
          window.parent.postMessage({
            type: 'workspace-check-result',
            data: {
              exists: workspaceFound,
              path: userWorkspacePath
            }
          }, '*');
        } catch (error) {
          window.parent.postMessage({
            type: 'workspace-check-result',
            data: {
              exists: false,
              error: error.toString()
            }
          }, '*');
        }
      })();
    `;
    
    // Set up message listener for the result
    const messageHandler = (event) => {
      if (event.data && event.data.type === 'workspace-check-result') {
        window.removeEventListener('message', messageHandler);
        resolve(event.data.data);
      }
    };
    window.addEventListener('message', messageHandler);
    
    // Send the script to check for user workspace
    try {
      iframeElement.contentWindow.postMessage({
        type: 'inject-script',
        script: script
      }, '*');
      
      // Set a timeout in case we don't get a response
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        resolve({ exists: false, error: 'Timeout checking workspace' });
      }, 5000);
    } catch (error) {
      window.removeEventListener('message', messageHandler);
      resolve({ exists: false, error: error.toString() });
    }
  });
};

// Set initial code in the editor (to be called after iframe is loaded)
export const setInitialCode = (iframeElement, code, language) => {
  if (!iframeElement || !iframeElement.contentWindow) {
    console.error('Invalid iframe element or content window');
    return false;
  }
  
  try {
    iframeElement.contentWindow.postMessage({
      type: 'set-code',
      data: { code, language }
    }, '*');
    return true;
  } catch (error) {
    console.error('Error setting initial code:', error);
    return false;
  }
};

// Register event listeners for the iframe
export const setupIframeListeners = (iframeElement, callbacks = {}) => {
  if (!iframeElement || !iframeElement.contentWindow) {
    console.error('Invalid iframe element or content window');
    return false;
  }
  
  const { onCodeChanged, onEditorReady } = callbacks;
  
  try {
    const handler = (event) => {
      const { type, data } = event.data || {};
      
      if (type === 'code-changed' && data?.code && onCodeChanged) {
        onCodeChanged(data.code);
      } else if (type === 'editor-ready' && onEditorReady) {
        onEditorReady();
      }
    };
    
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  } catch (error) {
    console.error('Error setting up iframe listeners:', error);
    return false;
  }
};

// Enable file creation command in code-server
export const enableFileCreation = (iframeElement) => {
  if (!iframeElement || !iframeElement.contentWindow) {
    console.error('Invalid iframe element for file creation enablement');
    return false;
  }
  
  try {
    // Script to inject that enables file creation capabilities
    const script = `
      (function() {
        try {
          console.log('Initializing file creation capabilities...');
          
          // Function to add file creation commands to the global context
          const enableFileCommands = () => {
            if (typeof window.vscodeApi === 'undefined') {
              try {
                // Try to acquire VS Code API if not already available
                window.vscodeApi = window.acquireVsCodeApi ? window.acquireVsCodeApi() : undefined;
              } catch (vsErr) {
                console.warn('Could not acquire VS Code API:', vsErr);
              }
            }
            
            // Set up global helper for file operations that works without the VS Code API
            window.CampusLearningFileHelper = {
              // Create a new file at the specified path
              createFile: async (filePath, content = '') => {
                try {
                  if (typeof require === 'function') {
                    const fs = require('fs');
                    const path = require('path');
                    
                    // Ensure we have an absolute path
                    if (!path.isAbsolute(filePath)) {
                      // Try to determine workspace root
                      const workspacePaths = ['/workspace', '/home/coder/project'];
                      let workspaceRoot = null;
                      
                      for (const wsPath of workspacePaths) {
                        try {
                          if (fs.existsSync(wsPath)) {
                            workspaceRoot = wsPath;
                            break;
                          }
                        } catch (err) {}
                      }
                      
                      // If no workspace found, use home directory
                      if (!workspaceRoot) {
                        const os = require('os');
                        workspaceRoot = path.join(os.homedir(), 'workspace');
                        
                        // Ensure the directory exists
                        if (!fs.existsSync(workspaceRoot)) {
                          fs.mkdirSync(workspaceRoot, { recursive: true });
                        }
                      }
                      
                      // Join with workspace path
                      filePath = path.join(workspaceRoot, filePath);
                    }
                    
                    // Ensure the directory exists
                    const dirPath = path.dirname(filePath);
                    if (!fs.existsSync(dirPath)) {
                      fs.mkdirSync(dirPath, { recursive: true });
                    }
                    
                    // Write the file
                    fs.writeFileSync(filePath, content);
                    console.log('File created successfully at: ' + filePath);
                    
                    // Try to open the file in editor
                    setTimeout(() => {
                      try {
                        // Try using VS Code API first
                        if (window.vscodeApi) {
                          window.vscodeApi.postMessage({ 
                            command: 'openFile', 
                            path: filePath 
                          });
                        } else {
                          // Fallback: Try to use file navigator UI to show the file
                          const sidebarElem = document.querySelector('.sidebar, .filetree, .explorer-viewlet');
                          if (sidebarElem) {
                            // Try to find the refresh button
                            const refreshBtn = sidebarElem.querySelector('button[title*="Refresh"], .refresh');
                            if (refreshBtn) {
                              refreshBtn.click();
                              console.log('Refreshed file explorer');
                            }
                          }
                        }
                      } catch (openErr) {
                        console.warn('Error trying to open file:', openErr);
                      }
                    }, 500);
                    
                    return { success: true, path: filePath };
                  } else {
                    throw new Error('Node.js require not available for file operations');
                  }
                } catch (error) {
                  console.error('Error creating file:', error);
                  return { success: false, error: error.toString() };
                }
              },
              
              // Create a new folder at the specified path
              createFolder: async (folderPath) => {
                try {
                  if (typeof require === 'function') {
                    const fs = require('fs');
                    const path = require('path');
                    
                    // Ensure we have an absolute path
                    if (!path.isAbsolute(folderPath)) {
                      // Try to determine workspace root
                      const workspacePaths = ['/workspace', '/home/coder/project'];
                      let workspaceRoot = null;
                      
                      for (const wsPath of workspacePaths) {
                        try {
                          if (fs.existsSync(wsPath)) {
                            workspaceRoot = wsPath;
                            break;
                          }
                        } catch (err) {}
                      }
                      
                      // If no workspace found, use home directory
                      if (!workspaceRoot) {
                        const os = require('os');
                        workspaceRoot = path.join(os.homedir(), 'workspace');
                        
                        // Ensure the parent directory exists
                        if (!fs.existsSync(workspaceRoot)) {
                          fs.mkdirSync(workspaceRoot, { recursive: true });
                        }
                      }
                      
                      // Join with workspace path
                      folderPath = path.join(workspaceRoot, folderPath);
                    }
                    
                    // Create the directory
                    fs.mkdirSync(folderPath, { recursive: true });
                    console.log('Folder created successfully at: ' + folderPath);
                    
                    // Try to refresh file explorer
                    setTimeout(() => {
                      try {
                        const sidebarElem = document.querySelector('.sidebar, .filetree, .explorer-viewlet');
                        if (sidebarElem) {
                          // Try to find the refresh button
                          const refreshBtn = sidebarElem.querySelector('button[title*="Refresh"], .refresh');
                          if (refreshBtn) {
                            refreshBtn.click();
                            console.log('Refreshed file explorer');
                          }
                        }
                      } catch (refreshErr) {
                        console.warn('Error refreshing file explorer:', refreshErr);
                      }
                    }, 500);
                    
                    return { success: true, path: folderPath };
                  } else {
                    throw new Error('Node.js require not available for file operations');
                  }
                } catch (error) {
                  console.error('Error creating folder:', error);
                  return { success: false, error: error.toString() };
                }
              }
            };
            
            // Also listen for file creation commands from the parent window
            window.addEventListener('message', (event) => {
              if (!event.data || !event.data.type) return;
              
              const { type, data } = event.data;
              
              if (type === 'create-file' && data && data.path) {
                const content = data.content || '';
                window.CampusLearningFileHelper.createFile(data.path, content)
                  .then(result => {
                    // Send result back to parent
                    window.parent.postMessage({
                      type: 'file-creation-result',
                      data: result
                    }, '*');
                  });
              } else if (type === 'create-folder' && data && data.path) {
                window.CampusLearningFileHelper.createFolder(data.path)
                  .then(result => {
                    // Send result back to parent
                    window.parent.postMessage({
                      type: 'folder-creation-result',
                      data: result
                    }, '*');
                  });
              }
            });
            
            console.log('File operations initialized successfully');
            return true;
          };
          
          // Try immediately
          if (!enableFileCommands()) {
            // If not successful, try again with a delay
            const interval = setInterval(() => {
              if (enableFileCommands()) {
                clearInterval(interval);
              }
            }, 1000);
            
            // Safety cleanup after 10 seconds
            setTimeout(() => clearInterval(interval), 10000);
          }
        } catch (error) {
          console.error('Error enabling file creation:', error);
        }
      })();
    `;
    
    // Send the script via postMessage to avoid CORS issues
    iframeElement.contentWindow.postMessage({
      type: 'inject-script',
      script: script
    }, '*');
    
    return true;
  } catch (error) {
    console.error('Error setting up file creation:', error);
    return false;
  }
};

// API function to create a file in the code-server workspace
export const createFile = async (iframeElement, filePath, content = '') => {
  if (!iframeElement || !iframeElement.contentWindow) {
    console.error('Invalid iframe element for file creation');
    return { success: false, error: 'Invalid iframe' };
  }
  
  return new Promise((resolve) => {
    // Set up a listener for the result
    const messageHandler = (event) => {
      if (event.data && event.data.type === 'file-creation-result') {
        // Remove the listener once we get a result
        window.removeEventListener('message', messageHandler);
        resolve(event.data.data);
      }
    };
    
    // Add the listener
    window.addEventListener('message', messageHandler);
    
    // Send the file creation request
    try {
      iframeElement.contentWindow.postMessage({
        type: 'create-file',
        data: {
          path: filePath,
          content: content
        }
      }, '*');
      
      // Set a timeout to resolve anyway if we don't get a response
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        resolve({ success: false, error: 'Timeout waiting for file creation result' });
      }, 5000);
    } catch (error) {
      window.removeEventListener('message', messageHandler);
      resolve({ success: false, error: error.toString() });
    }
  });
};

// API function to create a folder in the code-server workspace
export const createFolder = async (iframeElement, folderPath) => {
  if (!iframeElement || !iframeElement.contentWindow) {
    console.error('Invalid iframe element for folder creation');
    return { success: false, error: 'Invalid iframe' };
  }
  
  return new Promise((resolve) => {
    // Set up a listener for the result
    const messageHandler = (event) => {
      if (event.data && event.data.type === 'folder-creation-result') {
        // Remove the listener once we get a result
        window.removeEventListener('message', messageHandler);
        resolve(event.data.data);
      }
    };
    
    // Add the listener
    window.addEventListener('message', messageHandler);
    
    // Send the folder creation request
    try {
      iframeElement.contentWindow.postMessage({
        type: 'create-folder',
        data: {
          path: folderPath
        }
      }, '*');
      
      // Set a timeout to resolve anyway if we don't get a response
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        resolve({ success: false, error: 'Timeout waiting for folder creation result' });
      }, 5000);
    } catch (error) {
      window.removeEventListener('message', messageHandler);
      resolve({ success: false, error: error.toString() });
    }
  });
};

// Inject communication script into the code-server iframe to handle communication
export const injectCommunicationScript = (iframeElement) => {
  if (!iframeElement || !iframeElement.contentWindow) {
    console.error('Invalid iframe element or content window');
    return false;
  }
  
  try {
    // Immediate check and creation of workspace directory
    createWorkspaceDirectory(iframeElement);
    
    // Enable file creation capabilities
    enableFileCreation(iframeElement);
    
    // Wait for editor to be fully loaded, but with shorter timeout
    setTimeout(() => {
      try {
        // Using postMessage instead of trying to directly manipulate the iframe content
        // This avoids cross-origin issues
        const script = `
          (function() {
            // Polyfill browser if it doesn't exist
            if (typeof browser === 'undefined') {
              window.browser = window.browser || window.chrome || {};
              
              // Global polyfill for browser.runtime
              if (!window.browser.runtime) {
                window.browser.runtime = {
                  sendMessage: () => Promise.resolve({}),
                  onMessage: {
                    addListener: () => {},
                    removeListener: () => {}
                  }
                };
              }
            }
            
            // Add error suppression
            window.addEventListener('error', (event) => {
              if (event.message && (
                event.message.includes('browser is not defined') ||
                event.message.includes('vsda') ||
                event.message.includes('404 (Not Found)')
              )) {
                console.warn('Suppressing error:', event.message);
                event.preventDefault();
                return true;
              }
              return false;
            }, true);
            
            let lastSavedContent = '';
            let editorInitialized = false;
            
            // Function to send content changes to parent window
            function sendContentToParent() {
              const editor = window.monaco?.editor?.getModels()[0];
              if (editor) {
                const content = editor.getValue();
                if (content !== lastSavedContent) {
                  lastSavedContent = content;
                  window.parent.postMessage({
                    type: 'code-changed',
                    data: { code: content }
                  }, '*');
                }
              }
            }
            
            // Listen for content changes
            const setupMonacoListeners = () => {
              if (window.monaco && window.monaco.editor) {
                const editor = window.monaco.editor.getModels()[0];
                
                if (editor && !editorInitialized) {
                  editorInitialized = true;
                editor.onDidChangeContent(() => {
                  sendContentToParent();
                });
                
                // Notify parent that editor is ready
                window.parent.postMessage({
                  type: 'editor-ready',
                  data: {}
                }, '*');
                  
                  return true;
                }
              }
              
              // If we get here, monaco or editor isn't ready yet
              return false;
            };
            
            // Listen for messages from parent
            window.addEventListener('message', (event) => {
              if (event.data && event.data.type === 'set-code') {
                const { code, language } = event.data.data;
                
                const setupAndSetCode = () => {
                  if (window.monaco && window.monaco.editor) {
                    const editor = window.monaco.editor.getModels()[0];
                
                if (editor) {
                  lastSavedContent = code;
                  editor.setValue(code);
                  
                  // Set language if monaco is available
                  if (window.monaco && language) {
                    monaco.editor.setModelLanguage(editor, language);
                  }
                      return true;
                    }
                  }
                  
                  // If we get here, monaco or editor isn't ready yet
                  return false;
                };
                
                // Try to set code immediately, or retry with a delay if not ready
                if (!setupAndSetCode()) {
                  const interval = setInterval(() => {
                    if (setupAndSetCode()) {
                      clearInterval(interval);
                    }
                  }, 500);
                  
                  // Safety cleanup after 10 seconds
                  setTimeout(() => clearInterval(interval), 10000);
                }
              }
            });
            
            // Auto-reload the editor if the workspace doesn't exist
            const checkWorkspaceError = () => {
              if (document.body.innerText && document.body.innerText.includes('Workspace does not exist')) {
                console.log('Detected workspace error, reloading...');
                window.location.href = window.location.origin;
                return true;
              }
              return false;
            };
            
            // Check for workspace error immediately and then periodically
            if (!checkWorkspaceError()) {
              setTimeout(checkWorkspaceError, 1000);
              setTimeout(checkWorkspaceError, 3000);
            }
            
            // Start checking for Monaco to be ready
            if (!setupMonacoListeners()) {
              const interval = setInterval(() => {
                if (setupMonacoListeners()) {
                  clearInterval(interval);
                }
              }, 500);
              
              // Safety cleanup after 10 seconds
              setTimeout(() => clearInterval(interval), 10000);
            }
          })();
        `;
        
        // Send the script content to the iframe using postMessage
        iframeElement.contentWindow.postMessage({
          type: 'inject-script',
          script: script
        }, '*');
        
        return true;
      } catch (err) {
        console.error('Error in setTimeout for communication script:', err);
        return false;
      }
    }, 1000); // Slightly increased from 500ms to ensure workspace exists
    
    return true;
  } catch (error) {
    console.error('Error injecting communication script:', error);
    return false;
  }
};

// Configure code-server settings (like theme, font size, etc)
export const configureCodeServer = (iframeElement, settings = {}) => {
  if (!iframeElement || !iframeElement.contentWindow) {
    console.error('Invalid iframe element or content window for configuring');
    return false;
  }
  
  const { theme = 'vs', fontSize = 14 } = settings;
  
  try {
    setTimeout(() => {
      try {
        // Using postMessage to send configuration to iframe
        iframeElement.contentWindow.postMessage({
          type: 'configure-editor',
          settings: {
            theme,
            fontSize,
            options: {
              automaticLayout: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              minimap: { enabled: true }
            }
          }
        }, '*');
        
        return true;
      } catch (err) {
        console.error('Error in setTimeout for configuration:', err);
        return false;
      }
    }, 2000); // Keep at 2 seconds
    
    return true;
  } catch (error) {
    console.error('Error configuring code-server:', error);
    return false;
  }
}; 