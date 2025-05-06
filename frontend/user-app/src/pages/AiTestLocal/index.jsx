import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { PaperAirplaneIcon, ArrowPathIcon, PlayIcon, BeakerIcon, CheckIcon, XMarkIcon, ChatBubbleLeftRightIcon, ClockIcon, DocumentArrowDownIcon, PlusCircleIcon, ArrowUpTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';
import CodeEditor from './components/CodeEditor';
import TestCasePanel from './components/TestCasePanel';
import { initGeminiChat, sendMessageToGemini } from '../../services/geminiService';
import { executeCode } from '../../api/codeExecutionApi';

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'cpp', name: 'C++' },
  { id: 'java', name: 'Java' }
];

const DEFAULT_CODE = {
  javascript: '// Write your JavaScript code here\n\nfunction solution(input) {\n  // Your code here\n  return input;\n}\n\n// Example usage\nconsole.log(solution(42));',
  python: '# Write your Python code here\n\ndef solution(input):\n    # Your code here\n    return input\n\n# Example usage\nprint(solution(42))',
  cpp: '#include <iostream>\nusing namespace std;\n\n// Write your C++ code here\nint solution(int input) {\n    // Your code here\n    return input;\n}\n\nint main() {\n    cout << solution(42) << endl;\n    return 0;\n}',
  java: 'public class Main {\n    // Write your Java code here\n    public static int solution(int input) {\n        // Your code here\n        return input;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(solution(42));\n    }\n}'
};

