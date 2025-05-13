import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

// Auth Context Provider
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layout Components
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AcademicWarning from './pages/academic/AcademicWarning';
import AcademicProgram from './pages/academic/AcademicProgram';
import CourseRegistration from './pages/registration/CourseRegistration';
import RegisteredCourses from './pages/registration/RegisteredCourses';
import RetakeRegistration from './pages/registration/RetakeRegistration';
import ExamRegistration from './pages/registration/ExamRegistration';
import SecondMajor from './pages/registration/SecondMajor';
import GraduationRegistration from './pages/registration/GraduationRegistration';
import TuitionPayment from './pages/tuition/TuitionPayment';
import PaymentHistory from './pages/tuition/PaymentHistory';
import TuitionFees from './pages/tuition/TuitionFees';
import ClassSchedule from './pages/schedule/ClassSchedule';
import ExamSchedule from './pages/schedule/ExamSchedule';

// Results pages (corrected from academic/)
import AcademicTranscript from './pages/results/AcademicTranscript';
import ConductScore from './pages/results/ConductScore';
import Awards from './pages/results/Awards';

// Services pages (corrected from feedback/)
import TeacherEvaluation from './pages/services/TeacherEvaluation';
import Feedback from './pages/services/Feedback';

// User pages (corrected from profile/)
import Profile from './pages/user/Profile';
import ProfileSettings from './pages/user/ProfileSettings';
import OnlineServices from './pages/services/OnlineServices';
import Attendance from './pages/services/Attendance';
import Internship from './pages/services/Internship';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // If auth is still loading, return nothing
  if (loading) {
    return null;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If authenticated, render children
  return children;
};

// MUI Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0c4da2', // HUBT blue
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes with MainLayout */}
            <Route element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              
              {/* Academic routes */}
              <Route path="/academic-warning" element={<AcademicWarning />} />
              <Route path="/academic-transcript" element={<AcademicTranscript />} />
              <Route path="/academic-program" element={<AcademicProgram />} />
              <Route path="/conduct-score" element={<ConductScore />} />
              <Route path="/awards" element={<Awards />} />
              
              {/* Registration routes */}
              <Route path="/course-registration" element={<CourseRegistration />} />
              <Route path="/registered-courses" element={<RegisteredCourses />} />
              <Route path="/retake-registration" element={<RetakeRegistration />} />
              <Route path="/exam-registration" element={<ExamRegistration />} />
              <Route path="/second-major" element={<SecondMajor />} />
              <Route path="/graduation-registration" element={<GraduationRegistration />} />
              
              {/* Tuition routes */}
              <Route path="/tuition-payment" element={<TuitionPayment />} />
              <Route path="/payment-history" element={<PaymentHistory />} />
              <Route path="/tuition-fees" element={<TuitionFees />} />
              
              {/* Schedule routes */}
              <Route path="/class-schedule" element={<ClassSchedule />} />
              <Route path="/exam-schedule" element={<ExamSchedule />} />
              
              {/* Feedback routes */}
              <Route path="/teacher-evaluation" element={<TeacherEvaluation />} />
              <Route path="/feedback" element={<Feedback />} />
              
              {/* Profile routes */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile-settings" element={<ProfileSettings />} />
              
              {/* Other routes */}
              <Route path="/online-services" element={<OnlineServices />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/internship" element={<Internship />} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 