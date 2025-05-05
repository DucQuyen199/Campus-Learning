import React from 'react';
import { useParams } from 'react-router-dom';

const CourseDetailPage = () => {
  const { id } = useParams();
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Course Details</h1>
      <p className="text-gray-600">Viewing course with ID: {id}</p>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
        <p className="text-center text-gray-500 py-8">
          Course detail page is under development. This page will display detailed information 
          about the course, including modules, lessons, and student enrollments.
        </p>
      </div>
    </div>
  );
};

export default CourseDetailPage; 