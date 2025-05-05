import React from 'react';
import { FaPhone, FaVideo } from 'react-icons/fa';
import { useCall } from '../../contexts/CallContext';
import { toast } from 'react-hot-toast';

const CallButtons = ({ userId, userName }) => {
  const { initiateCall } = useCall();

  const handleAudioCall = async () => {
    try {
      await initiateCall(userId, 'audio');
    } catch (error) {
      toast.error(error.message || 'Failed to start audio call');
    }
  };

  const handleVideoCall = async () => {
    try {
      await initiateCall(userId, 'video');
    } catch (error) {
      toast.error(error.message || 'Failed to start video call');
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleAudioCall}
        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        title={`Start audio call with ${userName || 'user'}`}
      >
        <FaPhone className="text-blue-500" />
      </button>
      
      <button
        onClick={handleVideoCall}
        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        title={`Start video call with ${userName || 'user'}`}
      >
        <FaVideo className="text-green-500" />
      </button>
    </div>
  );
};

export default CallButtons; 