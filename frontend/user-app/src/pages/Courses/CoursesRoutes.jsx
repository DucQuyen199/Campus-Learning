/*-----------------------------------------------------------------
* File: CoursesRoutes.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
