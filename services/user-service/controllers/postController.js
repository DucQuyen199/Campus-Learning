const { pool, sql } = require('../config/db');
const Post = require('../models/Post');
const fs = require('fs');

// Create a new post
exports.createPost = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { content, type = 'regular', visibility = 'public', location } = req.body;
    const userId = req.user.UserID;
    const files = req.files;

    await transaction.begin();

    // Insert post với các trường khớp database
    const postResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .input('content', sql.NVarChar(sql.MAX), content)
      .input('type', sql.VarChar(20), type)
      .input('visibility', sql.VarChar(20), visibility)
      .input('location', sql.NVarChar(255), location)
      .query(`
        INSERT INTO Posts (
          UserID, Content, Type, Visibility, Location,
          CreatedAt, UpdatedAt, LikesCount, CommentsCount, SharesCount, ReportsCount
        )
        OUTPUT INSERTED.PostID
        VALUES (
          @userId, @content, @type, @visibility, @location,
          GETDATE(), GETDATE(), 0, 0, 0, 0
        )
      `);

    const postId = postResult.recordset[0].PostID;

    // Insert media files
    if (files && files.length > 0) {
      for (const file of files) {
        const isVideo = file.mimetype.startsWith('video/');
        const mediaType = isVideo ? 'video' : 'image';
        
        // Đảm bảo đường dẫn file được lưu dưới dạng chuẩn hóa
        // Bỏ "uploads/" ở đầu nếu có để tránh trùng lặp
        const mediaUrl = file.path.replace(/^uploads\//, '');
        
        await transaction.request()
          .input('postId', sql.BigInt, postId)
          .input('mediaUrl', sql.VarChar(255), mediaUrl)
          .input('mediaType', sql.VarChar(20), mediaType)
          .input('size', sql.Int, file.size)
          .input('width', sql.Int, null)
          .input('height', sql.Int, null)
          .input('duration', sql.Int, null)
          .query(`
            INSERT INTO PostMedia (
              PostID, MediaUrl, MediaType, Size,
              Width, Height, Duration, CreatedAt
            )
            VALUES (
              @postId, @mediaUrl, @mediaType, @size,
              @width, @height, @duration, GETDATE()
            )
          `);
      }
    }

    await transaction.commit();

    res.status(201).json({
      message: 'Đăng bài thành công',
      postId
    });

  } catch (error) {
    await transaction.rollback();
    // Xóa files nếu có lỗi
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    console.error('Create post error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi đăng bài',
      error: error.message
    });
  }
};

