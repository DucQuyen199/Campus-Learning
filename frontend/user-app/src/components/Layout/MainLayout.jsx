import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfileImage, logout as logoutAction } from '../../store/slices/authSlice';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  HomeIcon, BookOpenIcon, CalendarIcon, ChatBubbleLeftRightIcon,
  BellIcon, TrophyIcon, AcademicCapIcon, UserGroupIcon,
  ExclamationTriangleIcon, UserCircleIcon, Cog6ToothIcon,
  SparklesIcon, ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassIcon, XMarkIcon, HeartIcon,
  Bars3Icon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, CodeBracketIcon,
  BeakerIcon, ArrowRightOnRectangleIcon
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
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { logout } = useAuth();
  const { theme, themeColor, colors } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  
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
      if (window.innerWidth < 640) { // Small mobile screens
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
    { name: 'Khóa Học', icon: BookOpenIcon, href: '/courses' },
    { name: 'Sự Kiện', icon: CalendarIcon, href: '/events' },
    { name: 'Bài Viết', icon: ChatBubbleLeftRightIcon, href: '/posts' },
    { name: 'AI Chat', icon: SparklesIcon, href: '/ai-chat' },
    { name: 'AI TestCase', icon: BeakerIcon, href: '/ai-test-local' },
    { name: 'Bài Thi', icon: AcademicCapIcon, href: '/exams' },
    { name: 'Thi Lập Trình', icon: TrophyIcon, href: '/competitions' },
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
    if (window.innerWidth < 640) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
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
        setSearchExpanded(false);
      }
      
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
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

  // Constant for sidebar width
  const sidebarWidth = sidebarOpen ? '250px' : '70px';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Main container with padding */}
      <div className="h-full w-full flex flex-col">
        {/* Unified form containing all layout elements */}
        <div className="flex flex-col w-full h-full bg-white dark:bg-gray-800 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 z-10 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
              {/* Logo and Toggle Button */}
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className="flex-shrink-0 flex items-center gap-2">
                  <CodeBracketIcon className="h-8 w-8 text-theme-primary" />
                  <Link to="/home" className="hover:opacity-95 transition-all">
                    <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-theme-primary via-theme-secondary to-theme-hover">
                    </span>
                  </Link>
                </div>

                {/* Main Nav Links */}
                <nav className="hidden sm:flex items-center flex-nowrap space-x-3 md:space-x-4 lg:space-x-6 ml-2 md:ml-4 max-w-full">
                  {navigation.filter(nav => !['/profile','/settings','/exams','/competitions','/chat','/friends','/reports','/ai-chat','/ai-test-local'].includes(nav.href)).map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/home' && location.pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={item.onClick}
                        className={`flex items-center space-x-1 whitespace-nowrap text-sm font-medium hover:text-theme-primary transition-colors ${isActive ? 'text-theme-primary' : 'text-gray-600 dark:text-gray-300'}`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="hidden lg:inline">{item.name}</span>
                      </Link>
                    );
                  })}

                  {/* Exams & Competitions Dropdown */}
                  <div className="relative group">
                    <button className={`flex items-center space-x-1 whitespace-nowrap text-sm font-medium transition-colors hover:text-theme-primary ${['/exams','/competitions'].some(p => location.pathname.startsWith(p)) ? 'text-theme-primary' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                      <AcademicCapIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="hidden lg:inline">Thi</span>
                      <ChevronDownIcon className="h-4 w-4 hidden lg:inline" />
                    </button>
                    <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 max-h-96 border border-gray-100 dark:border-gray-700 hidden group-hover:block">
                      <div className="py-1">
                        <h3 className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                          Thi & Kiểm tra
                        </h3>
                        <Link to="/exams" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap">
                          <AcademicCapIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                          Bài Thi
                        </Link>
                        <Link to="/competitions" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap">
                          <TrophyIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                          Thi Lập Trình
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Chat & Friends Dropdown */}
                  <div className="relative group">
                    <button className={`flex items-center space-x-1 whitespace-nowrap text-sm font-medium transition-colors hover:text-theme-primary ${['/chat','/friends'].some(p => location.pathname.startsWith(p)) ? 'text-theme-primary' : 'text-gray-600 dark:text-gray-300'}`}
                      onClick={(e) => e.preventDefault() /* prevent nav */}
                    >
                      <ChatBubbleBottomCenterTextIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="hidden lg:inline">Cộng đồng</span>
                      <ChevronDownIcon className="h-4 w-4 hidden lg:inline" />
                    </button>
                    <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 max-h-96 border border-gray-100 dark:border-gray-700 hidden group-hover:block">
                      <div className="py-1">
                        <h3 className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                          Cộng đồng
                        </h3>
                        <Link to="/chat" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap">
                          <ChatBubbleBottomCenterTextIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                          Chat
                        </Link>
                        <Link to="/friends" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap">
                          <UserGroupIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                          Bạn Bè
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* AI Tools Dropdown */}
                  <div className="relative group">
                    <button className={`flex items-center space-x-1 whitespace-nowrap text-sm font-medium transition-colors hover:text-theme-primary ${['/ai-chat','/ai-test-local'].some(p => location.pathname.startsWith(p)) ? 'text-theme-primary' : 'text-gray-600 dark:text-gray-300'}`}>
                      <SparklesIcon className="h-5 w-5 flex-shrink-0" />
                      <span className="hidden lg:inline">AI</span>
                      <ChevronDownIcon className="h-4 w-4 hidden lg:inline" />
                    </button>
                    <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 max-h-96 border border-gray-100 dark:border-gray-700 hidden group-hover:block">
                      <div className="py-1">
                        <h3 className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                          Công cụ AI
                        </h3>
                        <Link to="/ai-chat" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap">
                          <SparklesIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                          AI Chat
                        </Link>
                        <Link to="/ai-test-local" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap">
                          <BeakerIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                          AI TestCase
                        </Link>
                      </div>
                    </div>
                  </div>
                </nav>
              </div>

              {/* Right side navigation items */}
              <div className="flex items-center justify-end space-x-3 sm:space-x-4">
                {/* Mobile Menu Button - Only visible on mobile */}
                <button
                  onClick={toggleSidebar}
                  className="sm:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-theme-accent hover:text-theme-primary dark:hover:bg-gray-700 focus:outline-none transition-all duration-200"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
                {/* Search Bar */}
                <div ref={searchRef} className="hidden md:block relative">
                  <form onSubmit={handleSearch} className="relative group">
                    <div className={`flex items-center transition-all duration-300 ${searchExpanded ? 'w-56 lg:w-64 xl:w-72' : 'w-10'}`}>
                      <button 
                        type="button" 
                        className={`absolute left-0 p-2.5 text-theme-secondary hover:text-theme-primary z-10 ${searchExpanded ? 'bg-transparent' : 'bg-white dark:bg-gray-700 rounded-full shadow-md'}`}
                        onClick={() => setSearchExpanded(true)}
                      >
                        <MagnifyingGlassIcon className="h-5 w-5" />
                      </button>
                      {searchExpanded && (
                        <input
                          type="text"
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-full leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary sm:text-sm shadow-md text-gray-900 dark:text-gray-100 transition-all"
                          placeholder="Tìm kiếm người dùng..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                        />
                      )}
                    </div>
                    {showResults && searchResults.length > 0 && (
                      <div className="absolute mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 max-h-96 overflow-y-auto border border-gray-100 dark:border-gray-700">
                        <div className="py-1">
                          <h3 className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                            Người dùng
                          </h3>
                          {searchResults.map((user) => (
                            <div
                              key={user.id}
                              className="px-4 py-2.5 hover:bg-theme-accent/50 dark:hover:bg-theme-accent/20 cursor-pointer flex items-center transition-colors duration-150"
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
                                <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </form>
                </div>
                
                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button 
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-theme-accent/50 relative transition-all duration-200 hover:text-theme-primary dark:hover:text-theme-secondary"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    {unreadCount > 0 ? (
                      <>
                        <BellIconSolid className="h-6 w-6 text-theme-primary" />
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
                    <div className={`fixed top-0 right-0 w-80 h-full bg-white dark:bg-gray-800 shadow-xl z-30 transform transition-transform duration-300 ease-in-out overflow-hidden ${
                      isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
                    }`}>
                      <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-theme-accent/50 to-white dark:from-gray-700 dark:to-gray-800">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thông báo</h3>
                          <div className="flex space-x-2">
                            {unreadCount > 0 && (
                              <button 
                                onClick={markAllAsRead}
                                className="text-xs text-theme-primary hover:text-theme-hover dark:hover:text-theme-secondary font-medium"
                              >
                                Đánh dấu đã đọc
                              </button>
                            )}
                            <button 
                              onClick={closeNotificationsPanel}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Notification List */}
                        <div className="flex-1 overflow-y-auto">
                          {isLoadingNotifications ? (
                            <div className="py-10 text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tải thông báo...</p>
                            </div>
                          ) : notifications.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                              {notifications.map((notification) => {
                                const NotificationIcon = getNotificationIcon(notification.Type);
                                return (
                                  <div 
                                    key={notification.NotificationID} 
                                    className={`px-4 py-3.5 hover:bg-theme-accent/50 dark:hover:bg-theme-accent/20 cursor-pointer flex items-start ${
                                      !notification.IsRead ? 'bg-theme-accent/50 dark:bg-theme-accent/20' : ''
                                    } transition-colors duration-150`}
                                    onClick={() => handleNotificationClick(notification)}
                                  >
                                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                                      !notification.IsRead ? 'bg-theme-secondary/30 text-theme-primary dark:bg-theme-secondary/20 dark:text-theme-secondary' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}>
                                      <NotificationIcon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium ${!notification.IsRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {notification.Title}
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                                        {notification.Content}
                                      </p>
                                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        {getTimeAgo(notification.CreatedAt)}
                                      </p>
                                    </div>
                                    {!notification.IsRead && (
                                      <span className="ml-2 h-2 w-2 bg-theme-primary rounded-full flex-shrink-0 mt-2"></span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-12 text-center">
                              <div className="bg-theme-accent/50 dark:bg-theme-accent/20 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                                <BellIcon className="h-8 w-8 text-theme-secondary" />
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Không có thông báo nào</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Thông báo mới sẽ xuất hiện ở đây</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <Link 
                            to="/notifications" 
                            className="block w-full py-2.5 bg-gradient-to-r from-theme-primary to-theme-hover hover:from-theme-hover hover:to-theme-active text-white text-center rounded-lg shadow-md transition-all duration-300 font-medium"
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
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setShowUserMenu(prev => !prev)}
                    className="flex items-center space-x-2 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-theme-accent/50 dark:hover:bg-theme-accent/20 transition-all duration-200 hover:text-theme-primary dark:hover:text-theme-secondary"
                  >
                    <Avatar
                      src={currentUser?.avatar || currentUser?.profileImage}
                      name={currentUser?.fullName || currentUser?.username || 'User'}
                      alt={currentUser?.fullName || currentUser?.username || 'User'}
                      size="small"
                      className="ring-2 ring-theme-accent"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline group-hover:text-theme-primary">
                      {currentUser?.fullName || currentUser?.username || 'User'}
                    </span>
                  </button>

                  {/* Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-30">
                      <Link 
                        to="/profile" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" 
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCircleIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                        Hồ sơ
                      </Link>
                      <Link 
                        to="/settings" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" 
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                        Cài đặt
                      </Link>
                      <Link 
                        to="/reports" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" 
                        onClick={() => setShowUserMenu(false)}
                      >
                        <ExclamationTriangleIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                        Báo cáo
                      </Link>
                      <button 
                        onClick={() => { setShowUserMenu(false); handleLogout(); }} 
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-auto bg-white dark:bg-gray-800">
            <main className="h-full w-full">
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Navigation */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 sm:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 shadow-xl z-40 transform transition-all duration-300 ease-in-out sm:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <CodeBracketIcon className="h-8 w-8 text-theme-primary mr-2" />
                  <span className="font-bold text-xl">Menu</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              {/* Mobile Menu Items */}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                  {navigation.filter(nav => !['/profile','/settings','/reports'].includes(nav.href)).map((item) => {
                    const isActive = location.pathname === item.href || 
                      (item.href !== '/home' && location.pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                          isActive 
                            ? 'bg-theme-accent/70 text-theme-primary dark:bg-theme-accent/20' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              {/* Mobile Menu Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={currentUser?.avatar || currentUser?.profileImage}
                    name={currentUser?.fullName || currentUser?.username || 'User'}
                    alt={currentUser?.fullName || currentUser?.username || 'User'}
                    size="small"
                    className="ring-2 ring-theme-accent"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {currentUser?.fullName || currentUser?.username || 'User'}
                    </p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MainLayout; 