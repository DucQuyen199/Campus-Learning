import React, { useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// This component now redirects to the new ArenaCode component
const ArenaRedirect = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If ID is undefined or invalid, show an error and redirect
    if (!id || id === 'undefined') {
      console.error('Invalid competition ID in redirect:', id);
      toast.error('Mã cuộc thi không hợp lệ');
      navigate('/competitions');
    }
  }, [id, navigate]);
  
  // Only redirect if we have a valid ID
  if (!id || id === 'undefined') {
    return null; // Don't redirect, the useEffect will handle navigation
  }
  
  console.log('Redirecting to competition code arena with ID:', id);
  return <Navigate to={`/competitions/${id}/code`} replace />;
};

export default ArenaRedirect;