/*-----------------------------------------------------------------
* File: index.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: Modern chat interface with messaging and calling features
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  PaperAirplaneIcon, 
  PhoneIcon,
  VideoCameraIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  PaperClipIcon,
  FaceSmileIcon,
  XMarkIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { chatApi } from '../../api/chatApi';
import { callApi } from '../../api/callApi';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../../components/common/Avatar';
import CallInterface from '../../components/Call/CallInterface';

const Chat = () => {
  // State management
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // User management
  const [searchUsers, setSearchUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  // UI states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  
  // Call states
  const [inCall, setInCall] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  
  // Typing indicators
  const [typingUsers, setTypingUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Mobile specific state
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showConversations, setShowConversations] = useState(true);
  
  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    
    // Check if coming from another page with selected user
    const selectedUser = location.state?.selectedUser;
    if (selectedUser) {
      handleStartConversation(selectedUser);
    }
  }, [location.state]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data) => {
      const { conversationId, message } = data;
      
      // Add message to current conversation if it matches
      if (currentConversation?.ConversationID === conversationId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      
      // Update conversation list
      setConversations(prev => 
        prev.map(conv => 
          conv.ConversationID === conversationId
            ? { 
                ...conv, 
                LastMessageContent: message.Content,
                LastMessageTime: message.CreatedAt,
                LastMessageSender: message.SenderUsername
              }
            : conv
        )
      );
    };

    const handleConversationUpdated = (data) => {
      const { conversationId, lastMessage } = data;
      setConversations(prev => 
        prev.map(conv => 
          conv.ConversationID === conversationId
            ? { ...conv, LastMessageAt: new Date(), lastMessage }
            : conv
        ).sort((a, b) => new Date(b.LastMessageAt) - new Date(a.LastMessageAt))
      );
    };

    const handleUserTyping = (data) => {
      const { conversationId, userId, username, isTyping } = data;
      
      if (currentConversation?.ConversationID === conversationId) {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: isTyping 
            ? { ...prev[conversationId], [userId]: username }
            : { ...prev[conversationId], [userId]: undefined }
        }));
      }
    };

    const handleIncomingCall = (callData) => {
      setIncomingCall(callData);
    };

    const handleCallParticipantJoined = (data) => {
      if (currentCall?.callId === data.callId) {
        setCurrentCall(prev => ({
          ...prev,
          participants: data.participants
        }));
        setIsWaitingForResponse(false); // Clear waiting state when someone joins
        toast.success('Người dùng đã tham gia cuộc gọi');
      }
    };

    const handleCallEnded = (data) => {
      if (currentCall?.callId === data.callId) {
        setInCall(false);
        setCurrentCall(null);
        setIsWaitingForResponse(false);
        toast.info('Cuộc gọi đã kết thúc');
      }
      setIncomingCall(null);
    };

    const handleCallTimeout = (data) => {
      if (currentCall?.callId === data.callId) {
        setInCall(false);
        setCurrentCall(null);
        setIsWaitingForResponse(false);
        toast.warning('Cuộc gọi đã hết thời gian chờ - Không có phản hồi sau 60 giây');
      }
      if (incomingCall?.callId === data.callId) {
        setIncomingCall(null);
        toast.info('Cuộc gọi đã hết thời gian chờ');
      }
    };

    // Register socket event listeners
    socket.on('new-message', handleNewMessage);
    socket.on('conversation-updated', handleConversationUpdated);
    socket.on('user-typing', handleUserTyping);
    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-participant-joined', handleCallParticipantJoined);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-timeout', handleCallTimeout);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('conversation-updated', handleConversationUpdated);
      socket.off('user-typing', handleUserTyping);
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-participant-joined', handleCallParticipantJoined);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-timeout', handleCallTimeout);
    };
  }, [socket, isConnected, currentConversation, currentCall]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getConversations();
      if (response.success) {
        setConversations(response.data);
      }
      } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Không thể tải danh sách cuộc trò chuyện');
    } finally {
            setLoading(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId) => {
    try {
      const response = await chatApi.getMessages(conversationId);
      if (response.success) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Không thể tải tin nhắn');
    }
  };

  // Select conversation with mobile handling
  const selectConversation = (conversation) => {
    setCurrentConversation(conversation);
    loadMessages(conversation.ConversationID);
    
    // Join conversation room
    if (socket) {
      socket.emit('join-conversation', conversation.ConversationID);
    }
    
    // On mobile, switch to chat view
    if (isMobileView) {
      setShowConversations(false);
    }
  };

  // Back to conversations list (mobile only)
  const backToConversations = () => {
    setShowConversations(true);
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || sendingMessage) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      const response = await chatApi.sendMessage({
        conversationId: currentConversation.ConversationID,
        content: messageText,
        type: 'text'
      });

      if (response.success) {
        // Add message locally
        setMessages(prev => [...prev, response.data]);
        
        // Emit to socket for real-time delivery
        if (socket) {
          socket.emit('message-sent', {
            conversationId: currentConversation.ConversationID,
            message: response.data
          });
        }
        
        scrollToBottom();
      } else {
        // Show error toast and restore the message
        toast.error(response.message || 'Failed to send message');
        setNewMessage(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Không thể gửi tin nhắn');
      setNewMessage(messageText); // Restore message
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle typing indicators
  const handleTyping = () => {
    if (!currentConversation || !socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing-start', { conversationId: currentConversation.ConversationID });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing-stop', { conversationId: currentConversation.ConversationID });
    }, 2000);
  };

  // Search users
  const searchUsersHandler = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchUsers([]);
      return;
    }

    try {
      setSearchingUsers(true);
      const response = await chatApi.searchUsers(query);
      if (response.success) {
        setSearchUsers(response.data);
      }
      } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
      }
    };

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsersHandler(userSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchTerm]);

  // Start conversation with user
  const handleStartConversation = async (selectedUser) => {
    try {
      const response = await chatApi.createConversation({
        participants: [selectedUser.UserID],
        type: 'private'
      });

      if (response.success) {
        // Add to conversations list if new
        const existingConv = conversations.find(c => c.ConversationID === response.data.ConversationID);
        if (!existingConv) {
          setConversations(prev => [response.data, ...prev]);
        }
        
        selectConversation(response.data);
        setShowUserSearch(false);
        setUserSearchTerm('');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Không thể bắt đầu cuộc trò chuyện');
    }
  };

  // Create group conversation
  const createGroupConversation = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error('Vui lòng nhập tên nhóm và chọn thành viên');
        return;
      }
      
    try {
      setCreatingGroup(true);
      const response = await chatApi.createConversation({
        title: groupName,
        participants: selectedUsers.map(u => u.UserID),
        type: 'group'
      });

      if (response.success) {
        setConversations(prev => [response.data, ...prev]);
        selectConversation(response.data);
        setShowCreateGroup(false);
        setGroupName('');
        setSelectedUsers([]);
        toast.success('Tạo nhóm thành công');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Không thể tạo nhóm');
    } finally {
      setCreatingGroup(false);
    }
  };

  // Start audio call
  const startAudioCall = async () => {
    if (!currentConversation) return;

    try {
      setIsWaitingForResponse(true);
      const response = await callApi.initiateCall({
        conversationId: currentConversation.ConversationID,
        type: 'audio'
      });

      if (response.success) {
        setCurrentCall(response.data);
        setInCall(true);
        if (response.data.status === 'ringing') {
          toast.info('Đang gọi... Chờ phản hồi');
        }
      }
    } catch (error) {
      console.error('Error starting audio call:', error);
      toast.error('Không thể bắt đầu cuộc gọi âm thanh');
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  // Start video call
  const startVideoCall = async () => {
    if (!currentConversation) return;

    try {
      setIsWaitingForResponse(true);
      const response = await callApi.initiateCall({
        conversationId: currentConversation.ConversationID,
        type: 'video'
      });

      if (response.success) {
        setCurrentCall(response.data);
        setInCall(true);
        if (response.data.status === 'ringing') {
          toast.info('Đang gọi video... Chờ phản hồi');
        }
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      toast.error('Không thể bắt đầu cuộc gọi video');
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  // Answer incoming call
  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      const response = await callApi.answerCall({
        callId: incomingCall.callId
      });

      if (response.success) {
        setCurrentCall(response.data);
        setInCall(true);
        setIncomingCall(null);
        setIsWaitingForResponse(false);
      }
    } catch (error) {
      console.error('Error answering call:', error);
      toast.error('Không thể trả lời cuộc gọi');
    }
  };

  // Reject incoming call
  const rejectCall = async () => {
    if (!incomingCall) return;

    try {
      await callApi.rejectCall({
        callId: incomingCall.callId
      });
      setIncomingCall(null);
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };

  // End current call
  const endCall = async () => {
    if (!currentCall) return;

    try {
      await callApi.endCall({
        callId: currentCall.callId
      });
      setInCall(false);
      setCurrentCall(null);
      setIsWaitingForResponse(false);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.Participants?.some(p => 
      p.FullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Username?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Get typing indicator text
  const getTypingText = () => {
    const typing = typingUsers[currentConversation?.ConversationID];
    if (!typing) return '';
    
    const typingUsernames = Object.values(typing).filter(Boolean);
    if (typingUsernames.length === 0) return '';
    
    if (typingUsernames.length === 1) {
      return `${typingUsernames[0]} đang gõ...`;
    } else if (typingUsernames.length === 2) {
      return `${typingUsernames[0]} và ${typingUsernames[1]} đang gõ...`;
    } else {
      return `${typingUsernames.length} người đang gõ...`;
    }
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 1) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  // Check screen size on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-[91vh] bg-gray-50 overflow-hidden rounded-lg shadow-lg mx-2 mt-4 mb-2">
      {/* Sidebar - Conversations List */}
      <div className={`${isMobileView ? 'w-full' : 'w-1/3'} bg-white border-r border-gray-200 flex flex-col ${isMobileView && !showConversations ? 'hidden' : 'flex'}`}>
        {/* Header */}
        <div className="p-2 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-gray-900">Tin nhắn</h1>
            <div className="flex space-x-1">
              <button 
                onClick={() => setShowUserSearch(true)}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Bắt đầu cuộc trò chuyện mới"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowCreateGroup(true)}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Tạo nhóm"
              >
                <UserGroupIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
            
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
          
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500 text-sm">Đang tải...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">Không có cuộc trò chuyện nào</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.ConversationID}
                  onClick={() => selectConversation(conversation)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    currentConversation?.ConversationID === conversation.ConversationID
                      ? 'bg-blue-50 border-r-2 border-blue-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      {conversation.Type === 'group' ? (
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="w-5 h-5 text-blue-600" />
                        </div>
                      ) : (
                        <Avatar 
                          src={conversation.Avatar}
                          alt={conversation.Title}
                          size="sm"
                        />
                      )}
                      {conversation.UnreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {conversation.UnreadCount > 99 ? '99+' : conversation.UnreadCount}
                        </div>
                      )}
                    </div>
                          
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-medium text-gray-900 truncate">
                          {conversation.Title || 'Cuộc trò chuyện'}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {conversation.LastMessageTime && formatMessageTime(conversation.LastMessageTime)}
                        </span>
                      </div>
                          
                      <div className="mt-1">
                        <p className="text-xs text-gray-600 truncate">
                          {conversation.LastMessageContent || 'Chưa có tin nhắn'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${isMobileView && showConversations ? 'hidden' : 'flex'}`}>
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isMobileView && (
                    <button 
                      onClick={backToConversations}
                      className="p-1 text-gray-500 hover:text-gray-700 mr-1"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                  )}
                  
                  {currentConversation.Type === 'group' ? (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserGroupIcon className="w-4 h-4 text-blue-600" />
                    </div>
                  ) : (
                    <Avatar 
                      src={currentConversation.Avatar}
                      alt={currentConversation.Title}
                      size="sm"
                    />
                  )}
                  
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 truncate max-w-[120px] md:max-w-xs">
                      {currentConversation.Title}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {currentConversation.Type === 'group' 
                        ? `${currentConversation.Participants?.length || 0} thành viên`
                        : 'Đang hoạt động'
                      }
                    </p>
                  </div>
                </div>

                {/* Call Buttons */}
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={startAudioCall}
                    disabled={isWaitingForResponse || inCall}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isWaitingForResponse || inCall 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={isWaitingForResponse ? "Đang gọi..." : "Gọi điện"}
                  >
                    <PhoneIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={startVideoCall}
                    disabled={isWaitingForResponse || inCall}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isWaitingForResponse || inCall 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={isWaitingForResponse ? "Đang gọi..." : "Gọi video"}
                  >
                    <VideoCameraIcon className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <EllipsisVerticalIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {messages.map((message, index) => {
                const currentUserId = user?.UserID ?? user?.id;
                const isOwn = message.SenderID === currentUserId;
                const showAvatar = !isOwn && (
                  index === messages.length - 1 || 
                  messages[index + 1]?.SenderID !== message.SenderID
                );

                return (
                  <div
                    key={message.MessageID}
                    className={`flex w-full ${isOwn ? 'justify-end pr-4' : 'justify-start pl-4'}`}
                  >
                    <div className={`flex items-end space-x-1 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {showAvatar && !isOwn && (
                        <Avatar 
                          src={message.SenderAvatar}
                          alt={message.SenderName}
                          size="xs"
                        />
                      )}
                      
                      <div className={`${showAvatar ? '' : isOwn ? 'ml-auto mr-1' : 'ml-1 mr-auto'}`}>
                        <div
                          className={`relative px-3 py-1.5 rounded-2xl text-sm ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-br-md shadow-sm'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md border'
                          }`}
                        >
                          {/* arrow tail for bubbles */}
                          {!isOwn && (
                            <div className="absolute -left-1.5 bottom-1 w-3 h-3 bg-gray-100 border-l border-b transform rotate-45"></div>
                          )}
                          {isOwn && (
                            <div className="absolute -right-1.5 bottom-1 w-3 h-3 bg-blue-600 transform rotate-45"></div>
                          )}
                          {!isOwn && currentConversation.Type === 'group' && (
                            <p className="text-xs font-medium mb-0.5 text-blue-600">
                              {message.SenderName}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed">{message.Content}</p>
                        </div>
                        
                        <p className={`text-xs text-gray-400 mt-0.5 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {formatMessageTime(message.CreatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing Indicator */}
              {getTypingText() && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-2 py-1">
                    <p className="text-sm text-gray-600 italic">{getTypingText()}</p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-2">
              <div className="flex items-center space-x-2">
                <button className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg transition-colors">
                  <PaperClipIcon className="w-4 h-4" />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Nhập tin nhắn..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sendingMessage}
                  />
                </div>

                <button className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg transition-colors">
                  <FaceSmileIcon className="w-4 h-4" />
                </button>
            
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center p-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserGroupIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">
                Chọn một cuộc trò chuyện
              </h3>
              <p className="text-gray-500 text-sm">
                Chọn một cuộc trò chuyện từ danh sách hoặc bắt đầu cuộc trò chuyện mới
              </p>
              {isMobileView && (
                <button
                  onClick={backToConversations}
                  className="mt-3 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg"
                >
                  Xem danh sách
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bắt đầu cuộc trò chuyện</h3>
              <button 
                onClick={() => {
                  setShowUserSearch(false);
                  setUserSearchTerm('');
                  setSearchUsers([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
                        <input
                          type="text"
                placeholder="Tìm kiếm người dùng..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
            <div className="max-h-60 overflow-y-auto">
              {searchingUsers ? (
                <div className="text-center py-4 text-gray-500">Đang tìm kiếm...</div>
              ) : searchUsers.length === 0 && userSearchTerm ? (
                <div className="text-center py-4 text-gray-500">Không tìm thấy người dùng</div>
              ) : (
                searchUsers.map((user) => (
                  <div
                    key={user.UserID}
                    onClick={() => handleStartConversation(user)}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <Avatar src={user.Avatar} alt={user.FullName} size="sm" />
                      <div>
                      <p className="font-medium text-gray-900">{user.FullName}</p>
                      <p className="text-sm text-gray-500">@{user.Username}</p>
                      </div>
                      </div>
                ))
                        )}
                      </div>
                      </div>
                        </div>
                      )}
                      
      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tạo nhóm</h3>
              <button
                onClick={() => {
                  setShowCreateGroup(false);
                  setGroupName('');
                  setSelectedUsers([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên nhóm
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Nhập tên nhóm..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tìm và chọn thành viên
                </label>
                <input
                  type="text"
                  placeholder="Tìm kiếm người dùng..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            
              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Đã chọn ({selectedUsers.length})
                  </p>
                <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <span
                        key={user.UserID}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {user.FullName}
                      <button
                          onClick={() => setSelectedUsers(prev => prev.filter(u => u.UserID !== user.UserID))}
                          className="text-blue-600 hover:text-blue-800"
                      >
                          <XMarkIcon className="w-3 h-3" />
                      </button>
                      </span>
                  ))}
                </div>
              </div>
            )}
            
              {/* Search Results */}
              <div className="max-h-40 overflow-y-auto">
                {searchUsers.filter(u => !selectedUsers.some(s => s.UserID === u.UserID)).map((user) => (
                  <div
                    key={user.UserID}
                    onClick={() => setSelectedUsers(prev => [...prev, user])}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <Avatar src={user.Avatar} alt={user.FullName} size="sm" />
                        <div>
                      <p className="font-medium text-gray-900">{user.FullName}</p>
                      <p className="text-sm text-gray-500">@{user.Username}</p>
                        </div>
                      </div>
                ))}
              </div>
              
              <div className="flex space-x-3 pt-4">
                        <button
                  onClick={() => {
                    setShowCreateGroup(false);
                    setGroupName('');
                    setSelectedUsers([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={createGroupConversation}
                  disabled={!groupName.trim() || selectedUsers.length === 0 || creatingGroup}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creatingGroup ? 'Đang tạo...' : 'Tạo nhóm'}
                        </button>
                      </div>
                    </div>
                </div>
                </div>
              )}

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="mb-4">
              <Avatar
                src={incomingCall.initiatorPicture}
                alt={incomingCall.initiatorName}
                size="lg"
                className="mx-auto mb-2"
              />
              <h3 className="text-lg font-semibold text-gray-900">
                {incomingCall.initiatorName}
              </h3>
              <p className="text-gray-500">
                {incomingCall.type === 'video' ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={rejectCall}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Từ chối
              </button>
              <button
                onClick={answerCall}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Trả lời
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Interface */}
      {inCall && currentCall && (
        <CallInterface
          call={currentCall}
          onEndCall={endCall}
          isVideoCall={currentCall.type === 'video'}
        />
      )}
    </div>
  );
};

export default Chat;