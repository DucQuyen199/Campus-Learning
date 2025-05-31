import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/Users/UserManagement';
import ExamsPage from './pages/Exams/ExamsPage';
import CreateExamPage from './pages/Exams/CreateExamPage';
import EditExamPage from './pages/Exams/EditExamPage';
import EditEssayQuestion from './pages/Exams/EditEssayQuestion';
import MultipleChoiceExamPage from './pages/Exams/MultipleChoiceExamPage';
import EssayExamPage from './pages/Exams/EssayExamPage';
import CodingExamPage from './pages/Exams/CodingExamPage';
import ExamDetailPage from './pages/Exams/ExamDetailPage';
import { EventsPage, EventDetail, CreateEventPage } from './pages/Events';
import CreatePrizeForm from './pages/Events/CreatePrizeForm';
import EditEventForm from './pages/Events/EditEventForm';
import AddEventSchedulePage from './pages/Events/AddEventSchedulePage';
import ReportsPage from './pages/Reports/ReportsPage';
import DashboardLayout from './components/layout/DashboardLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import CourseManagement from './pages/Courses/CourseManagement';
import CoursesPage from './pages/Courses/CoursesPage';
import CourseDetail from './pages/Courses/CourseDetail';
import CreateCourse from './pages/Courses/CreateCourse';
import EditCourse from './pages/Courses/EditCourse';
import RoleManagement from './pages/Users/RoleManagement';
import ReportManagement from './pages/Reports/ReportManagement';
import { CompetitionsPage, CompetitionDetail, CompetitionForm, ProblemForm, ProblemDetail } from './pages/Competitions';
import CreateModule from './pages/Courses/CreateModule';
import ModuleDetail from './pages/Courses/ModuleDetail';
import ModuleEdit from './pages/Courses/ModuleEdit';
import CreateLesson from './pages/Courses/CreateLesson';
import LessonDetail from './pages/Courses/LessonDetail';
import EditLesson from './pages/Courses/EditLesson';
import SettingsPage from './pages/Settings';

// Material UI theme
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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Save current path to localStorage when not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location.pathname !== '/login') {
      localStorage.setItem('auth_redirect', location.pathname);
    }
  }, [isLoading, isAuthenticated, location]);
  
  // Listen for auth:error events from API interceptors
  useEffect(() => {
    const handleAuthError = (event) => {
      console.log('Auth error event detected, redirecting to login');
      // Current path is already saved by the event dispatcher
      navigate('/login');
    };
    
    window.addEventListener('auth:error', handleAuthError);
    
    return () => {
      window.removeEventListener('auth:error', handleAuthError);
    };
  }, [navigate]);

  if (isLoading) {
    // Show loading spinner while checking auth status
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render children if authenticated
  return children;
};

// App Routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Users Route */}
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <UserManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Exams Routes */}
      <Route
        path="/exams"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ExamsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/exams/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateExamPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Specialized Exam Creation Routes */}
      <Route
        path="/exams/create/multiple-choice"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <MultipleChoiceExamPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/exams/create/essay"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EssayExamPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/exams/create/coding"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CodingExamPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/exams/edit/:examId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditExamPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Exam Detail Routes */}
      <Route
        path="/exams/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ExamDetailPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/exams/multiple-choice/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ExamDetailPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/exams/essay/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ExamDetailPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/exams/coding/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ExamDetailPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/exams/:examId/questions/:questionId/essay-edit"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditEssayQuestion />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Events Routes */}
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EventsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/events/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateEventPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/events/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EventDetail />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/events/:id/prizes/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreatePrizeForm />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/events/:id/schedule/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AddEventSchedulePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/events/:id/edit"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditEventForm />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Competitions Routes */}
      <Route
        path="/competitions"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CompetitionsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/competitions/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CompetitionDetail />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/competitions/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CompetitionForm />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/competitions/edit/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CompetitionForm />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Competition Problems Routes */}
      <Route
        path="/competitions/:id/problems/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProblemForm />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/competitions/:id/problems/:problemId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProblemDetail />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/competitions/:id/problems/:problemId/edit"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProblemForm />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Reports Route */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ReportsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Course Management Routes */}
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CoursesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CourseDetail />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateCourse />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/edit/:courseId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditCourse />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Module Management Routes */}
      <Route
        path="/courses/:id/modules/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateModule />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id/modules/:moduleId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ModuleDetail />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id/modules/:moduleId/edit"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ModuleEdit />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Lesson Management Routes */}
      <Route
        path="/courses/:id/modules/:moduleId/lessons/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateLesson />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id/modules/:moduleId/lessons/:lessonId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <LessonDetail />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id/modules/:moduleId/lessons/:lessonId/edit"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditLesson />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* User Management Routes */}
      <Route
        path="/users/roles"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <RoleManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Report Management Route */}
      <Route
        path="/reports/management"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ReportManagement />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Temporary placeholders for other protected routes */}
      {['profile'].map((path) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <div style={{ padding: '20px' }}>
                  <h1>{path.charAt(0).toUpperCase() + path.slice(1)} Page</h1>
                  <p>This page is under construction.</p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      ))}
      
      {/* Settings Route */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Root route */}
      <Route path="/" element={
        <Navigate to="/dashboard" replace />
      } />

      {/* 404 route */}
      <Route path="*" element={
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h1>404 - Không tìm thấy trang</h1>
        </div>
      } />
    </Routes>
  );
};

// App Component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 