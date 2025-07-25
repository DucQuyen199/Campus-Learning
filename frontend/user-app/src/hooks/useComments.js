/*-----------------------------------------------------------------
* File: useComments.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import { useState, useCallback } from 'react';
import postService from '../services/postService';

/**
 * Custom hook for managing comments
 * @param {object} options - Configuration options
 * @param {Function} options.onUpdatePost - Callback when post comment count changes
 * @returns {object} Comments methods and state
 */
const useComments = ({ onUpdatePost } = {}) => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalComments: 0,
    totalPages: 0
  });

  /**
   * Fetch comments for a post
   * @param {number} postId - The ID of the post
   * @param {object} options - Fetch options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Number of comments per page
   * @param {number|null} options.parentId - Parent comment ID for nested comments
   */
  const fetchComments = useCallback(async (postId, options = {}) => {
    const { page = 1, limit = 10, parentId = null } = options;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await postService.getComments(postId, page, limit, parentId);
      setComments(result.comments || []);
      setPagination(result.pagination || {
        page,
        limit,
        totalComments: 0,
        totalPages: 0
      });
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add a new comment to a post
   * @param {number} postId - The ID of the post
   * @param {string} content - Comment content
   * @param {number|null} parentCommentId - Parent comment ID for replies
   */
  const addComment = useCallback(async (postId, content, parentCommentId = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (parentCommentId) {
        result = await postService.addReply(postId, parentCommentId, content);
      } else {
        result = await postService.addComment(postId, content);
      }
      
      // Add new comment to the list
      setComments(prevComments => [result.comment, ...prevComments]);
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        totalComments: prev.totalComments + 1,
        totalPages: Math.ceil((prev.totalComments + 1) / prev.limit)
      }));
      
      // Notify parent component about the comment count change
      if (onUpdatePost) {
        onUpdatePost(postId, 1);
      }
      
      return result.comment;
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onUpdatePost]);

  /**
   * Like or unlike a comment
   * @param {number} commentId - The ID of the comment
   */
  const likeComment = useCallback(async (commentId) => {
    try {
      await postService.toggleCommentLike(commentId);
      
      // Update comment in state
      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment.CommentID === commentId) {
            const newLikesCount = comment.IsLiked 
              ? comment.LikesCount - 1 
              : comment.LikesCount + 1;
            
            return {
              ...comment,
              IsLiked: !comment.IsLiked,
              LikesCount: newLikesCount
            };
          }
          return comment;
        })
      );
    } catch (err) {
      console.error('Error liking comment:', err);
      setError('Failed to like comment');
    }
  }, []);

  /**
   * Delete a comment
   * @param {number} commentId - The ID of the comment
   * @param {number} postId - The ID of the post
   */
  const deleteComment = useCallback(async (commentId, postId) => {
    try {
      await postService.deleteComment(commentId);
      
      // Remove comment from state
      setComments(prevComments => 
        prevComments.filter(comment => comment.CommentID !== commentId)
      );
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        totalComments: Math.max(0, prev.totalComments - 1),
        totalPages: Math.ceil(Math.max(0, prev.totalComments - 1) / prev.limit)
      }));
      
      // Notify parent component about the comment count change
      if (onUpdatePost && postId) {
        onUpdatePost(postId, -1);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  }, [onUpdatePost]);

  /**
   * Reset comments state
   */
  const resetComments = useCallback(() => {
    setComments([]);
    setIsLoading(false);
    setError(null);
    setPagination({
      page: 1,
      limit: 10,
      totalComments: 0,
      totalPages: 0
    });
  }, []);

  return {
    comments,
    isLoading,
    error,
    pagination,
    fetchComments,
    addComment,
    likeComment,
    deleteComment,
    resetComments
  };
};

export default useComments; 
