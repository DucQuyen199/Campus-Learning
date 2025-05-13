/**
 * Controller for notifications operations
 */

// Mock notifications data
const generateMockNotifications = (userId) => {
  userId = parseInt(userId);
  return [
    {
      id: 1,
      userId: userId,
      title: 'Đăng ký học phần',
      message: 'Thời gian đăng ký học phần học kỳ mới sắp bắt đầu',
      type: 'academic',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    },
    {
      id: 2,
      userId: userId,
      title: 'Học phí học kỳ',
      message: 'Vui lòng thanh toán học phí trước ngày 30/06/2025',
      type: 'payment',
      isRead: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    },
    {
      id: 3,
      userId: userId,
      title: 'Lịch thi cập nhật',
      message: 'Lịch thi học kỳ đã được cập nhật, vui lòng kiểm tra',
      type: 'exam',
      isRead: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    }
  ];
};

const notificationsController = {
  // Get user notifications
  getNotifications: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      // Generate mock notifications
      const notifications = generateMockNotifications(userId);
      
      return res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error in getNotifications controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching notifications'
      });
    }
  },
  
  // Mark notification as read
  markAsRead: async (req, res) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification ID'
        });
      }
      
      return res.json({
        success: true,
        message: 'Notification marked as read',
        data: {
          id: notificationId,
          isRead: true
        }
      });
    } catch (error) {
      console.error('Error in markAsRead controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while marking notification as read'
      });
    }
  },
  
  // Delete notification
  deleteNotification: async (req, res) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid notification ID'
        });
      }
      
      return res.json({
        success: true,
        message: 'Notification deleted',
        data: {
          id: notificationId,
          deleted: true
        }
      });
    } catch (error) {
      console.error('Error in deleteNotification controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while deleting notification'
      });
    }
  }
};

module.exports = notificationsController; 