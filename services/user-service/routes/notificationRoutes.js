const express = require('express');
const router = express.Router();
const { pool, sql } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Lấy tất cả thông báo của người dùng hiện tại
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.UserID;
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT TOP 50
          NotificationID, UserID, Type, Title, Content,
          RelatedID, RelatedType, IsRead, CreatedAt, Priority
        FROM Notifications
        WHERE UserID = @userId
        ORDER BY CreatedAt DESC
      `);
    
    return res.status(200).json({
      notifications: result.recordset
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy thông báo' });
  }
});

// Lấy số lượng thông báo chưa đọc
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.UserID;
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT COUNT(*) as UnreadCount
        FROM Notifications
        WHERE UserID = @userId AND IsRead = 0
      `);
    
    return res.status(200).json({
      unreadCount: result.recordset[0].UnreadCount
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy số lượng thông báo chưa đọc' });
  }
});

// Đánh dấu một thông báo đã đọc
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.UserID;
    const notificationId = req.params.id;
    
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('notificationId', sql.BigInt, notificationId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        WHERE NotificationID = @notificationId AND UserID = @userId
      `);
    
    return res.status(200).json({ message: 'Đã đánh dấu thông báo là đã đọc' });
  } catch (error) {
    console.error('Mark Read Error:', error);
    return res.status(500).json({ message: 'Lỗi khi đánh dấu thông báo đã đọc' });
  }
});

// Đánh dấu tất cả thông báo đã đọc
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.UserID;
    
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        WHERE UserID = @userId AND IsRead = 0
      `);
    
    return res.status(200).json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  } catch (error) {
    console.error('Mark All Read Error:', error);
    return res.status(500).json({ message: 'Lỗi khi đánh dấu tất cả thông báo đã đọc' });
  }
});

// Xóa một thông báo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.UserID;
    const notificationId = req.params.id;
    
    await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('notificationId', sql.BigInt, notificationId)
      .query(`
        DELETE FROM Notifications
        WHERE NotificationID = @notificationId AND UserID = @userId
      `);
    
    return res.status(200).json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    console.error('Delete Notification Error:', error);
    return res.status(500).json({ message: 'Lỗi khi xóa thông báo' });
  }
});

// Lấy thông báo theo loại
router.get('/type/:type', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.UserID;
    const type = req.params.type;
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('type', sql.VarChar(50), type)
      .query(`
        SELECT 
          NotificationID, UserID, Type, Title, Content,
          RelatedID, RelatedType, IsRead, CreatedAt, Priority
        FROM Notifications
        WHERE UserID = @userId AND Type = @type
        ORDER BY CreatedAt DESC
      `);
    
    return res.status(200).json({
      notifications: result.recordset
    });
  } catch (error) {
    console.error('Get Notifications By Type Error:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy thông báo theo loại' });
  }
});

module.exports = router; 