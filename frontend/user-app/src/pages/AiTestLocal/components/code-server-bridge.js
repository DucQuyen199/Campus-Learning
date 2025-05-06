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
    return {
      success: true,
      url: `http://localhost:${port}`,
      message: 'Code-server is already running'
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

// Create a default workspace directory if missing - improved with multiple attempts
const createWorkspaceDirectory = (iframeElement) => {
  if (!iframeElement || !iframeElement.contentWindow) return;
  
  const script = `
    (function() {
      try {
        // Create workspace directory if it doesn't exist
        const fs = require('fs');
        const path = require('path');
        
        // Try both paths - /workspace is for Docker environments, /home/coder/project for direct installs
        const workspacePaths = ['/workspace', '/home/coder/project'];
        
        let workspaceCreated = false;
        
        for (const wsPath of workspacePaths) {
          try {
            if (!fs.existsSync(wsPath)) {
              fs.mkdirSync(wsPath, { recursive: true });
              console.log('Created workspace directory at ' + wsPath);
              workspaceCreated = true;
            } else {
              console.log('Workspace directory already exists at ' + wsPath);
              workspaceCreated = true;
            }
          } catch (err) {
            console.error('Error creating workspace at ' + wsPath + ':', err);
          }
        }
        
        if (!workspaceCreated) {
          // If all paths failed, create in home directory
          const homeDir = require('os').homedir();
          const fallbackPath = path.join(homeDir, 'workspace');
          
          if (!fs.existsSync(fallbackPath)) {
            fs.mkdirSync(fallbackPath, { recursive: true });
            console.log('Created fallback workspace at ' + fallbackPath);
          }
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

// Inject a custom script into the code-server iframe to handle communication
export const injectCommunicationScript = (iframeElement) => {
  if (!iframeElement || !iframeElement.contentWindow) {
    console.error('Invalid iframe element or content window');
    return false;
  }
  
  try {
    // Immediate check and creation of workspace directory
    createWorkspaceDirectory(iframeElement);
    
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