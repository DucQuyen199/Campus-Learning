import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications } from '@/store/slices/notificationSlice';
import { 
  ChatBubbleLeftRightIcon, ChatBubbleBottomCenterTextIcon,
  BellIcon, HeartIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const Notifications = () => {
  const dispatch = useDispatch();
  const { notifications, loading } = useSelector((state) => state.notifications);
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return <ChatBubbleLeftRightIcon className="h-6 w-6" />;
      case 'reply':
        return <ChatBubbleBottomCenterTextIcon className="h-6 w-6" />;
      case 'reaction':
        return <HeartIconSolid className="h-6 w-6 text-red-500" />;
      case 'message':
        return <ChatBubbleBottomCenterTextIcon className="h-6 w-6" />;
      default:
        return <BellIcon className="h-6 w-6" />;
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} phút trước`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingRead(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const token = localStorage.getItem('token');
      
      await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Refresh notifications after marking all as read
      dispatch(fetchNotifications());
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc tất cả:', error);
    } finally {
      setMarkingRead(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Thông báo</h1>
        {notifications && notifications.some(notification => !notification.IsRead) && (
          <button 
            onClick={markAllAsRead}
            disabled={markingRead}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors disabled:opacity-50"
          >
            {markingRead ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="text-center p-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Đang tải thông báo...</p>
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div 
                key={notification.NotificationID} 
                className={`p-4 hover:bg-gray-50 ${
                  !notification.IsRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    !notification.IsRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {getNotificationIcon(notification.Type)}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${!notification.IsRead ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.Title}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {notification.Content}
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      {getTimeAgo(notification.CreatedAt)}
                    </p>
                  </div>
                  {!notification.IsRead && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-10">
            <div className="text-gray-400 text-5xl mb-4">🔔</div>
            <p className="text-gray-500">Bạn không có thông báo nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications; 