import React, { useEffect, useState } from 'react';

/**
 * Workspace Error Handler Component
 * This component helps detect and fix workspace errors in code-server iframe
 */
const WorkspaceErrorHandler = ({ iframeRef, onError, onFixed }) => {
  const [hasError, setHasError] = useState(false);
  const [errorChecks, setErrorChecks] = useState(0);
  const maxChecks = 10;
  
  // Check for workspace error
  useEffect(() => {
    if (!iframeRef || !iframeRef.current) return;
    
    const checkForError = () => {
      try {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow || !iframe.contentWindow.document) return;
        
        const text = iframe.contentWindow.document.body.innerText || '';
        
        if (text.includes('Workspace does not exist') || 
            text.includes('Please select another workspace')) {
          console.log('WorkspaceErrorHandler: Detected workspace error');
          setHasError(true);
          if (onError) onError();
          return true;
        }
        return false;
      } catch (err) {
        // Ignore cross-origin errors
        return false;
      }
    };
    
    // Immediate check
    const hasErrorNow = checkForError();
    
    if (!hasErrorNow) {
      // Set up periodic checks
      const interval = setInterval(() => {
        const foundError = checkForError();
        
        // Increment check counter
        setErrorChecks(prev => {
          const next = prev + 1;
          // Stop checking after max checks
          if (next >= maxChecks) {
            clearInterval(interval);
          }
          return next;
        });
        
        if (foundError) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [iframeRef, onError]);
  
  // Handle fixing the error
  useEffect(() => {
    if (!hasError || !iframeRef || !iframeRef.current) return;
    
    console.log('WorkspaceErrorHandler: Attempting to fix workspace error');
    
    // The fix consists of reloading the iframe to the root URL
    const iframe = iframeRef.current;
    const currentSrc = iframe.src;
    
    // Extract the base URL (without any path or query params)
    const baseUrl = currentSrc.split('/').slice(0, 3).join('/');
    
    // Apply the fix after a short delay
    const fixTimeout = setTimeout(() => {
      iframe.src = baseUrl;
      console.log('WorkspaceErrorHandler: Reloaded iframe to', baseUrl);
      
      // Notify that the error is being fixed
      if (onFixed) onFixed();
      
      // Reset error state after applying fix
      setHasError(false);
    }, 500);
    
    return () => clearTimeout(fixTimeout);
  }, [hasError, iframeRef, onFixed]);
  
  // This component doesn't render anything visible
  return null;
};

export default WorkspaceErrorHandler; 