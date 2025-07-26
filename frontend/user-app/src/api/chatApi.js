/*-----------------------------------------------------------------
* File: chatApi.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: Chat API functions for messaging functionality
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';
import { API_URL } from '../config';

// Create axios instance with default config
const chatApiClient = axios.create({
  baseURL: `${API_URL}/api/chat`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
chatApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
chatApiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const chatApi = {
  // Get all conversations for the current user
  getConversations: async (params = {}) => {
    try {
      const response = await chatApiClient.get('/conversations', { params });
      return response;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  },

  // Get messages for a specific conversation
  getMessages: async (conversationId, params = {}) => {
    try {
      const response = await chatApiClient.get(`/conversations/${conversationId}/messages`, { params });
      return response;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  // Send a message
  sendMessage: async (messageData) => {
    try {
      // Handle both conversation-specific and general message endpoints
      let endpoint = '/messages';
      if (messageData.conversationId) {
        endpoint = `/conversations/${messageData.conversationId}/messages`;
      }
      
      const response = await chatApiClient.post(endpoint, messageData);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      // Return a standardized error object instead of throwing
      return {
        success: false,
        message: error.message || 'Failed to send message'
      };
    }
  },

  // Create a new conversation
  createConversation: async (conversationData) => {
    try {
      const response = await chatApiClient.post('/conversations', conversationData);
      return response;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  // Search users
  searchUsers: async (query, params = {}) => {
    try {
      const response = await chatApiClient.get('/users/search', { 
        params: { query, ...params } 
      });
      return response;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  // Update/edit a message
  updateMessage: async (messageId, updateData) => {
    try {
      const response = await chatApiClient.put(`/messages/${messageId}`, updateData);
      return response;
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    try {
      const response = await chatApiClient.delete(`/messages/${messageId}`);
      return response;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Leave a conversation
  leaveConversation: async (conversationId) => {
    try {
      const response = await chatApiClient.post(`/conversations/${conversationId}/leave`);
      return response;
    } catch (error) {
      console.error('Error leaving conversation:', error);
      throw error;
    }
  },

  // Mute/unmute a conversation
  toggleMuteConversation: async (conversationId, muted) => {
    try {
      const response = await chatApiClient.post(`/conversations/${conversationId}/mute`, { muted });
      return response;
    } catch (error) {
      console.error('Error toggling mute conversation:', error);
      throw error;
    }
  },

  // Upload file/media for messages
  uploadMedia: async (file, type = 'image') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await chatApiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  },

  // Get conversation details
  getConversationDetails: async (conversationId) => {
    try {
      const response = await chatApiClient.get(`/conversations/${conversationId}`);
      return response;
    } catch (error) {
      console.error('Error getting conversation details:', error);
      throw error;
    }
  },

  // Add participants to group conversation
  addParticipants: async (conversationId, userIds) => {
    try {
      const response = await chatApiClient.post(`/conversations/${conversationId}/participants`, {
        participants: userIds
      });
      return response;
    } catch (error) {
      console.error('Error adding participants:', error);
      throw error;
    }
  },

  // Remove participant from group conversation
  removeParticipant: async (conversationId, userId) => {
    try {
      const response = await chatApiClient.delete(`/conversations/${conversationId}/participants/${userId}`);
      return response;
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  },

  // Update conversation settings
  updateConversation: async (conversationId, updateData) => {
    try {
      const response = await chatApiClient.put(`/conversations/${conversationId}`, updateData);
      return response;
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId, messageId) => {
    try {
      const response = await chatApiClient.post(`/conversations/${conversationId}/read`, {
        messageId
      });
      return response;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  // Upload files for chat
  uploadFiles: async (files, onUploadProgress) => {
    try {
      const formData = new FormData();
      
      // Add files to form data
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const response = await chatApiClient.post('/upload-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onUploadProgress
      });
      return response;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },

  // Send file message
  sendFileMessage: async (conversationId, file, caption = '', onUploadProgress) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await chatApiClient.post(`/conversations/${conversationId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onUploadProgress
      });
      return response;
    } catch (error) {
      console.error('Error sending file message:', error);
      throw error;
    }
  },

  // Get file info helper
  getFileIcon: (fileType, mimeType) => {
    if (fileType.startsWith('image')) return '🖼️';
    if (fileType.startsWith('video')) return '🎥';
    if (fileType.startsWith('audio')) return '🎵';
    if (fileType === 'document_word') return '📄';
    if (fileType === 'document_excel') return '📊';
    if (fileType === 'document_powerpoint') return '📊';
    if (fileType === 'document_pdf') return '📋';
    if (fileType === 'document_text') return '📝';
    if (fileType === 'archive') return '🗜️';
    return '📎';
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}; 
