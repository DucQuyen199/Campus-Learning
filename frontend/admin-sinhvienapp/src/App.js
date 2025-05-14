import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import Dashboard from './pages/Dashboard';
import Students from './pages/students/Students';
import StudentDetail from './pages/students/StudentDetail';
import AddStudent from './pages/students/AddStudent';
import Programs from './pages/academic/Programs';
import ProgramDetail from './pages/academic/ProgramDetail';
import AddProgram from './pages/academic/AddProgram';
import Subjects from './pages/academic/Subjects';
import SubjectDetail from './pages/academic/SubjectDetail';
import AcademicResults from './pages/academic/AcademicResults';
import Semesters from './pages/academic/Semesters';
import SemesterDetail from './pages/academic/SemesterDetail';
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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const { checkAuthStatus } = useAuth();
  
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>
      
      {/* Admin Routes */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Student Management */}
        <Route path="/students" element={<Students />} />
        <Route path="/students/:id" element={<StudentDetail />} />
        <Route path="/students/add" element={<AddStudent />} />
        
        {/* Academic Management */}
        <Route path="/academic/programs" element={<Programs />} />
        <Route path="/academic/programs/:id" element={<ProgramDetail />} />
        <Route path="/academic/programs/add" element={<AddProgram />} />
        <Route path="/academic/subjects" element={<Subjects />} />
        <Route path="/academic/subjects/:id" element={<SubjectDetail />} />
        <Route path="/academic/results" element={<AcademicResults />} />
        <Route path="/academic/semesters" element={<Semesters />} />
        <Route path="/academic/semesters/:id" element={<SemesterDetail />} />
        
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
