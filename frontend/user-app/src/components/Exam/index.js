/*-----------------------------------------------------------------
* File: index.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import ExamList from './ExamList';
import ExamDetails from './ExamDetails';
import ExamSession from './ExamSession';
import ExamResults from './ExamResults';
import UpcomingExams from './UpcomingExams';
import FullscreenExamManager from './FullscreenExamManager';
import ExamHistory from './ExamHistory';

// Export theme configuration to fix the import issue
export const examTheme = {
  colors: {
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    primaryDark: '#1d4ed8',
    secondary: '#8b5cf6',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    neutral: '#64748b',
    background: '#f1f5f9',
    backgroundSecondary: '#f8fafc',
    border: '#e2e8f0',
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      light: '#94a3b8'
    }
  },
  shadows: {
    card: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    button: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    hover: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  borderRadius: {
    small: '0.375rem',
    medium: '0.75rem',
    large: '1rem',
    xl: '1.5rem'
  },
  transitions: {
    fast: 'all 0.2s ease',
    default: 'all 0.3s ease',
    slow: 'all 0.5s ease'
  }
};

export {
  ExamList,
  ExamDetails,
  ExamSession,
  ExamResults,
  UpcomingExams,
  FullscreenExamManager,
  ExamHistory
}; 
