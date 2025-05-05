import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  PaperAirplaneIcon, 
  ArrowPathIcon,
  AcademicCapIcon,
  LightBulbIcon, 
  CodeBracketIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { initChat, sendMessage } from '../../services/aiService';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chat, setChat] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef(null);

  // Danh sách gợi ý theo chủ đề
  const suggestionCategories = [
    {
      title: "Lập trình",
      icon: CodeBracketIcon,
      suggestions: [
        "Giải thích cách sử dụng React Hooks",
        "So sánh MongoDB và MySQL",
        "Cách tối ưu hiệu suất website",
        "Giải thích khái niệm Closure trong JavaScript"
      ]
    },
    {
      title: "Kiến thức IT",
      icon: AcademicCapIcon,
      suggestions: [
        "Design Patterns phổ biến trong phát triển phần mềm",
        "Giải thích nguyên lý SOLID",
        "Sự khác biệt giữa REST và GraphQL",
        "Kiến trúc Microservices là gì?"
      ]
    },
    {
      title: "Công nghệ hiện đại",
      icon: BookOpenIcon,
      suggestions: [
        "Giải thích về Docker và cách sử dụng",
        "Ứng dụng AI trong phát triển phần mềm",
        "So sánh các cloud platform phổ biến",
        "Blockchain và ứng dụng trong thực tế"
      ]
    },
    {
      title: "Phát triển kỹ năng",
      icon: LightBulbIcon,
      suggestions: [
        "Roadmap học Web Development từ cơ bản",
        "Cách nâng cao kỹ năng debugging",
        "Best practices khi làm việc với Git",
        "Cách chuẩn bị cho phỏng vấn vị trí Developer"
      ]
    }
  ];

  // Khởi tạo chat khi component mount
  useEffect(() => {
    const setupChat = async () => {
      try {
        const chatInstance = await initChat();
        setChat(chatInstance);
        // Thêm tin nhắn chào mừng
        setMessages([
          {
            role: 'assistant',
            content: 'Xin chào! Tôi là trợ lý AI chuyên về IT của CampusT. Tôi sẽ giúp bạn trả lời các câu hỏi về lập trình, công nghệ và thông tin. Hãy đặt câu hỏi về lĩnh vực công nghệ thông tin để tôi có thể hỗ trợ tốt nhất.'
          }
        ]);
      } catch (err) {
        console.error('Failed to initialize chat:', err);
        setError('Không thể kết nối đến AI. Vui lòng kiểm tra API key và thử lại sau.');
      } finally {
        setInitializing(false);
      }
    };

    setupChat();
  }, []);

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
    
    // Thêm tin nhắn của người dùng vào state
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Hiển thị trạng thái đang tải
    setLoading(true);
    
    try {
      // Gửi tin nhắn đến AI
      const response = await sendMessage(chat, userMessage);
      
      // Thêm phản hồi từ AI vào state
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
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
      setMessages([
        {
          role: 'assistant',
          content: 'Xin chào! Tôi là trợ lý AI chuyên về IT của CampusT. Tôi sẽ giúp bạn trả lời các câu hỏi về lập trình, công nghệ và thông tin. Hãy đặt câu hỏi về lĩnh vực công nghệ thông tin để tôi có thể hỗ trợ tốt nhất.'
        }
      ]);
      setError(null);
    } catch (err) {
      console.error('Failed to reset chat:', err);
      setError('Không thể khởi tạo lại cuộc trò chuyện. Vui lòng tải lại trang.');
    } finally {
      setInitializing(false);
    }
  };

  // Xử lý khi nhấp vào gợi ý
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <div className="h-[93vh] flex flex-col p-2 max-w-[100vw] mx-auto bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Trợ lý AI CampusT</h1>
        <button
          onClick={handleReset}
          disabled={initializing}
          className="flex items-center px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg transition-all shadow-sm border border-gray-200 hover:shadow"
        >
          <ArrowPathIcon className="h-4 w-4 mr-1 text-blue-600" />
          <span className="text-gray-700">Bắt đầu lại</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-3 rounded-lg shadow-sm text-sm animate-fadeIn">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {initializing ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="flex-1 flex gap-3 overflow-hidden h-full">
          {/* Chat Container */}
          <div className="flex-[5] flex flex-col overflow-hidden rounded-lg shadow-lg bg-white backdrop-blur-sm bg-opacity-90">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-100 scrollbar-track-transparent">
              <div className="p-4 space-y-4">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <div 
                      className={`max-w-[90%] p-3 rounded-2xl shadow-sm ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' 
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <ReactMarkdown 
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 text-sm" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-lg font-bold my-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-bold my-2" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-bold my-1" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 text-sm" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 text-sm" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1 text-sm" {...props} />,
                            code: ({node, inline, ...props}) => 
                              inline 
                                ? <code className="bg-gray-100 px-1 rounded text-xs" {...props} />
                                : <code className="block bg-gray-100 p-2 rounded text-xs my-2 overflow-x-auto" {...props} />,
                            pre: ({node, ...props}) => <pre className="bg-gray-100 p-2 rounded my-2 overflow-x-auto text-xs" {...props} />
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-white border border-gray-200 p-3 rounded-2xl shadow-sm">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                        <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex items-center px-3 py-2 border-t border-gray-100">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
                disabled={loading || initializing}
              />
              <button
                type="submit"
                disabled={loading || initializing || !input.trim()}
                className="ml-2 flex items-center justify-center h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:opacity-90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Suggestions Container */}
          <div className="flex-[2] bg-white rounded-lg shadow-lg overflow-y-auto min-w-[250px] flex flex-col backdrop-blur-sm bg-opacity-90 h-full">
            <div className="p-5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-100 scrollbar-track-transparent">
              <h2 className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Gợi ý nội dung</h2>
              
              <div className="space-y-5">
                {suggestionCategories.map((category, catIndex) => (
                  <div key={catIndex} className="space-y-3">
                    <div className="flex items-center space-x-2 text-gray-700 font-medium border-b border-gray-100 pb-2">
                      <category.icon className="h-5 w-5 text-blue-600" />
                      <h3 className="text-base">{category.title}</h3>
                    </div>
                    <div className="space-y-2 pl-1">
                      {category.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left p-2.5 rounded-lg text-sm hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat; 