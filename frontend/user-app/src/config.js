/*-----------------------------------------------------------------
* File: config.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
// API configuration
export const API_URL = 'http://localhost:5001';

// Socket.IO configuration
export const SOCKET_URL = 'http://localhost:5001';

// Other app configuration
export const APP_CONFIG = {
  defaultAvatar: '/assets/default-avatar.png',
  maxFileUploadSize: 5 * 1024 * 1024, // 5MB
  supportedFileTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm'],
    audio: ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg']
  }
}; 
