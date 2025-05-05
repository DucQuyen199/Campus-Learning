import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfileImage, logout as logoutAction } from '../../store/slices/authSlice';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HomeIcon, BookOpenIcon, CalendarIcon, ChatBubbleLeftRightIcon,
  BellIcon, TrophyIcon, AcademicCapIcon, UserGroupIcon,
  ExclamationTriangleIcon, UserCircleIcon, Cog6ToothIcon,
  SparklesIcon, ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassIcon, XMarkIcon, HeartIcon,
  Bars3Icon, ChevronLeftIcon, ChevronRightIcon, CodeBracketIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid, HeartIcon as HeartIconSolid, CalendarIcon as CalendarIconSolid } from '@heroicons/react/24/solid';
import { Avatar } from '../index';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authUser = useSelector(state => state.auth.user);
  const token = localStorage.getItem('token');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const searchRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { logout } = useAuth();
  
  // Cập nhật thời gian hiện tại mỗi phút
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);
  
  // Format ngày tháng năm tiếng Việt ngắn gọn
  const formatDateShort = (date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const day = days[date.getDay()];
    const dateNum = date.getDate();
    const month = date.getMonth() + 1;
    
    return `${day}, ${dateNum}/${month}`;
  };
  
  // Thêm state cho thông báo
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationsRef = useRef(null);
  
  // Thêm state để theo dõi việc đã fetch thông báo lần đầu hay chưa
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  // Check window size on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // Mobile
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Update current user state from Redux and localStorage
  useEffect(() => {
    const loadUserData = () => {
      if (authUser && Object.keys(authUser).length > 0) {
        console.log('Setting current user from Redux state:', authUser);
        setCurrentUser(authUser);
      } else {
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          try {
            const userData = JSON.parse(userDataString);
            console.log('Setting current user from localStorage:', userData);
            setCurrentUser(userData);
            // If we have user data in localStorage but not in Redux, update Redux too
            if (!authUser || Object.keys(authUser).length === 0) {
              dispatch(updateProfileImage(userData.profileImage || userData.avatar));
            }
          } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
          }
        }
      }
    };
    
    loadUserData();
    
    // Listen for profile updates
    const handleProfileUpdate = (event) => {
      if (event.detail && event.detail.profileImage) {
        dispatch(updateProfileImage(event.detail.profileImage));
      }
      loadUserData();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [authUser, dispatch]);
  
  const navigation = [
    { name: 'Trang Chủ', icon: HomeIcon, href: '/home' },
    { name: 'Khóa Học IT', icon: BookOpenIcon, href: '/courses' },
    { name: 'Sự Kiện', icon: CalendarIcon, href: '/events' },
    { name: 'Bài Viết', icon: ChatBubbleLeftRightIcon, href: '/posts' },
    { name: 'Thi Đấu ', icon: CodeBracketIcon, href: '/competitions' },
    { name: 'AI Chat', icon: SparklesIcon, href: '/ai-chat' },
    { name: 'Bài Thi', icon: AcademicCapIcon, href: '/exams' },
    { name: 'Chat', icon: ChatBubbleBottomCenterTextIcon, href: '/chat', onClick: () => navigate('/chat') },
    { name: 'Báo Cáo', icon: ExclamationTriangleIcon, href: '/reports' },
    { name: 'Bạn Bè', icon: UserGroupIcon, href: '/friends' },
    { name: 'Hồ Sơ', icon: UserCircleIcon, href: '/profile' },
    { name: 'Cài Đặt', icon: Cog6ToothIcon, href: '/settings' }
  ];

  // Danh sách các route không cần layout
  const noLayoutRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  
  // Xác định xem có cần hiển thị layout hay không
  const shouldShowLayout = !noLayoutRoutes.includes(location.pathname) && token;
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Hàm tìm kiếm người dùng khi nhập
  useEffect(() => {
    if (!shouldShowLayout) return; // Không chạy hook nếu không hiển thị layout
    
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        // Sử dụng API URL từ biến môi trường
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        
        // Gọi API tìm kiếm người dùng
        const response = await fetch(`${apiUrl}/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Không thể tìm kiếm người dùng');
        }

        const data = await response.json();
        console.log('Kết quả tìm kiếm người dùng:', data);
        setSearchResults(data.users || []);
        setShowResults(true);
      } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        // Đặt một mảng trống để tránh lỗi
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const handler = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers();
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, token, shouldShowLayout]);

  // Fetch thông tin user role một lần khi component được mount
  useEffect(() => {
    if (!shouldShowLayout) return;
    
    // Lấy thông tin user từ localStorage để kiểm tra role
    const checkUserRole = () => {
      try {
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          const userRole = (userData.role || userData.Role || '').toUpperCase();
          const isAdmin = userRole === 'ADMIN';
          console.log(`[Role Check] User role: ${userRole}, IsAdmin: ${isAdmin}`);
          setIsAdminUser(isAdmin);
        }
      } catch (error) {
        console.error('Error parsing user data for role check:', error);
      }
    };
    
    checkUserRole();
  }, [shouldShowLayout]); // Chỉ chạy khi shouldShowLayout thay đổi
  
  // Fetch thông báo - tách thành hàm riêng bên ngoài useEffect
  const fetchNotifications = async () => {
    // Nếu là admin và đã fetch lần đầu, không làm gì cả
    if (isAdminUser && hasInitialFetch) {
      console.log("[Notifications] Skipping fetch for admin user after initial load");
      return;
    }
    
    // Tránh loading state nếu đã có dữ liệu
    if (notifications.length === 0) {
      setIsLoadingNotifications(true);
    }
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      console.log(`[Notifications] Fetching notifications, isAdmin: ${isAdminUser}`);
      
      // Gọi API lấy thông báo
      const response = await fetch(`${apiUrl}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể lấy thông báo');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Đếm số thông báo chưa đọc
      const unread = (data.notifications || []).filter(notification => !notification.IsRead).length;
      setUnreadCount(unread);
      
      // Đánh dấu đã fetch ban đầu
      if (!hasInitialFetch) {
        console.log("[Notifications] Setting hasInitialFetch to true");
        setHasInitialFetch(true);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông báo:', error);
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };
  
  // Setup initial fetch và polling
  useEffect(() => {
    if (!shouldShowLayout) return;
    
    // Fetch lần đầu khi component mount
    fetchNotifications();
    
    // Thiết lập interval chỉ cho người dùng bình thường
    let intervalId = null;
    
    // Chỉ thiết lập interval nếu KHÔNG phải admin
    if (!isAdminUser) {
      console.log("[Notifications] Setting up polling interval for non-admin user");
      // Tăng thời gian giữa các lần polling lên 90 giây
      intervalId = setInterval(fetchNotifications, 90000);
    } else {
      console.log("[Notifications] Admin user detected, NO polling interval set");
    }
    
    // Cleanup function
    return () => {
      if (intervalId) {
        console.log("[Notifications] Clearing polling interval");
        clearInterval(intervalId);
      }
    };
  }, [shouldShowLayout, isAdminUser]); // Loại bỏ token và các dependencies không cần thiết

  // Xử lý click bên ngoài dropdown để đóng kết quả
  useEffect(() => {
    if (!shouldShowLayout) return; // Không chạy hook nếu không hiển thị layout
    
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [shouldShowLayout]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleLogout = async () => {
    // Use the AuthContext's logout function for proper cleanup
    await logout();
    
    // Also dispatch Redux logout action to clear state
    dispatch(logoutAction());
    
    // Navigate to login page after logout
    navigate('/login', { replace: true });
  };

  // Xử lý đánh dấu đã đọc thông báo
  const markNotificationAsRead = async (notificationId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      
      await fetch(`${apiUrl}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Cập nhật state
      setNotifications(notifications.map(notification => 
        notification.NotificationID === notificationId 
          ? { ...notification, IsRead: true } 
          : notification
      ));
      
      // Giảm số lượng thông báo chưa đọc
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
    }
  };

  // Xử lý đánh dấu đã đọc tất cả thông báo
  const markAllAsRead = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      
      await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Cập nhật state
      setNotifications(notifications.map(notification => ({ ...notification, IsRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc tất cả:', error);
    }
  };

  // Xử lý đóng panel thông báo với hiệu ứng
  const closeNotificationsPanel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowNotifications(false);
      setIsClosing(false);
    }, 300); // Thời gian này phải khớp với thời lượng của animation
  };

  // Xử lý click vào thông báo
  const handleNotificationClick = (notification) => {
    // Đánh dấu là đã đọc
    if (!notification.IsRead) {
      markNotificationAsRead(notification.NotificationID);
    }
    
    // Điều hướng dựa vào loại thông báo
    if (notification.RelatedType === 'Posts') {
      // Navigate to the specific post
      const postId = notification.RelatedID;
      navigate(`/posts?postId=${postId}`);
    } else if (notification.RelatedType === 'Comments') {
      // Navigate to the post with comment highlight
      const postId = notification.PostID || notification.RelatedID;
      const commentId = notification.RelatedID;
      navigate(`/posts?postId=${postId}&commentId=${commentId}`);
    } else if (notification.Type === 'message') {
      navigate('/chat');
    } else {
      // Mặc định hiển thị trang thông báo
      navigate('/notifications');
    }
    
    closeNotificationsPanel();
  };

  // Lấy biểu tượng phù hợp cho thông báo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return ChatBubbleLeftRightIcon;
      case 'reply':
        return ChatBubbleBottomCenterTextIcon;
      case 'reaction':
        return HeartIconSolid;
      case 'message':
        return ChatBubbleBottomCenterTextIcon;
      default:
        return BellIcon;
    }
  };

  // Lấy thời gian thông báo ở định dạng dễ đọc
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

  // Kiểm tra nếu đang ở trang không cần layout
  if (!shouldShowLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Toggle Button */}
            <div className="flex items-center space-x-4 flex-1">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-blue-600 focus:outline-none transition-all duration-200"
              >
                {sidebarOpen ? <ChevronLeftIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
              </button>
              
              <div className="flex-shrink-0">
                <Link to="/home" className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-xl shadow-sm">
                    <AcademicCapIcon className="h-7 w-7 text-blue-600" />
                  </div>
                  
                  <div className="flex items-center">
                    <span className="font-extrabold text-2xl text-blue-600 tracking-tight">
                      CAMPUST
                    </span>
                    <span className="mx-2 text-blue-300 font-light text-xl">|</span>
                    <span className="font-semibold text-xl text-blue-500 tracking-tight">
                      LEARNING
                    </span>
                  </div>
                </Link>
              </div>
              
              {/* Calendar */}
              <div className="hidden md:flex items-center ml-auto">
                <div className="flex items-center bg-blue-100 text-blue-700 rounded-lg px-3.5 py-2 shadow-sm">
                  <CalendarIconSolid className="h-5 w-5 mr-1.5 text-blue-600" />
                  <span className="text-sm font-medium">{formatDateShort(currentTime)}</span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
                    placeholder="Tìm kiếm người dùng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* User search results dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg z-20 max-h-96 overflow-y-auto border border-gray-100">
                    <div className="py-1">
                      <h3 className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-100">
                        Người dùng
                      </h3>
                      
                      {searchResults.map((user) => (
                        <div 
                          key={user.id} 
                          className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center transition-colors duration-150"
                          onClick={() => handleUserClick(user.id)}
                        >
                          <Avatar
                            src={user.avatar}
                            name={user.fullName}
                            alt={user.fullName || 'User'}
                            size="small"
                            className="mr-3"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{user.fullName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {isSearching && (
                  <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg z-20 py-3 text-center border border-gray-100">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Đang tìm kiếm...</p>
                  </div>
                )}
              </form>
            </div>

            {/* Right side navigation items */}
            <div className="flex items-center justify-end space-x-4 flex-1">
              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  className="p-2 rounded-full text-gray-500 hover:bg-blue-50 relative transition-all duration-200 hover:text-blue-600"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  {unreadCount > 0 ? (
                    <>
                      <BellIconSolid className="h-6 w-6 text-blue-600" />
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-pulse shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </>
                  ) : (
                    <BellIcon className="h-6 w-6" />
                  )}
                </button>
                
                {/* Notifications panel */}
                {showNotifications && (
                  <div className={`fixed top-0 right-0 w-80 h-full bg-white shadow-xl z-30 transform transition-transform duration-300 ease-in-out overflow-hidden ${
                    isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
                  }`}>
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
                        <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                        <div className="flex space-x-2">
                          {unreadCount > 0 && (
                            <button 
                              onClick={markAllAsRead}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Đánh dấu đã đọc
                            </button>
                          )}
                          <button 
                            onClick={closeNotificationsPanel}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <XMarkIcon className="h-5 w-5 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Notification List */}
                      <div className="flex-1 overflow-y-auto">
                        {isLoadingNotifications ? (
                          <div className="py-10 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Đang tải thông báo...</p>
                          </div>
                        ) : notifications.length > 0 ? (
                          <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => {
                              const NotificationIcon = getNotificationIcon(notification.Type);
                              return (
                                <div 
                                  key={notification.NotificationID} 
                                  className={`px-4 py-3.5 hover:bg-blue-50 cursor-pointer flex items-start ${
                                    !notification.IsRead ? 'bg-blue-50' : ''
                                  } transition-colors duration-150`}
                                  onClick={() => handleNotificationClick(notification)}
                                >
                                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                                    !notification.IsRead ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    <NotificationIcon className={`${!sidebarOpen ? 'h-8 w-8 hover:scale-110' : 'h-6 w-6'} ${isActive ? (!sidebarOpen ? 'text-blue-600 bg-blue-50 p-1.5 rounded-xl shadow-sm' : 'text-blue-600') : 'text-gray-400'} transition-all duration-200`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${!notification.IsRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                      {notification.Title}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                                      {notification.Content}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {getTimeAgo(notification.CreatedAt)}
                                    </p>
                                  </div>
                                  {!notification.IsRead && (
                                    <span className="ml-2 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-12 text-center">
                            <div className="bg-blue-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                              <BellIcon className="h-8 w-8 text-blue-400" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Không có thông báo nào</p>
                            <p className="text-xs text-gray-400 mt-1">Thông báo mới sẽ xuất hiện ở đây</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Footer */}
                      <div className="p-4 border-t border-gray-100 bg-white">
                        <Link 
                          to="/notifications" 
                          className="block w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-center rounded-lg shadow-md transition-all duration-300 font-medium"
                          onClick={closeNotificationsPanel}
                        >
                          Xem tất cả thông báo
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Backdrop for notifications panel */}
              {showNotifications && (
                <div 
                  className={`fixed inset-0 bg-black z-20 transition-opacity duration-300 ${
                    isClosing ? 'opacity-0' : 'bg-opacity-25 animate-fade-in'
                  }`}
                  onClick={closeNotificationsPanel}
                />
              )}
              
              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 p-2 rounded-lg text-gray-600 hover:bg-blue-50 transition-all duration-200 hover:text-blue-600"
                >
                  <Avatar
                    src={currentUser?.avatar || currentUser?.profileImage}
                    name={currentUser?.fullName || currentUser?.username || 'User'}
                    alt={currentUser?.fullName || currentUser?.username || 'User'}
                    size="small"
                    className="ring-2 ring-blue-100"
                  />
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline group-hover:text-blue-600">
                    {currentUser?.fullName || currentUser?.username || 'User'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-20 ${
        sidebarOpen ? 'w-[15%]' : 'w-16'
      } shadow-sm`}>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Navigation Links */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={item.onClick}
                  className={`flex items-center ${!sidebarOpen ? 'justify-center py-5 px-2' : 'px-4 py-4'} mb-1.5 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100' 
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <item.icon className={`${!sidebarOpen ? 'h-8 w-8 hover:scale-110' : 'h-6 w-6'} ${isActive ? (!sidebarOpen ? 'text-blue-600 bg-blue-50 p-1.5 rounded-xl shadow-sm' : 'text-blue-600') : 'text-gray-400'} transition-all duration-200`} />
                  {sidebarOpen && (
                    <span className={`font-medium ml-3 truncate ${isActive ? 'font-semibold' : ''} text-base`}>
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section - Moved to bottom */}
          <div className="border-t border-gray-100">
            {sidebarOpen ? (
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={currentUser?.avatar || currentUser?.profileImage}
                    name={currentUser?.fullName || currentUser?.username || 'User'}
                    alt={currentUser?.fullName || currentUser?.username || 'User'}
                    size="medium"
                    className="ring-2 ring-blue-100 flex-shrink-0 shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-800 truncate">
                      {currentUser?.fullName || currentUser?.username || 'User'}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {currentUser?.Email || currentUser?.email}
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/profile')}
                    className="p-1.5 hover:bg-blue-50 rounded-full transition-colors"
                    title="Xem hồ sơ"
                  >
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 flex justify-center">
                <button onClick={() => navigate('/profile')} title="Xem hồ sơ">
                  <Avatar
                    src={currentUser?.avatar || currentUser?.profileImage}
                    name={currentUser?.fullName || currentUser?.username || 'User'}
                    alt={currentUser?.fullName || currentUser?.username || 'User'}
                    size="large"
                    className="ring-2 ring-blue-100 hover:ring-blue-200 transition-all duration-200"
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Toggle button for small screens */}
        <div className="absolute top-1/2 -right-3 hidden sm:flex">
          <button 
            onClick={toggleSidebar}
            className="bg-white rounded-full p-1.5 shadow-md z-30 hover:bg-blue-50 transition-colors duration-200 border border-gray-100"
          >
            {sidebarOpen ? 
              <ChevronLeftIcon className="h-3.5 w-3.5 text-gray-500" /> : 
              <ChevronRightIcon className="h-3.5 w-3.5 text-gray-500" />
            }
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`fixed top-16 bottom-0 right-0 transition-all duration-300 overflow-auto bg-white ${
        sidebarOpen ? 'left-[15%]' : 'left-16'
      } bg-gray-50`}>
        <main className="h-full w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 