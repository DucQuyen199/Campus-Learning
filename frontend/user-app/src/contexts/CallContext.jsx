import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import { useSocket } from './SocketContext';
import callService from '../services/callService';
import { toast } from 'react-hot-toast';

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { socket, user } = useSocket();
  const [call, setCall] = useState(null);
  const [callStatus, setCallStatus] = useState(null); // 'ringing', 'ongoing', 'ended'
  const [callType, setCallType] = useState(null); // 'audio', 'video'
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [isMakingCall, setIsMakingCall] = useState(false);
  const [callHistory, setCallHistory] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallServiceAvailable, setIsCallServiceAvailable] = useState(true);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef();
  const callTimerRef = useRef();

  // Check for active call on load
  useEffect(() => {
    const checkActiveCall = async () => {
      try {
        const { hasActiveCall, call } = await callService.getActiveCall();
        if (hasActiveCall) {
          setCall(call);
          setCallStatus('ongoing');
          setCallType(call.Type);
          // Setup media and peer connection
          await setupMediaAndConnection({ callId: call.CallID });
        }
        // Service is available if we get a proper response
        setIsCallServiceAvailable(true);
      } catch (error) {
        // Log only in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Call service unavailable:', error.message || 'Unknown error');
        }

        // Check if this is a 404 error, which means the endpoint doesn't exist
        if (error.response?.status === 404 || 
            error.message?.includes('404') || 
            error.message?.includes('not found')) {
          setIsCallServiceAvailable(false);
        }
        
        // Don't show error toast for expected service unavailability
        if (error.response?.status !== 404) {
          // Uncomment if you want to show an error toast
          // toast.error('Could not connect to call service');
        }
      }
    };

    // Only check for active calls if user is logged in and call service was not already determined to be unavailable
    if (user && isCallServiceAvailable) {
      checkActiveCall();
    }
    
    return () => {
      // Cleanup on unmount
      stopMediaTracks();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [user, isCallServiceAvailable]);

  // Socket event listeners for call handling
  useEffect(() => {
    if (!socket || !isCallServiceAvailable) return;

    // Incoming call handler
    const handleIncomingCall = async (data) => {
      console.log('Incoming call:', data);
      setCall(data);
      setCallType(data.type);
      setCallStatus('ringing');
      setIsReceivingCall(true);
    };

    // Call answered handler
    const handleCallAnswered = async (data) => {
      console.log('Call answered:', data);
      setCallStatus('ongoing');
      startCallTimer();
    };

    // Call ended handler
    const handleCallEnded = (data) => {
      console.log('Call ended:', data);
      toast.success(`Call ended. Duration: ${formatCallDuration(data.duration)}`);
      endCallCleanup();
    };

    // Call rejected handler
    const handleCallRejected = (data) => {
      console.log('Call rejected:', data);
      toast.error('Call was rejected');
      endCallCleanup();
    };

    // WebRTC signaling handlers
    const handleSignalingData = async (data) => {
      try {
        console.log('Received signaling data:', data.signal.type, data);
        
        if (!peerConnectionRef.current) {
          console.log('Setting up new peer connection for incoming call/signal');
          await setupMediaAndConnection({ 
            isReceivingCall: true, 
            fromUserId: data.fromUserId
          });
        }
        
        const { type, sdp, candidate } = data.signal;
        
        if (type === 'offer') {
          console.log('Setting remote description (offer)');
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
          console.log('Creating answer');
          const answer = await peerConnectionRef.current.createAnswer();
          console.log('Setting local description (answer)');
          await peerConnectionRef.current.setLocalDescription(answer);
          
          console.log('Sending answer to:', data.fromUserId);
          socket.emit('call-signal', {
            userId: data.fromUserId,
            signal: {
              type: 'answer',
              sdp: peerConnectionRef.current.localDescription.sdp
            }
          });
        } else if (type === 'answer') {
          console.log('Setting remote description (answer)');
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
          console.log('Connection should be establishing now');
        } else if (type === 'candidate') {
          try {
            console.log('Adding ICE candidate');
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Error adding received ice candidate', err);
            }
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error handling signaling data:', error);
        }
        toast.error('Failed to establish connection');
      }
    };

    // Only register socket events if the call service is available
    if (isCallServiceAvailable) {
      // Register socket event listeners
      socket.on('incoming-call', handleIncomingCall);
      socket.on('call-answered', handleCallAnswered);
      socket.on('call-ended', handleCallEnded);
      socket.on('call-rejected', handleCallRejected);
      socket.on('call-signal', handleSignalingData);
    }

    // Cleanup on component unmount
    return () => {
      if (socket) {
        socket.off('incoming-call', handleIncomingCall);
        socket.off('call-answered', handleCallAnswered);
        socket.off('call-ended', handleCallEnded);
        socket.off('call-rejected', handleCallRejected);
        socket.off('call-signal', handleSignalingData);
      }
    };
  }, [socket, user, isCallServiceAvailable]);

  // Set up media streams and peer connection
  const setupMediaAndConnection = async ({ callId, isReceivingCall, fromUserId }) => {
    try {
      // Get user media
      const constraints = {
        audio: true,
        video: callType === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // Set local video source
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle'
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Set up remote stream handler
      peerConnection.ontrack = (event) => {
        console.log('Got remote track:', event.streams[0]);
        setRemoteStream(event.streams[0]);
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Send ICE candidates to the other peer
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Generated new ICE candidate:', event.candidate.candidate);
          
          socket.emit('call-signal', {
            userId: fromUserId || call.initiatorId || call.receiverId,
            signal: {
              type: 'candidate',
              candidate: event.candidate
            }
          });
        } else {
          console.log('ICE candidate generation complete');
        }
      };
      
      // Log connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state change:', peerConnection.iceConnectionState);
      };
      
      peerConnection.onicegatheringstatechange = () => {
        console.log('ICE gathering state change:', peerConnection.iceGatheringState);
      };

      // Create and send offer if initiating the call
      if (!isReceivingCall) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socket.emit('call-signal', {
          userId: fromUserId || call.receiverId,
          signal: {
            type: 'offer',
            sdp: peerConnection.localDescription.sdp
          }
        });
      }

      // Join call room for multi-user communication
      if (callId) {
        socket.emit('join-call-room', callId);
      }

      // Set up connection state change handler
      peerConnection.onconnectionstatechange = (event) => {
        console.log('Connection state change:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'disconnected' || 
            peerConnection.connectionState === 'failed') {
          toast.error('Call connection lost');
          endCall();
        }
      };

      return peerConnection;
    } catch (error) {
      console.error('Error setting up media and connection:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Please allow camera and microphone access');
      } else {
        toast.error('Failed to setup call: ' + error.message);
      }
      
      throw error;
    }
  };

  // Start call timer
  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Format call duration
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clean up call resources
  const endCallCleanup = () => {
    setCall(null);
    setCallStatus(null);
    setCallType(null);
    setIsReceivingCall(false);
    setIsMakingCall(false);
    
    stopMediaTracks();
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  // Stop all media tracks
  const stopMediaTracks = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
  };

  // API: Initiate a call
  const initiateCall = async (receiverId, type = 'video') => {
    try {
      setIsMakingCall(true);
      setCallType(type);
      
      const response = await callService.initiateCall(receiverId, type);
      setCall(response.call);
      setCallStatus('ringing');
      
      await setupMediaAndConnection({ 
        callId: response.call.callId,
        isReceivingCall: false
      });
      
      return response.call;
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error(error.message || 'Failed to initiate call');
      endCallCleanup();
      throw error;
    }
  };

  // API: Answer an incoming call
  const answerCall = async () => {
    try {
      if (!call) return;
      
      const response = await callService.answerCall(call.callId);
      setCallStatus('ongoing');
      setIsReceivingCall(false);
      
      await setupMediaAndConnection({ 
        callId: call.callId,
        isReceivingCall: true,
        fromUserId: call.initiatorId
      });
      
      startCallTimer();
      
      return response;
    } catch (error) {
      console.error('Error answering call:', error);
      toast.error(error.message || 'Failed to answer call');
      endCallCleanup();
      throw error;
    }
  };

  // API: End an active call
  const endCall = async () => {
    try {
      if (!call) return;
      
      await callService.endCall(call.callId);
      
      if (socket) {
        socket.emit('leave-call-room', call.callId);
      }
      
      endCallCleanup();
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error(error.message || 'Failed to end call');
      endCallCleanup();
      throw error;
    }
  };

  // API: Reject an incoming call
  const rejectCall = async () => {
    try {
      if (!call) return;
      
      await callService.rejectCall(call.callId);
      endCallCleanup();
    } catch (error) {
      console.error('Error rejecting call:', error);
      toast.error(error.message || 'Failed to reject call');
      endCallCleanup();
      throw error;
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const enabled = !isAudioEnabled;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      setIsAudioEnabled(enabled);
      
      // Notify other participants
      if (socket && call) {
        socket.emit('toggle-media', {
          callId: call.callId,
          type: 'audio',
          enabled
        });
      }
      
      return enabled;
    }
    return isAudioEnabled;
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const enabled = !isVideoEnabled;
      localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      setIsVideoEnabled(enabled);
      
      // Notify other participants
      if (socket && call) {
        socket.emit('toggle-media', {
          callId: call.callId,
          type: 'video',
          enabled
        });
      }
      
      return enabled;
    }
    return isVideoEnabled;
  };

  // Load call history
  const loadCallHistory = async (limit = 10, offset = 0) => {
    try {
      const response = await callService.getCallHistory(limit, offset);
      setCallHistory(response.calls);
      return response.calls;
    } catch (error) {
      console.error('Error loading call history:', error);
      toast.error(error.message || 'Failed to load call history');
      throw error;
    }
  };

  return (
    <CallContext.Provider
      value={{
        call,
        callStatus,
        callType,
        isReceivingCall,
        isMakingCall,
        callHistory,
        localStream,
        remoteStream,
        isAudioEnabled,
        isVideoEnabled,
        callDuration,
        localVideoRef,
        remoteVideoRef,
        initiateCall,
        answerCall,
        endCall,
        rejectCall,
        toggleAudio,
        toggleVideo,
        loadCallHistory,
        formatCallDuration
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext); 