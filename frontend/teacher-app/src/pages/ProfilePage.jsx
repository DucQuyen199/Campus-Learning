import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';

const ProfilePage = () => {
  const user = useSelector(selectCurrentUser);
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {user ? (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-primary-100 mx-auto flex items-center justify-center">
              {user.Image ? (
                <img 
                  src={user.Image} 
                  alt={user.FullName} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary-600">
                  {user.FullName ? user.FullName.charAt(0).toUpperCase() : 'T'}
                </span>
              )}
            </div>
            
            <h2 className="text-xl font-semibold mt-4">{user.FullName || 'Teacher'}</h2>
            <p className="text-gray-600">{user.Email || 'email@example.com'}</p>
            
            <div className="mt-8 space-y-2 text-left max-w-md mx-auto">
              <p><span className="font-medium">Role:</span> {user.Role || 'TEACHER'}</p>
              <p><span className="font-medium">Account Status:</span> {user.Status || 'Active'}</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Profile page is under development. This page will display your profile information,
            with options to update your details and change your password.
          </p>
        )}
        
        <div className="flex justify-center mt-8">
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

export default ProfilePage; 