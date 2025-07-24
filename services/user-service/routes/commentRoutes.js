/*-----------------------------------------------------------------
* File: commentRoutes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Giả sử chúng ta đã có hoặc sẽ có commentController
// Nếu chưa có, tạm thời định nghĩa các hàm trực tiếp trong routes

// Lấy comment của bài đăng
router.get('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { pool } = require('../config/database');
    
    const query = `
      SELECT c.*, u.FullName, u.Image as UserImage,
             CASE WHEN cl.LikeID IS NOT NULL THEN 1 ELSE 0 END as IsLiked
      FROM Comments c
      JOIN Users u ON c.UserID = u.UserID
      LEFT JOIN CommentLikes cl ON c.CommentID = cl.CommentID AND cl.UserID = @currentUserId
      WHERE c.PostID = @postId AND c.IsDeleted = 0 AND c.DeletedAt IS NULL
      ORDER BY c.CreatedAt DESC
    `;
    
    const result = await pool.request()
      .input('postId', postId)
      .input('currentUserId', req.user.UserID)
      .query(query);
    
    res.json({
      success: true,
      comments: result.recordset
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy bình luận',
      error: error.message
    });
  }
});

// Thêm comment mới
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.UserID;
    const { pool } = require('../config/database');
    
    // Bắt đầu transaction
    const transaction = new pool.Transaction();
    await transaction.begin();
    
    try {
      // Thêm comment mới
      const insertQuery = `
        INSERT INTO Comments (PostID, UserID, Content, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.CommentID
        VALUES (@postId, @userId, @content, GETDATE(), GETDATE())
      `;
      
      const insertResult = await transaction.request()
        .input('postId', postId)
        .input('userId', userId)
        .input('content', content)
        .query(insertQuery);
      
      const commentId = insertResult.recordset[0].CommentID;
      
      // Cập nhật số lượng comment cho bài đăng
      const updatePostQuery = `
        UPDATE Posts
        SET CommentsCount = CommentsCount + 1,
            UpdatedAt = GETDATE()
        WHERE PostID = @postId
      `;
      
      await transaction.request()
        .input('postId', postId)
        .query(updatePostQuery);
      
      // Commit transaction
      await transaction.commit();
      
      // Lấy thông tin comment vừa tạo
      const getCommentQuery = `
        SELECT c.*, u.FullName, u.Image as UserImage, 0 as IsLiked
        FROM Comments c
        JOIN Users u ON c.UserID = u.UserID
        WHERE c.CommentID = @commentId
      `;
      
      const commentResult = await pool.request()
        .input('commentId', commentId)
        .query(getCommentQuery);
      
      res.status(201).json({
        success: true,
        message: 'Bình luận đã được thêm',
        comment: commentResult.recordset[0]
      });
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm bình luận',
      error: error.message
    });
  }
});

// Xóa comment
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.UserID;
    const { pool } = require('../config/database');
    
    // Bắt đầu transaction
    const transaction = new pool.Transaction();
    await transaction.begin();
    
    try {
      // Kiểm tra quyền xóa (người tạo comment hoặc người tạo bài đăng)
      const checkQuery = `
        SELECT c.PostID, c.UserID, p.UserID as PostOwnerID
        FROM Comments c
        JOIN Posts p ON c.PostID = p.PostID
        WHERE c.CommentID = @commentId
      `;
      
      const checkResult = await transaction.request()
        .input('commentId', commentId)
        .query(checkQuery);
      
      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bình luận không tồn tại'
        });
      }
      
      const comment = checkResult.recordset[0];
      const postId = comment.PostID;
      
      // Kiểm tra quyền xóa
      if (comment.UserID !== userId && comment.PostOwnerID !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa bình luận này'
        });
      }
      
      // Soft delete comment
      const deleteQuery = `
        UPDATE Comments
        SET IsDeleted = 1, DeletedAt = GETDATE()
        WHERE CommentID = @commentId
      `;
      
      await transaction.request()
        .input('commentId', commentId)
        .query(deleteQuery);
      
      // Cập nhật số lượng comment cho bài đăng
      const updatePostQuery = `
        UPDATE Posts
        SET CommentsCount = CommentsCount - 1,
            UpdatedAt = GETDATE()
        WHERE PostID = @postId AND CommentsCount > 0
      `;
      
      await transaction.request()
        .input('postId', postId)
        .query(updatePostQuery);
      
      // Commit transaction
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Bình luận đã được xóa'
      });
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bình luận',
      error: error.message
    });
  }
});

// Thích/bỏ thích comment
router.post('/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.UserID;
    const { pool } = require('../config/database');
    
    // Bắt đầu transaction
    const transaction = new pool.Transaction();
    await transaction.begin();
    
    try {
      // Kiểm tra xem đã thích comment chưa
      const checkQuery = `
        SELECT CommentLikeID 
        FROM CommentLikes 
        WHERE CommentID = @commentId AND UserID = @userId
      `;
      
      const checkResult = await transaction.request()
        .input('commentId', commentId)
        .input('userId', userId)
        .query(checkQuery);
      
      let action = '';
      
      if (checkResult.recordset.length === 0) {
        // Chưa thích, thêm like
        const insertQuery = `
          INSERT INTO CommentLikes (CommentID, UserID, CreatedAt)
          VALUES (@commentId, @userId, GETDATE())
        `;
        
        await transaction.request()
          .input('commentId', commentId)
          .input('userId', userId)
          .query(insertQuery);
        
        // Cập nhật số lượng like cho comment
        const updateCommentQuery = `
          UPDATE Comments
          SET LikesCount = LikesCount + 1
          WHERE CommentID = @commentId
        `;
        
        await transaction.request()
          .input('commentId', commentId)
          .query(updateCommentQuery);
        
        action = 'liked';
      } else {
        // Đã thích, bỏ like
        const deleteQuery = `
          DELETE FROM CommentLikes
          WHERE CommentID = @commentId AND UserID = @userId
        `;
        
        await transaction.request()
          .input('commentId', commentId)
          .input('userId', userId)
          .query(deleteQuery);
        
        // Cập nhật số lượng like cho comment
        const updateCommentQuery = `
          UPDATE Comments
          SET LikesCount = LikesCount - 1
          WHERE CommentID = @commentId AND LikesCount > 0
        `;
        
        await transaction.request()
          .input('commentId', commentId)
          .query(updateCommentQuery);
        
        action = 'unliked';
      }
      
      // Commit transaction
      await transaction.commit();
      
      res.json({
        success: true,
        message: `Bạn đã ${action === 'liked' ? 'thích' : 'bỏ thích'} bình luận`,
        action
      });
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thích/bỏ thích bình luận',
      error: error.message
    });
  }
});

module.exports = router; 
