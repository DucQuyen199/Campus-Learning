import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DefaultLayout, AuthLayout } from '@/layouts';
import HomePage from '@/pages/Home';
import AboutPage from '@/pages/About';
import CoursesPage from '@/pages/Courses';
import CourseDetail from '@/pages/Courses/CourseDetail';
import CourseLearning from '@/pages/Courses/CourseLearning';
import Payment from '@/pages/Payment';
import PaymentResult from '@/pages/PaymentResult';
import LoginPage from '@/pages/Auth/Login';
import RegisterPage from '@/pages/Auth/Register';
import ForgotPasswordPage from '@/pages/Auth/ForgotPassword';
import ProfilePage from '@/pages/Profile';
import SettingsPage from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import PrivateRoute from './PrivateRoute';
import EventDetail from '@/pages/Events/EventDetail';
import ChatPage from '@/components/chat/ChatPage';
import PaymentCallback from '@/pages/Courses/PaymentCallback';
import PaymentHistory from '@/pages/PaymentHistory';
import AiTestLocal from '@/pages/AiTestLocal';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DefaultLayout />}>
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="courses">
          <Route index element={<CoursesPage />} />
          <Route path=":courseId" element={<CourseDetail />} />
          <Route path=":courseId/learn" element={
            <PrivateRoute>
              <CourseLearning />
            </PrivateRoute>
          } />
        </Route>
        <Route path="payment/:courseId" element={
          <PrivateRoute>
            <Payment />
          </PrivateRoute>
        } />
        <Route path="payment-result" element={
          <PrivateRoute>
            <PaymentResult />
          </PrivateRoute>
        } />
        <Route path="payment-history" element={
          <PrivateRoute>
            <PaymentHistory />
          </PrivateRoute>
        } />
        <Route path="profile" element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        } />
        <Route path="settings" element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Route>
      
      <Route path="/" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes; 