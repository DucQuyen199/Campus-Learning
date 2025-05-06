import React, { useEffect, useRef, useState } from 'react';
import { startCodeServer, injectCommunicationScript, configureCodeServer } from './code-server-bridge';
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
        title="CAMPUST Code Editor"
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