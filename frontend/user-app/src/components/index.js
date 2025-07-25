/*-----------------------------------------------------------------
* File: index.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
// Export all components
export { default as Loading } from './common/Loading';
export { default as Avatar } from './common/Avatar';
export { default as Button } from './common/Button';
export { default as Card } from './common/Card';
export { default as Modal } from './common/Modal';
export { default as Pagination } from './common/Pagination';
export { default as Toast } from './common/Toast';

// Exam components
export { 
  ExamList, 
  ExamDetails, 
  ExamSession, 
  ExamResults, 
  UpcomingExams 
} from './Exam'; 
