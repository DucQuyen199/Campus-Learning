/*-----------------------------------------------------------------
* File: MainLayout.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfileImage, logout as logoutAction } from '../../store/slices/authSlice';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'react-toastify';
import { 
  HomeIcon, BookOpenIcon, CalendarIcon, ChatBubbleLeftRightIcon,
  BellIcon, TrophyIcon, AcademicCapIcon, UserGroupIcon,
  ExclamationTriangleIcon, UserCircleIcon, Cog6ToothIcon,
  SparklesIcon, ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassIcon, XMarkIcon, HeartIcon,
  Bars3Icon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, CodeBracketIcon,
  BeakerIcon, ArrowRightOnRectangleIcon, PhotoIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid, HeartIcon as HeartIconSolid, CalendarIcon as CalendarIconSolid } from '@heroicons/react/24/solid';
import { Avatar } from '../index';
import SearchBar from '../../components/common/SearchBar';
import Loading from '../../components/common/Loading';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authUser = useSelector(state => state.auth.user);
  const { settings } = useSelector(state => state.user);
  const token = localStorage.getItem('token');
  const [currentUser, setCurrentUser] = useState(null);
  const { logout, currentUser: contextUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [searchType, setSearchType] = useState('users'); // 'users', 'posts', 'courses', 'events'
  const [searchData, setSearchData] = useState({
    users: [],
    posts: [],
    courses: [],
    events: []
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { theme, themeColor, colors } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Search queue and optimization
  const searchQueueRef = useRef(new Map()); // Store pending searches
  const searchCacheRef = useRef(new Map()); // Cache search results
  const activeSearchesRef = useRef(new Set()); // Track active searches
  const searchTimeoutRef = useRef(null);
  const searchAbortControllerRef = useRef(new Map()); // Store abort controllers
  const [searchQueueStatus, setSearchQueueStatus] = useState({
    pending: 0,
    active: 0,
    completed: 0
  });
  
  // Search queue configuration
  const SEARCH_CONFIG = {
    debounceMs: 300,
    maxConcurrentSearches: 3,
    cacheExpirationMs: 5 * 60 * 1000, // 5 minutes
    minSearchLength: 2,
    retryAttempts: 2,
    retryDelayMs: 1000
  };
  
  // Get navigation layout preference from user settings
  const navigationLayout = settings?.preferences?.navigationLayout || 'sidebar';
  const isHeaderNavigation = navigationLayout === 'header';
  
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
      // Priority: AuthContext currentUser > Redux authUser > localStorage
      if (contextUser && Object.keys(contextUser).length > 0) {
        console.log('Setting current user from AuthContext:', contextUser);
        setCurrentUser(contextUser);
        // Update Redux store to keep in sync
        dispatch(updateProfileImage(contextUser.avatar || contextUser.profileImage || contextUser.Image));
      } else if (authUser && Object.keys(authUser).length > 0) {
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
              dispatch(updateProfileImage(userData.profileImage || userData.avatar || userData.Image));
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
  }, [contextUser, authUser, dispatch]);
  
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
  
  // Optimized search queue system
  useEffect(() => {
    if (!shouldShowLayout) return;

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search query is too short, clear results
    if (searchQuery.trim().length < SEARCH_CONFIG.minSearchLength) {
      setSearchData({
        users: [],
        posts: [],
        courses: [],
        events: []
      });
      setShowResults(false);
      clearSearchQueue();
      return;
    }

    // Debounced search execution
    searchTimeoutRef.current = setTimeout(() => {
      enqueueSearch(searchQuery.trim(), searchType);
    }, SEARCH_CONFIG.debounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchType, token, shouldShowLayout]);

  // Search queue management functions
  const generateSearchKey = (query, type) => `${type}:${query.toLowerCase()}`;

  const getCachedResult = (searchKey) => {
    const cached = searchCacheRef.current.get(searchKey);
    if (cached && Date.now() - cached.timestamp < SEARCH_CONFIG.cacheExpirationMs) {
      console.log(`🎯 Cache hit for: ${searchKey}`);
      return cached.data;
    }
    return null;
  };

  const setCachedResult = (searchKey, data) => {
    searchCacheRef.current.set(searchKey, {
      data,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    if (searchCacheRef.current.size > 50) {
      const entries = Array.from(searchCacheRef.current.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 10).forEach(([key]) => {
        searchCacheRef.current.delete(key);
      });
    }
  };

  const clearSearchQueue = () => {
    searchQueueRef.current.clear();
    activeSearchesRef.current.clear();
    
    // Abort all active requests
    searchAbortControllerRef.current.forEach(controller => {
      controller.abort();
    });
    searchAbortControllerRef.current.clear();
    
    setSearchQueueStatus({ pending: 0, active: 0, completed: 0 });
  };

  const updateQueueStatus = () => {
    setSearchQueueStatus({
      pending: searchQueueRef.current.size,
      active: activeSearchesRef.current.size,
      completed: searchCacheRef.current.size
    });
  };

  const enqueueSearch = async (query, type) => {
    const searchKey = generateSearchKey(query, type);
    
    // Check cache first
    const cachedResult = getCachedResult(searchKey);
    if (cachedResult) {
      setSearchData(prev => ({
        ...prev,
        [type]: cachedResult
      }));
      setShowResults(true);
      setIsSearching(false);
      return;
    }

    // Check if search is already queued or active
    if (searchQueueRef.current.has(searchKey) || activeSearchesRef.current.has(searchKey)) {
      console.log(`⏳ Search already queued/active: ${searchKey}`);
      return;
    }

    // Add to queue
    searchQueueRef.current.set(searchKey, { query, type, attempts: 0 });
    updateQueueStatus();
    
    console.log(`📝 Enqueued search: ${searchKey}, Queue size: ${searchQueueRef.current.size}`);
    
    // Process queue
    processSearchQueue();
  };

  const processSearchQueue = async () => {
    // Check if we can process more searches
    if (activeSearchesRef.current.size >= SEARCH_CONFIG.maxConcurrentSearches) {
      console.log(`🚦 Max concurrent searches reached: ${activeSearchesRef.current.size}/${SEARCH_CONFIG.maxConcurrentSearches}`);
      return;
    }

    // Get next search from queue
    const queueIterator = searchQueueRef.current.entries();
    const nextEntry = queueIterator.next();
    
    if (nextEntry.done) {
      return; // Queue is empty
    }

    const [searchKey, searchItem] = nextEntry.value;
    const { query, type, attempts } = searchItem;

    // Move from queue to active
    searchQueueRef.current.delete(searchKey);
    activeSearchesRef.current.add(searchKey);
    updateQueueStatus();

    console.log(`🚀 Processing search: ${searchKey}, Active: ${activeSearchesRef.current.size}`);

    try {
      setIsSearching(true);
      const result = await executeSearch(query, type, searchKey);
      
      // Cache the result
      setCachedResult(searchKey, result);
      
      // Update UI
      setSearchData(prev => ({
        ...prev,
        [type]: result
      }));
      setShowResults(true);
      
      console.log(`✅ Search completed: ${searchKey}, Results: ${result.length}`);
      
    } catch (error) {
      console.error(`❌ Search failed: ${searchKey}`, error);
      
      // Retry logic
      if (attempts < SEARCH_CONFIG.retryAttempts) {
        console.log(`🔄 Retrying search: ${searchKey}, Attempt: ${attempts + 1}`);
        
        setTimeout(() => {
          searchQueueRef.current.set(searchKey, { 
            query, 
            type, 
            attempts: attempts + 1 
          });
          processSearchQueue();
        }, SEARCH_CONFIG.retryDelayMs * (attempts + 1));
      } else {
        // Set empty result after max retries
        setSearchData(prev => ({
          ...prev,
          [type]: []
        }));
        setShowResults(true);
      }
    } finally {
      // Remove from active searches
      activeSearchesRef.current.delete(searchKey);
      
      // Clean up abort controller
      searchAbortControllerRef.current.delete(searchKey);
      
      setIsSearching(activeSearchesRef.current.size > 0);
      updateQueueStatus();
      
      // Process next item in queue
      if (searchQueueRef.current.size > 0) {
        setTimeout(() => processSearchQueue(), 50);
      }
    }
  };

  const executeSearch = async (query, type, searchKey) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    
    // Create abort controller for this search
    const abortController = new AbortController();
    searchAbortControllerRef.current.set(searchKey, abortController);

    let endpoint = '';
    let dataKey = '';
    
    switch (type) {
      case 'users':
        endpoint = `/api/users/search?q=${encodeURIComponent(query)}`;
        dataKey = 'users';
        break;
      case 'posts':
        endpoint = `/api/posts?search=${encodeURIComponent(query)}`;
        dataKey = 'posts';
        break;
      case 'courses':
        endpoint = `/api/courses?search=${encodeURIComponent(query)}`;
        dataKey = 'courses';
        break;
      case 'events':
        endpoint = `/api/events?search=${encodeURIComponent(query)}`;
        dataKey = 'events';
        break;
      default:
        endpoint = `/api/users/search?q=${encodeURIComponent(query)}`;
        dataKey = 'users';
    }
    
    console.log(`🔍 Executing search: ${type} - ${apiUrl}${endpoint}`);
    
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortController.signal
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Search endpoint not found: ${endpoint}`);
          // Try alternative search
          return await executeAlternativeSearch(query, type, abortController.signal);
        }
        throw new Error(`HTTP ${response.status}: Không thể tìm kiếm ${type}`);
      }

      const data = await response.json();
      let results = data[dataKey] || data.data || data.results || data || [];
      
      // Client-side filtering for better search results
      if (type !== 'users' && Array.isArray(results)) {
        results = filterContentByQuery(results, query, type);
      }
      
      return Array.isArray(results) ? results : [];
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`🛑 Search aborted: ${searchKey}`);
        throw new Error('Search aborted');
      }
      throw error;
    }
  };

  const executeAlternativeSearch = async (query, type, signal) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    
    let endpoint = '';
    let dataKey = '';
    
    switch (type) {
      case 'posts':
        endpoint = '/api/posts';
        dataKey = 'posts';
        break;
      case 'courses':
        endpoint = '/api/courses';
        dataKey = 'courses';
        break;
      case 'events':
        endpoint = '/api/events';
        dataKey = 'events';
        break;
      default:
        return [];
    }
    
    const response = await fetch(`${apiUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      signal
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Alternative search failed`);
    }
    
    const data = await response.json();
    const allItems = data[dataKey] || data.data || [];
    
    return filterContentByQuery(allItems, query, type);
  };

  // Client-side filtering function for content-based search
  const filterContentByQuery = (items, query, type) => {
    if (!query || !Array.isArray(items)) return items;
    
    const searchTerm = query.toLowerCase().trim();
    
    return items.filter(item => {
      switch (type) {
        case 'posts':
          return (
            (item.title && item.title.toLowerCase().includes(searchTerm)) ||
            (item.content && item.content.toLowerCase().includes(searchTerm)) ||
            (item.Title && item.Title.toLowerCase().includes(searchTerm)) ||
            (item.Content && item.Content.toLowerCase().includes(searchTerm)) ||
            (item.description && item.description.toLowerCase().includes(searchTerm))
          );
        case 'courses':
          return (
            (item.Title && item.Title.toLowerCase().includes(searchTerm)) ||
            (item.title && item.title.toLowerCase().includes(searchTerm)) ||
            (item.Description && item.Description.toLowerCase().includes(searchTerm)) ||
            (item.description && item.description.toLowerCase().includes(searchTerm)) ||
            (item.ShortDescription && item.ShortDescription.toLowerCase().includes(searchTerm)) ||
            (item.Category && item.Category.toLowerCase().includes(searchTerm)) ||
            (item.category && item.category.toLowerCase().includes(searchTerm))
          );
        case 'events':
          return (
            (item.title && item.title.toLowerCase().includes(searchTerm)) ||
            (item.eventName && item.eventName.toLowerCase().includes(searchTerm)) ||
            (item.Title && item.Title.toLowerCase().includes(searchTerm)) ||
            (item.EventName && item.EventName.toLowerCase().includes(searchTerm)) ||
            (item.description && item.description.toLowerCase().includes(searchTerm)) ||
            (item.Description && item.Description.toLowerCase().includes(searchTerm)) ||
            (item.location && item.location.toLowerCase().includes(searchTerm))
          );
        default:
          return true;
      }
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSearchQueue();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
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
    setIsLoggingOut(true);
    try {
      // Add a 5-second delay to ensure the logout process isn't too quick
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Use the AuthContext's logout function for proper cleanup
      await logout();
      
      // Also dispatch Redux logout action to clear state
      dispatch(logoutAction());
      
      // Navigate to login page after logout
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Đã xảy ra lỗi khi đăng xuất');
    } finally {
      setIsLoggingOut(false);
    }
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
  
  // Show loading screen when logging out
  if (isLoggingOut) {
    return <Loading message="Đang đăng xuất..." variant="default" fullscreen={true} />;
  }

  // Constant for sidebar width
  const sidebarWidth = sidebarOpen ? '250px' : '70px';

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden text-gray-900 dark:text-gray-100"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
    >
      {/* Custom CSS for dropdown positioning */}
      <style jsx>{`
        .search-dropdown-up .search-results {
          bottom: 100%;
          top: auto;
          margin-bottom: 8px;
          margin-top: 0;
        }
        
        .sidebar-bottom .search-dropdown-up {
          position: relative;
        }
        
        .sidebar-bottom .search-dropdown-up .search-results {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          z-index: 50;
        }

        /* Full-width search bar when expanded */
        .search-expanded {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 100%;
          margin-bottom: 0;
          border-radius: 0;
          border-left: 0;
          border-right: 0;
        }

        .search-expanded .search-input {
          width: 100%;
        }

        /* Overlay search form */
        .search-overlay {
          position: absolute;
          left: 0;
          right: -120px; /* Extend beyond the sidebar to overlay other buttons */
          bottom: 0;
          background: white;
          z-index: 40;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .dark .search-overlay {
          background: #1F2937; /* dark mode bg */
        }

        .search-overlay-collapsed {
          right: -200px; /* Even wider for collapsed sidebar */
        }
      `}</style>
      
      {/* Main container with padding */}
      <div className="h-full w-full flex flex-col">
        {/* Unified form containing all layout elements */}
        <div className="flex flex-col w-full h-full bg-white dark:bg-gray-800 overflow-hidden">
          {/* Header - Only show when header navigation is enabled or on mobile */}
          {(isHeaderNavigation || window.innerWidth < 1024) && (
            <div className="border-b border-gray-200 dark:border-gray-700 z-50 bg-white dark:bg-gray-800 shadow-sm fixed top-0 left-0 right-0 w-full">
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

                  {/* Main Nav Links - Show in header when header navigation is enabled */}
                  {isHeaderNavigation && (
                    <nav className="hidden lg:flex items-center flex-nowrap space-x-3 md:space-x-4 lg:space-x-6 ml-2 md:ml-4 max-w-full">
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
                        <button className={`flex items-center space-x-1 whitespace-nowrap text-sm font-medium transition-colors hover:text-theme-primary ${['/chat','/friends','/stories'].some(p => location.pathname.startsWith(p)) ? 'text-theme-primary' : 'text-gray-600 dark:text-gray-300'}`}
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
                            <Link to="/stories" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap">
                              <PhotoIcon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
                              Stories
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
                  )}
                </div>

                {/* Right side navigation items - Only show when header navigation or mobile */}
                <div className="flex items-center justify-end space-x-3 sm:space-x-4">
                  {/* Mobile Menu Button - Only visible on mobile */}
                  <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-theme-accent hover:text-theme-primary dark:hover:bg-gray-700 focus:outline-none transition-all duration-200"
                  >
                    <Bars3Icon className="h-6 w-6" />
                  </button>
                  
                  {/* Show search, notifications, user menu only in header mode or mobile */}
                  {(isHeaderNavigation || window.innerWidth < 1024) && (
                    <>
                      {/* Unified Search */}
                      <div className="block">
                        <button 
                          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-theme-accent/50 relative transition-all duration-200 hover:text-theme-primary dark:hover:text-theme-secondary"
                          onClick={() => setShowSearchPanel(!showSearchPanel)}
                        >
                          <MagnifyingGlassIcon className="h-6 w-6" />
                        </button>
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
                      </div>
                      
                      {/* User Menu */}
                      <div className="relative" ref={userMenuRef}>
                        <button 
                          onClick={() => setShowUserMenu(prev => !prev)}
                          className="flex items-center p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-theme-accent/50 dark:hover:bg-theme-accent/20 transition-all duration-200 hover:text-theme-primary dark:hover:text-theme-secondary"
                        >
                          <Avatar
                            src={currentUser?.avatar || currentUser?.profileImage || currentUser?.Image}
                            name={currentUser?.fullName || currentUser?.username || currentUser?.FullName || 'User'}
                            alt={currentUser?.fullName || currentUser?.username || currentUser?.FullName || 'User'}
                            size="small"
                            className="ring-2 ring-theme-accent"
                          />
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
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Search panel - Global for all layouts */}
          {showSearchPanel && (
            <>
              <div
                className={`fixed top-0 right-0 w-80 h-full bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden ${
                  isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
                }`}
                style={{
                  paddingTop: 'env(safe-area-inset-top, 0px)',
                  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                  paddingLeft: 'env(safe-area-inset-left, 0px)',
                  paddingRight: 'env(safe-area-inset-right, 0px)'
                }}
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-theme-accent/50 to-white dark:from-gray-700 dark:to-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tìm kiếm</h3>
                    <button 
                      onClick={() => {
                        setShowSearchPanel(false);
                        setSearchQuery('');
                        setShowResults(false);
                        setSearchData({
                          users: [],
                          posts: [],
                          courses: [],
                          events: []
                        });
                      }}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  
                  {/* Search Input */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Tìm kiếm ${searchType === 'users' ? 'người dùng' : searchType === 'posts' ? 'bài viết' : searchType === 'courses' ? 'khóa học' : 'sự kiện'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                        autoFocus
                      />
                    </div>
                    
                    {/* Search Queue Status */}
                    {(searchQueueStatus.pending > 0 || searchQueueStatus.active > 0 || isSearching) && (
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                          {searchQueueStatus.active > 0 && (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border border-theme-primary border-t-transparent mr-1"></div>
                              <span>Đang tìm: {searchQueueStatus.active}</span>
                            </div>
                          )}
                          {searchQueueStatus.pending > 0 && (
                            <div className="flex items-center">
                              <div className="h-2 w-2 bg-yellow-500 rounded-full mr-1"></div>
                              <span>Hàng đợi: {searchQueueStatus.pending}</span>
                            </div>
                          )}
                          {searchQueueStatus.completed > 0 && (
                            <div className="flex items-center">
                              <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                              <span>Cache: {searchQueueStatus.completed}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Search performance indicator */}
                        <div className="text-theme-primary">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Search Tabs */}
                  <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    {[
                      { key: 'users', label: 'Người dùng', icon: UserGroupIcon },
                      { key: 'posts', label: 'Bài viết', icon: ChatBubbleLeftRightIcon },
                      { key: 'courses', label: 'Khóa học', icon: BookOpenIcon },
                      { key: 'events', label: 'Sự kiện', icon: CalendarIcon }
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={`search-tab-${key}`}
                        onClick={() => setSearchType(key)}
                        className={`flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors ${
                          searchType === key
                            ? 'text-theme-primary border-b-2 border-theme-primary bg-white dark:bg-gray-800'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Search Results */}
                  <div className="flex-1 overflow-y-auto">
                    {isSearching ? (
                      <div className="py-10 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tìm kiếm...</p>
                      </div>
                    ) : searchData[searchType]?.length > 0 ? (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {searchData[searchType].map((item, index) => {
                          // Generate unique key based on search type and item properties
                          const getItemKey = () => {
                            if (searchType === 'users') return `user-${item.UserID || item.id || index}`;
                            if (searchType === 'posts') return `post-${item.id || item.PostID || index}`;
                            if (searchType === 'courses') return `course-${item.CourseID || item.id || index}`;
                            if (searchType === 'events') return `event-${item.EventID || item.id || index}`;
                            return `search-item-${searchType}-${index}`;
                          };

                          return (
                            <div 
                              key={getItemKey()}
                              className="px-4 py-3.5 hover:bg-theme-accent/50 dark:hover:bg-theme-accent/20 cursor-pointer flex items-start transition-colors duration-150"
                              onClick={() => {
                                if (searchType === 'users') {
                                  handleUserClick(item.UserID || item.id);
                                } else if (searchType === 'posts') {
                                  navigate(`/posts?postId=${item.id || item.PostID}`);
                                } else if (searchType === 'courses') {
                                  navigate(`/courses/${item.CourseID || item.id}`);
                                } else if (searchType === 'events') {
                                  navigate(`/events/${item.EventID || item.id}`);
                                }
                                setShowSearchPanel(false);
                                setSearchQuery('');
                                setShowResults(false);
                              }}
                            >
                              {searchType === 'users' ? (
                                <>
                                  <Avatar
                                    src={item.ProfileImage || item.avatar || item.Image}
                                    name={item.FullName || item.Username || item.fullName || item.username}
                                    size="medium"
                                    className="mr-3 flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {item.FullName || item.Username || item.fullName || item.username}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      @{item.Username || item.username}
                                    </p>
                                  </div>
                                </>
                              ) : searchType === 'posts' ? (
                                <>
                                  <div className="bg-theme-accent/50 dark:bg-theme-accent/20 rounded-lg p-2 mr-3 flex-shrink-0">
                                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-theme-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                      {item.title || item.content || item.Title || item.Content}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {item.author || item.createdBy || item.Author || 'Không rõ tác giả'}
                                    </p>
                                  </div>
                                </>
                              ) : searchType === 'courses' ? (
                                <>
                                  <div className="bg-theme-accent/50 dark:bg-theme-accent/20 rounded-lg p-2 mr-3 flex-shrink-0">
                                    <BookOpenIcon className="h-5 w-5 text-theme-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                      {item.Title || item.title || item.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {item.Category || item.category || 'Không rõ danh mục'}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="bg-theme-accent/50 dark:bg-theme-accent/20 rounded-lg p-2 mr-3 flex-shrink-0">
                                    <CalendarIcon className="h-5 w-5 text-theme-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                      {item.title || item.eventName || item.Title || item.EventName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {item.date || item.eventDate || item.Date || 'Không rõ ngày'}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : searchQuery.length >= 2 ? (
                      <div className="py-12 text-center">
                        <div className="bg-theme-accent/50 dark:bg-theme-accent/20 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                          <MagnifyingGlassIcon className="h-8 w-8 text-theme-secondary" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Không tìm thấy {searchType === 'users' ? 'người dùng' : searchType === 'posts' ? 'bài viết' : searchType === 'courses' ? 'khóa học' : 'sự kiện'} nào
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Thử tìm kiếm với từ khóa khác</p>
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <div className="bg-theme-accent/50 dark:bg-theme-accent/20 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                          <MagnifyingGlassIcon className="h-8 w-8 text-theme-secondary" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Bắt đầu tìm kiếm</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Nhập ít nhất 2 ký tự để tìm kiếm</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Backdrop for search panel */}
              <div 
                className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
                  isClosing ? 'opacity-0' : 'bg-opacity-25 animate-fade-in'
                }`}
                onClick={() => {
                  setShowSearchPanel(false);
                  setSearchQuery('');
                  setShowResults(false);
                  setSearchData({
                    users: [],
                    posts: [],
                    courses: [],
                    events: []
                  });
                }}
              />
            </>
          )}
          
          {/* Notifications panel - Global for all layouts */}
          {showNotifications && (
            <>
              <div
                className={`fixed top-0 right-0 w-80 h-full bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden ${
                  isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
                }`}
                style={{
                  paddingTop: 'env(safe-area-inset-top, 0px)',
                  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                  paddingLeft: 'env(safe-area-inset-left, 0px)',
                  paddingRight: 'env(safe-area-inset-right, 0px)'
                }}
              >
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
              
              {/* Backdrop for notifications panel */}
              <div 
                className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
                  isClosing ? 'opacity-0' : 'bg-opacity-25 animate-fade-in'
                }`}
                onClick={closeNotificationsPanel}
              />
            </>
          )}
          
          {/* Sidebar Navigation - Show when sidebar navigation is enabled */}
          {!isHeaderNavigation && (
            <div className={`fixed left-0 ${isHeaderNavigation || window.innerWidth < 1024 ? 'top-16' : 'top-0'} bottom-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 ${
              sidebarOpen ? 'w-80' : 'w-20'
            } hidden lg:flex flex-col`}>
              {/* Sidebar Header with Logo only */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <CodeBracketIcon className="h-8 w-8 text-theme-primary flex-shrink-0" />
                  {sidebarOpen && (
                    <Link to="/home" className="hover:opacity-95 transition-all">
                      <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-theme-primary via-theme-secondary to-theme-hover">
                        CampusLearning
                      </span>
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Navigation Menu */}
              <div className="flex-1 overflow-y-auto p-4">
                <nav className="space-y-2">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href || 
                      (item.href !== '/home' && location.pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={item.onClick}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-theme-accent/70 text-theme-primary dark:bg-theme-accent/20' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {sidebarOpen && <span className="font-medium">{item.name}</span>}
                      </Link>
                    );
                  })}
                  
                  {/* Add Stories link to sidebar */}
                  <Link
                    to="/stories"
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      location.pathname.startsWith('/stories')
                        ? 'bg-theme-accent/70 text-theme-primary dark:bg-theme-accent/20' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <PhotoIcon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && <span className="font-medium">Stories</span>}
                  </Link>
                </nav>
              </div>
              
              {/* Bottom Action Section - User, Search, Notifications, Settings */}
              <div className="border-t border-gray-200 dark:border-gray-700">
                {sidebarOpen && (
                  <div className="p-4 flex items-center justify-between">
                    {/* User Avatar */}
                    <div className="relative" ref={userMenuRef}>
                      <button 
                        onClick={() => setShowUserMenu(prev => !prev)}
                        className="p-2 rounded-full hover:bg-theme-accent/50 transition-all duration-200"
                      >
                        <Avatar
                          src={currentUser?.avatar || currentUser?.profileImage || currentUser?.Image}
                          name={currentUser?.fullName || currentUser?.username || currentUser?.FullName || 'User'}
                          alt={currentUser?.fullName || currentUser?.username || currentUser?.FullName || 'User'}
                          size="medium"
                          className="ring-2 ring-theme-accent"
                        />
                      </button>

                      {/* User Dropdown - Position up */}
                      {showUserMenu && (
                        <div className="absolute bottom-full mb-2 left-0 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-30">
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
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Search */}
                      <div className="relative">
                        <button 
                          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-theme-accent/50 transition-all duration-200 hover:text-theme-primary dark:hover:text-theme-secondary"
                          onClick={() => setShowSearchPanel(!showSearchPanel)}
                        >
                          <MagnifyingGlassIcon className="h-5 w-5" />
                        </button>
                      </div>
                      
                      {/* Notifications */}
                      <button 
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-theme-accent/50 relative transition-all duration-200 hover:text-theme-primary dark:hover:text-theme-secondary"
                        onClick={() => setShowNotifications(!showNotifications)}
                      >
                        {unreadCount > 0 ? (
                          <>
                            <BellIconSolid className="h-5 w-5 text-theme-primary" />
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform bg-red-600 rounded-full">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          </>
                        ) : (
                          <BellIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Collapsed sidebar - only show essential buttons */}
                {!sidebarOpen && (
                  <div className="p-2 space-y-2">
                    {/* User Avatar */}
                    <div className="relative" ref={userMenuRef}>
                      <button 
                        onClick={() => setShowUserMenu(prev => !prev)}
                        className="w-full p-2 rounded-lg hover:bg-theme-accent/50 transition-all duration-200 flex justify-center"
                      >
                        <Avatar
                          src={currentUser?.avatar || currentUser?.profileImage || currentUser?.Image}
                          name={currentUser?.fullName || currentUser?.username || currentUser?.FullName || 'User'}
                          alt={currentUser?.fullName || currentUser?.username || currentUser?.FullName || 'User'}
                          size="small"
                          className="ring-2 ring-theme-accent"
                        />
                      </button>

                      {/* User Dropdown - Position up and to the right */}
                      {showUserMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-100 dark:border-gray-700 z-30">
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
                    
                    {/* Search */}
                    <div className="relative">
                      <button 
                        className="w-full p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-theme-accent/50 transition-all duration-200 hover:text-theme-primary dark:hover:text-theme-secondary flex justify-center"
                        onClick={() => setShowSearchPanel(!showSearchPanel)}
                      >
                        <MagnifyingGlassIcon className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* Notifications */}
                    <button 
                      className="w-full p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-theme-accent/50 relative transition-all duration-200 hover:text-theme-primary dark:hover:text-theme-secondary flex justify-center"
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      {unreadCount > 0 ? (
                        <>
                          <BellIconSolid className="h-5 w-5 text-theme-primary" />
                          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform bg-red-600 rounded-full">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        </>
                      ) : (
                        <BellIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Sidebar Toggle Button - Vertical Separator */}
          {!isHeaderNavigation && (
            <>
              {/* Toggle Button */}
              <div 
                className={`fixed ${isHeaderNavigation || window.innerWidth < 1024 ? 'top-16' : 'top-1/2 -translate-y-1/2'} z-50 hidden lg:block transition-all duration-300 ${
                  sidebarOpen ? 'left-[312px]' : 'left-[72px]'
                }`}
              >
                <button
                  onClick={toggleSidebar}
                  className="w-7 h-7 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg flex items-center justify-center border border-gray-200 dark:border-gray-600 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {sidebarOpen ? (
                    <ChevronLeftIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
              </div>

              {/* Vertical Separator Line */}
              <div 
                className={`fixed ${isHeaderNavigation || window.innerWidth < 1024 ? 'top-16' : 'top-0'} bottom-0 z-40 hidden lg:block transition-all duration-300 ${
                  sidebarOpen ? 'left-80' : 'left-20'
                }`}
              >
                <div className="h-full w-px bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </>
          )}
          
          {/* Main Content */}
          <div className={`flex-1 overflow-auto bg-white dark:bg-gray-800 ${
            isHeaderNavigation || window.innerWidth < 1024 ? 'pt-16' : 'pt-0'
          } ${
            !isHeaderNavigation ? (sidebarOpen ? 'lg:ml-80' : 'lg:ml-20') : ''
          }`}>
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
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className={`fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-800 shadow-xl z-40 transform transition-all duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              paddingLeft: 'env(safe-area-inset-left, 0px)',
              paddingRight: 'env(safe-area-inset-right, 0px)'
            }}
          >
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <CodeBracketIcon className="h-8 w-8 text-theme-primary mr-3" />
                  <span className="font-bold text-xl">CampusLearning</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              {/* User Profile */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center">
                  <Avatar
                    src={currentUser?.avatar || currentUser?.profileImage || currentUser?.Image}
                    name={currentUser?.fullName || currentUser?.username || currentUser?.FullName || 'User'}
                    alt={currentUser?.fullName || currentUser?.username || currentUser?.FullName || 'User'}
                    size="large"
                    className="ring-2 ring-theme-accent"
                  />
                </div>
              </div>
              
              {/* Mobile Menu Items */}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                  {navigation.map((item) => {
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
                  
                  {/* Add Stories link to mobile menu */}
                  <Link
                    to="/stories"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                      location.pathname.startsWith('/stories')
                        ? 'bg-theme-accent/70 text-theme-primary dark:bg-theme-accent/20' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <PhotoIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Stories</span>
                  </Link>
                </div>
              </div>
              
              {/* Mobile Menu Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MainLayout;