import React, { useEffect, useState } from 'react';
import { useCall } from '../../contexts/CallContext';
import { FaPhone, FaPhoneSlash, FaVideo } from 'react-icons/fa';
import { format } from 'date-fns';

const CallHistory = () => {
  const { callHistory, loadCallHistory, initiateCall, formatCallDuration } = useCall();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCallHistory = async () => {
      setLoading(true);
      try {
        await loadCallHistory();
      } catch (error) {
        console.error('Error loading call history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCallHistory();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'missed':
      case 'rejected':
        return <FaPhoneSlash className="text-red-500" />;
      case 'completed':
      case 'ended':
        return <FaPhone className="text-green-500" />;
      default:
        return <FaPhone className="text-blue-500" />;
    }
  };

  const formatCallDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPp'); // Format like "Apr 29, 2021, 1:30 PM"
    } catch (error) {
      return dateString;
    }
  };

  const handleCallUser = (userId, type) => {
    initiateCall(userId, type);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!callHistory?.length) {
    return (
      <div className="text-center p-4 text-gray-500">
        No call history found.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {callHistory.map((call) => (
        <div key={call.CallID} className="p-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3">
              {call.Type === 'video' ? 
                <FaVideo className="text-blue-500" /> : 
                getStatusIcon(call.Status)
              }
            </div>
            
            <div>
              <p className="font-semibold">
                {call.InitiatorID === call.UserID ? 
                  'Outgoing Call' : 
                  'Incoming Call'
                }
              </p>
              
              <p className="text-sm text-gray-500">
                {formatCallDate(call.StartTime)}
              </p>
              
              {call.Duration > 0 && (
                <p className="text-xs text-gray-500">
                  Duration: {formatCallDuration(call.Duration)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleCallUser(
                call.InitiatorID === call.UserID ? call.ReceiverID : call.InitiatorID,
                'audio'
              )}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <FaPhone className="text-blue-500" />
            </button>
            
            <button
              onClick={() => handleCallUser(
                call.InitiatorID === call.UserID ? call.ReceiverID : call.InitiatorID,
                'video'
              )}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <FaVideo className="text-green-500" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CallHistory; 