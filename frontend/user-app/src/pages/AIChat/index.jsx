import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  PaperAirplaneIcon, 
  ArrowPathIcon,
  AcademicCapIcon,
  LightBulbIcon, 
  CodeBracketIcon,
  BookOpenIcon,
  ChatBubbleLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  BookOpenIcon as LibraryIcon,
  SparklesIcon,
  MicrophoneIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { initChat, sendMessage } from '../../services/aiService';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chat, setChat] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isTemporaryChat, setIsTemporaryChat] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversations from localStorage on component mount
  useEffect(() => {
    try {
      const savedConversations = JSON.parse(localStorage.getItem('chatConversations')) || [];
      setConversations(savedConversations);

      // Get the last active conversation ID
      const lastActiveId = localStorage.getItem('activeConversationId');
      if (lastActiveId && savedConversations.find(conv => conv.id === lastActiveId)) {
        setActiveConversationId(lastActiveId);
        setIsTemporaryChat(false);
      }
    } catch (err) {
      console.error('Error loading conversations from localStorage:', err);
    }
  }, []);

  // Khởi tạo chat khi component mount
  useEffect(() => {
    const setupChat = async () => {
      try {
        const chatInstance = await initChat();
        setChat(chatInstance);
        
        if (activeConversationId && !isTemporaryChat) {
          // Load existing conversation if available
          const activeConversation = conversations.find(conv => conv.id === activeConversationId);
          if (activeConversation) {
            setMessages(activeConversation.messages || []);
            return;
          }
        }
        
        // Create a temporary chat session (not saved to history yet)
        setMessages([{ 
          role: 'assistant',
          content: 'Xin chào! Tôi là trợ lý AI chuyên về IT của CampusT. Tôi sẽ giúp bạn trả lời các câu hỏi về lập trình, công nghệ và thông tin. Hãy đặt câu hỏi về lĩnh vực công nghệ thông tin để tôi có thể hỗ trợ tốt nhất.' 
        }]);
        setIsTemporaryChat(true);
      } catch (err) {
        console.error('Failed to initialize chat:', err);
        setError('Không thể kết nối đến AI. Vui lòng kiểm tra API key và thử lại sau.');
      } finally {
        setInitializing(false);
        // Focus input after initialization
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    };

    setupChat();
  }, [activeConversationId, conversations]);

  // Update localStorage when conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('chatConversations', JSON.stringify(conversations));
    } else {
      localStorage.removeItem('chatConversations');
    }
  }, [conversations]);

  // Update active conversation in localStorage
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem('activeConversationId', activeConversationId);
    } else {
      localStorage.removeItem('activeConversationId');
    }
  }, [activeConversationId]);

  // Update the active conversation with new messages
  useEffect(() => {
    if (isTemporaryChat || !activeConversationId || !messages.length || initializing) return;

    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conv => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages,
            updatedAt: new Date().toISOString(),
            title: getConversationTitle(messages)
          };
        }
        return conv;
      });
      return updatedConversations;
    });
  }, [messages, activeConversationId, isTemporaryChat]);

  // Helper to generate a title from messages
  const getConversationTitle = (msgs) => {
    if (!msgs.length) return "New Chat";
    
    // Find the first user message
    const firstUserMessage = msgs.find(m => m.role === 'user');
    if (!firstUserMessage) return "New Chat";
    
    // Use first 30 chars of the message as title
    const title = firstUserMessage.content.substring(0, 30);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  };

  // Convert a temporary chat to a permanent one
  const saveTemporaryChat = (messagesWithUserQuery) => {
    // Use provided messages or current state
    const messagesToSave = messagesWithUserQuery || messages;
    
    // Don't save empty chats
    if (messagesToSave.length <= 1) return;
    
    // Only save if user has asked something
    if (!messagesToSave.find(m => m.role === 'user')) return;
    
    const newConversation = {
      id: Date.now().toString(),
      title: getConversationTitle(messagesToSave),
      messages: [...messagesToSave],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setIsTemporaryChat(false);
    
    return newConversation.id;
  };

  // Create a new conversation
  const createNewChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI chuyên về IT của CampusT. Tôi sẽ giúp bạn trả lời các câu hỏi về lập trình, công nghệ và thông tin. Hãy đặt câu hỏi về lĩnh vực công nghệ thông tin để tôi có thể hỗ trợ tốt nhất.'
    }]);
    setActiveConversationId(null);
    setIsTemporaryChat(true);
  };

  // Delete a conversation
  const deleteConversation = (id, e) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    // If we deleted the active conversation, create a new one
    if (id === activeConversationId) {
      createNewChat();
    }
  };

  // Clear all conversations
  const clearAllHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả lịch sử trò chuyện? Hành động này không thể hoàn tác.')) {
      setConversations([]);
      localStorage.removeItem('chatConversations');
      localStorage.removeItem('activeConversationId');
      createNewChat();
    }
  };

  // Switch to a conversation
  const switchConversation = (id) => {
    if (id === activeConversationId) return;
    
    // If we're in a temporary chat with user messages, save it first
    if (isTemporaryChat && messages.length > 1 && messages.some(m => m.role === 'user')) {
      saveTemporaryChat();
    }
    
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      setMessages(conversation.messages || []);
      setActiveConversationId(id);
      setIsTemporaryChat(false);
    }
  };

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    if (!chat) {
      setError('Chưa kết nối được với AI. Vui lòng tải lại trang.');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    
    // Create new messages array with the user's message
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    
    // Update messages state
    setMessages(updatedMessages);
    
    // Hiển thị trạng thái đang tải
    setLoading(true);
    
    try {
      // If this is the first user message in a temporary chat, save it to history
      if (isTemporaryChat) {
        saveTemporaryChat(updatedMessages);
      }
      
      // Gửi tin nhắn đến AI
      const response = await sendMessage(chat, userMessage);
      
      // Thêm phản hồi từ AI vào state
      const messagesWithResponse = [...updatedMessages, { role: 'assistant', content: response }];
      setMessages(messagesWithResponse);
      
      // Update the conversation in localStorage
      if (!isTemporaryChat) {
        setConversations(prevConversations => {
          return prevConversations.map(conv => {
            if (conv.id === activeConversationId) {
              return {
                ...conv,
                messages: messagesWithResponse,
                updatedAt: new Date().toISOString(),
                title: conv.title || getConversationTitle(messagesWithResponse)
              };
            }
            return conv;
          });
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setInitializing(true);
      const chatInstance = await initChat();
      setChat(chatInstance);
      createNewChat();
      setError(null);
    } catch (err) {
      console.error('Failed to reset chat:', err);
      setError('Không thể khởi tạo lại cuộc trò chuyện. Vui lòng tải lại trang.');
    } finally {
      setInitializing(false);
      // Focus input after reset
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleNewChat = () => {
    // If current chat has user messages, ask to save it
    if (isTemporaryChat && messages.some(m => m.role === 'user')) {
      saveTemporaryChat();
    }
    handleReset();
  };

  // Handle suggestion action click
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion.label);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const isEmptyChat = messages.length === 1 && 
                     messages[0].role === 'assistant' && 
                     messages[0].content === 'Xin chào! Tôi là trợ lý AI chuyên về IT của CampusT. Tôi sẽ giúp bạn trả lời các câu hỏi về lập trình, công nghệ và thông tin. Hãy đặt câu hỏi về lĩnh vực công nghệ thông tin để tôi có thể hỗ trợ tốt nhất.';

  // Recent conversations list from the state
  const recentConversations = conversations.slice(0, 10).map(conv => ({
    id: conv.id,
    title: conv.title
  }));

  // Suggestion actions
  const suggestedActions = [
    { icon: "🎨", label: "Create image" },
    { icon: "📋", label: "Make a plan" },
    { icon: "📄", label: "Summarize text" },
    { icon: "💡", label: "Brainstorm" }
  ];

  // Update the active conversation with new messages - now only used for switching conversations
  useEffect(() => {
    // Skip the automatic update from messages changes
    // We'll handle updates explicitly in the handleSubmit function
    if (isTemporaryChat || !activeConversationId || !messages.length || initializing || loading) return;
  }, [messages, activeConversationId, isTemporaryChat, initializing, loading]);

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-[260px] h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden">
          {/* New chat button - fixed */}
          <div className="flex-shrink-0">
            <button 
              onClick={handleNewChat}
              className="flex items-center gap-2 m-2 p-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-200"
            >
              <PlusIcon className="h-4 w-4" />
              <span>New chat</span>
            </button>
            
            {/* Navigation items - fixed */}
            <div className="px-2 py-1 space-y-0.5">
              <button className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100">
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>Search chats</span>
              </button>
              
              <button className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100">
                <LibraryIcon className="h-4 w-4" />
                <span>Library</span>
              </button>
              
              <button className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100">
                <SparklesIcon className="h-4 w-4" />
                <span>Sora</span>
              </button>
              
              <button className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100">
                <CodeBracketIcon className="h-4 w-4" />
                <span>GPTs</span>
              </button>
            </div>
          </div>
          
          {/* Conversation history - scrollable */}
          <div className="flex-1 overflow-y-auto mt-1 border-t border-gray-100 pt-1 min-h-0">
            <div className="px-2 py-1">
              <div className="flex justify-between items-center px-3 mb-1">
                <div className="text-xs font-medium text-gray-500">Recent Chats</div>
                {conversations.length > 0 && (
                  <button 
                    onClick={clearAllHistory}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {conversations.length === 0 ? (
                <div className="text-xs text-gray-400 px-3 py-2 italic">
                  No saved conversations yet
                </div>
              ) : (
                <div className="space-y-0.5">
                  {recentConversations.map((convo) => (
                    <button 
                      key={convo.id} 
                      className={`flex items-center justify-between w-full px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 group ${activeConversationId === convo.id && !isTemporaryChat ? 'bg-gray-100' : ''}`}
                      onClick={() => switchConversation(convo.id)}
                    >
                      <div className="flex items-center truncate">
                        <ChatBubbleLeftIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{convo.title}</span>
                      </div>
                      <button 
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded" 
                        onClick={(e) => deleteConversation(convo.id, e)}
                      >
                        <TrashIcon className="h-3 w-3 text-gray-500" />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-gray-50 overflow-hidden">
        {error && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 bg-red-50 border-l-4 border-red-400 p-3 rounded-lg shadow-sm text-sm animate-fadeIn max-w-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {initializing ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Messages Area - scrollable */}
            <div className={`flex-1 overflow-y-auto min-h-0 ${isEmptyChat ? 'flex items-center justify-center' : ''}`}>
              {isEmptyChat ? (
                <div className="text-center p-6 -mt-24">
                  <h1 className="text-3xl font-medium text-gray-800 mb-6">Hãy đặt câu hỏi liên quan đến IT.</h1>
                </div>
              ) : (
                <div className="py-4 px-4 max-w-3xl mx-auto">
                  {messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex mb-4 px-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[90%] ${message.role === 'assistant' ? 'whitespace-pre-wrap' : ''}`}>
                        <div className="flex items-start gap-3">
                          {message.role === 'assistant' && (
                            <div className="w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center flex-shrink-0 mt-1 text-xs">
                              <span>AI</span>
                            </div>
                          )}
                          <div className={`text-sm`}>
                            {message.role === 'assistant' ? (
                              <ReactMarkdown>
                                {message.content}
                              </ReactMarkdown>
                            ) : (
                              <div className="flex items-start gap-3">
                                <p>{message.content}</p>
                                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 mt-1 text-xs">
                                  <span>U</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex mb-4 px-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-700 text-white flex items-center justify-center flex-shrink-0 mt-1 text-xs">
                          <span>AI</span>
                        </div>
                        <div className="flex space-x-1 items-center">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Input Area with Suggestions - fixed at bottom */}
            <div className={`flex-shrink-0 px-4 pb-5 pt-2 bg-gray-50 ${isEmptyChat ? 'absolute bottom-0 left-0 right-0' : ''}`}>
              {/* Suggestion buttons */}
              <div className="flex justify-center space-x-2 mb-3">
                {suggestedActions.map((action, idx) => (
                  <button 
                    key={idx} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                    onClick={() => handleSuggestionClick(action)}
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
                <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors">
                  More
                </button>
              </div>
              
              {/* Input form */}
              <div className="max-w-3xl mx-auto relative">
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything"
                    className="w-full py-3 px-4 pr-20 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-gray-300 focus:ring-0 text-sm bg-white"
                    disabled={loading || initializing}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                    <button
                      type="button"
                      className="p-1.5 text-gray-400 hover:text-gray-500 mr-1"
                    >
                      <MicrophoneIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={loading || initializing || !input.trim()}
                      className="p-1.5 text-gray-400 hover:text-gray-600 disabled:text-gray-300 disabled:hover:text-gray-300"
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChat; 