/*-----------------------------------------------------------------
* File: index.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { format } from 'date-fns';
import Avatar from '../../components/common/Avatar';
import { chatApi } from '../../api/chatApi';
import { 
  CalendarIcon, 
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  PhoneIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import CallButtons from '../../components/call/CallButtons';
import { useCall } from '../../contexts/CallContext';
import CallInterface from '../../components/call/CallInterface';

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentConversation, setCurrentConversation] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const messageCacheRef = useRef({});
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchUsers, setSearchUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [isRefreshingConversations, setIsRefreshingConversations] = useState(false);
  const [groupImage, setGroupImage] = useState(null);
  const [groupImagePreview, setGroupImagePreview] = useState(null);
  const [userSearchPage, setUserSearchPage] = useState(1);
  const fileInputRef = useRef(null);
  const socket = useRef();
  const scrollRef = useRef();
  const initialConversationsFetchedRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { initiateCall } = useCall();

  // Add these new state variables for call functionality
  const [inCall, setInCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callLoading, setCallLoading] = useState(false);

  // Add a new state for showing group members modal
  const [showGroupMembers, setShowGroupMembers] = useState(false);

  // Add a state to hold members of current group fetched from server
  const [groupMembers, setGroupMembers] = useState([]);

  // Modal states
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [potentialMembers, setPotentialMembers] = useState([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Group edit states
  const [activeTab, setActiveTab] = useState('members');
  const [editGroupName, setEditGroupName] = useState('');
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [newGroupImage, setNewGroupImage] = useState(null);
  const [newGroupImagePreview, setNewGroupImagePreview] = useState(null);
  const [groupDescription, setGroupDescription] = useState('');
  const [isSavingGroupInfo, setIsSavingGroupInfo] = useState(false);

  // Determine if current user is group admin
  const isGroupAdmin = currentConversation?.Participants?.some(p =>
    (p.UserID || p.id) === (user?.UserID || user?.id) && p.ConversationParticipant?.Role === 'admin'
  );

  // Function to fetch group members from database
  const fetchGroupMembers = async (conversationId) => {
    try {
      const conv = await chatApi.getConversationById(conversationId);
      setGroupMembers(conv.Participants || []);
    } catch (error) {
      console.error('Error fetching group members:', error);
      showError('Không thể tải danh sách thành viên nhóm');
    }
  };

  // Clear members list when group members modal closes
  useEffect(() => {
    if (!showGroupMembers) setGroupMembers([]);
    if (!showAddMembers) {
      setPotentialMembers([]);
      setSelectedNewMembers([]);
      setMemberSearchTerm('');
    }
  }, [showGroupMembers, showAddMembers]);

  // Initialize the edit form when the modal opens
  useEffect(() => {
    if (showGroupMembers && currentConversation) {
      setEditGroupName(currentConversation.Title || '');
      setGroupDescription(currentConversation.Description || '');
      setNewGroupImage(null);
      setNewGroupImagePreview(null);
    }
  }, [showGroupMembers, currentConversation]);

  // Add a function to handle audio calls
  const handleAudioCall = (userId, userName) => {
    try {
      initiateCall(userId, 'audio');
    } catch (error) {
      showError(error.message || 'Failed to start audio call');
    }
  };

  // Add a function to handle video calls
  const handleVideoCall = (userId, userName) => {
    try {
      initiateCall(userId, 'video');
    } catch (error) {
      showError(error.message || 'Failed to start video call');
    }
  };

  // Function to end an ongoing call
  const endCall = () => {
    setInCall(false);
    setIsVideoCall(false);
  };

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError(null);
        
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/events?limit=5`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        setEvents(response.data.events || []);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEventsError('Không thể tải danh sách sự kiện');
      } finally {
        setEventsLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  // Format date for events
  const formatEventDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return date;
    }
  };

  // Format time for events
  const formatEventTime = (time) => {
    if (!time) return '';
    try {
      return time.substring(0, 5);
    } catch (e) {
      console.error('Error formatting time:', e);
      return time;
    }
  };

  // Navigate to event detail page
  const handleViewEventDetail = (eventId) => {
    if (!eventId) {
      showError('ID sự kiện không hợp lệ');
      return;
    }
    navigate(`/events/${eventId}`);
  };

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Handle user coming from profile page
  const handleUserFromProfile = async (selectedUser) => {
    try {
      // Ensure we have user data loaded
      if (!user || !user.UserID) {
        console.error('Current user data not loaded yet');
        showError('Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau khi tải dữ liệu người dùng.');
        return;
      }

      console.log('Handling user from profile:', selectedUser);
      
      // Extract user ID from the selected user (handle both UserID and id fields)
      const userId = selectedUser.UserID || selectedUser.id;
      if (!userId) {
        console.error('Invalid user from profile - missing ID:', selectedUser);
        showError('Không thể tìm thấy ID người dùng đã chọn.');
        return;
      }
      
      // Get current user's ID
      const currentUserId = user.UserID || user.id;
      if (!currentUserId) {
        console.error('Invalid current user - missing ID:', user);
        showError('Không thể tìm thấy ID người dùng hiện tại.');
        return;
      }
      
      // Don't create conversation with yourself
      if (Number(userId) === Number(currentUserId)) {
        console.error('Cannot create conversation with yourself');
        showError('Không thể tạo cuộc trò chuyện với chính bạn.');
        return;
      }
      
      console.log(`Looking for existing conversation between user ${currentUserId} and ${userId}`);
      
      // Make sure conversations are loaded before proceeding
      if (!conversations || conversations.length === 0) {
        console.log('No conversations loaded yet, fetching them first');
        try {
          await fetchConversations();
        } catch (error) {
          console.error('Failed to fetch conversations:', error);
          showError('Không thể tải danh sách cuộc trò chuyện.');
          return;
        }
      }
      
      // Check if this conversation was recently created (within last minute)
      // to avoid duplicate creation on page refreshes
      const lastCreatedTime = localStorage.getItem(`conversation_created_${userId}`);
      if (lastCreatedTime) {
        const now = new Date().getTime();
        const elapsedTime = now - parseInt(lastCreatedTime);
        if (elapsedTime < 60000) { // 1 minute
          console.log('This conversation was recently created, skipping recreation');
          
          // Try to find the existing conversation by participant
          const existingConv = conversations.find(conv => {
            return conv.Type !== 'group' && conv.Participants && conv.Participants.some(
              p => Number(p.UserID) === Number(userId) || Number(p.id) === Number(userId)
            );
          });
          
          if (existingConv) {
            console.log('Found recently created conversation, selecting it');
            handleConversationSelect(existingConv);
            return;
          }
        } else {
          // Remove the expired entry
          localStorage.removeItem(`conversation_created_${userId}`);
        }
      }
      
      // Look for existing conversation with this user
      let existingConversation = conversations.find(conv => {
        // Only check direct conversations, not group chats
        if (conv.Type === 'group') return false;
        
        // Check if the other user is a participant
        return conv.Participants && conv.Participants.some(
          p => Number(p.UserID) === Number(userId) || Number(p.id) === Number(userId)
        );
      });
      
      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.ConversationID);
        handleConversationSelect(existingConversation);
        return;
      }
      
      // No existing conversation found, create a new one
      console.log('No existing conversation found, creating new one');
      
      try {
        // Create a new conversation
        const newConversation = await chatApi.createConversation({
          title: null, // No title for direct messages
          type: 'private',
          createdBy: currentUserId,
          participants: [Number(userId)] // Add the target user
        });
        
        console.log('New conversation created:', newConversation);
        
        // Mark this conversation as recently created
        localStorage.setItem(`conversation_created_${userId}`, new Date().getTime().toString());
        
        // Add the new conversation to the list with the selected user info
        const conversationWithUser = {
          ...newConversation,
          Participants: [
            {
              UserID: currentUserId,
              Username: user.Username,
              FullName: user.FullName,
              Image: user.Image || user.Avatar
            },
            {
              UserID: userId,
              Username: selectedUser.Username,
              FullName: selectedUser.FullName || selectedUser.Username,
              Image: selectedUser.Image || selectedUser.Avatar
            }
          ],
          Messages: []
        };
        
        // Update conversations list
        setConversations(prev => [conversationWithUser, ...prev]);
        
        // Set the current conversation immediately
        setCurrentConversation(conversationWithUser);
        
        // Save selected conversation to localStorage
        localStorage.setItem('currentConversationId', conversationWithUser.ConversationID);
        
        // If it's a private conversation, set the selected user
        if (selectedUser) {
          setSelectedUser({
            ...selectedUser,
            UserID: userId,
            FullName: selectedUser.FullName || selectedUser.Username,
            Image: selectedUser.Image || selectedUser.Avatar
          });
        }
        
        // Refresh conversations to get the proper data from server
        setTimeout(() => {
          fetchConversations(0, true).catch(err => {
            console.log('Failed to refresh conversations after creation:', err);
          });
        }, 500);
        
      } catch (createError) {
        console.error('Error creating new conversation:', createError);
        
        // If creation fails but we already have conversations, select the first one as fallback
        if (conversations && conversations.length > 0) {
          console.log('Using first conversation as fallback');
          handleConversationSelect(conversations[0]);
        }
        
        showError('Không thể tạo cuộc trò chuyện mới. Hiển thị danh sách trò chuyện hiện có.');
      }
    } catch (error) {
      console.error('Error in handleUserFromProfile:', error);
      showError('Đã xảy ra lỗi khi xử lý hồ sơ người dùng.');
    }
  };

  // Connect to Socket.io server and set up event handlers
  useEffect(() => {
    if (!user) return; // Don't connect if user isn't loaded
    
    // Only connect socket once
    if (!socket.current) {
      console.log('Initializing socket connection...');
      
      // Create socket connection with auth token
      socket.current = io(import.meta.env.VITE_API_URL, {
        auth: { token: localStorage.getItem('token') },
        transports: ['websocket', 'polling'], // Prefer WebSocket
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
      
      // Setup connection event handlers
      socket.current.on('connect', () => {
        console.log('Socket connected successfully');
      });
      
      socket.current.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      socket.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      // Set up event listener for online users
      socket.current.on('getUsers', (users) => {
        setOnlineUsers(users);
      });
      
      // Listen for new messages
      socket.current.on('new-message', (message) => {
        // Add message to state if it belongs to the current conversation
        if (currentConversation && message.ConversationID === currentConversation.ConversationID) {
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages, message];
            // Also update cache
            messageCacheRef.current[currentConversation.ConversationID] = updatedMessages;
            return updatedMessages;
          });
        }
        
        // Play notification sound for new messages
        const audio = new Audio('/sounds/message.mp3');
        audio.play().catch(e => console.log('Error playing sound:', e));
      });
      
      // Listen for conversation updates
      socket.current.on('conversation-updated', ({ conversationId, lastMessage }) => {
        setConversations(prevConversations => {
          // Find the conversation that needs to be updated
          const conversationIndex = prevConversations.findIndex(
            c => c.ConversationID === conversationId
          );
          
          if (conversationIndex === -1) {
            // If conversation not found, fetch all conversations
            fetchConversations(0, true);
            return prevConversations;
          }
          
          // Update the conversation with the new message
          const conversation = prevConversations[conversationIndex];
          const updatedConversation = {
            ...conversation,
            LastMessageAt: new Date().toISOString(),
            Messages: [lastMessage, ...(conversation.Messages || []).slice(1)]
          };
          
          // Remove the updated conversation and add it to the top
          return [
            updatedConversation,
            ...prevConversations.filter(c => c.ConversationID !== conversationId)
          ];
        });
      });
    }

    // Clean up socket connection when component unmounts
    return () => {
      // Only disconnect on full component unmount
      if (socket.current) {
        console.log('Component unmounting, cleaning up socket connection');
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [user]); // Only depend on user

  // Optimized fetch for user data with better error handling
  useEffect(() => {
    let mounted = true;
    
    const fetchUser = async () => {
      try {
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login');
          navigate('/login');
          return;
        }
        
        // Get current user data
        const userResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000 // 8 second timeout
        });
        
        if (!mounted) return;
        
        if (!userResponse.data) {
          console.log('Invalid user data response');
          navigate('/login');
          return;
        }
        
        setUser(userResponse.data);
        
        // Handle selectedUser from profile navigation
        if (location.state?.selectedUser) {
          console.log('User navigated from profile page with:', location.state.selectedUser);
          handleUserFromProfile(location.state.selectedUser);
          return; // Don't proceed with conversation loading since handleUserFromProfile will handle it
        }
        
        // Restore conversations and selected conversation will be handled in the useEffect 
        // that watches for user state changes
        // Set loading to false after user data is fetched
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user:', error);
        if (mounted) {
          if (error.response?.status === 401) {
            navigate('/login');
          } else {
            setError('Failed to load user data. Please refresh the page.');
            setLoading(false);
          }
        }
      }
    };

    // Set loading to false immediately to show UI while data is being fetched
    setLoading(false);
    fetchUser();
    
    return () => {
      mounted = false;
    };
  }, [navigate, location.state]);
  
  // Optimized fetchConversations with proper caching
  const fetchConversations = async (retryCount = 0, forceRefresh = false) => {
    // Ensure user is loaded before fetching conversations
    if (!user || !user.UserID) {
      console.log('Delaying conversation fetch: user not loaded yet');
      return Promise.reject(new Error('User not loaded yet'));
    }
    
    // Use an actual state variable to prevent race conditions
    if (isRefreshingConversations) {
      console.log('Already refreshing conversations, skipping duplicate fetch');
      return Promise.resolve(conversations); 
    }
    
    // Set refreshing flag
    setIsRefreshingConversations(true);
    setLoading(true); // Set loading state while fetching
    
    try {
      console.log('Fetching conversations...');
      
      // Use AbortController for proper timeout handling
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 15000);
      
      // Get ETag from localStorage if available
      const etag = localStorage.getItem('conversationsEtag');
      
      // Set up headers with ETag for conditional request
      const headers = { 
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      };
      
      // Only send If-None-Match if not forcing refresh
      if (!forceRefresh && etag) {
        headers['If-None-Match'] = etag;
      }
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/conversations`, {
        headers,
        signal: abortController.signal,
        validateStatus: function (status) {
          // Accept 304 Not Modified as a valid status
          return (status >= 200 && status < 300) || status === 304;
        }
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // If server responded with 304 Not Modified, use current data
      if (response.status === 304) {
        console.log('Server returned 304 Not Modified, using cached conversations');
        // Save last check time even if we got a 304
        localStorage.setItem('lastConversationsRefresh', Date.now().toString());
        // If empty conversations array, open create group modal
        if (conversations.length === 0 && !initialConversationsFetchedRef.current) {
          initialConversationsFetchedRef.current = true;
          setShowCreateGroup(true);
        }
        setLoading(false);
        return conversations;
      }
      
      // Store the new ETag if provided
      const newEtag = response.headers.etag;
      if (newEtag) {
        localStorage.setItem('conversationsEtag', newEtag);
      }
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`Loaded ${response.data.length} conversations`);
        
        // Sort conversations by last message time
        const sortedConversations = [...response.data].sort((a, b) => {
          const dateA = a.LastMessageAt ? new Date(a.LastMessageAt) : new Date(0);
          const dateB = b.LastMessageAt ? new Date(b.LastMessageAt) : new Date(0);
          return dateB - dateA;
        });
        
        // Update conversations state
        setConversations(sortedConversations);
        
        // Save current time as last refresh time
        localStorage.setItem('lastConversationsRefresh', Date.now().toString());
        // If empty conversations array, open create group modal
        if (sortedConversations.length === 0 && !initialConversationsFetchedRef.current) {
          initialConversationsFetchedRef.current = true;
          setTimeout(() => setShowCreateGroup(true), 100);
        }
        
        // Mark as fetched
        initialConversationsFetchedRef.current = true;
        setLoading(false);
        
        // Return conversations for further processing
        return sortedConversations;
      } else {
        console.error('Invalid conversations data format:', response.data);
        setLoading(false);
        if (conversations.length > 0) {
          return conversations;
        }
        return [];
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
      
      // Handle specific errors
      if (error.name === 'AbortError') {
        console.log('Fetch conversations timed out');
      } else if (error.response && error.response.status === 401) {
        console.log('Unauthorized, redirecting to login...');
        navigate('/login');
        return [];
      }
      
      // If fail count is less than 2, retry with exponential backoff
      if (retryCount < 2) {
        const nextRetryDelay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying fetch conversations in ${nextRetryDelay}ms (attempt ${retryCount + 1}/3)...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, nextRetryDelay));
        
        // Reset refreshing flag before retry
        setIsRefreshingConversations(false);
        
        return fetchConversations(retryCount + 1);
      }
      
      // After all retries, return existing conversations or empty array
      return conversations.length > 0 ? conversations : [];
    } finally {
      setIsRefreshingConversations(false);
    }
  };
  
  // Fetch conversations with better logic to prevent continuous loading
  useEffect(() => {
    // Add a debounce mechanism to prevent rapid consecutive calls
    let fetchTimeout;
    
    // Only fetch when user is loaded and !isRefreshingConversations
    if (user && !isRefreshingConversations) {
      clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => {
        // Only fetch if first load or cache expired
        const lastRefreshTime = localStorage.getItem('lastConversationsRefresh');
        const currentTime = Date.now();
        const shouldFetch =
          !lastRefreshTime ||
          (currentTime - parseInt(lastRefreshTime)) > 30000;
        
        if (shouldFetch) {
          fetchConversations()
            .then(loadedConversations => {
              // On first fetch, if no conversations, open the create-group modal
              if (!initialConversationsFetchedRef.current) {
                initialConversationsFetchedRef.current = true;
                if (loadedConversations.length === 0) {
                  setShowCreateGroup(true);
                  return;
                }
              }
              // Restore previously selected conversation or select first conversation
              const savedConversationId = localStorage.getItem('currentConversationId');
              
              if (savedConversationId && !currentConversation) {
                // Find the saved conversation
                const savedConversation = loadedConversations.find(c => 
                  c.ConversationID === parseInt(savedConversationId)
                );
                
                if (savedConversation) {
                  console.log('Restoring previously selected conversation:', savedConversation.ConversationID);
                  handleConversationSelect(savedConversation);
                } else if (loadedConversations.length > 0) {
                  // If saved conversation not found but we have conversations, select the first one
                  console.log('Saved conversation not found, selecting first conversation');
                  localStorage.removeItem('currentConversationId');
                  handleConversationSelect(loadedConversations[0]);
                }
              } else if (loadedConversations.length > 0 && !currentConversation) {
                // If no saved conversation, select the first one
                handleConversationSelect(loadedConversations[0]);
              }
            })
            .catch(error => {
              console.error('Failed to fetch conversations:', error);
              // If fetch fails but we have no conversations, show create group modal
              if (conversations.length === 0 && !initialConversationsFetchedRef.current) {
                initialConversationsFetchedRef.current = true;
                setShowCreateGroup(true);
              }
            });
        }
      }, 100); // Reduce delay to make UI more responsive
    }
    
    return () => {
      clearTimeout(fetchTimeout);
    };
  }, [user, isRefreshingConversations, currentConversation]);

  // Handle sending a message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation) return;

    // Store message to prevent duplicates in case of retries
    const messageText = newMessage.trim();
    const messageId = `msg_${Date.now()}`;
    
    // Clear input immediately for better UX
    setNewMessage('');
    
    // Mark message as pending
    const pendingMessage = {
      MessageID: messageId,
      ConversationID: currentConversation.ConversationID,
      Content: messageText,
      CreatedAt: new Date().toISOString(),
      Sender: {
        UserID: user.UserID || user.id,
        Username: user.Username,
        FullName: user.FullName,
        Image: user.Image
      },
      isPending: true
    };
    
    // Add pending message to UI immediately
    setMessages(prevMessages => {
      const updated = [...prevMessages, pendingMessage];
      messageCacheRef.current[currentConversation.ConversationID] = updated;
      return updated;
    });
    
    try {
      // Send message to server using the chatApi service
      const response = await chatApi.sendMessage(currentConversation.ConversationID, { content: messageText });

      // Replace pending message with actual message in UI
      setMessages(prevMessages => {
        const updated = prevMessages.map(msg =>
          msg.MessageID === messageId ? { ...response, Sender: pendingMessage.Sender } : msg
        );
        messageCacheRef.current[currentConversation.ConversationID] = updated;
        return updated;
      });
      
      // Update the conversations list to move this conversation to the top
      const updatedConversation = {
        ...currentConversation,
        LastMessageAt: new Date().toISOString(), // Update the timestamp
        Messages: [
          { // Add the new message to the conversation
            ...response,
            Sender: {
              UserID: user.UserID || user.id,
              Username: user.Username,
              FullName: user.FullName,
              Image: user.Image
            }
          },
          ...(currentConversation.Messages || []).slice(1) // Keep other messages
        ]
      };
      
      // Remove the current conversation from the list and add the updated one at the top
      setConversations(prevConversations => [
        updatedConversation,
        ...prevConversations.filter(c => c.ConversationID !== currentConversation.ConversationID)
      ]);
      setCurrentConversation(updatedConversation);
      
      // Mark last conversations refresh time
      localStorage.setItem('lastConversationsRefresh', Date.now().toString());
      
      // Emit socket event for real-time updates
      if (socket.current) {
        socket.current.emit('message-sent', {
          conversationId: currentConversation.ConversationID,
          message: response
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark message as failed in UI
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.MessageID === messageId ? { ...msg, isError: true, isPending: false } : msg
        )
      );
      
      // Display error to user
      showError('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
    }
  };

  // Add back the handleConversationSelect function
  const handleConversationSelect = async (conv) => {
    // Load messages from cache: in-memory or localStorage, fallback to conv.Messages
    const convId = conv.ConversationID;
    const inMemory = messageCacheRef.current[convId];
    if (inMemory) {
      setMessages(inMemory);
    } else {
      const localCache = localStorage.getItem(`chat_messages_${convId}`);
      if (localCache) {
        try {
          const parsed = JSON.parse(localCache);
          if (Array.isArray(parsed)) {
            setMessages(parsed);
            messageCacheRef.current[convId] = parsed;
          }
        } catch (e) {
          console.error('Error parsing localStorage messages:', e);
          // Fallback to server-provided messages
          if (conv.Messages && conv.Messages.length > 0) {
            setMessages(conv.Messages);
          } else {
            setMessages([]);
          }
        }
      } else if (conv.Messages && conv.Messages.length > 0) {
        setMessages(conv.Messages);
      } else {
        setMessages([]);
      }
    }
    console.log('Selecting conversation:', conv.ConversationID);
    // For group chats, fetch full conversation with participants
    let selectedConv = conv;
    if (conv.Type === 'group') {
      try {
        selectedConv = await chatApi.getConversationById(conv.ConversationID);
      } catch (error) {
        console.error('Error loading full group conversation:', error);
      }
    }
    setCurrentConversation(selectedConv);
    // Save selected conversation to localStorage
    localStorage.setItem('currentConversationId', selectedConv.ConversationID);
    
    if (selectedConv.Type !== 'group') {
      const others = getOtherParticipants(selectedConv);
      if (others.length > 0) {
        const otherUser = others[0];
        setSelectedUser({
          ...otherUser,
          UserID: otherUser.UserID || otherUser.id,
          FullName: otherUser.FullName || otherUser.Username,
          Email: otherUser.Email,
          Phone: otherUser.Phone,
          Bio: otherUser.Bio,
          Image: getUserAvatar(otherUser)
        });
      } else {
        setSelectedUser(null);
      }
    } else {
      setSelectedUser(null);
    }
  };

  // Get other participants in a conversation (excluding current user)
  const getOtherParticipants = (conversation) => {
    if (!conversation?.Participants || !user) return [];
    const currentUserId = user.UserID || user.id;
    return conversation.Participants.filter(p => {
      const id = p.UserID || p.id;
      return id !== currentUserId;
    });
  };

  // Get conversation display name based on participants
  const getConversationName = (conversation) => {
    if (!conversation) return '';
    
    if (conversation.Type === 'group' && conversation.Title) {
      return conversation.Title;
    }
    
    const others = getOtherParticipants(conversation);
    if (others.length === 0) {
      // If the conversation has no other participants but has messages
      if (conversation.Messages?.length > 0 && conversation.Messages[0].Sender) {
        return conversation.Messages[0].Sender.FullName || conversation.Messages[0].Sender.Username;
      }
      // If the conversation has a creator
      if (conversation.CreatedBy === user?.UserID) {
        return 'New Conversation';
      }
      // Get the creator's name if available
      const creator = conversation.Participants?.find(p => p.UserID === conversation.CreatedBy);
      return creator ? (creator.FullName || creator.Username) : 'New Conversation';
    }
    
    return others.map(p => p.FullName || p.Username).join(', ');
  };

  // Helper function to get user avatar from different possible field names
  const getUserAvatar = (user) => {
    if (!user) return null;
    return user.Image || user.Avatar || user.avatar || user.profileImage || user.profile_image;
  };

  // Get avatar info for conversation
  const getConversationAvatarInfo = (conversation) => {
    if (!conversation) return { src: null, name: '' };

    if (conversation.Type === 'group') {
      return {
        src: null,
        name: conversation.Title || 'Group Chat'
      };
    }

    const others = getOtherParticipants(conversation);
    if (others.length === 0) {
      // If the conversation has messages, use the sender's info
      if (conversation.Messages?.length > 0 && conversation.Messages[0].Sender) {
        const sender = conversation.Messages[0].Sender;
        return {
          src: getUserAvatar(sender),
          name: sender.FullName || sender.Username
        };
      }
      // If the conversation has a creator
      const creator = conversation.Participants?.find(p => p.UserID === conversation.CreatedBy);
      if (creator) {
        return {
          src: getUserAvatar(creator),
          name: creator.FullName || creator.Username
        };
      }
      return {
        src: null,
        name: 'New Conversation'
      };
    }

    const otherUser = others[0];
    return {
      src: getUserAvatar(otherUser),
      name: otherUser.FullName || otherUser.Username
    };
  };

  // Helper function to check if a user is online
  const isUserOnline = (userId) => {
    if (!userId || !onlineUsers) return false;
    return onlineUsers.some(user => user?.UserID === userId || user?.id === userId);
  };

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Chưa cập nhật';
    }
  };

  // Fetch messages when conversation changes
  useEffect(() => {
    let abortController;
    const fetchMessages = async () => {
      if (!currentConversation) return;
      // Check in-memory cache first or localStorage
      const convId = currentConversation.ConversationID;
      const inMemory = messageCacheRef.current[convId];
      if (inMemory) {
        setMessages(inMemory);
      } else {
        const localCache = localStorage.getItem(`chat_messages_${convId}`);
        if (localCache) {
          try {
            const parsed = JSON.parse(localCache);
            if (Array.isArray(parsed)) {
              setMessages(parsed);
              messageCacheRef.current[convId] = parsed;
            }
          } catch (e) {
            console.error('Error parsing localStorage messages:', e);
          }
        }
      }
      // Otherwise, fetch messages from API
      abortController = new AbortController();
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/chat/messages/${currentConversation.ConversationID}`,
          { 
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            signal: abortController.signal
          }
        );
        setMessages(response.data);
        // Cache messages
        messageCacheRef.current[currentConversation.ConversationID] = response.data;
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
    return () => {
      abortController?.abort();
    };
  }, [currentConversation]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (currentConversation?.ConversationID && Array.isArray(messages)) {
      try {
        localStorage.setItem(
          `chat_messages_${currentConversation.ConversationID}`,
          JSON.stringify(messages)
        );
      } catch (e) {
        console.error('Error saving messages to localStorage:', e);
      }
    }
  }, [messages, currentConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => {
    const conversationName = getConversationName(conv).toLowerCase();
    const lastMessage = conv.Messages?.[0]?.Content?.toLowerCase() || '';
    return conversationName.includes(searchTerm.toLowerCase()) || 
           lastMessage.includes(searchTerm.toLowerCase());
  });

  // Show error message function (simple alternative to Chakra toast)
  const showError = (message) => {
    setError(message);
    // Auto-hide after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  // Add this function to safely format dates
  const safeFormatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return '';
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // New function to search users
  const handleUserSearch = async (query, loadMore = false) => {
    setUserSearchTerm(query);
    setIsSearchingUsers(true);
    
    // Determine page to load
    const page = loadMore ? userSearchPage + 1 : 1;
    
    try {
      let users = [];
      
      if (!query || query.length < 2) {
        // If no query or too short, load suggested users instead
        users = await chatApi.getSuggestedUsers(20, page); // Always load 20 users at a time
      } else {
        // Otherwise perform search with the query - search all users from database
        users = await chatApi.searchUsers(query, 30, page); // Load 30 results for search
      }
      
      // Filter out current user and already selected users
      const filteredUsers = users.filter(u => 
        (u.UserID !== user?.UserID && u.UserID !== user?.id) && 
        !selectedUsers.some(selected => 
          selected.UserID === u.UserID || selected.UserID === u.id
        )
      );
      
      // Update the page
      setUserSearchPage(page);
      
      // Only update state if the search term hasn't changed during the API call
      // or if we're loading suggested users (empty query)
      if (query === userSearchTerm || !query) {
        if (loadMore) {
          // Append users when loading more
          setSearchUsers(prev => {
            // Filter out duplicates by UserID
            const existingIds = new Set(prev.map(u => u.UserID || u.id));
            const uniqueNewUsers = filteredUsers.filter(u => !existingIds.has(u.UserID || u.id));
            return [...prev, ...uniqueNewUsers];
          });
        } else {
          // Replace users when doing a new search
          setSearchUsers(filteredUsers);
        }
      }
    } catch (error) {
      console.error('Error searching/suggesting users:', error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Handle group image upload
  const handleGroupImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image.*')) {
      showError('Vui lòng chọn một tệp hình ảnh.');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setGroupImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
    
    // Save file for upload
    setGroupImage(file);
  };
  
  // Clear group image
  const clearGroupImage = () => {
    setGroupImage(null);
    setGroupImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add user to selected list
  const selectUser = (user) => {
    const updated = [...selectedUsers, user];
    setSelectedUsers(updated);
    localStorage.setItem('chat_create_group_selectedUsers', JSON.stringify(updated));
    setSearchUsers(searchUsers.filter(u => u.UserID !== user.UserID));
    setUserSearchTerm('');
    
    // After selecting a user, load new suggestions
    handleUserSearch('');
  };

  // Remove user from selected list
  const removeSelectedUser = (userId) => {
    const updated = selectedUsers.filter(u => u.UserID !== userId);
    setSelectedUsers(updated);
    localStorage.setItem('chat_create_group_selectedUsers', JSON.stringify(updated));
    
    // Refresh suggestions when removing a user
    handleUserSearch(userSearchTerm);
  };

  // Handle persistence and loading suggestions when create group modal opens/closes
  useEffect(() => {
    if (showCreateGroup) {
      // Load persisted selected users
      const saved = localStorage.getItem('chat_create_group_selectedUsers');
      if (saved) {
        try { setSelectedUsers(JSON.parse(saved)); } catch {}
      }
      // Load suggested users for modal
      handleUserSearch('');
    } else {
      // Modal closed, clear selected users and persisted data
      setSelectedUsers([]);
      localStorage.removeItem('chat_create_group_selectedUsers');
    }
  }, [showCreateGroup]);

  // Create group conversation
  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    
    try {
      setLoading(true);
      const currentUserId = user?.UserID || user?.id;
      
      if (!currentUserId) {
        showError('Không thể tạo nhóm. Vui lòng đăng nhập lại.');
        return;
      }
      
      // Include current user in the participants list
      const participants = [
        ...selectedUsers.map(u => u.UserID || u.id),
        currentUserId
      ];
      
      const data = {
        title: groupName,
        type: 'group',
        participants: participants
      };
      
      // Create new conversation first
      try {
        const newConversation = await chatApi.createConversation(data);
        
        // If we have a group image, upload it
        if (groupImage) {
          try {
            const formData = new FormData();
            formData.append('image', groupImage);
            formData.append('conversationId', newConversation.ConversationID);
            
            await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/conversations/${newConversation.ConversationID}/image`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            // Update the new conversation with the image URL if available in response
            if (newConversation.ImageUrl) {
              newConversation.ImageUrl = `${import.meta.env.VITE_API_URL}/uploads/groups/${newConversation.ConversationID}.jpg`;
            }
          } catch (imageError) {
            console.error('Error uploading group image:', imageError);
            // Continue with group creation even if image upload fails
          }
        }
        
        // Add the new conversation to the list and select it
        setConversations([newConversation, ...conversations]);
        setCurrentConversation(newConversation);
        
        // Reset group creation state
        setGroupName('');
        setSelectedUsers([]);
        setGroupImage(null);
        setGroupImagePreview(null);
        setShowCreateGroup(false);
      } catch (apiError) {
        console.error('Error creating group:', apiError);
        
        // Handle specific error cases
        if (apiError.data && apiError.data.message) {
          if (apiError.data.message.includes('Validation error') || 
              apiError.data.message.includes('duplicate') || 
              apiError.data.message.includes('unique constraint') ||
              apiError.data.message.includes('already exists')) {
            showError('Nhóm chat với thành viên này đã tồn tại hoặc có lỗi dữ liệu. Vui lòng thử lại với thành viên khác.');
          } else {
            showError(`Không thể tạo nhóm: ${apiError.data.message}`);
          }
        } else {
          showError('Không thể tạo nhóm. Vui lòng thử lại sau.');
        }
      }
    } catch (error) {
      console.error('Error in group creation process:', error);
      showError('Không thể tạo nhóm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Add loading state to the UI
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Add a function to navigate to user profile
  const navigateToUserProfile = (userId) => {
    if (!userId) return;
    navigate(`/profile/${userId}`);
  };

  // Search for users to add to group
  const searchPotentialMembers = async (query) => {
    try {
      setMemberSearchTerm(query);
      let results = [];
      
      if (!query || query.length < 2) {
        // If no query or too short, load suggested users
        results = await chatApi.getSuggestedUsers(20, 1);
      } else {
        // Otherwise search by query
        results = await chatApi.searchUsers(query, 30, 1);
      }
      
      // Filter out current members
      const currentMemberIds = groupMembers.map(m => m.UserID || m.id);
      const filteredResults = results.filter(u => !currentMemberIds.includes(u.UserID || u.id));
      
      setPotentialMembers(filteredResults);
    } catch (error) {
      console.error('Error searching for users:', error);
      showError('Không thể tìm kiếm người dùng');
    }
  };
  
  // Add selected users to the group
  const addMembersToGroup = async () => {
    if (!selectedNewMembers.length || !currentConversation) return;
    
    setIsAddingMembers(true);
    try {
      const result = await chatApi.addGroupParticipants(
        currentConversation.ConversationID, 
        selectedNewMembers.map(m => m.UserID || m.id)
      );
      
      // Update the conversation with new members
      if (result.conversation) {
        setCurrentConversation(result.conversation);
      }
      
      // Close the add members modal
      setShowAddMembers(false);
      
      // Refresh the group members list
      await fetchGroupMembers(currentConversation.ConversationID);
      
      // Clear selections
      setSelectedNewMembers([]);
      setPotentialMembers([]);
    } catch (error) {
      console.error('Failed to add members:', error);
      showError(error.message || 'Không thể thêm thành viên vào nhóm');
    } finally {
      setIsAddingMembers(false);
    }
  };
  
  // Remove a member from the group
  const removeMemberFromGroup = async (memberId) => {
    if (!currentConversation || isRemovingMember) return;
    
    setIsRemovingMember(true);
    try {
      await chatApi.removeGroupParticipant(currentConversation.ConversationID, memberId);
      
      // Update the group members list
      setGroupMembers(prev => prev.filter(m => (m.UserID || m.id) !== memberId));
      
      // Update the current conversation
      if (currentConversation && currentConversation.Participants) {
        setCurrentConversation(prev => ({
          ...prev,
          Participants: prev.Participants.filter(p => (p.UserID || p.id) !== memberId)
        }));
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      showError(error.message || 'Không thể xóa thành viên khỏi nhóm');
    } finally {
      setIsRemovingMember(false);
    }
  };
  
  // Leave the group
  const leaveGroup = async () => {
    if (!currentConversation || isRemovingMember) return;
    
    if (!confirm('Bạn có chắc chắn muốn rời khỏi nhóm này?')) {
      return;
    }
    
    setIsRemovingMember(true);
    try {
      await chatApi.leaveGroup(currentConversation.ConversationID);
      
      // Remove the conversation from the list
      setConversations(prev => prev.filter(c => c.ConversationID !== currentConversation.ConversationID));
      
      // Clear current conversation
      setCurrentConversation(null);
      
      // Close the group members modal
      setShowGroupMembers(false);
    } catch (error) {
      console.error('Failed to leave group:', error);
      showError(error.message || 'Không thể rời khỏi nhóm');
    } finally {
      setIsRemovingMember(false);
    }
  };

  // Add a new function to handle group info changes
  const handleGroupImageEdit = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image.*')) {
      showError('Vui lòng chọn một tệp hình ảnh.');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewGroupImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
    
    // Save file for upload
    setNewGroupImage(file);
  };

  // Function to save updated group information
  const saveGroupInfo = async () => {
    if (!currentConversation || !editGroupName.trim()) return;
    
    setIsSavingGroupInfo(true);
    try {
      // Update group name and description
      const updatedData = {
        title: editGroupName.trim(),
        description: groupDescription.trim()
      };
      
      // First update the basic info
      await chatApi.updateConversation(currentConversation.ConversationID, updatedData);
      
      // If we have a new image, upload it
      if (newGroupImage) {
        const formData = new FormData();
        formData.append('image', newGroupImage);
        
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/chat/conversations/${currentConversation.ConversationID}/image`, 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }
      
      // Update the conversation in state
      setCurrentConversation(prev => ({
        ...prev,
        Title: editGroupName.trim()
      }));
      
      // Create a system message
      const systemMessage = `${user.FullName || user.Username} đã cập nhật thông tin nhóm.`;
      await chatApi.sendMessage(currentConversation.ConversationID, {
        content: systemMessage,
        type: 'system'
      });
      
      // Reset the edit state
      setIsEditingGroup(false);
      setNewGroupImage(null);
      setNewGroupImagePreview(null);
      
      // Refresh the conversation data
      const updatedConversation = await chatApi.getConversationById(currentConversation.ConversationID);
      setCurrentConversation(updatedConversation);
      
    } catch (error) {
      console.error('Failed to update group info:', error);
      showError(error.message || 'Không thể cập nhật thông tin nhóm');
    } finally {
      setIsSavingGroupInfo(false);
    }
  };

  return (
    <div className="flex flex-col h-[93vh] bg-gray-100 w-full rounded-xl shadow-lg">
      {/* Call Interface */}
      <CallInterface />
      
      {/* Error message */}
      {error && <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-md">{error}</div>}
      
      {/* Mobile view navigation */}
      <div className="md:hidden flex items-center justify-between bg-white p-3 border-b">
        {currentConversation ? (
          <button 
            className="flex items-center"
            onClick={() => {
              // Go back to conversations list
              localStorage.removeItem('currentConversationId');
              setCurrentConversation(null);
              setSelectedUser(null);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Trò chuyện</span>
          </button>
        ) : (
          <h2 className="text-xl font-bold text-gray-800">Trò chuyện</h2>
        )}
        
        {!currentConversation && (
          <button 
            onClick={() => {
              setShowCreateGroup(true);
              handleUserSearch('');
            }}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
            title="Tạo nhóm mới"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List - Hidden on mobile when a conversation is selected */}
        <div className={`${currentConversation ? 'hidden' : 'flex'} md:flex w-full md:w-1/3 bg-white border-r overflow-hidden flex-col h-full rounded-l-xl`}>
          <div className="hidden md:block p-3 border-b">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold text-gray-800">Trò chuyện</h2>
              <button 
                onClick={() => {
                  setShowCreateGroup(true);
                  handleUserSearch('');
                }}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
                title="Tạo nhóm mới"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2.5 pl-10 text-sm border rounded-lg focus:outline-none focus:border-blue-500 bg-gray-50"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          
          {/* Mobile search - only visible when no conversation is selected */}
          <div className="p-3 border-b md:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2.5 pl-10 text-sm border rounded-lg focus:outline-none focus:border-blue-500 bg-gray-50"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          
          {/* Create Group Modal */}
          {showCreateGroup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-5xl p-6 shadow-xl h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Tạo nhóm mới</h3>
                  <button 
                    onClick={() => setShowCreateGroup(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex-1 flex gap-6 overflow-hidden">
                  {/* Left side - Group Info */}
                  <div className="w-2/5 flex flex-col overflow-hidden">
                    <h4 className="font-medium text-gray-700 mb-2">Thông tin nhóm</h4>
                    <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhóm</label>
                        <input
                          type="text"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          placeholder="Nhập tên nhóm"
                          className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh nhóm (tùy chọn)</label>
                        {groupImagePreview ? (
                          <div className="relative w-32 h-32 mx-auto">
                            <img 
                              src={groupImagePreview} 
                              alt="Group Preview" 
                              className="w-full h-full object-cover rounded-lg border"
                            />
                            <button 
                              onClick={clearGroupImage}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-1 text-sm text-gray-500">Kéo thả ảnh hoặc bấm để tải lên</p>
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/*"
                              className="hidden"
                              onChange={handleGroupImageChange}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả nhóm (tùy chọn)</label>
                        <textarea
                          placeholder="Mô tả ngắn về nhóm"
                          rows={3}
                          className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex-1 overflow-hidden flex flex-col">
                      <h4 className="font-medium text-gray-700 mb-2">Thành viên đã chọn ({selectedUsers.length})</h4>
                      <div className="bg-gray-50 rounded-lg border flex-1 overflow-y-auto p-2">
                        {selectedUsers.length > 0 ? (
                          <div className="flex flex-wrap gap-2 p-2">
                            {selectedUsers.map(user => (
                              <div 
                                key={user.UserID || user.id} 
                                className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full flex items-center"
                              >
                                <Avatar 
                                  src={user.Image || user.Avatar} 
                                  name={user.FullName || user.Username} 
                                  size="tiny"
                                  className="mr-2"
                                />
                                <span className="text-sm">{user.FullName || user.Username}</span>
                                <button 
                                  onClick={() => removeSelectedUser(user.UserID || user.id)}
                                  className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            Chưa có thành viên nào được chọn
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - User Search */}
                  <div className="w-3/5 flex flex-col overflow-hidden">
                    <h4 className="font-medium text-gray-700 mb-2">Thêm thành viên</h4>
                    <div className="bg-gray-50 p-4 rounded-lg border flex-1 flex flex-col overflow-hidden">
                      <div className="relative mb-4">
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => handleUserSearch(e.target.value)}
                          onFocus={() => {
                            if (!searchUsers.length && !isSearchingUsers) {
                              handleUserSearch('');
                            }
                          }}
                          placeholder="Tìm kiếm người dùng..."
                          className="w-full p-2.5 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {userSearchTerm && (
                          <button
                            onClick={() => {
                              setUserSearchTerm('');
                              handleUserSearch('');
                            }}
                            className="absolute right-10 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        {isSearchingUsers && (
                          <div className="absolute right-3 top-2.5 animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 overflow-y-auto">
                        {isSearchingUsers ? (
                          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mb-2"></div>
                            <p>{userSearchTerm ? 'Đang tìm kiếm...' : 'Đang tải danh sách người dùng...'}</p>
                          </div>
                        ) : searchUsers.length > 0 ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {searchUsers.map(user => (
                                <div 
                                  key={user.UserID || user.id} 
                                  className="p-3 bg-white hover:bg-blue-50 rounded-md cursor-pointer flex items-center justify-between transition-colors border"
                                  onClick={() => selectUser(user)}
                                >
                                  <div className="flex items-center overflow-hidden">
                                    <Avatar 
                                      src={user.Image || user.Avatar} 
                                      name={user.FullName || user.Username} 
                                      size="small" 
                                      className="flex-shrink-0 mr-3"
                                    />
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">{user.FullName || user.Username}</p>
                                      <p className="text-xs text-gray-500 truncate">{user.Email || `@${user.Username}`}</p>
                                    </div>
                                  </div>
                                  <button className="ml-2 p-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                            
                            {searchUsers.length >= 20 && (
                              <div className="flex justify-center pt-2">
                                <button
                                  onClick={() => {
                                    // Load more users with the same query
                                    handleUserSearch(userSearchTerm || '', true);
                                  }}
                                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                                  disabled={isSearchingUsers}
                                >
                                  {isSearchingUsers ? 'Đang tải...' : 'Tải thêm người dùng'}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : userSearchTerm && userSearchTerm.length > 1 ? (
                          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                            <p>Không tìm thấy người dùng phù hợp với "{userSearchTerm}"</p>
                            <button 
                              onClick={() => handleUserSearch('')}
                              className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
                            >
                              Xem danh sách gợi ý
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p>Không thể tải danh sách người dùng gợi ý</p>
                            <button 
                              onClick={() => handleUserSearch('')}
                              className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
                            >
                              Thử lại
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">Người dùng đang online</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {onlineUsers.slice(0, 8).map(onlineUser => {
                            // Add null check for onlineUser
                            if (!onlineUser) return null;
                            // Bỏ qua người dùng hiện tại
                            if (user && (onlineUser.UserID === user.UserID || onlineUser.id === user.id)) return null;
                            // Bỏ qua người dùng đã được chọn
                            if (selectedUsers.some(u => u.UserID === onlineUser.UserID || u.UserID === onlineUser.id)) return null;
                            return (
                              <div 
                                key={onlineUser.UserID || onlineUser.id} 
                                className="p-2 bg-white rounded-md border cursor-pointer flex items-center gap-2"
                                onClick={() => {
                                  const userObj = {
                                    UserID: onlineUser.UserID || onlineUser.id,
                                    Username: onlineUser.Username,
                                    FullName: onlineUser.FullName,
                                    Image: onlineUser.Image || onlineUser.Avatar
                                  };
                                  if (!selectedUsers.some(u => u.UserID === userObj.UserID)) {
                                    selectUser(userObj);
                                  }
                                }}
                              >
                                <div className="relative">
                                  <Avatar 
                                    src={onlineUser.Image || onlineUser.Avatar} 
                                    name={onlineUser.FullName || onlineUser.Username} 
                                    size="tiny" 
                                  />
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                                </div>
                                <span className="text-xs truncate">{onlineUser.FullName || onlineUser.Username}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <button 
                    onClick={() => setShowCreateGroup(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={createGroup}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                    disabled={!groupName.trim() || selectedUsers.length === 0}
                  >
                    Tạo nhóm
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="overflow-y-auto flex-1">
            {conversations.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-64 p-4">
                <div className="rounded-full bg-blue-100 p-3 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-center mb-2">Chưa có cuộc trò chuyện nào</p>
                <p className="text-gray-500 text-sm text-center">Bạn có thể bắt đầu một cuộc trò chuyện mới bằng cách tạo nhóm hoặc tìm người dùng khác để nhắn tin.</p>
                <button 
                  onClick={() => setShowCreateGroup(true)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Tạo nhóm mới
                </button>
              </div>
            ) : (
              <>
                {loading && conversations.length === 0 ? (
                  // Show skeleton loaders while loading
                  <>
                    {[1, 2, 3, 4, 5].map((index) => (
                      <div key={index} className="p-3 border-b animate-pulse">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.ConversationID}
                        className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          currentConversation?.ConversationID === conv.ConversationID ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => handleConversationSelect(conv)}
                      >
                        <div className="flex items-center">
                          {/* Avatar */}
                          <div className="flex-shrink-0 mr-3 relative">
                            <Avatar 
                              src={getConversationAvatarInfo(conv).src}
                              name={getConversationAvatarInfo(conv).name}
                              size="medium"
                            />
                            {/* Group indicator */}
                            {conv.Type === 'group' && (
                              <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Conversation details */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-base truncate flex items-center">
                              {getConversationName(conv)}
                              {/* Call buttons next to username - hide on mobile */}
                              {conv.Type === 'private' && getOtherParticipants(conv).length > 0 && (
                                <div className="hidden md:flex ml-2">
                                  <button
                                    className="p-1 rounded-full hover:bg-gray-200 transition-colors mr-1"
                                    title="Audio Call"
                                    onClick={(e) => {
                                      e.stopPropagation(); 
                                      const otherId = getOtherParticipants(conv)[0]?.UserID;
                                      const otherName = getOtherParticipants(conv)[0]?.Username || getOtherParticipants(conv)[0]?.FullName;
                                      handleAudioCall(otherId, otherName);
                                    }}
                                  >
                                    <PhoneIcon className="h-3 w-3 text-gray-600" />
                                  </button>
                                  <button
                                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                    title="Video Call"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const otherId = getOtherParticipants(conv)[0]?.UserID;
                                      const otherName = getOtherParticipants(conv)[0]?.Username || getOtherParticipants(conv)[0]?.FullName;
                                      handleVideoCall(otherId, otherName);
                                    }}
                                  >
                                    <VideoCameraIcon className="h-3 w-3 text-gray-600" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {conv.Messages && conv.Messages.length > 0 
                                ? `${conv.Messages[0].Sender?.Username || 'Không xác định'}: ${conv.Messages[0].Content}`
                                : 'Chưa có tin nhắn'}
                            </div>
                          </div>
                          
                          {/* Online indicator and timestamp */}
                          <div className="flex flex-col items-end ml-3">
                            {conv.Type === 'private' && getOtherParticipants(conv).length > 0 && 
                              isUserOnline(getOtherParticipants(conv)[0]?.UserID) && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                            {conv.Messages && conv.Messages.length > 0 && conv.Messages[0].CreatedAt && (
                              <div className="text-xs text-gray-400 mt-1">
                                {safeFormatDate(conv.Messages[0].CreatedAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredConversations.length === 0 && (
                      <div className="text-center p-4 text-gray-500">
                        {searchTerm ? 
                          `Không tìm thấy cuộc trò chuyện nào với từ khóa "${searchTerm}"` : 
                          'Đang tải danh sách trò chuyện...'}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat Area - Visible always on desktop, only when a conversation is selected on mobile */}
        <div className={`${!currentConversation ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-gray-50 h-full`}>
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar 
                        src={
                          currentConversation.Type === 'private' && selectedUser
                            ? (selectedUser.Image || selectedUser.Avatar)
                            : getConversationAvatarInfo(currentConversation).src
                        }
                        name={
                          currentConversation.Type === 'private' && selectedUser
                            ? (selectedUser.FullName || selectedUser.Username)
                            : getConversationAvatarInfo(currentConversation).name
                        }
                        size="large"
                        className={currentConversation.Type === 'group' ? "cursor-pointer" : ""}
                        onClick={async (e) => {
                          if (currentConversation.Type === 'group') {
                            e.stopPropagation();
                            await fetchGroupMembers(currentConversation.ConversationID);
                            setShowGroupMembers(true);
                          }
                        }}
                      />
                      {/* Group indicator */}
                      {currentConversation.Type === 'group' && (
                        <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Conversation info */}
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold">
                          {currentConversation.Type === 'private' && selectedUser
                            ? (selectedUser.FullName || selectedUser.Username)
                            : getConversationName(currentConversation)
                          }
                        </h3>
                        {currentConversation.Type === 'private' && getOtherParticipants(currentConversation).length > 0 && (
                          <div className="flex ml-3">
                            <button
                              className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors mr-2"
                              title="Audio Call"
                              onClick={() => {
                                const otherId = getOtherParticipants(currentConversation)[0]?.UserID;
                                const otherName = getOtherParticipants(currentConversation)[0]?.Username || getOtherParticipants(currentConversation)[0]?.FullName;
                                handleAudioCall(otherId, otherName);
                              }}
                            >
                              <PhoneIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                              title="Video Call"
                              onClick={() => {
                                const otherId = getOtherParticipants(currentConversation)[0]?.UserID;
                                const otherName = getOtherParticipants(currentConversation)[0]?.Username || getOtherParticipants(currentConversation)[0]?.FullName;
                                handleVideoCall(otherId, otherName);
                              }}
                            >
                              <VideoCameraIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {currentConversation.Type === 'group' && currentConversation.Participants && (
                        <div className="hidden md:flex flex-col">
                          <div className="text-sm text-gray-500">
                            {currentConversation.Participants.length} thành viên
                          </div>
                          <div className="flex items-center mt-1">
                            <div className="flex -space-x-2 mr-2">
                              {currentConversation.Participants.slice(0, 3).map(member => (
                                <Avatar 
                                  key={member.UserID || member.id}
                                  src={getUserAvatar(member)}
                                  name={member.FullName || member.Username}
                                  size="tiny"
                                  className="border border-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToUserProfile(member.UserID || member.id);
                                  }}
                                />
                              ))}
                              {currentConversation.Participants.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 border border-white">
                                  +{currentConversation.Participants.length - 3}
                                </div>
                              )}
                            </div>
                            <button 
                              className="text-xs text-blue-600 hover:underline"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await fetchGroupMembers(currentConversation.ConversationID);
                                setShowGroupMembers(true);
                              }}
                            >
                              Xem tất cả
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Mobile-friendly group members view */}
                      {currentConversation.Type === 'group' && currentConversation.Participants && (
                        <div className="md:hidden flex items-center">
                          <span className="text-xs text-gray-500 mr-2">
                            {currentConversation.Participants.length} thành viên
                          </span>
                          <button 
                            className="text-xs text-blue-600 hover:underline"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await fetchGroupMembers(currentConversation.ConversationID);
                              setShowGroupMembers(true);
                            }}
                          >
                            Xem tất cả
                          </button>
                        </div>
                      )}
                      {currentConversation.Type === 'private' && getOtherParticipants(currentConversation).length > 0 && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${isUserOnline(getOtherParticipants(currentConversation)[0]?.UserID) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {isUserOnline(getOtherParticipants(currentConversation)[0]?.UserID) 
                            ? 'Đang trực tuyến' 
                            : 'Ngoại tuyến'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Call Overlay */}
              {inCall && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-80 z-50 flex flex-col items-center justify-center text-white p-6 rounded-xl">
                  <div className="text-center mb-8">
                    {isVideoCall ? (
                      <div className="relative mb-6">
                        <div className="w-64 h-64 rounded-xl bg-gray-800 flex items-center justify-center mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="absolute bottom-0 right-0 w-24 h-24 rounded-lg bg-gray-700 border-2 border-gray-600">
                          <Avatar 
                            src={user?.Image || user?.Avatar} 
                            name={user?.FullName || user?.Username || 'Bạn'}
                            size="large"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <div className="w-32 h-32 rounded-full bg-gray-700 mx-auto mb-4 flex items-center justify-center">
                          <Avatar 
                            src={getConversationAvatarInfo(currentConversation).src}
                            name={getConversationAvatarInfo(currentConversation).name}
                            size="xxl"
                          />
                        </div>
                        <div className="text-xl font-medium">
                          {getConversationName(currentConversation)}
                        </div>
                        <div className="text-green-400 mt-2">
                          Đang gọi...
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-center space-x-4">
                      <button 
                        onClick={endCall}
                        className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition focus:outline-none"
                        title="Kết thúc cuộc gọi"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l8 8-8 8M8 8L0 16l8 8" />
                        </svg>
                      </button>
                      {isVideoCall && (
                        <button 
                          className="p-4 bg-gray-600 hover:bg-gray-700 rounded-full transition focus:outline-none"
                          title="Bật/tắt camera"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      <button 
                        className="p-4 bg-gray-600 hover:bg-gray-700 rounded-full transition focus:outline-none"
                        title="Bật/tắt âm thanh"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {loading ? (
                  // Show message skeletons while loading
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex mb-4 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        {i % 2 !== 0 && (
                          <div className="flex-shrink-0 mr-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          </div>
                        )}
                        <div className={`max-w-[70%] p-3 rounded-lg animate-pulse ${i % 2 === 0 ? 'bg-blue-200' : 'bg-gray-200'}`}>
                          <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn
                  </div>
                ) : (
                  // Existing message rendering - with improved mobile styling
                  <>
                    {messages.map((message, index) => (
                      <div
                        ref={scrollRef}
                        key={message.MessageID || index}
                        className={`flex mb-3 ${
                          message.SenderID === user?.UserID || message.SenderID === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {/* Sender avatar (only for messages from others) */}
                        {message.SenderID !== user?.UserID && message.SenderID !== user?.id && (
                          <div className="flex-shrink-0 mr-2">
                            <Avatar 
                              src={getUserAvatar(message.Sender)}
                              name={message.Sender?.FullName || message.Sender?.Username || 'Người dùng'}
                              size="small"
                            />
                          </div>
                        )}
                        
                        {/* Message bubble */}
                        <div
                          className={`max-w-[80%] md:max-w-[70%] p-3 rounded-lg shadow-sm ${
                            message.SenderID === user?.UserID || message.SenderID === user?.id
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white rounded-bl-none'
                          }`}
                        >
                          {/* Sender name (only for messages from others and in group chats) */}
                          {(message.SenderID !== user?.UserID && message.SenderID !== user?.id && 
                            currentConversation.Type === 'group' && message.Sender) && (
                            <div className={`text-xs font-medium mb-1 ${
                              message.SenderID === user?.UserID || message.SenderID === user?.id
                              ? 'text-blue-200' : 'text-blue-600'
                            }`}>
                              {message.Sender.FullName || message.Sender.Username || 'Người dùng'}
                            </div>
                          )}
                          
                          <p className="text-sm">{message.Content}</p>
                          <span className={`text-xs mt-1 block text-right ${
                            message.SenderID === user?.UserID || message.SenderID === user?.id
                            ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {safeFormatDate(message.CreatedAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSubmit} className="p-3 border-t bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-xl font-medium mb-2">Tin nhắn của bạn</h3>
              <p className="text-center max-w-xs">Chọn một cuộc trò chuyện để bắt đầu hoặc tạo nhóm mới với nút +</p>
            </div>
          )}
        </div>
      </div>

      {/* Group Members Modal */}
      {showGroupMembers && currentConversation && currentConversation.Type === 'group' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-5xl p-6 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Nhóm: {currentConversation.Title}</h3>
              <button 
                onClick={() => setShowGroupMembers(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Tab navigation */}
            <div className="border-b mb-4">
              <div className="flex space-x-6">
                <button
                  className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'members' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('members')}
                >
                  Thành viên ({groupMembers.length})
                </button>
                <button
                  className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'info' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('info')}
                >
                  Thông tin nhóm
                </button>
              </div>
            </div>
            
            {/* Members tab content */}
            {activeTab === 'members' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">{groupMembers.length} thành viên</span>
                  <button 
                    onClick={() => {
                      setShowAddMembers(true);
                      setShowGroupMembers(false);
                      searchPotentialMembers('');
                    }}
                    className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Thêm thành viên
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupMembers.map(member => (
                      <div 
                        key={member.UserID || member.id} 
                        className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                        onClick={() => {
                          setShowGroupMembers(false);
                          navigateToUserProfile(member.UserID || member.id);
                        }}
                      >
                        <div className="flex items-center">
                          <Avatar 
                            src={getUserAvatar(member)} 
                            name={member.FullName || member.Username} 
                            size="medium" 
                            className="mr-3"
                          />
                          <div>
                            <p className="font-medium">{member.FullName || member.Username}</p>
                            <p className="text-xs text-gray-500">{member.Email || `@${member.Username}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {member.ConversationParticipant?.Role === 'admin' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs mr-2">Admin</span>
                          )}
                          <span className={`w-2 h-2 rounded-full ${isUserOnline(member.UserID || member.id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {isGroupAdmin && (member.UserID || member.id) !== (user?.UserID || user?.id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Bạn có chắc chắn muốn xóa ${member.FullName || member.Username} khỏi nhóm?`)) {
                                  removeMemberFromGroup(member.UserID || member.id);
                                }
                              }}
                              className="ml-2 p-1 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                              title="Xóa khỏi nhóm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Info tab content */}
            {activeTab === 'info' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">Thông tin nhóm</span>
                  <button 
                    onClick={() => setIsEditingGroup(!isEditingGroup)}
                    className={`px-3 py-1.5 ${isEditingGroup ? 'bg-gray-500' : 'bg-blue-500'} text-white text-sm rounded-lg hover:${isEditingGroup ? 'bg-gray-600' : 'bg-blue-600'} transition flex items-center`}
                  >
                    {isEditingGroup ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Hủy chỉnh sửa
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Chỉnh sửa
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {isEditingGroup ? (
                    <div className="space-y-4">
                      {/* Group Image Edit */}
                      <div className="flex flex-col items-center">
                        <div className="relative mb-3">
                          {newGroupImagePreview ? (
                            <img 
                              src={newGroupImagePreview} 
                              alt="Group Preview" 
                              className="w-32 h-32 object-cover rounded-lg border"
                            />
                          ) : currentConversation.ImageUrl ? (
                            <img 
                              src={currentConversation.ImageUrl} 
                              alt="Group" 
                              className="w-32 h-32 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                          )}
                          {newGroupImagePreview && (
                            <button 
                              onClick={() => {
                                setNewGroupImage(null);
                                setNewGroupImagePreview(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <label className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 cursor-pointer">
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*"
                            onChange={handleGroupImageEdit} 
                          />
                          Chọn ảnh nhóm
                        </label>
                      </div>
                      
                      {/* Group Name Edit */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhóm</label>
                        <input
                          type="text"
                          value={editGroupName}
                          onChange={(e) => setEditGroupName(e.target.value)}
                          placeholder="Nhập tên nhóm"
                          className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* Group Description Edit */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả nhóm</label>
                        <textarea
                          value={groupDescription}
                          onChange={(e) => setGroupDescription(e.target.value)}
                          placeholder="Mô tả ngắn về nhóm"
                          rows={3}
                          className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* Save Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={saveGroupInfo}
                          disabled={!editGroupName.trim() || isSavingGroupInfo}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center"
                        >
                          {isSavingGroupInfo && (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          )}
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Group Image Display */}
                      <div className="flex justify-center">
                        {currentConversation.ImageUrl ? (
                          <img 
                            src={currentConversation.ImageUrl} 
                            alt="Group" 
                            className="w-40 h-40 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Group Name Display */}
                      <div className="text-center">
                        <h3 className="text-xl font-bold">{currentConversation.Title}</h3>
                        <p className="text-gray-500 text-sm mt-1">Tạo bởi {currentConversation.CreatedBy}</p>
                      </div>
                      
                      {/* Group Description Display */}
                      {currentConversation.Description && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Mô tả</h4>
                          <p className="text-gray-600">{currentConversation.Description}</p>
                        </div>
                      )}
                      
                      {/* Group Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{groupMembers.length}</div>
                          <div className="text-xs text-blue-700 mt-1">Thành viên</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {groupMembers.filter(m => isUserOnline(m.UserID || m.id)).length}
                          </div>
                          <div className="text-xs text-green-700 mt-1">Đang online</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {messages.length}
                          </div>
                          <div className="text-xs text-purple-700 mt-1">Tin nhắn</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Leave group button */}
            <div className="pt-4 mt-4 border-t">
              <button
                onClick={leaveGroup}
                className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                disabled={isRemovingMember}
              >
                {isRemovingMember ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                )}
                Rời khỏi nhóm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembers && currentConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Thêm thành viên</h3>
              <button 
                onClick={() => setShowAddMembers(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={memberSearchTerm}
                  onChange={(e) => searchPotentialMembers(e.target.value)}
                  placeholder="Tìm kiếm người dùng..."
                  className="w-full p-2.5 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Selected users */}
            {selectedNewMembers.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Đã chọn ({selectedNewMembers.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedNewMembers.map(user => (
                    <div 
                      key={user.UserID || user.id}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center text-sm"
                    >
                      <span>{user.FullName || user.Username}</span>
                      <button
                        onClick={() => setSelectedNewMembers(prev => prev.filter(u => (u.UserID || u.id) !== (user.UserID || user.id)))}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Search results */}
            <div className="flex-1 overflow-y-auto mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Kết quả tìm kiếm</h4>
              {potentialMembers.length > 0 ? (
                <div className="space-y-2">
                  {potentialMembers.map(user => (
                    <div
                      key={user.UserID || user.id}
                      className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                      onClick={() => {
                        // Add to selected users if not already selected
                        if (!selectedNewMembers.some(u => (u.UserID || u.id) === (user.UserID || user.id))) {
                          setSelectedNewMembers(prev => [...prev, user]);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <Avatar
                          src={getUserAvatar(user)}
                          name={user.FullName || user.Username}
                          size="small"
                          className="mr-2"
                        />
                        <div>
                          <p className="font-medium">{user.FullName || user.Username}</p>
                          <p className="text-xs text-gray-500">{user.Email || `@${user.Username}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full ${isUserOnline(user.UserID || user.id) ? 'bg-green-500' : 'bg-gray-400'} mr-2`}></span>
                        <button
                          className="p-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!selectedNewMembers.some(u => (u.UserID || u.id) === (user.UserID || user.id))) {
                              setSelectedNewMembers(prev => [...prev, user]);
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {memberSearchTerm ? 'Không tìm thấy người dùng phù hợp' : 'Tìm kiếm người dùng để thêm vào nhóm'}
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowAddMembers(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={addMembersToGroup}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
                disabled={selectedNewMembers.length === 0 || isAddingMembers}
              >
                {isAddingMembers && (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                )}
                Thêm thành viên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
