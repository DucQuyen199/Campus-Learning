import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Lưu URL hiện tại để redirect sau khi login
    return <Navigate to="/login" state={{ returnUrl: location.pathname }} replace />;
  }

  return children;
}; 