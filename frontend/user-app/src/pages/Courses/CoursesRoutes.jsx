import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EditCode from './EditCode';

const CoursesRoutes = () => {
  return (
    <Routes>
      <Route path=":courseId/edit-code/:lessonId" element={<EditCode />} />
    </Routes>
  );
};

export default CoursesRoutes; 