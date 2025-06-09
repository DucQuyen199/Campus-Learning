import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../store/slices/authSlice';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  // Double-check authentication with localStorage
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('teacherToken');
      setIsTokenValid(!!token);
      setIsVerifying(false);
    };
    
    checkToken();
  }, []);

  // Show loading state while verifying
  if (isVerifying) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  // If not authenticated via Redux or localStorage, redirect to login
  if (!isAuthenticated && !isTokenValid) {
    // Redirect to login page but save the location they were trying to access
    // Exclude common error paths to avoid redirect loops
    const shouldSavePath = !['/login', '/error'].some(path => 
      location.pathname.startsWith(path)
    );
    
    if (shouldSavePath) {
      localStorage.setItem('auth_redirect', location.pathname);
    }
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; 