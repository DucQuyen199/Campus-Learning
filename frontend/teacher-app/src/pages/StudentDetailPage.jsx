import React from 'react';
import { useParams, Link } from 'react-router-dom';

const StudentDetailPage = () => {
  const { id } = useParams();
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Student Profile</h1>
      <p className="text-gray-600">Viewing student with ID: {id}</p>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
        <p className="text-center text-gray-500 py-8">
          Student detail page is under development. This page will display detailed information 
          about the student, including course enrollments, assignments, and grades.
        </p>
        
        <div className="flex justify-center mt-4">
          <Link 
            to="/students" 
            className="btn btn-outline mr-4"
          >
            Back to Students
          </Link>
          <Link 
            to="/dashboard" 
            className="btn btn-primary"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailPage; 