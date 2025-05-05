const { pool } = require('../config/db');
const sql = require('mssql');
const db = require('../models');
const { Op, Sequelize } = require('sequelize');
const Friendship = db.Friendship;
const User = db.User;
const sequelize = db.sequelize; // Import sequelize instance

// Get all friendships for the current user
exports.getAllFriendships = async (req, res) => {
  console.log('getAllFriendships called');
  console.log('User object:', req.user);
  
  try {
    const currentUserId = req.user.userId;

    // Query all friendships directly from the database
    const result = await pool.request()
      .input('currentUserId', sql.BigInt, currentUserId)
      .query(`
        -- Get accepted friendships (friends)
        SELECT 
          f.FriendshipID, 
          f.UserID as RequesterID, 
          f.FriendID as AddresseeID, 
          f.Status,
          f.RequestedAt as CreatedAt,
          f.UpdatedAt,
          u.UserID,
          u.Username,
          u.FullName,
          u.Image,
          u.Status as UserStatus,
          u.School
        FROM Friendships f
        JOIN Users u ON (
          CASE
            WHEN f.UserID = @currentUserId THEN f.FriendID
            ELSE f.UserID
          END = u.UserID
        )
        WHERE (f.UserID = @currentUserId OR f.FriendID = @currentUserId)
        AND f.Status = 'accepted'
        
        UNION ALL
        
        -- Get pending received requests
        SELECT 
          f.FriendshipID, 
          f.UserID as RequesterID, 
          f.FriendID as AddresseeID, 
          f.Status,
          f.RequestedAt as CreatedAt,
          f.UpdatedAt,
          u.UserID,
          u.Username,
          u.FullName,
          u.Image,
          u.Status as UserStatus,
          u.School
        FROM Friendships f
        JOIN Users u ON f.UserID = u.UserID
        WHERE f.FriendID = @currentUserId
        AND f.Status = 'pending'
        
        UNION ALL
        
        -- Get pending sent requests
        SELECT 
          f.FriendshipID, 
          f.UserID as RequesterID, 
          f.FriendID as AddresseeID, 
          f.Status,
          f.RequestedAt as CreatedAt,
          f.UpdatedAt,
          u.UserID,
          u.Username,
          u.FullName,
          u.Image,
          u.Status as UserStatus,
          u.School
        FROM Friendships f
        JOIN Users u ON f.FriendID = u.UserID
        WHERE f.UserID = @currentUserId
        AND f.Status = 'pending'
      `);

    // Process the results
    const records = result.recordset;
    const friends = [];
    const pendingRequests = [];
    const sentRequests = [];

    records.forEach(record => {
      const userData = {
        UserID: record.UserID,
        Username: record.Username,
        FullName: record.FullName,
        Image: record.Image,
        Status: record.UserStatus,
        School: record.School,
        FriendshipID: record.FriendshipID,
        Status: record.Status,
        RequesterID: record.RequesterID,
        AddresseeID: record.AddresseeID,
        CreatedAt: record.CreatedAt,
        UpdatedAt: record.UpdatedAt
      };

      if (record.Status === 'accepted') {
        friends.push(userData);
      } else if (record.Status === 'pending' && record.FriendID === currentUserId) {
        pendingRequests.push(userData);
      } else if (record.Status === 'pending' && record.UserID === currentUserId) {
        sentRequests.push(userData);
      }
    });

    res.json({ 
      friends, 
      pendingRequests, 
      sentRequests 
    });
  } catch (error) {
    console.error('Error getting all friendships:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi lấy danh sách bạn bè',
      error: error.message
    });
  }
};