// Get all posts (with pagination and filters)
exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, visibility } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user?.UserID || null;

    let query = `
      SELECT 
        p.PostID,
        p.UserID,
        p.Content,
        p.Type,
        p.Visibility,
        p.Location,
        p.CreatedAt,
        p.UpdatedAt,
        p.LikesCount,
        p.CommentsCount,
        p.SharesCount,
        u.Username,
        u.FullName,
        u.Image as UserImage,
        CASE WHEN @userId IS NOT NULL AND EXISTS (
          SELECT 1 FROM PostLikes 
          WHERE PostID = p.PostID AND UserID = @userId
        ) THEN 1 ELSE 0 END as IsLiked
      FROM Posts p
      INNER JOIN Users u ON p.UserID = u.UserID
      WHERE p.DeletedAt IS NULL
    `;

    const params = [
      { name: 'userId', value: userId, type: sql.BigInt },
      { name: 'offset', value: offset, type: sql.Int },
      { name: 'limit', value: parseInt(limit), type: sql.Int }
    ];

    // Thêm điều kiện lọc nếu có
    if (type) {
      query += ` AND p.Type = @type`;
      params.push({ name: 'type', value: type, type: sql.VarChar(20) });
    }

    if (visibility) {
      query += ` AND p.Visibility = @visibility`;
      params.push({ name: 'visibility', value: visibility, type: sql.VarChar(20) });
    }

    // Thêm phân trang
    query += `
      ORDER BY p.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    // Tạo request với các params
    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    // Thực thi query chính
    const result = await request.query(query);

    // Lấy media cho mỗi post
    const posts = await Promise.all(result.recordset.map(async (post) => {
      const mediaResult = await pool.request()
        .input('postId', sql.BigInt, post.PostID)
        .query(`
          SELECT 
            MediaID,
            MediaUrl,
            MediaType,
            ThumbnailUrl,
            Size,
            Width,
            Height,
            Duration
          FROM PostMedia 
          WHERE PostID = @postId
        `);

      // Lấy tags cho post
      const tagsResult = await pool.request()
        .input('postId', sql.BigInt, post.PostID)
        .query(`
          SELECT t.TagID, t.Name
          FROM Tags t
          INNER JOIN PostTags pt ON t.TagID = pt.TagID
          WHERE pt.PostID = @postId
        `);
      
      return {
        ...post,
        media: mediaResult.recordset,
        tags: tagsResult.recordset
      };
    }));

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: posts.length
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi tải bài viết',
      error: error.message
    });
  }
};

// Get single post
exports.getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.UserID || null;

    const result = await pool.request()
      .input('postId', sql.BigInt, id)
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT 
          p.PostID,
          p.UserID,
          p.Content,
          p.Type,
          p.Visibility,
          p.Location,
          p.CreatedAt,
          p.UpdatedAt,
          p.LikesCount,
          p.CommentsCount,
          p.SharesCount,
          u.Username,
          u.FullName,
          u.Image as UserImage,
          CASE WHEN @userId IS NOT NULL AND EXISTS (
            SELECT 1 FROM PostLikes 
            WHERE PostID = p.PostID AND UserID = @userId
          ) THEN 1 ELSE 0 END as IsLiked
        FROM Posts p
        INNER JOIN Users u ON p.UserID = u.UserID
        WHERE p.PostID = @postId AND p.DeletedAt IS NULL
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }

    const post = result.recordset[0];

    // Lấy media của post
    const mediaResult = await pool.request()
      .input('postId', sql.BigInt, id)
      .query(`
        SELECT * FROM PostMedia 
        WHERE PostID = @postId
      `);

    // Lấy tags của post
    const tagsResult = await pool.request()
      .input('postId', sql.BigInt, id)
      .query(`
        SELECT t.TagID, t.Name
        FROM Tags t
        INNER JOIN PostTags pt ON t.TagID = pt.TagID
        WHERE pt.PostID = @postId
      `);

    res.json({
      ...post,
      media: mediaResult.recordset,
      tags: tagsResult.recordset
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi tải bài viết',
      error: error.message
    });
  }
};

// Update a post
exports.updatePost = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { id } = req.params;
    const { content, visibility, location } = req.body;
    const userId = req.user.UserID;
    
    await transaction.begin();
    
    // Check if post exists and belongs to user
    const checkResult = await transaction.request()
      .input('postId', sql.BigInt, id)
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT 1 FROM Posts
        WHERE PostID = @postId AND UserID = @userId AND DeletedAt IS NULL
      `);
      
    if (checkResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy bài viết hoặc không có quyền chỉnh sửa' });
    }
    
    // Update the post
    await transaction.request()
      .input('postId', sql.BigInt, id)
      .input('content', sql.NVarChar(sql.MAX), content)
      .input('visibility', sql.VarChar(20), visibility)
      .input('location', sql.NVarChar(255), location)
      .query(`
        UPDATE Posts
        SET Content = @content,
            Visibility = @visibility,
            Location = @location,
            UpdatedAt = GETDATE()
        WHERE PostID = @postId AND UserID = @userId
      `);
      
    await transaction.commit();
    
    res.json({ message: 'Cập nhật bài viết thành công' });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Update post error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi cập nhật bài viết',
      error: error.message
    });
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { id } = req.params;
    const userId = req.user.UserID;
    
    await transaction.begin();
    
    // Check if post exists and belongs to user
    const checkResult = await transaction.request()
      .input('postId', sql.BigInt, id)
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT 1 FROM Posts
        WHERE PostID = @postId AND UserID = @userId AND DeletedAt IS NULL
      `);
      
    if (checkResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy bài viết hoặc không có quyền xóa' });
    }
    
    // Soft delete the post
    await transaction.request()
      .input('postId', sql.BigInt, id)
      .query(`
        UPDATE Posts
        SET DeletedAt = GETDATE()
        WHERE PostID = @postId
      `);
      
    await transaction.commit();
    
    res.json({ message: 'Xóa bài viết thành công' });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Delete post error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi xóa bài viết',
      error: error.message
    });
  }
};

// Like/Unlike a post
exports.likePost = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { postId } = req.params;
    const userId = req.user.UserID;

    await transaction.begin();

    // Check if already liked
    const checkResult = await transaction.request()
      .input('postId', sql.BigInt, postId)
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT 1 FROM PostLikes
        WHERE PostID = @postId AND UserID = @userId
      `);

    if (checkResult.recordset.length > 0) {
      // Unlike
      await transaction.request()
        .input('postId', sql.BigInt, postId)
        .input('userId', sql.BigInt, userId)
        .query(`
          DELETE FROM PostLikes
          WHERE PostID = @postId AND UserID = @userId;

          UPDATE Posts
          SET LikesCount = LikesCount - 1
          WHERE PostID = @postId;
        `);
    } else {
      // Like
      await transaction.request()
        .input('postId', sql.BigInt, postId)
        .input('userId', sql.BigInt, userId)
        .query(`
          INSERT INTO PostLikes (PostID, UserID)
          VALUES (@postId, @userId);

          UPDATE Posts
          SET LikesCount = LikesCount + 1
          WHERE PostID = @postId;
        `);
      
      // Get post owner to create notification
      const postOwnerResult = await transaction.request()
        .input('postId', sql.BigInt, postId)
        .query(`
          SELECT UserID, Content FROM Posts
          WHERE PostID = @postId
        `);
      
      if (postOwnerResult.recordset.length > 0) {
        const postOwnerId = postOwnerResult.recordset[0].UserID;
        const postContent = postOwnerResult.recordset[0].Content;
        const shortContent = postContent.length > 30 ? postContent.substring(0, 30) + '...' : postContent;
        
        // Get user info for notification
        const userResult = await transaction.request()
          .input('userId', sql.BigInt, userId)
          .query(`
            SELECT FullName FROM Users
            WHERE UserID = @userId
          `);
        
        const userName = userResult.recordset.length > 0 ? userResult.recordset[0].FullName : 'Người dùng';
        
        // Don't notify if user likes their own post
        if (postOwnerId !== userId) {
          // Create notification for post owner
          await transaction.request()
            .input('ownerId', sql.BigInt, postOwnerId)
            .input('type', sql.VarChar(50), 'reaction')
            .input('title', sql.NVarChar(255), 'Có người đã thích bài viết của bạn')
            .input('content', sql.NVarChar(sql.MAX), `${userName} đã thích bài viết "${shortContent}" của bạn`)
            .input('relatedId', sql.BigInt, postId)
            .input('relatedType', sql.VarChar(50), 'Posts')
            .query(`
              INSERT INTO Notifications (UserID, Type, Title, Content, RelatedID, RelatedType, IsRead, CreatedAt)
              VALUES (@ownerId, @type, @title, @content, @relatedId, @relatedType, 0, GETDATE())
            `);
        }
      }
    }

    await transaction.commit();
    res.json({ message: 'Thành công' });

  } catch (error) {
    await transaction.rollback();
    console.error('Like post error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra',
      error: error.message
    });
  }
};

