/*-----------------------------------------------------------------
* File: webRTC.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
/**
 * WebRTC utility functions for peer-to-peer audio/video calls
 */

// Configuration for STUN/TURN servers
const iceConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // Google's public STUN server
    { urls: "stun:stun1.l.google.com:19302" },
    // Add TURN servers for production to handle NAT traversal issues
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'credential'
    // }
  ],
  iceCandidatePoolSize: 10,
};

/**
 * Creates and returns a new WebRTC peer connection
 * @returns {RTCPeerConnection}
 */
export const createPeerConnection = () => {
  try {
    return new RTCPeerConnection(iceConfig);
  } catch (error) {
    console.error("Error creating peer connection:", error);
    throw error;
  }
};

/**
 * Get local media stream (audio and/or video)
 * @param {boolean} audio - Whether to include audio
 * @param {boolean} video - Whether to include video
 * @returns {Promise<MediaStream>}
 */
export const getLocalStream = async (audio = true, video = false) => {
  try {
    const constraints = {
      audio,
      video: video ? { width: 640, height: 480, facingMode: "user" } : false,
    };
    
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error("Error getting local stream:", error);
    throw error;
  }
};

/**
 * Add tracks from media stream to peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @param {MediaStream} stream - The media stream
 */
export const addTracksToConnection = (peerConnection, stream) => {
  if (!peerConnection || !stream) return;
  
  stream.getTracks().forEach(track => {
    peerConnection.addTrack(track, stream);
  });
};

/**
 * Create an offer to initiate a call
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @returns {Promise<RTCSessionDescriptionInit>}
 */
export const createOffer = async (peerConnection) => {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
  } catch (error) {
    console.error("Error creating offer:", error);
    throw error;
  }
};

/**
 * Create an answer to respond to an offer
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @returns {Promise<RTCSessionDescriptionInit>}
 */
export const createAnswer = async (peerConnection) => {
  try {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  } catch (error) {
    console.error("Error creating answer:", error);
    throw error;
  }
};

/**
 * Set the remote description for a peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @param {RTCSessionDescriptionInit} description - The remote description
 */
export const setRemoteDescription = async (peerConnection, description) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
  } catch (error) {
    console.error("Error setting remote description:", error);
    throw error;
  }
};

/**
 * Add an ICE candidate to the peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @param {RTCIceCandidateInit} candidate - The ICE candidate
 */
export const addIceCandidate = async (peerConnection, candidate) => {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error("Error adding ICE candidate:", error);
    throw error;
  }
};

/**
 * Handle ending a call and cleaning up resources
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @param {MediaStream} localStream - The local media stream
 */
export const endCall = (peerConnection, localStream) => {
  // Stop all tracks in the local stream
  if (localStream) {
    localStream.getTracks().forEach(track => {
      track.stop();
    });
  }
  
  // Close and cleanup the peer connection
  if (peerConnection) {
    peerConnection.ontrack = null;
    peerConnection.onicecandidate = null;
    peerConnection.oniceconnectionstatechange = null;
    peerConnection.onsignalingstatechange = null;
    peerConnection.onicegatheringstatechange = null;
    peerConnection.onnegotiationneeded = null;
    peerConnection.close();
  }
};

