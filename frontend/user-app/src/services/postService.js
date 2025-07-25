/*-----------------------------------------------------------------
* File: postService.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const postService = {
  // Create a new post
  createPost: async (postData) => {
    const response = await axios.post(`${API_URL}/posts`, postData);
    return response.data;
  },

  // Get all posts with pagination and filters
  getPosts: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...filters
    });
    const response = await axios.get(`${API_URL}/posts?${params}`);
    return response.data;
  },

  // Get a single post
  getPost: async (postId) => {
    const response = await axios.get(`${API_URL}/posts/${postId}`);
    return response.data;
  },
  
  // Get posts for a specific user
  getUserPosts: async (userId, page = 1, limit = 10) => {
    const params = new URLSearchParams({
      page,
      limit
    });
    const response = await axios.get(`${API_URL}/posts/user/${userId}?${params}`);
    return response.data;
  },

  // Update a post
  updatePost: async (postId, postData) => {
    const response = await axios.put(`${API_URL}/posts/${postId}`, postData);
    return response.data;
  },

  // Delete a post
  deletePost: async (postId) => {
    const response = await axios.delete(`${API_URL}/posts/${postId}`);
    return response.data;
  },

  // Like/Unlike a post
  toggleLike: async (postId) => {
    const response = await axios.post(`${API_URL}/posts/${postId}/like`);
    return response.data;
  },
  
  // Get comments for a post
  getComments: async (postId, page = 1, limit = 10, parentId = null) => {
    const params = new URLSearchParams({
      page,
      limit
    });
    
    if (parentId) {
      params.append('parentId', parentId);
    }
    
    const response = await axios.get(`${API_URL}/posts/${postId}/comments?${params}`);
    return response.data;
  },
  
  // Add a comment to a post
  addComment: async (postId, content) => {
    const response = await axios.post(`${API_URL}/posts/${postId}/comments`, { content });
    return response.data;
  },
  
  // Add a reply to a comment
  addReply: async (postId, parentCommentId, content) => {
    const response = await axios.post(`${API_URL}/posts/${postId}/comments`, { 
      content, 
      parentCommentId 
    });
    return response.data;
  },
  
  // Like/Unlike a comment
  toggleCommentLike: async (commentId) => {
    const response = await axios.post(`${API_URL}/posts/comments/${commentId}/like`);
    return response.data;
  },
  
  // Delete a comment
  deleteComment: async (commentId) => {
    const response = await axios.delete(`${API_URL}/posts/comments/${commentId}`);
    return response.data;
  },

  // Share a post
  sharePost: async (postId, shareData) => {
    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/share`, shareData);
      return response.data;
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  }
};

export default postService; 
