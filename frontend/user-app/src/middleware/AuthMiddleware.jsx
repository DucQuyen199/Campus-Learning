/*-----------------------------------------------------------------
* File: AuthMiddleware.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthMiddleware = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading, refreshUserToken } = useAuth();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (isAuthenticated) {
          // User is already authenticated based on context
          setAuthenticated(true);
          setChecking(false);
          return;
        }
        
        // Try to refresh token if we have one
        const hasToken = localStorage.getItem('token');
        const hasRefreshToken = localStorage.getItem('refreshToken');
        
        if (hasToken) {
          // If we have a token, consider authenticated first
          // This prevents unnecessary redirects while checking
          setAuthenticated(true);
          
          // Only try to refresh if we have a refresh token
          if (hasRefreshToken) {
            try {
              const refreshed = await refreshUserToken();
              setAuthenticated(refreshed);
            } catch (refreshError) {
              console.log('Token refresh error:', refreshError.message);
              // Keep authenticated true if we still have a valid token
              // This handles the case where refresh fails but token is still valid
              setAuthenticated(!!localStorage.getItem('token'));
            }
          }
        } else {
          // No token at all, definitely not authenticated
          setAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth middleware error:', error);
        // Only set to false if there's no token
        setAuthenticated(!!localStorage.getItem('token'));
      } finally {
        setChecking(false);
      }
    };
    
    verifyAuth();
  }, [isAuthenticated, refreshUserToken]);
  
  // Show loading while checking authentication
  if (loading || checking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Authentication successful, render children
  return children;
};

export default AuthMiddleware; 
