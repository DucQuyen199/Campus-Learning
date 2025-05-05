import React from 'react';
import { Link } from 'react-router-dom';

const AssignmentsPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Assignments</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-center text-gray-500 py-8">
          Assignments page is under development. This page will display all assignments
          you've created, with filtering by course, due date, and status.
        </p>
        
        <div className="flex justify-center mt-4">
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

export default AssignmentsPage; 