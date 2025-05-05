import React, { useEffect } from 'react';
import { useCall } from '../../contexts/CallContext';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhone, FaPhoneSlash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const CallInterface = () => {
  const {
    call,
    callStatus,
    callType,
    isReceivingCall,
    isMakingCall,
    callDuration,
    isAudioEnabled,
    isVideoEnabled,
    localVideoRef,
    remoteVideoRef,
    answerCall,
    endCall,
    rejectCall,
    toggleAudio,
    toggleVideo,
    formatCallDuration
  } = useCall();

  // Set up video elements
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.muted = true; // Mute local video to prevent echo
    }
  }, []);

  if (!call) return null;

  const renderIncomingCallUI = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-xl font-semibold mb-2">Incoming {callType} Call</h2>
      <p className="text-lg mb-6">From: {call.initiatorName || 'Unknown'}</p>
      
      <div className="flex space-x-4">
        <button 
          onClick={rejectCall}
          className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full"
        >
          <FaPhoneSlash className="text-2xl" />
        </button>
        
        <button 
          onClick={answerCall}
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full"
        >
          <FaPhone className="text-2xl" />
        </button>
      </div>
    </div>
  );

  const renderOutgoingCallUI = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-xl font-semibold mb-2">Calling...</h2>
      <p className="text-lg mb-6">{call.receiverName || 'Unknown'}</p>
      
      <button 
        onClick={endCall}
        className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full"
      >
        <FaPhoneSlash className="text-2xl" />
      </button>
    </div>
  );

  const renderOngoingCallUI = () => (
    <div className="flex flex-col h-full">
      {/* Video area */}
      <div className="flex-1 relative">
        {/* Remote video (full screen) */}
        {callType === 'video' && (
          <div className="absolute inset-0 bg-gray-900">
            <video 
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Audio-only placeholder */}
        {callType === 'audio' && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-4xl text-white font-bold">
                {call.receiverName?.[0] || call.initiatorName?.[0] || '?'}
              </span>
            </div>
          </div>
        )}
        
        {/* Local video (picture-in-picture) */}
        {callType === 'video' && (
          <div className="absolute bottom-4 right-4 w-1/4 h-1/4 max-w-[160px] max-h-[160px] rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video 
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Call duration */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white py-1 px-3 rounded-full">
          {formatCallDuration(callDuration)}
        </div>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-6">
        <button 
          onClick={toggleAudio}
          className={`p-3 rounded-full ${isAudioEnabled ? 'bg-gray-600' : 'bg-red-500'}`}
        >
          {isAudioEnabled ? <FaMicrophone className="text-white text-xl" /> : <FaMicrophoneSlash className="text-white text-xl" />}
        </button>
        
        {callType === 'video' && (
          <button 
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoEnabled ? 'bg-gray-600' : 'bg-red-500'}`}
          >
            {isVideoEnabled ? <FaVideo className="text-white text-xl" /> : <FaVideoSlash className="text-white text-xl" />}
          </button>
        )}
        
        <button 
          onClick={endCall}
          className="bg-red-500 hover:bg-red-600 p-3 rounded-full"
        >
          <FaPhoneSlash className="text-white text-xl" />
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden w-full max-w-3xl h-[80vh]">
          {isReceivingCall && callStatus === 'ringing' && renderIncomingCallUI()}
          {isMakingCall && callStatus === 'ringing' && renderOutgoingCallUI()}
          {callStatus === 'ongoing' && renderOngoingCallUI()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallInterface; 