// Get friendships for a specific user
exports.getUserFriendships = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    if (!userId) {
      return res.status(400).json({
        message: 'ID người dùng không hợp lệ'
      });
    }

    // Get accepted friendships
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('currentUserId', sql.BigInt, currentUserId)
      .query(`
        SELECT 
          f.FriendshipID,
          f.UserID as RequesterID,
          f.FriendID as AddresseeID,
          f.Status,
          f.RequestedAt as CreatedAt,
          f.UpdatedAt,
          CASE
            WHEN f.UserID = @userId THEN f.FriendID
            ELSE f.UserID
          END as FriendID,
          u.Username as FriendUsername,
          u.FullName as FriendFullName,
          u.Image as FriendProfilePicture,
          u.Status as FriendStatus,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM Friendships 
              WHERE ((UserID = @currentUserId AND FriendID = u.UserID) 
                 OR (UserID = u.UserID AND FriendID = @currentUserId))
              AND Status = 'accepted'
            ) THEN 1
            ELSE 0
          END as IsAlsoFriendWithCurrentUser
        FROM Friendships f
        JOIN Users u ON (
          CASE
            WHEN f.UserID = @userId THEN f.FriendID
            ELSE f.UserID
          END = u.UserID
        )
        WHERE (f.UserID = @userId OR f.FriendID = @userId)
        AND f.Status = 'accepted'
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting user friendships:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi lấy danh sách bạn bè',
      error: error.message
    });
  }
};

// Get friendship status with a specific user
exports.getFriendshipStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    if (!userId || userId == currentUserId) {
      return res.status(400).json({
        message: 'ID người dùng không hợp lệ'
      });
    }

    // Check friendship status
    const result = await pool.request()
      .input('currentUserId', sql.BigInt, currentUserId)
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT 
          FriendshipID,
          UserID,
          FriendID,
          Status,
          RequestedAt,
          UpdatedAt
        FROM Friendships
        WHERE ((UserID = @currentUserId AND FriendID = @userId)
            OR (UserID = @userId AND FriendID = @currentUserId))
      `);

    if (result.recordset.length === 0) {
      return res.json({
        status: 'NOT_FRIENDS',
        friendship: null
      });
    }

    const friendship = result.recordset[0];
    let status = friendship.Status;

    // If status is pending, determine if current user sent or received the request
    if (status === 'pending') {
      status = friendship.UserID.toString() === currentUserId.toString() 
        ? 'PENDING_SENT' 
        : 'PENDING_RECEIVED';
    }

    res.json({
      status,
      friendship
    });
  } catch (error) {
    console.error('Error getting friendship status:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi kiểm tra trạng thái kết bạn',
      error: error.message
    });
  }
};

// Send a friend request
exports.sendFriendRequest = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { addresseeId } = req.body;
    const requesterId = req.user.userId;

    if (!addresseeId) {
      return res.status(400).json({
        message: 'ID người nhận không hợp lệ'
      });
    }

    if (requesterId == addresseeId) {
      return res.status(400).json({
        message: 'Không thể gửi yêu cầu kết bạn cho chính mình'
      });
    }

    await transaction.begin();

    // Check if addressee exists
    const userCheckResult = await transaction.request()
      .input('userId', sql.BigInt, addresseeId)
      .query(`
        SELECT UserID FROM Users 
        WHERE UserID = @userId AND DeletedAt IS NULL
      `);

    if (userCheckResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Không tìm thấy người dùng'
      });
    }

    // Check existing friendship
    const checkResult = await transaction.request()
      .input('userId', sql.BigInt, requesterId)
      .input('friendId', sql.BigInt, addresseeId)
      .query(`
        SELECT FriendshipID, Status FROM Friendships
        WHERE ((UserID = @userId AND FriendID = @friendId)
            OR (UserID = @friendId AND FriendID = @userId))
      `);

    if (checkResult.recordset.length > 0) {
      const friendship = checkResult.recordset[0];
      await transaction.rollback();
      
      if (friendship.Status === 'pending') {
        return res.status(400).json({
          message: 'Đã tồn tại yêu cầu kết bạn'
        });
      } else if (friendship.Status === 'accepted') {
        return res.status(400).json({
          message: 'Đã là bạn bè'
        });
      } else {
        return res.status(400).json({
          message: 'Không thể gửi yêu cầu kết bạn'
        });
      }
    }

    // Create friend request
    const result = await transaction.request()
      .input('userId', sql.BigInt, requesterId)
      .input('friendId', sql.BigInt, addresseeId)
      .query(`
        INSERT INTO Friendships (UserID, FriendID, Status, RequestedAt, UpdatedAt)
        OUTPUT INSERTED.*
        VALUES (@userId, @friendId, 'pending', GETDATE(), GETDATE())
      `);

    await transaction.commit();

    res.status(201).json({
      message: 'Đã gửi yêu cầu kết bạn',
      friendship: result.recordset[0]
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error sending friend request:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi gửi yêu cầu kết bạn',
      error: error.message
    });
  }
};

// Accept a friend request
exports.acceptFriendRequest = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    await transaction.begin();

    // Check existing friendship
    const checkResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .input('currentUserId', sql.BigInt, currentUserId)
      .query(`
        SELECT FriendshipID, Status FROM Friendships
        WHERE UserID = @userId AND FriendID = @currentUserId
        AND Status = 'pending'
      `);

    if (checkResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Không tìm thấy yêu cầu kết bạn'
      });
    }

    // Accept friend request
    const result = await transaction.request()
      .input('friendshipId', sql.BigInt, checkResult.recordset[0].FriendshipID)
      .query(`
        UPDATE Friendships
        SET Status = 'accepted', UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE FriendshipID = @friendshipId
      `);

    await transaction.commit();

    res.json({
      message: 'Đã chấp nhận yêu cầu kết bạn',
      friendship: result.recordset[0]
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error accepting friend request:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi chấp nhận yêu cầu kết bạn',
      error: error.message
    });
  }
};

