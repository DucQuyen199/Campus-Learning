import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  ExamList, 
  ExamDetails, 
  ExamSession, 
  ExamResults, 
  UpcomingExams,
  ExamHistory
} from '../../components/Exam';

const ExamsPage = () => {
  return (
    <Routes>
      <Route path="/" element={<ExamList />} />
      <Route path="/upcoming" element={<UpcomingExams />} />
      <Route path="/:examId" element={<ExamDetails />} />
      <Route path="/:examId/session" element={<ExamSession />} />
      <Route path="/results/:participantId" element={<ExamResults />} />
      <Route path="/:examId/history" element={<ExamHistory />} />
    </Routes>
  );
};

export default ExamsPage;