// Get posts by user ID
exports.getPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 5 } = req.query;
    const offset = (page - 1) * limit;
    const currentUserId = req.user?.UserID || null;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    let query = `
      SELECT 
        p.PostID,
        p.UserID,
        p.Content,
        p.Type,
        p.Visibility,
        p.Location,
        p.CreatedAt,
        p.UpdatedAt,
        p.LikesCount,
        p.CommentsCount,
        p.SharesCount,
        u.Username,
        u.FullName,
        u.Image as UserImage,
        CASE WHEN @currentUserId IS NOT NULL AND EXISTS (
          SELECT 1 FROM PostLikes 
          WHERE PostID = p.PostID AND UserID = @currentUserId
        ) THEN 1 ELSE 0 END as IsLiked
      FROM Posts p
      INNER JOIN Users u ON p.UserID = u.UserID
      WHERE p.DeletedAt IS NULL AND p.UserID = @userId
    `;

    const params = [
      { name: 'userId', value: userId, type: sql.BigInt },
      { name: 'currentUserId', value: currentUserId, type: sql.BigInt },
      { name: 'offset', value: offset, type: sql.Int },
      { name: 'limit', value: parseInt(limit), type: sql.Int }
    ];

    // Add pagination
    query += `
      ORDER BY p.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    // Create request with params
    const request = pool.request();
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });

    // Execute main query
    const result = await request.query(query);

    // Get total count
    const countResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT COUNT(*) as total
        FROM Posts
        WHERE DeletedAt IS NULL AND UserID = @userId
      `);
    
    const total = countResult.recordset[0].total;

    // Get media for each post
    const posts = await Promise.all(result.recordset.map(async (post) => {
      const mediaResult = await pool.request()
        .input('postId', sql.BigInt, post.PostID)
        .query(`
          SELECT 
            MediaID,
            MediaUrl,
            MediaType,
            ThumbnailUrl,
            Size,
            Width,
            Height,
            Duration
          FROM PostMedia 
          WHERE PostID = @postId
        `);

      // Get tags for post
      const tagsResult = await pool.request()
        .input('postId', sql.BigInt, post.PostID)
        .query(`
          SELECT t.TagID, t.Name
          FROM Tags t
          INNER JOIN PostTags pt ON t.TagID = pt.TagID
          WHERE pt.PostID = @postId
        `);
      
      return {
        ...post,
        media: mediaResult.recordset,
        tags: tagsResult.recordset
      };
    }));

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get posts by user ID error:', error);
    res.status(500).json({
      message: 'An error occurred while fetching user posts',
      error: error.message
    });
  }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.UserID;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Nội dung bình luận không được để trống' });
    }
    
    await transaction.begin();
    
    // Check if post exists
    const postCheck = await transaction.request()
      .input('postId', sql.BigInt, postId)
      .query(`
        SELECT UserID, Content FROM Posts
        WHERE PostID = @postId AND DeletedAt IS NULL
      `);
      
    if (postCheck.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }
    
    const postOwnerId = postCheck.recordset[0].UserID;
    const postContent = postCheck.recordset[0].Content;
    const shortPostContent = postContent.length > 30 ? postContent.substring(0, 30) + '...' : postContent;
    
    // Check parent comment if provided
    if (parentCommentId) {
      const parentCheck = await transaction.request()
        .input('commentId', sql.BigInt, parentCommentId)
        .input('postId', sql.BigInt, postId)
        .query(`
          SELECT c.UserID, u.FullName FROM Comments c
          JOIN Users u ON c.UserID = u.UserID
          WHERE c.CommentID = @commentId AND c.PostID = @postId AND c.DeletedAt IS NULL
        `);
        
      if (parentCheck.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Không tìm thấy bình luận cha' });
      }
      
      // Parent comment owner info
      const parentCommentOwnerId = parentCheck.recordset[0].UserID;
      const parentCommentOwnerName = parentCheck.recordset[0].FullName;
    }
    
    // Insert comment
    const result = await transaction.request()
      .input('postId', sql.BigInt, postId)
      .input('userId', sql.BigInt, userId)
      .input('parentCommentId', parentCommentId ? sql.BigInt : sql.Bit, parentCommentId || null)
      .input('content', sql.NVarChar(sql.MAX), content)
      .query(`
        INSERT INTO Comments (
          PostID, UserID, ParentCommentID, Content,
          LikesCount, RepliesCount, CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.CommentID
        VALUES (
          @postId, @userId, @parentCommentId, @content,
          0, 0, GETDATE(), GETDATE()
        )
      `);
      
    const commentId = result.recordset[0].CommentID;
    
    // Update post comment count
    await transaction.request()
      .input('postId', sql.BigInt, postId)
      .query(`
        UPDATE Posts
        SET CommentsCount = CommentsCount + 1
        WHERE PostID = @postId
      `);
      
    // Update parent comment replies count if applicable
    if (parentCommentId) {
      await transaction.request()
        .input('parentCommentId', sql.BigInt, parentCommentId)
        .query(`
          UPDATE Comments
          SET RepliesCount = RepliesCount + 1
          WHERE CommentID = @parentCommentId
        `);
    }
    
    // Get user info for notifications
    const userResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT FullName FROM Users
        WHERE UserID = @userId
      `);
    
    const userName = userResult.recordset[0].FullName;
    
    // Create notification for post owner if commenter is not the post owner
    if (postOwnerId !== userId) {
      await transaction.request()
        .input('ownerId', sql.BigInt, postOwnerId)
        .input('type', sql.VarChar(50), 'comment')
        .input('title', sql.NVarChar(255), 'Có người đã bình luận bài viết của bạn')
        .input('content', sql.NVarChar(sql.MAX), `${userName} đã bình luận bài viết "${shortPostContent}" của bạn`)
        .input('relatedId', sql.BigInt, postId)
        .input('relatedType', sql.VarChar(50), 'Posts')
        .query(`
          INSERT INTO Notifications (UserID, Type, Title, Content, RelatedID, RelatedType, IsRead, CreatedAt)
          VALUES (@ownerId, @type, @title, @content, @relatedId, @relatedType, 0, GETDATE())
        `);
    }
    
    // Create notification for parent comment owner if this is a reply
    if (parentCommentId) {
      const parentCommentResult = await transaction.request()
        .input('commentId', sql.BigInt, parentCommentId)
        .query(`
          SELECT c.UserID, u.FullName FROM Comments c
          JOIN Users u ON c.UserID = u.UserID 
          WHERE c.CommentID = @commentId
        `);
      
      if (parentCommentResult.recordset.length > 0) {
        const parentCommentOwnerId = parentCommentResult.recordset[0].UserID;
        
        // Don't notify if user replies to their own comment
        if (parentCommentOwnerId !== userId) {
          await transaction.request()
            .input('ownerId', sql.BigInt, parentCommentOwnerId)
            .input('type', sql.VarChar(50), 'reply')
            .input('title', sql.NVarChar(255), 'Có người đã phản hồi bình luận của bạn')
            .input('content', sql.NVarChar(sql.MAX), `${userName} đã phản hồi bình luận của bạn trong bài viết "${shortPostContent}"`)
            .input('relatedId', sql.BigInt, commentId)
            .input('relatedType', sql.VarChar(50), 'Comments')
            .query(`
              INSERT INTO Notifications (UserID, Type, Title, Content, RelatedID, RelatedType, IsRead, CreatedAt)
              VALUES (@ownerId, @type, @title, @content, @relatedId, @relatedType, 0, GETDATE())
            `);
        }
      }
    }
    
    // Get the inserted comment with user info
    const commentResult = await transaction.request()
      .input('commentId', sql.BigInt, commentId)
      .query(`
        SELECT 
          c.CommentID,
          c.PostID,
          c.UserID,
          c.ParentCommentID,
          c.Content,
          c.LikesCount,
          c.RepliesCount,
          c.CreatedAt,
          c.UpdatedAt,
          c.IsEdited,
          u.Username,
          u.FullName,
          u.Image as UserImage
        FROM Comments c
        INNER JOIN Users u ON c.UserID = u.UserID
        WHERE c.CommentID = @commentId
      `);
      
    await transaction.commit();
    
    res.status(201).json({
      message: 'Thêm bình luận thành công',
      comment: commentResult.recordset[0]
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Add comment error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi thêm bình luận',
      error: error.message
    });
  }
};

// Get comments for a post
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10, parentId = null } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user?.UserID || null;
    
    // Validate postId
    if (!postId) {
      return res.status(400).json({ message: 'ID bài viết không hợp lệ' });
    }
    
    // Check if post exists
    const postCheck = await pool.request()
      .input('postId', sql.BigInt, postId)
      .query(`
        SELECT 1 FROM Posts
        WHERE PostID = @postId AND DeletedAt IS NULL
      `);
      
    if (postCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    }
    
    // Build query based on whether we want root comments or replies
    let whereClause;
    if (parentId === null) {
      whereClause = `c.ParentCommentID IS NULL`;
    } else {
      whereClause = `c.ParentCommentID = @parentId`;
    }
    
    const query = `
      SELECT 
        c.CommentID,
        c.PostID,
        c.UserID,
        c.ParentCommentID,
        c.Content,
        c.LikesCount,
        c.RepliesCount,
        c.CreatedAt,
        c.UpdatedAt,
        c.IsEdited,
        u.Username,
        u.FullName,
        u.Image as UserImage,
        CASE WHEN @userId IS NOT NULL AND EXISTS (
          SELECT 1 FROM CommentLikes 
          WHERE CommentID = c.CommentID AND UserID = @userId
        ) THEN 1 ELSE 0 END as IsLiked,
        (
          SELECT COUNT(*) FROM Comments 
          WHERE PostID = @postId AND DeletedAt IS NULL
        ) as TotalCount
      FROM Comments c
      INNER JOIN Users u ON c.UserID = u.UserID
      WHERE c.PostID = @postId AND ${whereClause} AND c.DeletedAt IS NULL
      ORDER BY c.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    const request = pool.request()
      .input('postId', sql.BigInt, postId)
      .input('userId', sql.BigInt, userId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    
    // Add parentId param if getting replies
    if (parentId !== null) {
      request.input('parentId', sql.BigInt, parentId);
    }
    
    const result = await request.query(query);
    
    // Get total count
    const totalCount = result.recordset.length > 0 ? result.recordset[0].TotalCount : 0;
    
    // Format timestamps
    const comments = result.recordset.map(comment => ({
      ...comment,
      CreatedAt: comment.CreatedAt.toISOString(),
      UpdatedAt: comment.UpdatedAt ? comment.UpdatedAt.toISOString() : null,
      TotalCount: undefined // Remove from individual comment objects
    }));
    
    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalComments: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi tải bình luận',
      error: error.message
    });
  }
};