const AiTestLocal = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [codeOutput, setCodeOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [chatHistory, setChatHistory] = useState([]);
  const [testSummary, setTestSummary] = useState({ total: 0, passed: 0, failed: 0 });
  const [userTestCases, setUserTestCases] = useState([]);
  const [problemDescription, setProblemDescription] = useState('');
  const [isGeneratingProblem, setIsGeneratingProblem] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('trung bình');
  const [selectedProblemType, setSelectedProblemType] = useState('xử lý chuỗi');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // List of possible problem types and difficulties
  const problemTypes = [
    'xử lý chuỗi', 
    'mảng và ma trận', 
    'đệ quy', 
    'tìm kiếm', 
    'sắp xếp', 
    'cấu trúc dữ liệu', 
    'thuật toán tham lam',
    'quy hoạch động',
    'toán học',
    'xử lý bit'
  ];
  
  const difficulties = ['dễ', 'trung bình', 'khó'];

  // Load chat history and problem description from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('aiTestLocalMessages');
    const savedTestCases = localStorage.getItem('aiTestLocalTestCases');
    const savedLanguage = localStorage.getItem('aiTestLocalLanguage');
    const savedCode = localStorage.getItem(`aiTestLocalCode_${selectedLanguage}`);
    const savedChatHistory = localStorage.getItem('aiTestLocalChatHistory');
    const savedProblemDescription = localStorage.getItem('aiTestLocalProblemDescription');

    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Failed to parse saved messages', e);
      }
    } else {
      const welcomeMessage = {
        role: 'assistant',
        content: 'Xin chào! Tôi là trợ lý AI của CampusT. Tôi có thể giúp bạn tạo bài toán lập trình kèm test cases. Nhấn nút "Tạo bài toán mới" để bắt đầu.'
      };
      setMessages([welcomeMessage]);
      localStorage.setItem('aiTestLocalMessages', JSON.stringify([welcomeMessage]));
    }

    if (savedTestCases) {
      try {
        setTestCases(JSON.parse(savedTestCases));
      } catch (e) {
        console.error('Failed to parse saved test cases', e);
      }
    }

    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }

    if (savedCode) {
      setCode(savedCode);
    }
    
    if (savedChatHistory) {
      try {
        setChatHistory(JSON.parse(savedChatHistory));
      } catch (e) {
        console.error('Failed to parse saved chat history', e);
        setChatHistory([]);
      }
    }

    if (savedProblemDescription) {
      setProblemDescription(savedProblemDescription);
    }
  }, []);

  // Save problem description to localStorage when it changes
  useEffect(() => {
    if (problemDescription) {
      localStorage.setItem('aiTestLocalProblemDescription', problemDescription);
    }
  }, [problemDescription]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiTestLocalMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Save test cases to localStorage when they change
  useEffect(() => {
    if (testCases.length > 0) {
      localStorage.setItem('aiTestLocalTestCases', JSON.stringify(testCases));
    }
  }, [testCases]);

  // Save selected language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('aiTestLocalLanguage', selectedLanguage);
    
    // Load saved code for the selected language or use default
    const savedCode = localStorage.getItem(`aiTestLocalCode_${selectedLanguage}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(DEFAULT_CODE[selectedLanguage]);
    }
  }, [selectedLanguage]);

  // Save code to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(`aiTestLocalCode_${selectedLanguage}`, code);
  }, [code, selectedLanguage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setProblemDescription(userMessage);
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Show loading indicator
    setLoading(true);
    
    try {
      // Send message to Gemini AI
      const response = await sendMessageToGemini(userMessage, messages);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      
      // Try to extract test cases from the response
      const extractedTestCases = extractTestCases(response);
      if (extractedTestCases.length > 0) {
        setTestCases(extractedTestCases);
      }
      
      // Add this conversation to history
      const newConversation = {
        id: Date.now(),
        title: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : ''),
        timestamp: new Date().toISOString(),
        messages: [...messages, { role: 'user', content: userMessage }, { role: 'assistant', content: response }],
        testCases: extractedTestCases.length > 0 ? extractedTestCases : testCases,
        problemDescription: userMessage
      };
      
      const updatedHistory = [newConversation, ...chatHistory].slice(0, 10);
      setChatHistory(updatedHistory);
      localStorage.setItem('aiTestLocalChatHistory', JSON.stringify(updatedHistory));
      
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Function to generate a new programming problem
  const generateNewProblem = async () => {
    setIsGeneratingProblem(true);
    setMessages([]);
    setProblemDescription('');
    setTestCases([]);
    setCode(DEFAULT_CODE[selectedLanguage]);
    setCodeOutput('');
    setTestResults([]);
    
    try {
      // Use selected difficulty and problem type
      const randomDifficulty = selectedDifficulty;
      const randomType = selectedProblemType;
      
      // Create a prompt to generate a new problem
      const prompt = `Hãy tạo một bài toán lập trình ${randomDifficulty} về ${randomType}. 
      
      Yêu cầu:
      1. Mô tả bài toán chi tiết với ví dụ input/output
      2. Bài toán phải phù hợp với ngôn ngữ ${LANGUAGES.find(l => l.id === selectedLanguage)?.name}
      3. Tạo 5-8 test cases với input và expected output
      4. Format kết quả như sau:
      
      ## <Tên bài toán>
      
      <Mô tả chi tiết về bài toán>
      
      ### Ví dụ:
      Input: <ví dụ input>
      Output: <ví dụ output>
      
      ### Test cases:
      \`\`\`json
      [
        {
          "input": <input>,
          "expected": <expected output>
        },
        ...
      ]
      \`\`\`
      `;
      
      // Add system message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Đang tạo bài toán ${randomDifficulty} về ${randomType}... Vui lòng đợi trong giây lát.` 
      }]);
      
      // Send request to generate a new problem
      const response = await sendMessageToGemini(prompt, []);
      
      // Extract problem description (everything before the first code block)
      const descriptionMatch = response.split('```')[0];
      if (descriptionMatch) {
        setProblemDescription(descriptionMatch.trim());
      }
      
      // Extract test cases
      const extractedTestCases = extractTestCases(response);
      if (extractedTestCases.length > 0) {
        setTestCases(extractedTestCases);
      }
      
      // Add AI response to chat
      setMessages([{ role: 'assistant', content: response }]);
      
      // Add this conversation to history
      const newConversation = {
        id: Date.now(),
        title: `Bài toán ${randomDifficulty} về ${randomType}`,
        timestamp: new Date().toISOString(),
        messages: [{ role: 'assistant', content: response }],
        testCases: extractedTestCases,
        problemDescription: descriptionMatch ? descriptionMatch.trim() : ''
      };
      
      const updatedHistory = [newConversation, ...chatHistory].slice(0, 10);
      setChatHistory(updatedHistory);
      localStorage.setItem('aiTestLocalChatHistory', JSON.stringify(updatedHistory));
      
    } catch (err) {
      console.error('Error generating problem:', err);
      setMessages([{ 
        role: 'assistant', 
        content: 'Có lỗi xảy ra khi tạo bài toán mới. Vui lòng thử lại sau.' 
      }]);
    } finally {
      setIsGeneratingProblem(false);
    }
  };

  const extractTestCases = (response) => {
    // Enhanced test case extraction with better pattern matching
    // First try to extract a valid JSON array using code blocks
    const testCasesRegex = /```(?:json|javascript)?\s*(\[(?:\s|\S)*?\])\s*```/g;
    const matches = [...response.matchAll(testCasesRegex)];
    
    if (matches && matches.length > 0) {
      // Try each match until we find valid test cases
      for (const match of matches) {
        try {
          const jsonString = match[1].trim();
          const parsedTestCases = JSON.parse(jsonString);
          
          // Validate that it's an array of test cases with input and expected output
          if (Array.isArray(parsedTestCases) && 
              parsedTestCases.length > 0 && 
              parsedTestCases[0].hasOwnProperty('input') && 
              parsedTestCases[0].hasOwnProperty('expected')) {
            return parsedTestCases;
          }
        } catch (e) {
          console.error('Failed to parse test cases from response match', e);
        }
      }
    }
    
    // If no valid code blocks found, try to find any JSON array in the text
    try {
      const jsonRegex = /\[\s*\{\s*"input"[\s\S]*?\}\s*\]/g;
      const jsonMatch = response.match(jsonRegex);
      
      if (jsonMatch) {
        const parsedTestCases = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsedTestCases) && 
            parsedTestCases.length > 0 && 
            parsedTestCases[0].hasOwnProperty('input') && 
            parsedTestCases[0].hasOwnProperty('expected')) {
          return parsedTestCases;
        }
      }
    } catch (e) {
      console.error('Failed to extract JSON from plain text', e);
    }
    
    return [];
  };

  const handleReset = () => {
    // Clear chat history
    const welcomeMessage = {
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của CampusT. Tôi có thể giúp bạn tạo các test case để kiểm tra code của bạn. Hãy mô tả bài toán hoặc yêu cầu, và tôi sẽ tạo test case phù hợp.'
    };
    setMessages([welcomeMessage]);
    localStorage.setItem('aiTestLocalMessages', JSON.stringify([welcomeMessage]));
    
    // Clear test cases
    setTestCases([]);
    localStorage.removeItem('aiTestLocalTestCases');
    
    // Reset code output and test results
    setCodeOutput('');
    setTestResults([]);
  };

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setCodeOutput('');
    setTestResults([]);
    setTestSummary({ total: 0, passed: 0, failed: 0 });
    
    try {
      // First run the code without test cases to see general output
      const result = await executeCode(code, selectedLanguage, '');
      
      if (result.success) {
        setCodeOutput(result.data.stdout || 'No output');
        
        // Run against test cases if there are any
        if (testCases.length > 0) {
          const testResults = await Promise.all(testCases.map(async (testCase, index) => {
            const input = JSON.stringify(testCase.input);
            const testResult = await executeCode(code, selectedLanguage, input);
            
            const output = testResult.success ? testResult.data.stdout.trim() : 'Error';
            const expected = JSON.stringify(testCase.expected);
            const passed = output.includes(expected) || output === expected;
            
            return {
              id: index,
              input: testCase.input,
              expected: testCase.expected,
              actual: output,
              passed
            };
          }));
          
          setTestResults(testResults);
          
          // Calculate test summary
          const passed = testResults.filter(r => r.passed).length;
          setTestSummary({
            total: testResults.length,
            passed,
            failed: testResults.length - passed
          });
        }
      } else {
        setCodeOutput(result.data.stderr || 'Error running code');
      }
    } catch (err) {
      console.error('Error running code:', err);
      setCodeOutput(`Error: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setIsRunning(false);
    }
  };
  
  const loadHistoryItem = (historyItem) => {
    setMessages(historyItem.messages);
    if (historyItem.testCases && historyItem.testCases.length > 0) {
      setTestCases(historyItem.testCases);
    }
    if (historyItem.problemDescription) {
      setProblemDescription(historyItem.problemDescription);
    }
    setActiveTab('chat');
  };

  // Export test cases to a file
  const exportTestCases = () => {
    if (testCases.length === 0) return;
    
    const dataStr = JSON.stringify(testCases, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `testcases_${selectedLanguage}_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // Import test cases from a file
  const importTestCases = (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsedTestCases = JSON.parse(content);
        
        // Validate the imported test cases
        if (Array.isArray(parsedTestCases) && parsedTestCases.length > 0) {
          // Check if each test case has input and expected properties
          const validTestCases = parsedTestCases.filter(tc => 
            tc && typeof tc === 'object' && tc.hasOwnProperty('input') && tc.hasOwnProperty('expected')
          );
          
          if (validTestCases.length > 0) {
            // Mark all imported test cases as user test cases
            setUserTestCases(prevUserTestCases => [...prevUserTestCases, ...validTestCases]);
            
            // Add to current test cases
            setTestCases(prevTestCases => [...prevTestCases, ...validTestCases]);
            
            // Show success message in code output
            setCodeOutput(`Successfully imported ${validTestCases.length} test cases from ${file.name}`);
          } else {
            setCodeOutput(`Error: The file does not contain valid test cases with 'input' and 'expected' properties.`);
          }
        } else {
          setCodeOutput(`Error: The file does not contain a valid array of test cases.`);
        }
      } catch (error) {
        console.error('Error parsing test case file:', error);
        setCodeOutput(`Error parsing file: ${error.message}`);
      }
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };
  
  // Trigger file input click
  const handleImportClick = () => {
    fileInputRef.current.click();
  };
  
  // Add a custom test case
  const addCustomTestCase = () => {
    const newTestCase = {
      input: null,
      expected: null
    };
    
    setUserTestCases([...userTestCases, newTestCase]);
    
    // Add to current test cases as well
    setTestCases([...testCases, newTestCase]);
  };

  return (
    <div className="h-[93vh] flex flex-col p-2 max-w-[100vw] mx-auto bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          AI Test Case Generator
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {difficulties.map(diff => (
                <option key={diff} value={diff}>Độ khó: {diff}</option>
              ))}
            </select>
            
            <select
              value={selectedProblemType}
              onChange={(e) => setSelectedProblemType(e.target.value)}
              className="px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {problemTypes.map(type => (
                <option key={type} value={type}>Loại: {type}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={generateNewProblem}
            disabled={isGeneratingProblem}
            className="flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="h-4 w-4 mr-1" />
            <span>{isGeneratingProblem ? 'Đang tạo...' : 'Tạo bài toán mới'}</span>
          </button>
          <select
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
          <button
            onClick={handleImportClick}
            className="flex items-center px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg transition-all shadow-sm border border-gray-200 hover:shadow"
          >
            <ArrowUpTrayIcon className="h-4 w-4 mr-1 text-blue-600" />
            <span className="text-gray-700">Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importTestCases}
            className="hidden"
          />
          <button
            onClick={exportTestCases}
            disabled={testCases.length === 0}
            className="flex items-center px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg transition-all shadow-sm border border-gray-200 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1 text-blue-600" />
            <span className="text-gray-700">Export</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg transition-all shadow-sm border border-gray-200 hover:shadow"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1 text-blue-600" />
            <span className="text-gray-700">Bắt đầu lại</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* Left side - AI Chat with tabs - 20% width */}
        <div className="w-1/5 flex flex-col overflow-hidden rounded-lg shadow-lg bg-white backdrop-blur-sm bg-opacity-90">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center justify-center py-2.5 px-4 text-sm font-medium focus:outline-none w-1/2 ${
                activeTab === 'chat'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
              Trò chuyện
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center justify-center py-2.5 px-4 text-sm font-medium focus:outline-none w-1/2 ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClockIcon className="w-4 h-4 mr-2" />
              Lịch sử
            </button>
          </div>
          
          {/* Chat tab content */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-100 scrollbar-track-transparent">
                <div className="p-3 space-y-3">
                  {messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                      <div 
                        className={`max-w-[95%] p-2 rounded-lg shadow-sm text-xs ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' 
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <ReactMarkdown 
                            components={{
                              p: ({node, ...props}) => <p className="mb-1 text-xs text-gray-800" {...props} />,
                              h1: ({node, ...props}) => <h1 className="text-sm font-bold my-1 text-gray-800" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xs font-bold my-1 text-gray-800" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-xs font-bold my-1 text-gray-800" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-1 text-xs text-gray-800" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-1 text-xs text-gray-800" {...props} />,
                              li: ({node, ...props}) => <li className="mb-0.5 text-xs text-gray-800" {...props} />,
                              code: ({node, inline, ...props}) => 
                                inline 
                                  ? <code className="bg-gray-100 px-1 rounded text-xs" {...props} />
                                  : <code className="block bg-gray-100 p-1 rounded text-xs my-1 overflow-x-auto" {...props} />,
                              pre: ({node, ...props}) => <pre className="bg-gray-100 p-1 rounded my-1 overflow-x-auto text-xs" {...props} />
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-xs">{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading || isGeneratingProblem ? (
                    <div className="flex justify-start animate-pulse">
                      <div className="bg-white border border-gray-200 p-2 rounded-lg shadow-sm">
                        <div className="flex space-x-1">
                          <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                          <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex items-center px-2 py-2 border-t border-gray-100">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hỏi thêm về bài toán..."
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs shadow-sm"
                  disabled={loading || isGeneratingProblem}
                />
                <button
                  type="submit"
                  disabled={loading || isGeneratingProblem || !input.trim()}
                  className="ml-1 flex items-center justify-center h-7 w-7 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:opacity-90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-3.5 w-3.5" />
                </button>
              </form>
            </>
          )}
          
          {/* History tab content */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3">
                {chatHistory.length > 0 ? (
                  <div className="space-y-2">
                    {chatHistory.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => loadHistoryItem(item)}
                        className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="text-xs font-medium truncate">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.testCases?.length || 0} test cases
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    <ClockIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right side - Code Editor and Test Results - 80% width */}
        <div className="w-4/5 flex flex-col overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 overflow-hidden rounded-lg shadow-lg bg-white backdrop-blur-sm bg-opacity-90">
            <div className="p-2 bg-blue-600 text-white text-sm font-medium flex justify-between items-center">
              <span>Code Editor ({LANGUAGES.find(l => l.id === selectedLanguage)?.name})</span>
              <button
                onClick={handleRunCode}
                disabled={isRunning || isGeneratingProblem}
                className="flex items-center px-3 py-1 bg-white hover:bg-gray-100 text-blue-600 rounded text-xs transition-all"
              >
                {isRunning ? (
                  <>
                    <BeakerIcon className="h-3 w-3 mr-1 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-3 w-3 mr-1" />
                    <span>Run Code</span>
                  </>
                )}
              </button>
            </div>
            <CodeEditor 
              code={code} 
              language={selectedLanguage} 
              onChange={handleCodeChange} 
            />
          </div>

          {/* Results area - split into two columns */}
          <div className="mt-3 grid grid-cols-2 gap-3 h-[300px]">
            {/* Test Cases and Results */}
            <div className="overflow-hidden rounded-lg shadow-lg bg-white backdrop-blur-sm bg-opacity-90">
              <div className="p-2 bg-indigo-600 text-white text-sm font-medium flex justify-between items-center">
                <span>Test Cases & Results</span>
                <div className="flex items-center space-x-2">
                  {testResults.length > 0 && testSummary.passed > 0 && (
                    <div className={`text-xs py-0.5 px-2 rounded font-medium ${
                      testSummary.passed === testSummary.total 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {testSummary.passed === testSummary.total 
                        ? 'Đã giải quyết thành công!' 
                        : `Đã đúng ${testSummary.passed}/${testSummary.total} test cases`}
                    </div>
                  )}
                  {testResults.length > 0 && (
                    <div className="flex items-center space-x-2 text-xs bg-white text-gray-800 py-0.5 px-2 rounded">
                      <span className="font-medium">Total: {testSummary.total}</span>
                      <div className="h-3 w-px bg-gray-300"></div>
                      <span className="text-green-600 font-medium">✓ {testSummary.passed}</span>
                      <div className="h-3 w-px bg-gray-300"></div>
                      <span className="text-red-600 font-medium">✗ {testSummary.failed}</span>
                    </div>
                  )}
                  <button
                    onClick={addCustomTestCase}
                    className="flex items-center text-xs bg-white hover:bg-gray-50 text-indigo-700 font-medium py-0.5 px-2 rounded"
                  >
                    <PlusCircleIcon className="h-3 w-3 mr-1" />
                    Add
                  </button>
                </div>
              </div>
              <div className="h-[calc(100%-32px)] overflow-y-auto p-2">
                {testCases.length > 0 ? (
                  <TestCasePanel 
                    testCases={testCases} 
                    testResults={testResults} 
                    userTestCases={userTestCases}
                    updateTestCases={setTestCases}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-3 text-sm">
                    {isGeneratingProblem 
                      ? 'Đang tạo bài toán và test cases...'
                      : 'Chưa có test case nào. Nhấn "Tạo bài toán mới" để bắt đầu.'}
                  </div>
                )}
              </div>
            </div>

            {/* Code Output */}
            <div className="overflow-hidden rounded-lg shadow-lg bg-white backdrop-blur-sm bg-opacity-90">
              <div className="p-2 bg-gray-700 text-white text-sm font-medium">
                Output
              </div>
              <div className="h-[calc(100%-32px)] overflow-y-auto p-2 font-mono text-xs">
                {codeOutput ? (
                  <pre className="whitespace-pre-wrap">{codeOutput}</pre>
                ) : (
                  <div className="text-center text-gray-500 py-3">
                    Run code to see output here
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiTestLocal; 