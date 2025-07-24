/*-----------------------------------------------------------------
* File: callService.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { chatApi } from '../api/chatApi';
import * as webRTC from './webRTC';

export class CallService {
  constructor(socket, userId) {
    this.socket = socket;
    this.userId = userId;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentCall = null;
    this.isInitiator = false;
    this.onCallStatusChange = null;
    this.onRemoteStreamReceived = null;
    this.currentCallId = null;
    this.listeners = [];
  }

  /**
   * Initialize listeners for call-related socket events
   */
  initListeners() {
    // Handle incoming calls
    const incomingCallListener = (callData) => {
      console.log('Incoming call received:', callData);
      this.handleIncomingCall(callData);
    };
    this.socket.on('incoming-call', incomingCallListener);
    this.listeners.push({ event: 'incoming-call', handler: incomingCallListener });

    // Handle ICE candidates from remote peer
    const iceCandidateListener = (data) => {
      if (this.peerConnection && data.callId === this.currentCallId) {
        webRTC.addIceCandidate(this.peerConnection, data.candidate);
      }
    };
    this.socket.on('ice-candidate', iceCandidateListener);
    this.listeners.push({ event: 'ice-candidate', handler: iceCandidateListener });

    // Handle call answer from remote peer
    const callAnsweredListener = async (data) => {
      if (this.isInitiator && data.callId === this.currentCallId) {
        console.log('Call answered:', data);
        try {
          await webRTC.setRemoteDescription(this.peerConnection, data.answer);
          if (this.onCallStatusChange) {
            this.onCallStatusChange('connected');
          }
        } catch (error) {
          console.error('Error handling call answer:', error);
        }
      }
    };
    this.socket.on('call-answered', callAnsweredListener);
    this.listeners.push({ event: 'call-answered', handler: callAnsweredListener });

    // Handle call offer from remote peer
    const callOfferListener = async (data) => {
      if (!this.isInitiator && data.callId === this.currentCallId) {
        console.log('Received call offer:', data);
        try {
          await webRTC.setRemoteDescription(this.peerConnection, data.offer);
        } catch (error) {
          console.error('Error handling call offer:', error);
        }
      }
    };
    this.socket.on('call-offer', callOfferListener);
    this.listeners.push({ event: 'call-offer', handler: callOfferListener });

    // Handle call ended
    const callEndedListener = (data) => {
      if (data.callId === this.currentCallId) {
        console.log('Call ended remotely:', data);
        this.endCall(false); // Don't emit event since we received one
      }
    };
    this.socket.on('call-ended', callEndedListener);
    this.listeners.push({ event: 'call-ended', handler: callEndedListener });
  }

  /**
   * Remove all listeners
   */
  removeListeners() {
    this.listeners.forEach(listener => {
      this.socket.off(listener.event, listener.handler);
    });
    this.listeners = [];
  }

  /**
   * Handle incoming call
   * @param {Object} callData - The call data
   */
  handleIncomingCall(callData) {
    this.currentCallId = callData.callId;
    this.currentCall = callData;
    this.isInitiator = false;

    if (this.onCallStatusChange) {
      this.onCallStatusChange('incoming', callData);
    }
  }

  /**
   * Initialize a call to another user
   * @param {Object} userToCall - The user to call
   * @param {boolean} isVideoCall - Whether this is a video call
   * @returns {Promise<void>}
   */
  async initiateCall(conversation, isVideoCall = false) {
    try {
      // Get the other participants from the conversation
      const participantIds = conversation.Participants
        .filter(p => p.UserID !== this.userId)
        .map(p => p.UserID);

      if (participantIds.length === 0) {
        throw new Error('No participants to call');
      }

      // Create a call in the backend
      const callData = await chatApi.initiateCall({
        conversationType: conversation.Type,
        conversationId: conversation.ConversationID,
        type: isVideoCall ? 'video' : 'audio',
        participantIds
      });

      if (!callData) {
        throw new Error('Failed to create call');
      }

      this.currentCallId = callData.callId;
      this.currentCall = callData;
      this.isInitiator = true;

      // Set up WebRTC
      await this.setupWebRTC(isVideoCall);

      // Create offer
      const offer = await webRTC.createOffer(this.peerConnection);

      // Send call initiated event
      this.socket.emit('call-initiated', {
        callId: this.currentCallId,
        participantIds,
        conversationId: conversation.ConversationID,
        offer,
        isVideoCall,
        initiator: {
          id: this.userId,
          name: conversation.Participants.find(p => p.UserID === this.userId)?.FullName || 'User'
        }
      });

      if (this.onCallStatusChange) {
        this.onCallStatusChange('calling');
      }

      return this.currentCallId;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  /**
   * Answer an incoming call
   * @returns {Promise<void>}
   */
  async answerCall(isVideoCall = false) {
    if (!this.currentCall) {
      throw new Error('No incoming call to answer');
    }

    try {
      // Set up WebRTC
      await this.setupWebRTC(isVideoCall);

      // Create answer
      const answer = await webRTC.createAnswer(this.peerConnection);

      // Send call answered event
      this.socket.emit('call-answered', {
        callId: this.currentCallId,
        answer,
        userId: this.userId
      });

      if (this.onCallStatusChange) {
        this.onCallStatusChange('connected');
      }
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  /**
   * Set up WebRTC connection
   * @param {boolean} withVideo - Whether to include video
   * @returns {Promise<void>}
   */
  async setupWebRTC(withVideo = false) {
    // Create peer connection
    this.peerConnection = webRTC.createPeerConnection();

    // Set up event handlers
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer
        this.socket.emit('ice-candidate', {
          callId: this.currentCallId,
          candidate: event.candidate,
          userId: this.userId
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Remote track received:', event.track.kind);
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      
      // Add the track to the remote stream
      this.remoteStream.addTrack(event.track);
      
      // Notify about the remote stream
      if (this.onRemoteStreamReceived) {
        this.onRemoteStreamReceived(this.remoteStream);
      }
    };

    // Get user media (audio/video)
    this.localStream = await webRTC.getUserMedia(true, withVideo);

    // Add tracks to the connection
    webRTC.addTracksToConnection(this.peerConnection, this.localStream);

    return this.localStream;
  }

  /**
   * End the current call
   * @param {boolean} emitEvent - Whether to emit a call-ended event
   */
  endCall(emitEvent = true) {
    if (emitEvent && this.currentCallId) {
      // Send call ended event to server
      this.socket.emit('call-ended', {
        callId: this.currentCallId,
        userId: this.userId
      });
    }

    // Clean up WebRTC
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop media streams
    if (this.localStream) {
      webRTC.stopMediaStream(this.localStream);
      this.localStream = null;
    }

    // Reset call state
    this.currentCallId = null;
    this.currentCall = null;
    this.isInitiator = false;

    // Notify about call end
    if (this.onCallStatusChange) {
      this.onCallStatusChange('ended');
    }
  }

  /**
   * Reject an incoming call
   */
  rejectCall() {
    if (!this.currentCallId) return;

    // Send call rejected event
    this.socket.emit('call-rejected', {
      callId: this.currentCallId,
      userId: this.userId
    });

    // Reset call state
    this.currentCallId = null;
    this.currentCall = null;
    this.isInitiator = false;

    // Notify about call rejection
    if (this.onCallStatusChange) {
      this.onCallStatusChange('rejected');
    }
  }

  /**
   * Toggle audio mute state
   * @returns {boolean} New mute state
   */
  toggleAudio() {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) return false;

    const newState = !audioTrack.enabled;
    audioTrack.enabled = newState;
    return newState;
  }

  /**
   * Toggle video state
   * @returns {boolean} New video state
   */
  toggleVideo() {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return false;

    const newState = !videoTrack.enabled;
    videoTrack.enabled = newState;
    return newState;
  }

  /**
   * Check if user is in a call
   * @returns {boolean}
   */
  isInCall() {
    return !!this.currentCallId;
  }

  /**
   * Get the local stream
   * @returns {MediaStream}
   */
  getLocalStream() {
    return this.localStream;
  }

  /**
   * Get the remote stream
   * @returns {MediaStream}
   */
  getRemoteStream() {
    return this.remoteStream;
  }

  /**
   * Set callback for call status changes
   * @param {Function} callback 
   */
  setCallStatusChangeCallback(callback) {
    this.onCallStatusChange = callback;
  }

  /**
   * Set callback for remote stream received
   * @param {Function} callback 
   */
  setRemoteStreamCallback(callback) {
    this.onRemoteStreamReceived = callback;
  }
}

export default CallService;