// Like/Unlike a comment
exports.likeComment = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { commentId } = req.params;
    const userId = req.user.UserID;
    
    await transaction.begin();
    
    // Check if comment exists
    const commentCheck = await transaction.request()
      .input('commentId', sql.BigInt, commentId)
      .query(`
        SELECT c.CommentID, c.PostID, c.UserID, c.Content, p.Content as PostContent 
        FROM Comments c
        JOIN Posts p ON c.PostID = p.PostID
        WHERE c.CommentID = @commentId AND c.DeletedAt IS NULL
      `);
      
    if (commentCheck.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy bình luận' });
    }
    
    const comment = commentCheck.recordset[0];
    const commentOwnerId = comment.UserID;
    const commentContent = comment.Content;
    const shortCommentContent = commentContent.length > 30 ? commentContent.substring(0, 30) + '...' : commentContent;
    const postContent = comment.PostContent;
    const shortPostContent = postContent.length > 30 ? postContent.substring(0, 30) + '...' : postContent;
    
    // Check if already liked
    const likeCheck = await transaction.request()
      .input('commentId', sql.BigInt, commentId)
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT 1 FROM CommentLikes
        WHERE CommentID = @commentId AND UserID = @userId
      `);
      
    if (likeCheck.recordset.length > 0) {
      // Unlike
      await transaction.request()
        .input('commentId', sql.BigInt, commentId)
        .input('userId', sql.BigInt, userId)
        .query(`
          DELETE FROM CommentLikes
          WHERE CommentID = @commentId AND UserID = @userId;
          
          UPDATE Comments
          SET LikesCount = LikesCount - 1
          WHERE CommentID = @commentId;
        `);
    } else {
      // Like
      await transaction.request()
        .input('commentId', sql.BigInt, commentId)
        .input('userId', sql.BigInt, userId)
        .query(`
          INSERT INTO CommentLikes (CommentID, UserID)
          VALUES (@commentId, @userId);
          
          UPDATE Comments
          SET LikesCount = LikesCount + 1
          WHERE CommentID = @commentId;
        `);
      
      // Get user info for notification
      const userResult = await transaction.request()
        .input('userId', sql.BigInt, userId)
        .query(`
          SELECT FullName FROM Users
          WHERE UserID = @userId
        `);
      
      const userName = userResult.recordset.length > 0 ? userResult.recordset[0].FullName : 'Người dùng';
      
      // Don't notify if user likes their own comment
      if (commentOwnerId !== userId) {
        // Create notification for comment owner
        await transaction.request()
          .input('ownerId', sql.BigInt, commentOwnerId)
          .input('type', sql.VarChar(50), 'reaction')
          .input('title', sql.NVarChar(255), 'Có người đã thích bình luận của bạn')
          .input('content', sql.NVarChar(sql.MAX), `${userName} đã thích bình luận "${shortCommentContent}" của bạn trong bài viết "${shortPostContent}"`)
          .input('relatedId', sql.BigInt, commentId)
          .input('relatedType', sql.VarChar(50), 'Comments')
          .query(`
            INSERT INTO Notifications (UserID, Type, Title, Content, RelatedID, RelatedType, IsRead, CreatedAt)
            VALUES (@ownerId, @type, @title, @content, @relatedId, @relatedType, 0, GETDATE())
          `);
      }
    }
    
    await transaction.commit();
    
    res.json({ message: 'Thành công' });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Like comment error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra',
      error: error.message
    });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { commentId } = req.params;
    const userId = req.user.UserID;
    
    await transaction.begin();
    
    // Check if comment exists and belongs to user
    const comment = await transaction.request()
      .input('commentId', sql.BigInt, commentId)
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT PostID, ParentCommentID FROM Comments
        WHERE CommentID = @commentId AND UserID = @userId AND DeletedAt IS NULL
      `);
      
    if (comment.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ 
        message: 'Không tìm thấy bình luận hoặc bạn không có quyền xóa' 
      });
    }
    
    const { PostID, ParentCommentID } = comment.recordset[0];
    
    // Soft delete the comment
    await transaction.request()
      .input('commentId', sql.BigInt, commentId)
      .query(`
        UPDATE Comments
        SET DeletedAt = GETDATE(), IsDeleted = 1
        WHERE CommentID = @commentId
      `);
    
    // Update post comment count
    await transaction.request()
      .input('postId', sql.BigInt, PostID)
      .query(`
        UPDATE Posts
        SET CommentsCount = CommentsCount - 1
        WHERE PostID = @postId
      `);
    
    // Update parent comment replies count if applicable
    if (ParentCommentID) {
      await transaction.request()
        .input('parentCommentId', sql.BigInt, ParentCommentID)
        .query(`
          UPDATE Comments
          SET RepliesCount = RepliesCount - 1
          WHERE CommentID = @parentCommentId
        `);
    }
    
    await transaction.commit();
    
    res.json({ message: 'Xóa bình luận thành công' });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Delete comment error:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi xóa bình luận',
      error: error.message
    });
  }
};

