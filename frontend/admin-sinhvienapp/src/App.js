import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import Dashboard from './pages/Dashboard';
import Students from './pages/students/Students';
import StudentDetail from './pages/students/StudentDetail';
import StudentEdit from './pages/students/StudentEdit';
import AddStudent from './pages/students/AddStudent';
import Programs from './pages/academic/Programs';
import ProgramDetail from './pages/academic/ProgramDetail';
import ProgramEdit from './pages/academic/ProgramEdit';
import AddProgram from './pages/academic/AddProgram';
import Subjects from './pages/academic/Subjects';
import SubjectDetail from './pages/academic/SubjectDetail';
import SubjectEdit from './pages/academic/SubjectEdit';
import AcademicResults from './pages/academic/AcademicResults';
import Semesters from './pages/academic/Semesters';
import SemesterDetail from './pages/academic/SemesterDetail';
import SemesterEdit from './pages/academic/SemesterEdit';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Academic Warnings Pages
import AcademicWarnings from './pages/academic/warnings/AcademicWarnings';
import AcademicWarningDetail from './pages/academic/warnings/AcademicWarningDetail';
import AddAcademicWarning from './pages/academic/warnings/AddAcademicWarning';

// Tuition Management Pages
import TuitionList from './pages/finance/TuitionList';
import TuitionDetail from './pages/finance/TuitionDetail';
import ProcessPayment from './pages/finance/ProcessPayment';
import TuitionStatistics from './pages/finance/TuitionStatistics';
import GenerateTuition from './pages/finance/GenerateTuition';

// Service Management Pages
import ServicesDashboard from './pages/services/ServicesDashboard';
import ServicesList from './pages/services/ServicesList';
import ServiceForm from './pages/services/ServiceForm';
import ServiceRequests from './pages/services/ServiceRequests';
import RequestDetail from './pages/services/RequestDetail';

// Classes Pages
import Classes from './pages/academic/Classes';

// Loading component
const LoadingScreen = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100%',
    }}
  >
    <CircularProgress size={60} thickness={4} />
  </Box>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Check if user is logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if user has ADMIN role
  if (user.role !== 'ADMIN') {
    // Clear any stored auth token and redirect to login
    localStorage.removeItem('token');
    return <Navigate to="/login" state={{ error: 'Bạn không có quyền truy cập vào trang quản trị' }} replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>
      
      {/* Admin Routes - Protected */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Student Management */}
        <Route path="/students" element={<Students />} />
        <Route path="/students/add" element={<AddStudent />} />
        <Route path="/students/edit/:id" element={<StudentEdit />} />
        <Route path="/students/:id" element={<StudentDetail />} />
        
        {/* Academic Management */}
        <Route path="/academic/programs" element={<Programs />} />
        <Route path="/academic/programs/:id" element={<ProgramDetail />} />
        <Route path="/academic/programs/add" element={<AddProgram />} />
        <Route path="/academic/programs/edit/:id" element={<ProgramEdit />} />
        <Route path="/academic/subjects" element={<Subjects />} />
        <Route path="/academic/subjects/add" element={<SubjectEdit />} />
        <Route path="/academic/subjects/edit/:id" element={<SubjectEdit />} />
        <Route path="/academic/subjects/:id" element={<SubjectDetail />} />
        <Route path="/academic/results" element={<AcademicResults />} />
        <Route path="/academic/semesters" element={<Semesters />} />
        <Route path="/academic/semesters/add" element={<SemesterEdit />} />
        <Route path="/academic/semesters/:id" element={<SemesterDetail />} />
        <Route path="/academic/semesters/:id/edit" element={<SemesterEdit />} />
        <Route path="/academic/classes" element={<Classes />} />
        
        {/* Academic Warnings */}
        <Route path="/academic/warnings" element={<AcademicWarnings />} />
        <Route path="/academic/warnings/:id" element={<AcademicWarningDetail />} />
        <Route path="/academic/warnings/add" element={<AddAcademicWarning />} />
        
        {/* Tuition Management */}
        <Route path="/finance/tuition" element={<TuitionList />} />
        <Route path="/finance/tuition/:id" element={<TuitionDetail />} />
        <Route path="/finance/tuition/:id/payment" element={<ProcessPayment />} />
        <Route path="/finance/tuition/statistics" element={<TuitionStatistics />} />
        <Route path="/finance/tuition/generate" element={<GenerateTuition />} />
        
        {/* Services Management */}
        <Route path="/services" element={<ServicesList />} />
        <Route path="/services/dashboard" element={<ServicesDashboard />} />
        <Route path="/services/add" element={<ServiceForm />} />
        <Route path="/services/edit/:id" element={<ServiceForm />} />
        <Route path="/services/requests" element={<ServiceRequests />} />
        <Route path="/services/requests/:id" element={<RequestDetail />} />
        
        {/* User Profile & Settings */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
