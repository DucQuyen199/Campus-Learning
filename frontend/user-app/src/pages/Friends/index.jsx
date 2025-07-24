/*-----------------------------------------------------------------
* File: index.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  UserCircleIcon,
  UserPlusIcon,
  UserMinusIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ExclamationCircleIcon,
  UsersIcon,
  ArrowLeftIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { Avatar } from '../../components';

const Friends = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get('userId');
  
  const [activeTab, setActiveTab] = useState(() => {
    // Restore the last active tab from sessionStorage
    const savedTab = sessionStorage.getItem('friendsActiveTab');
    return savedTab || 'all';
  }); // 'all', 'pending', 'sent', 'suggestions', 'search'
  const [friends, setFriends] = useState(() => {
    const saved = sessionStorage.getItem('friends');
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingRequests, setPendingRequests] = useState(() => {
    const saved = sessionStorage.getItem('pendingRequests');
    return saved ? JSON.parse(saved) : [];
  });
  const [sentRequests, setSentRequests] = useState(() => {
    const saved = sessionStorage.getItem('sentRequests');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ type: null, message: null });
  const [viewingUser, setViewingUser] = useState(null);
  const [isOwnFriends, setIsOwnFriends] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchDiff, setTouchDiff] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fix the mobile height issue with viewport height
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  const fetchFriendships = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (!isOnline) {
        // Sử dụng dữ liệu từ cache nếu không có kết nối
        const cachedFriends = sessionStorage.getItem('friends');
        const cachedPendingRequests = sessionStorage.getItem('pendingRequests');
        const cachedSentRequests = sessionStorage.getItem('sentRequests');
        
        if (cachedFriends) setFriends(JSON.parse(cachedFriends));
        if (cachedPendingRequests) setPendingRequests(JSON.parse(cachedPendingRequests));
        if (cachedSentRequests) setSentRequests(JSON.parse(cachedSentRequests));
        
        showNotification('error', 'Không có kết nối mạng. Hiển thị dữ liệu đã lưu.');
        setLoading(false);
        return;
      }

      // Get friends - either current user's or specified user's
      let endpoint = '/api/friendships';
      if (userId) {
        endpoint = `/api/friendships/user/${userId}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout

      try {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login', { 
            state: { message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' }
          });
          return;
        }

        if (!response.ok) {
          throw new Error('Không thể tải danh sách bạn bè');
        }

        const data = await response.json();
        console.log('API response data:', data);
        
        // Handle the response data
        if (userId) {
          // For other user's profile, we get a direct array of friends
          setFriends(data);
        } else {
          // For current user's profile, we get categorized lists
          setFriends(data.friends || []);
          setPendingRequests(data.pendingRequests || []);
          if (data.sentRequests && Array.isArray(data.sentRequests)) {
            console.log('Setting sent requests from API:', data.sentRequests);
            setSentRequests(data.sentRequests);
          } else {
            console.warn('No sentRequests array in API response or invalid format:', data.sentRequests);
          }
          console.log('Setting sent requests:', data.sentRequests || []);
          
          // Lưu vào sessionStorage để khôi phục khi reload
          sessionStorage.setItem('friends', JSON.stringify(data.friends || []));
          sessionStorage.setItem('pendingRequests', JSON.stringify(data.pendingRequests || []));
          sessionStorage.setItem('sentRequests', JSON.stringify(data.sentRequests || []));
          sessionStorage.setItem('friendsLastFetched', Date.now().toString());
        }
      } catch (err) {
        // Nếu bị abort do timeout, hiển thị thông báo phù hợp
        if (err.name === 'AbortError') {
          showNotification('error', 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        } else {
          console.error('Error fetching friendships:', err);
          setError(err.message);
        }
        
        // Sử dụng dữ liệu từ cache nếu có lỗi
        const cachedFriends = sessionStorage.getItem('friends');
        const cachedPendingRequests = sessionStorage.getItem('pendingRequests');
        const cachedSentRequests = sessionStorage.getItem('sentRequests');
        
        if (cachedFriends) setFriends(JSON.parse(cachedFriends));
        if (cachedPendingRequests) setPendingRequests(JSON.parse(cachedPendingRequests));
        if (cachedSentRequests) setSentRequests(JSON.parse(cachedSentRequests));
      } finally {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error in fetchFriendships:', err);
      setLoading(false);
    }
  }, [userId, navigate, isOnline]);

  // Search users functionality
  const searchUsers = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      
      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Add debounce to avoid too many requests
      searchTimeoutRef.current = setTimeout(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Không thể tìm kiếm người dùng');
        }

        const data = await response.json();
        
        // Filter out users already in friends/requests lists
        const friendIds = new Set(friends.map(f => f.UserID));
        const pendingIds = new Set(pendingRequests.map(p => p.UserID));
        const sentIds = new Set(sentRequests.map(s => s.UserID));
        
        // Get current user ID
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = currentUser.id;
        
        // Filter out current user and users with existing relationships
        const filteredResults = data.filter(user => 
          user.UserID !== currentUserId && 
          !friendIds.has(user.UserID) && 
          !pendingIds.has(user.UserID) &&
          !sentIds.has(user.UserID)
        );
        
        setSearchResults(filteredResults);
        
        // Auto switch to search tab if there are results
        if (filteredResults.length > 0) {
          setActiveTab('search');
        }
      }, 500); // 500ms debounce
    } catch (err) {
      console.error('Error searching users:', err);
      showNotification('error', 'Không thể tìm kiếm người dùng');
    } finally {
      setSearchLoading(false);
    }
  }, [friends, pendingRequests, sentRequests, navigate]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchUsers(value);
  };

  useEffect(() => {
    if (userId) {
      fetchUserInfo();
      setIsOwnFriends(false);
      // When viewing someone else's friends, only show the 'all' tab
      setActiveTab('all');
    } else {
      setIsOwnFriends(true);
    }
    
    fetchFriendships();
  }, [userId, fetchFriendships]);

  useEffect(() => {
    // Only fetch suggestions when on the suggestions tab and it's the user's own friends page
    if (activeTab === 'suggestions' && isOwnFriends && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [activeTab, isOwnFriends]);

  useEffect(() => {
    if (activeTab === 'pending' && isOwnFriends) {
      fetchFriendships();
    }
  }, [activeTab, isOwnFriends, fetchFriendships]);

  // Debug logs for sent requests tab
  useEffect(() => {
    if (activeTab === 'sent') {
      console.log('Current sent requests:', sentRequests);
      console.log('Sent requests from sessionStorage:', JSON.parse(sessionStorage.getItem('sentRequests') || '[]'));
    }
  }, [activeTab, sentRequests]);

  // Force fetch data when switching to sent tab
  useEffect(() => {
    if (activeTab === 'sent' && isOwnFriends) {
      // Fetch new data directly from API when on sent tab
      console.log('Fetching sent requests from API...');
      
      const fetchSentRequests = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          // Show loading state
          setLoading(true);
          
          // Get data from API
          const response = await fetch('/api/friendships', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch sent requests');
          }
          
          const data = await response.json();
          console.log('Fresh API data for sent requests:', data);
          
          // Update state with latest data
          if (data && data.sentRequests) {
            setSentRequests(data.sentRequests);
            // Update sessionStorage as well
            sessionStorage.setItem('sentRequests', JSON.stringify(data.sentRequests));
          }
        } catch (error) {
          console.error('Error fetching sent requests:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchSentRequests();
    }
  }, [activeTab, isOwnFriends]);

  // Helper function to fetch sent requests directly
  const fetchSentRequestsOnly = async () => {
    try {
      console.log('Fetching just sent requests...');
      const token = localStorage.getItem('token');
      if (!token) return [];
      
      const response = await fetch('/api/friendships', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sent requests');
      }
      
      const data = await response.json();
      console.log('API data for direct sent requests fetch:', data);
      
      return data.sentRequests || [];
    } catch (error) {
      console.error('Error fetching sent requests directly:', error);
      return [];
    }
  };

  useEffect(() => {
    // Khôi phục dữ liệu từ sessionStorage khi component mount
    const restoreDataFromSession = () => {
      try {
        // Chỉ khôi phục dữ liệu nếu đang xem trang bạn bè của mình
        if (!userId) {
          const lastFetched = sessionStorage.getItem('friendsLastFetched');
          const now = Date.now();
          // Chỉ sử dụng dữ liệu cache nếu nó được lấy trong vòng 5 phút
          const isRecent = lastFetched && (now - parseInt(lastFetched)) < 5 * 60 * 1000;
          
          if (isRecent) {
            const cachedFriends = sessionStorage.getItem('friends');
            const cachedPendingRequests = sessionStorage.getItem('pendingRequests');
            const cachedSentRequests = sessionStorage.getItem('sentRequests');
            
            if (cachedFriends) setFriends(JSON.parse(cachedFriends));
            if (cachedPendingRequests) setPendingRequests(JSON.parse(cachedPendingRequests));
            if (cachedSentRequests) setSentRequests(JSON.parse(cachedSentRequests));
            
            // Vẫn tiếp tục fetch ở background để cập nhật dữ liệu mới nhất
            fetchFriendships();
          } else {
            // Nếu không có dữ liệu hoặc dữ liệu cũ, fetch mới
            fetchFriendships();
          }
        } else {
          // Nếu đang xem trang bạn bè của người khác, luôn fetch mới
          fetchFriendships();
        }
      } catch (error) {
        console.error('Error restoring session data:', error);
        fetchFriendships();
      }
    };

    restoreDataFromSession();
  }, [userId, fetchFriendships]);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải thông tin người dùng');
      }

      const data = await response.json();
      setViewingUser(data);
    } catch (err) {
      console.error('Error fetching user info:', err);
      setError(err.message);
    }
  };

  const fetchSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/friendships/suggestions/random', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { 
          state: { message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' }
        });
        return;
      }

      if (!response.ok) {
        throw new Error('Không thể tải gợi ý kết bạn');
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching friend suggestions:', err);
      setError(err.message);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const loadMoreSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/friendships/suggestions/random', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải thêm gợi ý kết bạn');
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error loading more suggestions:', err);
      setError(err.message);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const acceptFriendRequest = async (userId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Check if the request still exists
      const requestExists = pendingRequests.some(request => request.UserID === userId);
      if (!requestExists) {
        showNotification('error', 'Lời mời kết bạn không còn tồn tại');
        return;
      }

      const response = await fetch(`/api/friendships/${userId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Could not accept friend request');
      }

      // Update local state
      const updatedUser = pendingRequests.find(user => user.UserID === userId);
      if (updatedUser) {
        const newFriends = [...friends, updatedUser];
        const newPendingRequests = pendingRequests.filter(user => user.UserID !== userId);
        
        setFriends(newFriends);
        setPendingRequests(newPendingRequests);
        
        // Cập nhật sessionStorage
        sessionStorage.setItem('friends', JSON.stringify(newFriends));
        sessionStorage.setItem('pendingRequests', JSON.stringify(newPendingRequests));
        sessionStorage.setItem('friendsLastFetched', Date.now().toString());
      }

      showNotification('success', 'Đã chấp nhận lời mời kết bạn');
    } catch (err) {
      console.error('Error accepting friend request:', err);
      showNotification('error', 'Không thể chấp nhận lời mời kết bạn');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectFriendRequest = async (userId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Check if the request still exists
      const requestExists = pendingRequests.some(request => request.UserID === userId);
      if (!requestExists) {
        showNotification('error', 'Lời mời kết bạn không còn tồn tại');
        return;
      }

      const response = await fetch(`/api/friendships/${userId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Could not reject friend request');
      }

      // Update local state
      const newPendingRequests = pendingRequests.filter(user => user.UserID !== userId);
      setPendingRequests(newPendingRequests);
      
      // Cập nhật sessionStorage
      sessionStorage.setItem('pendingRequests', JSON.stringify(newPendingRequests));
      sessionStorage.setItem('friendsLastFetched', Date.now().toString());

      showNotification('success', 'Đã từ chối lời mời kết bạn');
    } catch (err) {
      console.error('Error rejecting friend request:', err);
      showNotification('error', 'Không thể từ chối lời mời kết bạn');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelFriendRequest = async (userId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Check if the request still exists
      const requestExists = sentRequests.some(request => request.UserID === userId);
      if (!requestExists) {
        showNotification('error', 'Lời mời kết bạn không còn tồn tại');
        return;
      }

      const response = await fetch(`/api/friendships/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Could not cancel friend request');
      }

      // Update local state
      const newSentRequests = sentRequests.filter(user => user.UserID !== userId);
      setSentRequests(newSentRequests);
      
      // Cập nhật sessionStorage
      sessionStorage.setItem('sentRequests', JSON.stringify(newSentRequests));
      sessionStorage.setItem('friendsLastFetched', Date.now().toString());

      showNotification('success', 'Đã hủy lời mời kết bạn');
    } catch (err) {
      console.error('Error canceling friend request:', err);
      showNotification('error', 'Không thể hủy lời mời kết bạn');
    } finally {
      setActionLoading(false);
    }
  };

  const removeFriend = async (userId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/friendships/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Could not remove friend');
      }

      // Update local state
      const newFriends = friends.filter(user => user.UserID !== userId);
      setFriends(newFriends);
      
      // Cập nhật sessionStorage
      sessionStorage.setItem('friends', JSON.stringify(newFriends));
      sessionStorage.setItem('friendsLastFetched', Date.now().toString());

      showNotification('success', 'Đã hủy kết bạn');
    } catch (err) {
      console.error('Error removing friend:', err);
      showNotification('error', 'Không thể hủy kết bạn');
    } finally {
      setActionLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Check if already sent a request
      const alreadySent = sentRequests.some(request => request.UserID === userId);
      if (alreadySent) {
        showNotification('error', 'Bạn đã gửi lời mời kết bạn cho người này');
        return;
      }

      console.log('Sending friend request to user ID:', userId);
      const response = await fetch('/api/friendships', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ addresseeId: userId })
      });

      if (!response.ok) {
        throw new Error('Không thể gửi lời mời kết bạn');
      }

      const data = await response.json();
      console.log('Friend request sent successfully, API response:', data);
      
      // Update local state - move from suggestions to sent requests
      const requestedUser = suggestions.find(user => user.UserID === userId);
      if (requestedUser) {
        // Add the new sent request to the list
        const newSentRequests = [...sentRequests, {
          ...requestedUser,
          FriendshipID: data.friendship.FriendshipID,
          Status: 'pending',
          CreatedAt: data.friendship.RequestedAt
        }];
        
        console.log('Adding to sent requests:', newSentRequests);
        setSentRequests(newSentRequests);
        // Remove from suggestions
        const newSuggestions = suggestions.filter(user => user.UserID !== userId);
        setSuggestions(newSuggestions);
        
        // Cập nhật sessionStorage
        sessionStorage.setItem('sentRequests', JSON.stringify(newSentRequests));
        sessionStorage.setItem('friendsLastFetched', Date.now().toString());
      }

      // Get the most up-to-date sent requests from the API
      const delayMs = 1000; // Wait for 1 second to allow backend to update
      setTimeout(async () => {
        try {
          const updatedSentRequests = await fetchSentRequestsOnly();
          console.log('Updated sent requests after direct API call:', updatedSentRequests);
          
          if (updatedSentRequests && updatedSentRequests.length > 0) {
            setSentRequests(updatedSentRequests);
            sessionStorage.setItem('sentRequests', JSON.stringify(updatedSentRequests));
          }
        } catch (error) {
          console.error('Error fetching updated sent requests:', error);
        }
      }, delayMs);

      // Fetch the updated list of sent requests after a short delay
      setTimeout(() => {
        try {
          fetch('/api/friendships', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          })
          .then(response => {
            if (response.ok) return response.json();
            throw new Error('Failed to fetch updated sent requests');
          })
          .then(data => {
            if (data && data.sentRequests) {
              console.log('Updated sent requests from API after sending:', data.sentRequests);
              setSentRequests(data.sentRequests);
              sessionStorage.setItem('sentRequests', JSON.stringify(data.sentRequests));
            }
          })
          .catch(error => {
            console.error('Error fetching updated sent requests:', error);
          });
        } catch (error) {
          console.error('Error in fetch updated requests:', error);
        }
      }, 1000);

      showNotification('success', 'Đã gửi lời mời kết bạn');
    } catch (err) {
      console.error('Error sending friend request:', err);
      showNotification('error', 'Không thể gửi lời mời kết bạn');
    } finally {
      setActionLoading(false);
    }
  };

  const navigateToProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const navigateToChat = (userData) => {
    // Prepare complete user data to pass to the chat page
    const userDataForChat = {
      UserID: userData.UserID,
      id: userData.UserID,
      FullName: userData.FullName || userData.Username,
      Username: userData.Username,
      Email: userData.Email,
      Image: userData.Image || userData.Avatar
    };
    
    // Navigate to chat page with user data
    navigate(`/chat`, { 
      state: { 
        selectedUser: userDataForChat,
        source: 'friends'
      } 
    });
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: null, message: null });
    }, 3000);
  };

  const navigateBack = () => {
    if (userId) {
      navigate(`/profile/${userId}`);
    } else {
      navigate('/profile');
    }
  };

  // New function for filtering users based on search term
  const filterUsers = (users) => {
    if (!searchTerm.trim()) return users;
    return users.filter(user => 
      (user.FullName && user.FullName.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (user.Username && user.Username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.School && user.School.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Add pull-to-refresh functionality
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        setTouchStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e) => {
      if (touchStartY > 0 && window.scrollY === 0) {
        const diff = e.touches[0].clientY - touchStartY;
        if (diff > 0) {
          setTouchDiff(Math.min(diff, 100));
        }
      }
    };

    const handleTouchEnd = () => {
      if (touchDiff > 70) {
        handleRefresh();
      }
      setTouchStartY(0);
      setTouchDiff(0);
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStartY, touchDiff]);

  // Add refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFriendships();
    if (activeTab === 'suggestions') {
      await fetchSuggestions();
    }
    setIsRefreshing(false);
    setLastRefreshed(new Date());
  };

  // Update the renderNotification function
  const renderNotification = () => {
    if (notification.message) {
      return (
        <div className={`fixed top-4 right-4 ${
          notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        } px-6 py-4 rounded-xl shadow-lg z-50 flex items-center justify-between transition-all duration-300 ease-in-out backdrop-blur-sm border border-white/50 max-w-md`}>
          <div className="flex items-center">
            {notification.type === 'success' 
              ? <CheckIcon className="h-5 w-5 mr-3 text-green-500" /> 
              : <ExclamationCircleIcon className="h-5 w-5 mr-3 text-red-500" />}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification({ type: null, message: null })} className="ml-4">
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      );
    }
    return null;
  };

  // Theo dõi trạng thái kết nối mạng
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Tự động kiểm tra lời mời kết bạn mới mỗi 30 giây khi ở tab "pending"
  useEffect(() => {
    if (!isOwnFriends || activeTab !== 'pending' || !isOnline) return;

    const checkNewRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/friendships', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) return;

        const data = await response.json();
        const newPendingRequests = data.pendingRequests || [];
        
        // So sánh với danh sách hiện tại để tìm lời mời mới
        if (newPendingRequests.length > pendingRequests.length) {
          // Có lời mời mới
          setPendingRequests(newPendingRequests);
          sessionStorage.setItem('pendingRequests', JSON.stringify(newPendingRequests));
          
          // Hiển thị thông báo nếu có lời mời mới
          const newRequestsCount = newPendingRequests.length - pendingRequests.length;
          if (newRequestsCount > 0) {
            showNotification('success', `Bạn có ${newRequestsCount} lời mời kết bạn mới`);
          }
        }
      } catch (error) {
        console.error('Error checking for new requests:', error);
      }
    };

    // Chạy ngay lần đầu và sau đó mỗi 30 giây
    checkNewRequests();
    const intervalId = setInterval(checkNewRequests, 30000);
    
    return () => clearInterval(intervalId);
  }, [activeTab, isOwnFriends, isOnline, pendingRequests.length]);

  // Hiển thị trạng thái kết nối mạng
  const renderNetworkStatus = () => {
    if (!isOnline) {
      return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm shadow-md border border-red-100 z-50 flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          <span>Không có kết nối mạng - Đang hiển thị dữ liệu đã lưu</span>
        </div>
      );
    }
    return null;
  };

  // For sent tab, show loading state when fetching
  const showSentLoading = activeTab === 'sent' && loading;

  // Persist active tab so it survives page reloads
  useEffect(() => {
    sessionStorage.setItem('friendsActiveTab', activeTab);
  }, [activeTab]);

  // Show full-screen spinner only if no cached data exists
  if (loading && friends.length === 0 && pendingRequests.length === 0 && sentRequests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Get the list of users to display based on active tab
  const displayedUsers = 
    activeTab === 'all' ? friends : 
    activeTab === 'pending' ? pendingRequests : 
    activeTab === 'suggestions' ? suggestions :
    activeTab === 'search' ? searchResults :
    sentRequests;

  // Filter based on search term for non-search tabs
  const filteredUsers = activeTab !== 'search' 
    ? filterUsers(displayedUsers)
    : displayedUsers;
  
  console.log('Active tab:', activeTab);
  console.log('Displayed users:', displayedUsers);
  console.log('Filtered users:', filteredUsers);

  // Determine if we should show loading for suggestions tab
  const showTabLoading = 
    (activeTab === 'suggestions' && suggestionsLoading) ||
    (activeTab === 'search' && searchLoading);

  return (
    <div className="w-full min-h-screen bg-gray-50/50" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* Network status indicator */}
      {renderNetworkStatus()}
      
      {/* Pull to refresh indicator */}
      {touchDiff > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center bg-white border-b border-gray-200"
          style={{ height: `${touchDiff}px`, opacity: touchDiff / 100 }}
        >
          <div className="flex items-center">
            <ArrowPathIcon 
              className={`h-5 w-5 mr-2 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} 
              style={{ transform: `rotate(${touchDiff * 3.6}deg)` }}
            />
            <span className="text-sm text-gray-600">
              {touchDiff > 70 ? 'Thả để làm mới' : 'Kéo xuống để làm mới'}
            </span>
          </div>
        </div>
      )}

      {/* Notification */}
      {renderNotification()}

      {/* Refresh status */}
      {lastRefreshed && !isRefreshing && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm border border-gray-100 z-40">
          Cập nhật lần cuối: {lastRefreshed.toLocaleTimeString()}
        </div>
      )}

      {/* Mobile header - Always visible on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={navigateBack}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="ml-2 text-lg font-bold text-gray-900">Bạn bè</h1>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={() => setMobileSearchVisible(!mobileSearchVisible)}
              className="p-2 mr-1 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 mr-1 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Mobile search bar */}
        {mobileSearchVisible && (
          <div className="px-3 pb-3 animate-fadeDown">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 transition-all"
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="flex h-screen md:pt-0 pt-16" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
        {/* Left Sidebar - Can be toggled on mobile */}
        <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 transition-transform duration-300 ease-in-out 
          fixed md:static top-0 left-0 bottom-0 z-30 
          md:w-80 w-3/4 bg-white border-r border-gray-200 flex flex-col h-full relative 
          md:pt-0 pt-16`}
          style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
        >
          {/* Loading indicator at top of sidebar */}
          {isRefreshing && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 overflow-hidden">
              <div className="h-full bg-blue-300 animate-pulse" style={{ width: '30%' }}></div>
            </div>
          )}

          {/* Close button for mobile sidebar */}
          <div className="md:hidden absolute top-4 right-4">
            <button 
              onClick={() => setShowSidebar(false)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Header */}
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <button 
                onClick={navigateBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all md:block hidden"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 md:block hidden">Bạn bè</h1>
              <button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className={`p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all ${isRefreshing ? 'opacity-50' : ''} md:block hidden`}
              >
                <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Search Bar - Hidden on mobile when using the top search bar */}
            <div className="relative md:block hidden">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 transition-all"
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Tab Navigation */}
          {isOwnFriends && (
            <div className="p-2 md:p-3 overflow-auto">
              <nav className="space-y-1">
                {[
                  { id: 'all', icon: UsersIcon, label: 'Tất cả bạn bè', count: friends.length },
                  { id: 'pending', icon: ClockIcon, label: 'Lời mời nhận', count: pendingRequests.length },
                  { id: 'sent', icon: UserPlusIcon, label: 'Đã gửi', count: sentRequests.length },
                  { id: 'suggestions', icon: SparklesIcon, label: 'Gợi ý', count: null },
                  { id: 'search', icon: MagnifyingGlassIcon, label: 'Tìm kiếm', count: searchResults.length > 0 ? searchResults.length : null }
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={`w-full px-3 md:px-4 py-3 rounded-xl font-medium flex items-center justify-between ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    } transition-all duration-200`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (window.innerWidth < 768) {
                        setShowSidebar(false);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'} mr-2 md:mr-3`} />
                      <span className="text-sm md:text-base">{tab.label}</span>
                    </div>
                    {tab.count !== null && (
                      <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-xs ${
                        activeTab === tab.id 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Semi-transparent overlay when sidebar is shown on mobile */}
        {showSidebar && window.innerWidth < 768 && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto pb-16 md:pb-0">
          {/* Show loading indicator when refreshing */}
          {isRefreshing && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 overflow-hidden">
              <div className="h-full bg-blue-300 animate-pulse" style={{ width: '30%' }}></div>
            </div>
          )}

          <div className="p-3 md:p-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3 md:mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                {activeTab === 'all' && 'Tất cả bạn bè'}
                {activeTab === 'pending' && 'Lời mời kết bạn'}
                {activeTab === 'sent' && 'Lời mời đã gửi'}
                {activeTab === 'suggestions' && 'Gợi ý kết bạn'}
                {activeTab === 'search' && 'Kết quả tìm kiếm'}
              </h2>
              {activeTab === 'suggestions' && (
                <button 
                  onClick={loadMoreSuggestions}
                  className="flex items-center px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Tải thêm gợi ý</span>
                  <span className="sm:hidden">Tải thêm</span>
                </button>
              )}
              {activeTab === 'sent' && (
                <button 
                  onClick={() => {
                    setLoading(true);
                    fetchFriendships().finally(() => setLoading(false));
                  }}
                  className="flex items-center px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Làm mới danh sách</span>
                  <span className="sm:hidden">Làm mới</span>
                </button>
              )}
            </div>

            {/* Loading State */}
            {(showTabLoading || showSentLoading) && (
              <div className="flex items-center justify-center h-40 md:h-64">
                <div className="flex flex-col items-center space-y-3 md:space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-[3px] border-blue-600 border-t-transparent"></div>
                  <p className="text-sm text-gray-500 font-medium">Đang tải...</p>
                </div>
              </div>
            )}

            {/* User Grid */}
            {!showTabLoading && !showSentLoading && filteredUsers.length > 0 && (
              <>
                {/* Mobile layout: dọc, card đơn giản, nút full width */}
                <div className="grid grid-cols-1 gap-2 sm:hidden px-2">
                  {activeTab === 'sent' && filteredUsers.map(user => (
                    <div key={user.UserID} className="w-full max-w-sm mx-auto bg-white rounded-xl p-3 border border-gray-200 flex flex-col gap-2">
                      <Avatar 
                        src={user.Image || user.Avatar} 
                        name={user.FullName || user.Username}
                        size="xl"
                        className="rounded-xl mb-2"
                      />
                      <div className="w-full">
                        <div className="font-semibold text-gray-900 truncate text-left">{user.FullName || user.Username}</div>
                        <div className="text-xs text-gray-500 truncate mb-1 text-left">@{user.Username}</div>
                        <div className="flex items-center text-xs text-gray-400 mb-2 text-left">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Đã gửi: {new Date(user.CreatedAt || Date.now()).toLocaleDateString('vi-VN')}
                        </div>
                        <button
                          onClick={() => cancelFriendRequest(user.UserID)}
                          className="w-full px-3 py-2.5 text-xs border border-red-100 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center font-medium"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1.5" />
                          Hủy lời mời
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop layout giữ nguyên */}
                <div className={`hidden sm:grid ${activeTab === 'sent' ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'} gap-2 md:gap-4`}>
                  {filteredUsers.map(user => (
                    <div 
                      key={user.UserID}
                      className={`bg-white rounded-xl ${activeTab === 'sent' ? 'p-4 md:p-5' : 'p-3 md:p-4'} border border-gray-200 hover:shadow-md transition-all group`}
                    >
                      <div className="flex items-start space-x-2 md:space-x-4">
                        {/* Avatar */}
                        <div className="relative">
                          <Avatar 
                            src={user.Image || user.Avatar} 
                            name={user.FullName || user.Username}
                            size="xl"
                            className="rounded-xl"
                          />
                          <div className={`absolute -bottom-1 -right-1 h-3 w-3 md:h-4 md:w-4 rounded-full border-2 border-white ${
                            user.Status === 'ONLINE' ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                        </div>
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div 
                            className="cursor-pointer"
                            onClick={() => navigateToProfile(user.UserID)}
                          >
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {user.FullName || user.Username}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-500 truncate">@{user.Username}</p>
                            {user.School && (
                              <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1 truncate">
                                {user.School}
                              </p>
                            )}
                          </div>
                          {/* Action Buttons */}
                          <div className="mt-2 md:mt-4 flex items-center space-x-2">
                            {isOwnFriends && (
                              <>
                                {activeTab === 'sent' && (
                                  <>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                                      <ClockIcon className="h-4 w-4" />
                                      <span>Đã gửi: {new Date(user.CreatedAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <button
                                      onClick={() => cancelFriendRequest(user.UserID)}
                                      className="flex-1 px-3 py-2.5 text-xs md:text-sm border border-red-100 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                                    >
                                      <XMarkIcon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                                      Hủy lời mời
                                    </button>
                                  </>
                                )}
                                {/* Các tab khác giữ nguyên */}
                                {activeTab === 'all' && (
                                  <>
                                    <button
                                      onClick={() => navigateToChat(user)}
                                      className="flex-1 px-2 md:px-3 py-2 text-xs md:text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                                    >
                                      <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                                      Nhắn tin
                                    </button>
                                    <button
                                      onClick={() => removeFriend(user.UserID)}
                                      className="px-2 md:px-3 py-2 text-xs md:text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <UserMinusIcon className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                                {activeTab === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => acceptFriendRequest(user.UserID)}
                                      className="flex-1 px-2 md:px-3 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                    >
                                      <CheckIcon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                                      Đồng ý
                                    </button>
                                    <button
                                      onClick={() => rejectFriendRequest(user.UserID)}
                                      className="flex-1 px-2 md:px-3 py-2 text-xs md:text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                                    >
                                      <XMarkIcon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                                      Từ chối
                                    </button>
                                  </>
                                )}
                                {(activeTab === 'suggestions' || activeTab === 'search') && (
                                  <button
                                    onClick={() => sendFriendRequest(user.UserID)}
                                    className="flex-1 px-2 md:px-3 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                  >
                                    <UserPlusIcon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                                    Kết bạn
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Empty State */}
            {!showTabLoading && !showSentLoading && filteredUsers.length === 0 && (
              <div className="text-center py-8 md:py-12">
                <div className="bg-gray-50 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <UserCircleIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 md:mb-2">
                  {activeTab === 'all' ? 'Chưa có bạn bè nào' : 
                   activeTab === 'pending' ? 'Không có lời mời kết bạn nào' :
                   activeTab === 'suggestions' ? 'Chưa có gợi ý bạn bè' :
                   activeTab === 'search' ? 'Không tìm thấy kết quả phù hợp' :
                   'Chưa gửi lời mời nào'}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 max-w-xs md:max-w-sm mx-auto">
                  {activeTab === 'all' 
                    ? 'Hãy kết bạn với nhiều người để mở rộng mạng lưới của bạn.' 
                    : activeTab === 'pending' 
                      ? 'Bạn không có lời mời kết bạn nào vào lúc này.'
                      : activeTab === 'suggestions'
                        ? 'Chúng tôi sẽ gợi ý những người phù hợp để bạn kết bạn.'
                        : activeTab === 'search'
                          ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xem các gợi ý kết bạn.'
                          : 'Bạn chưa gửi lời mời kết bạn cho ai.'}
                </p>
                {activeTab === 'sent' && (
                  <button 
                    onClick={() => {
                      setLoading(true);
                      fetchFriendships().finally(() => setLoading(false));
                    }}
                    className="mt-3 md:mt-4 px-4 py-2 text-xs md:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    Làm mới danh sách
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 md:hidden">
        <div className="flex items-center justify-around py-2">
          {[
            { id: 'all', icon: UsersIcon, label: 'Bạn bè' },
            { id: 'pending', icon: ClockIcon, label: 'Lời mời', badge: pendingRequests.length },
            { id: 'suggestions', icon: SparklesIcon, label: 'Gợi ý' },
            { id: 'sent', icon: UserPlusIcon, label: 'Đã gửi', badge: sentRequests.length }
          ].map(tab => (
            <button
              key={tab.id}
              className={`flex flex-col items-center justify-center px-2 py-1 ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="relative">
                <tab.icon className="h-5 w-5" />
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Add CSS to help with mobile viewport issues
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeDown {
    animation: fadeDown 0.2s ease-out;
  }
`;
document.head.appendChild(style);

export default Friends; 
