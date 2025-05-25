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
  const [loading, setLoading] = useState(true);
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
  const socket = useRef();
  const scrollRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const { initiateCall } = useCall();

  // Add these new state variables for call functionality
  const [inCall, setInCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callLoading, setCallLoading] = useState(false);

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
        
        setEvents(response.data || []);
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

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let mounted = true; // Track if component is mounted

    // Get user data
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Only update state if component is still mounted
        if (!mounted) return;
        
        setUser(response.data);
        
        // Connect to socket server
        try {
          // Only create a new socket connection if one doesn't exist already
          if (!socket.current || socket.current.connected === false) {
            console.log('Initializing socket connection...');
            socket.current = io(import.meta.env.VITE_API_URL, {
              auth: { token },
              reconnection: true,
              reconnectionAttempts: 5,
              reconnectionDelay: 1000,
              timeout: 10000
            });
            
            // Add connection event handlers
            socket.current.on('connect', () => {
              console.log('Socket connected successfully');
              // Join user's personal room
              socket.current.emit('join_room', `user:${response.data.UserID || response.data.id}`);
            });
            
            socket.current.on('connect_error', (err) => {
              console.error('Socket connection error:', err.message);
            });
            
            // Listen for online users
            socket.current.on('getUsers', (users) => {
              setOnlineUsers(users);
            });

            // Listen for new messages
            socket.current.on('new-message', (message) => {
              // Add the new message to the messages state if it's for the current conversation
              if (currentConversation && message.ConversationID === currentConversation.ConversationID) {
                setMessages(prevMessages => {
                  const updated = [...prevMessages, message];
                  messageCacheRef.current[currentConversation.ConversationID] = updated;
                  return updated;
                });
              }
              
              // When receiving a message, also update the conversations list
              setConversations(prevConversations => {
                // Find the conversation that received this message
                const conversationId = message.ConversationID;
                const conversation = prevConversations.find(c => c.ConversationID === conversationId);
                
                if (!conversation) return prevConversations; // If conversation not found, don't update
                
                // Create updated conversation with the new message
                const updatedConversation = {
                  ...conversation,
                  LastMessageAt: message.CreatedAt || new Date().toISOString(),
                  Messages: [
                    {
                      ...message,
                      Sender: message.Sender || { 
                        UserID: message.SenderID,
                        // Use existing sender info if available
                        ...(conversation.Participants?.find(p => p.UserID === message.SenderID) || {})
                      }
                    },
                    ...(conversation.Messages || []).slice(1)
                  ]
                };
                
                // If this is the current active conversation, update it
                if (currentConversation && currentConversation.ConversationID === conversationId) {
                  setCurrentConversation(updatedConversation);
                }
                
                // Update lastConversationsRefresh to prevent unnecessary API calls
                localStorage.setItem('lastConversationsRefresh', Date.now().toString());
                
                // Move this conversation to the top of the list
                return [
                  updatedConversation,
                  ...prevConversations.filter(c => c.ConversationID !== conversationId)
                ];
              });
            });

            // Listen for conversation updates (when someone else sends a message)
            socket.current.on('conversation-updated', (data) => {
              const { conversationId, lastMessage } = data;
              
              // Update the conversations list
              setConversations(prevConversations => {
                // Find the conversation that was updated
                const conversation = prevConversations.find(c => c.ConversationID === conversationId);
                if (!conversation) return prevConversations; // If conversation not found, don't update
                
                // Create updated conversation with the last message
                const updatedConversation = {
                  ...conversation,
                  LastMessageAt: lastMessage.CreatedAt || new Date().toISOString(),
                  Messages: conversation.Messages ? 
                    [lastMessage, ...conversation.Messages.slice(1)] : 
                    [lastMessage]
                };
                
                // Update lastConversationsRefresh to prevent unnecessary API calls
                localStorage.setItem('lastConversationsRefresh', Date.now().toString());
                
                // Move this conversation to the top of the list
                return [
                  updatedConversation,
                  ...prevConversations.filter(c => c.ConversationID !== conversationId)
                ];
              });
            });
          } else {
            console.log('Socket already connected, reusing connection');
          }
        } catch (socketError) {
          console.error('Failed to initialize socket:', socketError);
          // Continue without socket if it fails
        }
        
        // Make sure isRefreshingConversations is reset before starting
        setIsRefreshingConversations(false);
        
        // First load conversations to ensure they're available
        let userConversations = [];
        try {
          userConversations = await fetchConversations();
          console.log('Initial conversations loaded:', userConversations.length);
          
          // Only proceed with user profile handling if component is still mounted
          if (!mounted) return;
          
          // Now that user and conversations are loaded, handle navigation from profile
          if (location.state?.selectedUser) {
            console.log('User navigated from profile page with:', location.state.selectedUser);
            handleUserFromProfile(location.state.selectedUser);
          } else {
            // Try to restore previously selected conversation from localStorage
            const savedConversationId = localStorage.getItem('currentConversationId');
            if (savedConversationId) {
              // Select the saved conversation if it exists
              const savedConversation = userConversations.find(c => 
                c.ConversationID === parseInt(savedConversationId)
              );
              
              if (savedConversation) {
                console.log('Restoring previously selected conversation:', savedConversation.ConversationID);
                handleConversationSelect(savedConversation);
              } else {
                console.log('Saved conversation not found, selecting first conversation');
                localStorage.removeItem('currentConversationId');
                
                // Select first conversation if available
                if (userConversations.length > 0) {
                  handleConversationSelect(userConversations[0]);
                }
              }
            } else if (userConversations.length > 0) {
              // If no saved conversation, select the first one
              handleConversationSelect(userConversations[0]);
            }
          }
        } catch (error) {
          console.log('Initial conversation load failed:', error.message);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/login');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUser();
    
    // Cleanup function
    return () => {
      mounted = false; // Mark component as unmounted
      if (socket.current) {
        console.log('Disconnecting socket...');
        socket.current.disconnect();
      }
    };
  }, [navigate, location.state]);
  
  // Fetch conversations whenever user changes
  useEffect(() => {
    // Only fetch conversations once when the user loads and conversations are empty
    if (user && !isRefreshingConversations && conversations.length === 0) {
      console.log('User loaded, fetching conversations...');
      fetchConversations().catch(err => {
        console.log('Failed to fetch conversations:', err.message);
      });
    }
    
    // Set up a visibility change handler instead of periodic polling
    if (user) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !isRefreshingConversations) {
          // The page became visible after being hidden
          const lastRefresh = localStorage.getItem('lastConversationsRefresh');
          const now = Date.now();
          
          // Only refresh if it's been more than 10 minutes since last refresh
          if (!lastRefresh || (now - parseInt(lastRefresh)) > 600000) {
            console.log('Tab became visible after being hidden for a while, refreshing conversations...');
            fetchConversations().catch(err => {
              console.log('Failed to refresh conversations on visibility change:', err.message);
            });
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user, isRefreshingConversations, conversations.length]);

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

  // Fetch conversations with retry mechanism
  const fetchConversations = async (retryCount = 0, forceRefresh = false) => {
    // Ensure user is loaded before fetching conversations
    if (!user || !user.UserID) {
      console.log('Delaying conversation fetch: user not loaded yet');
      return Promise.reject(new Error('User not loaded yet'));
    }
    
    // Use an actual state variable instead of a window property to prevent race conditions
    if (isRefreshingConversations) {
      console.log('Already refreshing conversations, skipping duplicate fetch');
      return Promise.resolve(conversations); // Return current conversations instead of rejecting
    }
    
    // Check if we have data in cache and it's recent (within last 10 minutes)
    const lastRefreshTime = localStorage.getItem('lastConversationsRefresh');
    const currentTime = Date.now();
    
    if (!forceRefresh && conversations.length > 0 && lastRefreshTime) {
      const ageInMs = currentTime - parseInt(lastRefreshTime);
      console.log(`Conversation cache age: ${Math.floor(ageInMs/1000)} seconds`);
      
      // If cache is less than 10 minutes old, use it
      if (ageInMs < 600000) {
        console.log('Using cached conversations (less than 10 minutes old)');
        return Promise.resolve(conversations);
      }
    }
    
    // Set refreshing flag
    setIsRefreshingConversations(true);
    
    try {
      console.log('Fetching conversations...');
      
      // Use a timeout promise to handle potential hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch conversations timeout')), 15000)
      );
      
      const fetchPromise = axios.get(`${import.meta.env.VITE_API_URL}/api/chat/conversations`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache' // Prevent browser caching
        }
      });
      
      // Race the fetch against a timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
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
        localStorage.setItem('lastConversationsRefresh', currentTime.toString());
        
        // Return conversations for further processing
        return sortedConversations;
      } else {
        console.error('Invalid conversations data format:', response.data);
        if (conversations.length > 0) {
          // If we have existing conversations, return those rather than empty array
          return conversations;
        }
        return [];
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      
      // Handle specific errors
      if (error.response && error.response.status === 401) {
        // Unauthorized - token may be expired
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

  // Add back the handleConversationSelect function
  const handleConversationSelect = (conv) => {
    // Load cached messages if available
    const cached = messageCacheRef.current[conv.ConversationID];
    if (cached) {
      setMessages(cached);
    } else if (conv.Messages && conv.Messages.length > 0) {
      setMessages(conv.Messages);
    } else {
      setMessages([]);
    }
    console.log('Selecting conversation:', conv.ConversationID);
    setCurrentConversation(conv);
    
    // Save selected conversation to localStorage
    localStorage.setItem('currentConversationId', conv.ConversationID);
    
    // If it's a private conversation, set the selected user
    if (conv.Type !== 'group') {
      const otherParticipants = getOtherParticipants(conv);
      if (otherParticipants.length > 0) {
        const otherUser = otherParticipants[0];
        // Set selected user with all necessary fields
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
        // If no other participants found, try to get user info from messages
        if (conv.Messages && conv.Messages.length > 0) {
          const lastMessage = conv.Messages[0];
          if (lastMessage.Sender && (lastMessage.Sender.UserID !== user.UserID && lastMessage.Sender.id !== user.id)) {
            setSelectedUser({
              ...lastMessage.Sender,
              UserID: lastMessage.Sender.UserID || lastMessage.Sender.id,
              FullName: lastMessage.Sender.FullName || lastMessage.Sender.Username,
              Email: lastMessage.Sender.Email,
              Phone: lastMessage.Sender.Phone,
              Bio: lastMessage.Sender.Bio,
              Image: getUserAvatar(lastMessage.Sender)
            });
          } else {
            setSelectedUser(null);
          }
        } else {
          setSelectedUser(null);
        }
      }
    } else {
      // For group chats, set selected user to null
      setSelectedUser(null);
    }
  };

  // Get other participants in a conversation (excluding current user)
  const getOtherParticipants = (conversation) => {
    if (!conversation?.Participants || !user) return [];
    return conversation.Participants.filter(p => 
      (p.UserID !== user.UserID && p.UserID !== user.id) ||
      (p.id !== user.UserID && p.id !== user.id)
    );
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
    const abortController = new AbortController();
    const fetchMessages = async () => {
      if (!currentConversation) return;
      // If we have cached messages for this conversation, use them
      const cached = messageCacheRef.current[currentConversation.ConversationID];
      if (cached) {
        setMessages(cached);
        return;
      }
      try {
        // Fetch messages from API with abort signal
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
      abortController.abort();
    };
  }, [currentConversation]);

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
  const handleUserSearch = async (query) => {
    setUserSearchTerm(query);
    if (query.length < 2) {
      setSearchUsers([]);
      return;
    }
    
    setIsSearchingUsers(true);
    try {
      // Use chatApi.searchUsers with a limit parameter
      const users = await chatApi.searchUsers(query, 10); // Limit to 10 results
      
      // Filter out current user and already selected users
      const filteredUsers = users.filter(u => 
        (u.UserID !== user?.UserID && u.UserID !== user?.id) && 
        !selectedUsers.some(selected => selected.UserID === u.UserID)
      );
      
      // Only update state if the search term hasn't changed during the API call
      if (query === userSearchTerm) {
        setSearchUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Add user to selected list
  const selectUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchUsers(searchUsers.filter(u => u.UserID !== user.UserID));
    setUserSearchTerm('');
  };

  // Remove user from selected list
  const removeSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.UserID !== userId));
  };

  // Create group conversation
  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    
    try {
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
        createdBy: currentUserId,
        participants: participants
      };
      
      const newConversation = await chatApi.createConversation(data);
      
      // Add the new conversation to the list and select it
      setConversations([newConversation, ...conversations]);
      setCurrentConversation(newConversation);
      
      // Reset group creation state
      setGroupName('');
      setSelectedUsers([]);
      setShowCreateGroup(false);
    } catch (error) {
      console.error('Error creating group:', error);
      showError('Không thể tạo nhóm. Vui lòng thử lại.');
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

  return (
    <div className="flex h-[93vh] bg-gray-100 w-full rounded-xl shadow-lg">
      {/* Call Interface */}
      <CallInterface />
      
      {/* Error message */}
      {error && <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md">{error}</div>}
      
      {/* Conversation List */}
      <div className="w-1/5 bg-white border-r overflow-hidden flex flex-col h-full rounded-l-xl">
        <div className="p-3 border-b">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-gray-800">Trò chuyện</h2>
            <button 
              onClick={() => setShowCreateGroup(true)}
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
        
        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl p-6 shadow-xl h-[80vh] flex flex-col">
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
                <div className="w-1/2 flex flex-col">
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
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-1 text-sm text-gray-500">Kéo thả ảnh hoặc bấm để tải lên</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả nhóm (tùy chọn)</label>
                      <textarea
                        placeholder="Mô tả ngắn về nhóm"
                        rows={4}
                        className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Thành viên đã chọn ({selectedUsers.length})</h4>
                    <div className="bg-gray-50 rounded-lg border overflow-y-auto max-h-64 p-2">
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
                <div className="w-1/2 flex flex-col">
                  <h4 className="font-medium text-gray-700 mb-2">Thêm thành viên</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border flex-1 flex flex-col">
                    <div className="relative mb-4">
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        placeholder="Tìm kiếm người dùng..."
                        className="w-full p-2.5 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {isSearchingUsers && (
                        <div className="absolute right-3 top-2.5 animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                      {searchUsers.length > 0 ? (
                        <div className="space-y-2">
                          {searchUsers.map(user => (
                            <div 
                              key={user.UserID || user.id} 
                              className="p-3 hover:bg-white rounded-md cursor-pointer flex items-center justify-between transition-colors"
                              onClick={() => selectUser(user)}
                            >
                              <div className="flex items-center">
                                <Avatar 
                                  src={user.Image || user.Avatar} 
                                  name={user.FullName || user.Username} 
                                  size="small" 
                                  className="mr-3"
                                />
                                <div>
                                  <p className="font-medium">{user.FullName || user.Username}</p>
                                  <p className="text-xs text-gray-500">{user.Email || `@${user.Username}`}</p>
                                </div>
                              </div>
                              <button className="p-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : userSearchTerm.length > 0 && !isSearchingUsers ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                          </svg>
                          <p>Không tìm thấy người dùng nào</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <p>Tìm kiếm người dùng để thêm vào nhóm</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Gợi ý</p>
                      <div className="grid grid-cols-2 gap-2">
                        {onlineUsers.slice(0, 4).map(onlineUser => {
                          // Bỏ qua người dùng hiện tại
                          if (user && (onlineUser.UserID === user.UserID || onlineUser.id === user.id)) return null;
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
                        {/* Call buttons next to username */}
                        {conv.Type === 'private' && getOtherParticipants(conv).length > 0 && (
                          <div className="flex ml-2">
                            <button
                              className="p-1 rounded-full hover:bg-gray-200 transition-colors mr-1"
                              title="Audio Call"
                              onClick={(e) => {
                                e.stopPropagation(); 
                                const otherId = getOtherParticipants(conv)[0].UserID;
                                const otherName = getOtherParticipants(conv)[0].Username || getOtherParticipants(conv)[0].FullName;
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
                                const otherId = getOtherParticipants(conv)[0].UserID;
                                const otherName = getOtherParticipants(conv)[0].Username || getOtherParticipants(conv)[0].FullName;
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
                        isUserOnline(getOtherParticipants(conv)[0].UserID) && (
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
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 h-full">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar 
                      src={getConversationAvatarInfo(currentConversation).src}
                      name={getConversationAvatarInfo(currentConversation).name}
                      size="large"
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
                        {getConversationName(currentConversation)}
                      </h3>
                      {currentConversation.Type === 'private' && getOtherParticipants(currentConversation).length > 0 && (
                        <div className="flex ml-3">
                          <button
                            className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors mr-2"
                            title="Audio Call"
                            onClick={() => {
                              const otherId = getOtherParticipants(currentConversation)[0].UserID;
                              const otherName = getOtherParticipants(currentConversation)[0].Username || getOtherParticipants(currentConversation)[0].FullName;
                              handleAudioCall(otherId, otherName);
                            }}
                          >
                            <PhoneIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                            title="Video Call"
                            onClick={() => {
                              const otherId = getOtherParticipants(currentConversation)[0].UserID;
                              const otherName = getOtherParticipants(currentConversation)[0].Username || getOtherParticipants(currentConversation)[0].FullName;
                              handleVideoCall(otherId, otherName);
                            }}
                          >
                            <VideoCameraIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {currentConversation.Type === 'group' && currentConversation.Participants && (
                      <div className="text-sm text-gray-500">
                        {currentConversation.Participants.length} thành viên
                      </div>
                    )}
                    {currentConversation.Type === 'private' && getOtherParticipants(currentConversation).length > 0 && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-1.5 ${isUserOnline(getOtherParticipants(currentConversation)[0].UserID) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {isUserOnline(getOtherParticipants(currentConversation)[0].UserID) 
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
                    className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                      message.SenderID === user?.UserID || message.SenderID === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white'
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
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn
                </div>
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

      {/* User Profile Panel */}
      <div className="w-1/4 bg-white border-l overflow-hidden flex flex-col h-full rounded-r-xl">
        <div className="p-4 border-b bg-white">
          <h2 className="text-xl font-bold text-gray-800">
            Sự kiện sắp diễn ra
          </h2>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4">
          {eventsLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : eventsError ? (
            <div className="text-center p-4 text-red-500">
              <p>{eventsError}</p>
              <button
                onClick={() => {
                  setEventsLoading(true);
                  axios.get(`${import.meta.env.VITE_API_URL}/api/events?limit=5`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                  })
                    .then(response => {
                      setEvents(response.data || []);
                      setEventsError(null);
                    })
                    .catch(error => {
                      console.error('Error fetching events:', error);
                      setEventsError('Không thể tải danh sách sự kiện');
                    })
                    .finally(() => setEventsLoading(false));
                }}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
              >
                Thử lại
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <CalendarIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-1">Không có sự kiện nào</h3>
              <p className="text-center max-w-xs">Hiện tại chưa có sự kiện nào sắp diễn ra</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div 
                  key={event.EventID} 
                  className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewEventDetail(event.EventID)}
                >
                  {/* Event Image */}
                  <div className="relative h-32">
                    <img
                      src={event.ImageUrl || '/default-event.jpg'}
                      alt={event.Title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/default-event.jpg';
                      }}
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {event.Status || 'Sắp diễn ra'}
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="p-3">
                    <h3 className="text-md font-semibold text-gray-900 line-clamp-2 mb-2">
                      {event.Title || 'Sự kiện không tên'}
                    </h3>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-600 text-xs">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span>
                          {event.EventDate ? formatEventDate(event.EventDate) : 'TBA'} 
                          {event.EventTime ? ` ${formatEventTime(event.EventTime)}` : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 text-xs">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        <span className="truncate">{event.Location || 'TBA'}</span>
                      </div>

                      <div className="flex items-center text-gray-600 text-xs">
                        <UserGroupIcon className="h-3 w-3 mr-1" />
                        <span>{event.CurrentAttendees || 0}/{event.MaxAttendees || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="mt-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewEventDetail(event.EventID);
                        }}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-2">
                <button
                  onClick={() => navigate('/events')}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Xem tất cả sự kiện
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;