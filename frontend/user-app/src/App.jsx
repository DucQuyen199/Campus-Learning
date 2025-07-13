import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/Layout/MainLayout';
import { ThemeProvider } from './contexts/ThemeContext';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/Courses/CourseDetail';
import CourseLearning from './pages/Courses/CourseLearning';
import EditCode from './pages/Courses/EditCode';
import Payment from './pages/Payment';
import PaymentResult from './pages/PaymentResult';
import PaymentHistory from './pages/PaymentHistory';
import CoursePrint from './pages/PaymentHistory/print';
import Events from './pages/Events';
import EventDetail from './pages/Events/EventDetail';
import Posts from './pages/Posts';
import Notifications from './pages/Notifications';
import Ranking from './pages/Ranking';
import AIChat from './pages/AIChat';
import Exams from './pages/Exams';
import OtherCourses from './pages/OtherCourses';
import Chat from './pages/Chat';
import Reports from './pages/Reports/index';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Settings from './pages/Settings';
import Login from './pages/Auth/Login';
import OtpLogin from './pages/Auth/OtpLogin';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import AuthMiddleware from './middleware/AuthMiddleware';
import StoryCreate from './pages/Stories/StoryCreate';
import { CallProvider } from './contexts/CallContext';
import { CallInterface } from './components/Call';
import FAQ from './pages/Support/FAQ';
import HelpCenter from './pages/Support/HelpCenter';
import PrivacyPolicy from './pages/Support/PrivacyPolicy';
import TermsOfUse from './pages/Support/TermsOfUse';
import Roadmaps from './pages/Roadmaps';
import AiTestLocal from './pages/AiTestLocal';
import CompetitionsPage from './pages/Competitions';
import CompetitionDetail from './pages/Competitions/CompetitionDetail';
import ProblemDetail from './pages/Competitions/ProblemDetail';
import PaymentVietQR from './pages/Payment/VietQRPayment';

// Custom CSS for toast notifications
import './toast-custom.css';

function App() {
  return (
    <ThemeProvider>
      <CallProvider>
        <MainLayout>
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            className="toast-container-custom"
            toastClassName="toast-custom"
            style={{ top: '70px' }} // Add top margin to push below navbar
          />
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                marginTop: '70px', // Push Toaster notifications below navbar
              },
            }}
          />
          <CallInterface />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/login-otp" element={<OtpLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Public course and event routes */}
            <Route path="/courses/*" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/events/:eventId" element={<EventDetail />} />
            <Route path="/roadmaps" element={<Roadmaps />} />
            
            {/* Payment callback routes - need to be public for third-party returns */}
            <Route path="/payment/callback" element={<PaymentResult />} />
            <Route path="/payment/paypal/success" element={<PaymentResult />} />
            <Route path="/payment/paypal/cancel" element={<PaymentResult />} />

            {/* Protected routes */}
            {[
              { path: '/home', element: <Home /> },
              { path: '/profile', element: <Profile /> },
              { path: '/profile/:userId', element: <Profile /> },
              { path: '/friends', element: <Friends /> },
              { path: '/events', element: <Events /> },
              { path: '/posts', element: <Posts /> },
              { path: '/notifications', element: <Notifications /> },
              { path: '/ranking', element: <Ranking /> },
              { path: '/ai-chat', element: <AIChat /> },
              { path: '/ai-test-local', element: <AiTestLocal /> },
              { path: '/other-courses', element: <OtherCourses /> },
              { path: '/chat', element: <Chat /> },
              { path: '/reports', element: <Reports /> },
              { path: '/settings', element: <Settings /> },
              { path: '/exams/*', element: <Exams /> },
              { path: '/competitions', element: <CompetitionsPage /> },
              { path: '/competitions/:id', element: <CompetitionDetail /> },
              { path: '/competitions/:competitionId/problems/:problemId', element: <ProblemDetail /> },
              { path: '/courses/:courseId/learn', element: <CourseLearning /> },
              { path: '/courses/:courseId/edit-code/:lessonId', element: <EditCode /> },
              { path: '/payment/:courseId', element: <Payment /> },
              { path: '/payment/vietqr/:transactionCode', element: <PaymentVietQR /> },
              { path: '/payment-history', element: <PaymentHistory /> },
              { path: '/payment-history/print-course', element: <CoursePrint /> }
            ].map(({ path, element }) => (
              <Route
                key={path}
                path={path}
                element={
                  <AuthMiddleware>
                    {element}
                  </AuthMiddleware>
                }
              />
            ))}

            {/* Public story creation route */}
            <Route path="/stories/create" element={<StoryCreate />} />

            {/* Root route */}
            <Route 
              path="/" 
              element={
                localStorage.getItem('token') ? 
                <Navigate to="/home" replace /> : 
                <Navigate to="/login" replace />
              } 
            />

            {/* Catch all route - redirect to home if authenticated, otherwise to login */}
            <Route 
              path="*" 
              element={
                localStorage.getItem('token') ? 
                <Navigate to="/home" replace /> : 
                <Navigate to="/login" replace />
              }
            />

            {/* Support routes */}
            <Route path="/support/faq" element={<FAQ />} />
            <Route path="/support/help-center" element={<HelpCenter />} />
            <Route path="/support/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/support/terms-of-use" element={<TermsOfUse />} />
          </Routes>
        </MainLayout>
      </CallProvider>
    </ThemeProvider>
  );
}

export default App;