// Share a post
exports.sharePost = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { postId } = req.params;
    const { shareType = 'link', sharePlatform } = req.body;
    const userId = req.user.UserID;

    await transaction.begin();

    // Check if post exists
    const postResult = await transaction.request()
      .input('postId', sql.BigInt, postId)
      .query(`
        SELECT PostID, UserID, Content, Visibility
        FROM Posts
        WHERE PostID = @postId AND DeletedAt IS NULL
      `);

    if (postResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Bài viết không tồn tại hoặc đã bị xóa' 
      });
    }

    const post = postResult.recordset[0];

    // Check if post is visible to the user
    if (post.Visibility === 'private' && post.UserID !== userId) {
      await transaction.rollback();
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền chia sẻ bài viết này' 
      });
    }

    // Record the share
    await transaction.request()
      .input('postId', sql.BigInt, postId)
      .input('userId', sql.BigInt, userId)
      .input('shareType', sql.VarChar(20), shareType)
      .input('sharePlatform', sql.VarChar(50), sharePlatform)
      .query(`
        INSERT INTO PostShares (
          PostID, UserID, ShareType, SharePlatform, CreatedAt
        )
        VALUES (
          @postId, @userId, @shareType, @sharePlatform, GETDATE()
        )
      `);

    // Update the share count in the Posts table
    await transaction.request()
      .input('postId', sql.BigInt, postId)
      .query(`
        UPDATE Posts
        SET SharesCount = SharesCount + 1,
            UpdatedAt = GETDATE()
        WHERE PostID = @postId
      `);

    await transaction.commit();

    // Return success response with share data
    res.status(200).json({
      success: true,
      message: 'Chia sẻ bài viết thành công',
      data: {
        postId,
        shareType,
        sharePlatform,
        shareCount: post.SharesCount + 1
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Share post error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi chia sẻ bài viết',
      error: error.message
    });
  }
}; 