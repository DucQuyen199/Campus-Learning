import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Layout components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Page components
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

// User pages
import Profile from './pages/user/Profile';
import ProfileSettings from './pages/user/ProfileSettings';

// Academic pages
import AcademicProgram from './pages/academic/AcademicProgram';
import AcademicWarning from './pages/academic/AcademicWarning';

// Registration pages
import CourseRegistration from './pages/registration/CourseRegistration';
import RetakeRegistration from './pages/registration/RetakeRegistration';
import ExamRegistration from './pages/registration/ExamRegistration';
import RegisteredCourses from './pages/registration/RegisteredCourses';
import SecondMajor from './pages/registration/SecondMajor';
import GraduationRegistration from './pages/registration/GraduationRegistration';

// Tuition pages
import TuitionPayment from './pages/tuition/TuitionPayment';
import PaymentHistory from './pages/tuition/PaymentHistory';
import TuitionFees from './pages/tuition/TuitionFees';

// Schedule pages
import ClassSchedule from './pages/schedule/ClassSchedule';
import ExamSchedule from './pages/schedule/ExamSchedule';

// Results pages
import AcademicTranscript from './pages/results/AcademicTranscript';
import ConductScore from './pages/results/ConductScore';
import Awards from './pages/results/Awards';

// Services pages
import TeacherEvaluation from './pages/services/TeacherEvaluation';
import Feedback from './pages/services/Feedback';
import OnlineServices from './pages/services/OnlineServices';
import Attendance from './pages/services/Attendance';
import Internship from './pages/services/Internship';

// Auth context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Main layout component
const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      width: '100%'
    }}>
      <CssBaseline />
      <Header handleDrawerToggle={handleDrawerToggle} />
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { xs: '100%', sm: `calc(100% - 240px)` },
          height: '100%',
          marginTop: '64px', // AppBar height
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

// App component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* User Information */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfileSettings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Academic */}
            <Route
              path="/academic-program"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AcademicProgram />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic-warning"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AcademicWarning />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Registration */}
            <Route
              path="/course-registration"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CourseRegistration />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/retake-registration"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RetakeRegistration />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam-registration"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ExamRegistration />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/registered-courses"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RegisteredCourses />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/second-major"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SecondMajor />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/graduation-registration"
              element={
                <ProtectedRoute>
                  <Layout>
                    <GraduationRegistration />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Tuition */}
            <Route
              path="/tuition-payment"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TuitionPayment />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PaymentHistory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tuition-fees"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TuitionFees />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Schedule */}
            <Route
              path="/class-schedule"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClassSchedule />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam-schedule"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ExamSchedule />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Results */}
            <Route
              path="/academic-transcript"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AcademicTranscript />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/conduct-score"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ConductScore />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/awards"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Awards />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Services */}
            <Route
              path="/teacher-evaluation"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TeacherEvaluation />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Feedback />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/online-services"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OnlineServices />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Attendance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/internship"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Internship />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 