// Reject a friend request
exports.rejectFriendRequest = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    await transaction.begin();

    // Check existing friendship
    const checkResult = await transaction.request()
      .input('userId', sql.BigInt, userId)
      .input('currentUserId', sql.BigInt, currentUserId)
      .query(`
        SELECT FriendshipID FROM Friendships
        WHERE UserID = @userId AND FriendID = @currentUserId
        AND Status = 'pending'
      `);

    if (checkResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Không tìm thấy yêu cầu kết bạn'
      });
    }

    // Reject friend request
    await transaction.request()
      .input('friendshipId', sql.BigInt, checkResult.recordset[0].FriendshipID)
      .query(`
        UPDATE Friendships
        SET Status = 'rejected', UpdatedAt = GETDATE()
        WHERE FriendshipID = @friendshipId
      `);

    await transaction.commit();

    res.json({
      message: 'Đã từ chối yêu cầu kết bạn'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error rejecting friend request:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi từ chối yêu cầu kết bạn',
      error: error.message
    });
  }
};

// Remove a friend or cancel a friend request
exports.removeFriend = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    await transaction.begin();

    // Check existing friendship
    const checkResult = await transaction.request()
      .input('currentUserId', sql.BigInt, currentUserId)
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT FriendshipID FROM Friendships
        WHERE ((UserID = @currentUserId AND FriendID = @userId)
            OR (UserID = @userId AND FriendID = @currentUserId))
      `);

    if (checkResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Không tìm thấy mối quan hệ bạn bè'
      });
    }

    // Remove friendship by setting status to rejected
    await transaction.request()
      .input('friendshipId', sql.BigInt, checkResult.recordset[0].FriendshipID)
      .query(`
        UPDATE Friendships
        SET Status = 'rejected', UpdatedAt = GETDATE()
        WHERE FriendshipID = @friendshipId
      `);

    await transaction.commit();

    res.json({
      message: 'Đã xóa khỏi danh sách bạn bè'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error removing friend:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi xóa bạn bè',
      error: error.message
    });
  }
};

// Get friend suggestions for current user
exports.getFriendSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const limit = req.query.limit || 10; // Default to 10 suggestions
    
    // Get suggestions based on:
    // 1. Friends of friends
    // 2. Similar courses/events
    // 3. Same school
    const result = await pool.request()
      .input('currentUserId', sql.BigInt, currentUserId)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        WITH CurrentUserFriends AS (
          -- Get current user's friends
          SELECT 
            CASE
              WHEN UserID = @currentUserId THEN FriendID
              ELSE UserID
            END as FriendID
          FROM Friendships
          WHERE (UserID = @currentUserId OR FriendID = @currentUserId)
            AND Status = 'accepted'
        ),
        
        ExistingFriendshipsOrRequests AS (
          -- Get users that already have a friendship or pending request
          SELECT 
            CASE
              WHEN UserID = @currentUserId THEN FriendID
              ELSE UserID
            END as UserID
          FROM Friendships
          WHERE (UserID = @currentUserId OR FriendID = @currentUserId)
        ),
        
        FriendsOfFriends AS (
          -- Get friends of friends
          SELECT
            PotentialFriend as SuggestedUserID,
            COUNT(DISTINCT CommonFriend) as CommonFriendsCount,
            1 as SuggestionType -- 1 = Friend of friend
          FROM (
            SELECT
              f1.FriendID as CommonFriend,
              f2.UserID as PotentialFriend
            FROM CurrentUserFriends f1
            JOIN Friendships f2 ON f1.FriendID = f2.FriendID
            WHERE f2.UserID != @currentUserId
            AND f2.Status = 'accepted'
            AND f2.UserID NOT IN (SELECT UserID FROM ExistingFriendshipsOrRequests)
            
            UNION
            
            SELECT
              f1.FriendID as CommonFriend,
              f2.FriendID as PotentialFriend
            FROM CurrentUserFriends f1
            JOIN Friendships f2 ON f1.FriendID = f2.UserID
            WHERE f2.FriendID != @currentUserId
            AND f2.Status = 'accepted'
            AND f2.FriendID NOT IN (SELECT UserID FROM ExistingFriendshipsOrRequests)
          ) AS FriendConnections
          GROUP BY PotentialFriend
        ),
        
        SameCourseSuggestions AS (
          -- Get users from same courses
          SELECT 
            u.UserID as SuggestedUserID,
            COUNT(DISTINCT ce1.CourseID) as CommonCoursesCount,
            2 as SuggestionType -- 2 = Same course
          FROM CourseEnrollments ce1
          JOIN CourseEnrollments ce2 ON ce1.CourseID = ce2.CourseID AND ce1.UserID != ce2.UserID
          JOIN Users u ON ce2.UserID = u.UserID
          WHERE ce1.UserID = @currentUserId
            AND ce2.UserID NOT IN (SELECT UserID FROM ExistingFriendshipsOrRequests)
            AND u.DeletedAt IS NULL
            AND u.AccountStatus = 'ACTIVE'
          GROUP BY u.UserID
        ),
        
        SameSchoolSuggestions AS (
          -- Get users from same school
          SELECT 
            u.UserID as SuggestedUserID,
            0 as CommonCount,
            3 as SuggestionType -- 3 = Same school
          FROM Users u
          JOIN Users currentUser ON u.School = currentUser.School 
                                AND u.School IS NOT NULL 
                                AND u.School != ''
          WHERE currentUser.UserID = @currentUserId
            AND u.UserID != @currentUserId
            AND u.UserID NOT IN (SELECT UserID FROM ExistingFriendshipsOrRequests)
            AND u.DeletedAt IS NULL
            AND u.AccountStatus = 'ACTIVE'
        ),
        
        CombinedSuggestions AS (
          -- Combine all suggestions with priority
          SELECT 
            SuggestedUserID,
            CommonFriendsCount as CommonCount,
            SuggestionType,
            ROW_NUMBER() OVER (
              PARTITION BY SuggestedUserID 
              ORDER BY SuggestionType, CommonFriendsCount DESC
            ) as RowNum
          FROM FriendsOfFriends
          
          UNION ALL
          
          SELECT 
            SuggestedUserID,
            CommonCoursesCount as CommonCount,
            SuggestionType,
            ROW_NUMBER() OVER (
              PARTITION BY SuggestedUserID 
              ORDER BY SuggestionType, CommonCoursesCount DESC
            ) as RowNum
          FROM SameCourseSuggestions
          
          UNION ALL
          
          SELECT 
            SuggestedUserID,
            CommonCount,
            SuggestionType,
            ROW_NUMBER() OVER (
              PARTITION BY SuggestedUserID 
              ORDER BY SuggestionType
            ) as RowNum
          FROM SameSchoolSuggestions
        )
        
        -- Final selection with user details
        SELECT TOP (@limit)
          u.UserID,
          u.Username,
          u.FullName,
          u.Image,
          u.Status,
          u.School,
          cs.CommonCount,
          CASE 
            WHEN cs.SuggestionType = 1 THEN 'friend_of_friend'
            WHEN cs.SuggestionType = 2 THEN 'same_course'
            WHEN cs.SuggestionType = 3 THEN 'same_school'
            ELSE 'other'
          END as SuggestionReason
        FROM CombinedSuggestions cs
        JOIN Users u ON cs.SuggestedUserID = u.UserID
        WHERE cs.RowNum = 1 -- Take the highest priority suggestion reason for each user
        AND u.DeletedAt IS NULL 
        AND u.AccountStatus = 'ACTIVE'
        ORDER BY 
          cs.SuggestionType, -- Order by suggestion type (friend of friend first)
          cs.CommonCount DESC, -- Then by common count (more common friends/courses first)
          u.Status DESC, -- Active users first
          u.LastLoginAt DESC -- Recently active users
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting friend suggestions:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi lấy gợi ý kết bạn',
      error: error.message
    });
  }
};

// Get random friend suggestions (users not already friends with current user)
exports.getRandomSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const limit = req.query.limit || 20; // Default to 20 suggestions
    
    // Get random users that are not already friends with the current user
    const result = await pool.request()
      .input('currentUserId', sql.BigInt, currentUserId)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        WITH ExistingConnections AS (
          -- Users that already have a friendship or pending request
          SELECT 
            CASE
              WHEN UserID = @currentUserId THEN FriendID
              ELSE UserID
            END as UserID
          FROM Friendships
          WHERE (UserID = @currentUserId OR FriendID = @currentUserId)
        )
        
        SELECT TOP (@limit)
          u.UserID,
          u.Username,
          u.FullName,
          u.Image,
          u.Status,
          u.School,
          'random_suggestion' as SuggestionReason
        FROM Users u
        WHERE u.UserID != @currentUserId
          AND u.UserID NOT IN (SELECT UserID FROM ExistingConnections)
          AND u.DeletedAt IS NULL
          AND u.AccountStatus = 'ACTIVE'
        ORDER BY NEWID() -- Random ordering
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error getting random suggestions:', error);
    res.status(500).json({
      message: 'Đã có lỗi xảy ra khi lấy gợi ý bạn bè ngẫu nhiên',
      error: error.message
    });
  }
};