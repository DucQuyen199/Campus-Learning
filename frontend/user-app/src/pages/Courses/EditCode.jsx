import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import courseApi from '../../api/courseApi';
import { useAuth } from '../../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import aiService from '../../services/aiService';
import Editor from '@monaco-editor/react';

// Language detection patterns
const languagePatterns = {
  javascript: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    patterns: [
      /function\s+\w+\s*\(/i,
      /const\s+\w+\s*=/i,
      /let\s+\w+\s*=/i,
      /var\s+\w+\s*=/i,
      /console\.log/i,
      /export\s+default/i,
      /import\s+.*\s+from/i,
      /document\.getElement/i
    ]
  },
  python: {
    extensions: ['.py'],
    patterns: [
      /def\s+\w+\s*\(/i,
      /print\s*\(/i,
      /import\s+\w+/i,
      /from\s+\w+\s+import/i,
      /if\s+__name__\s*==\s*["']__main__["']/i
    ]
  },
  java: {
    extensions: ['.java'],
    patterns: [
      /public\s+class/i,
      /public\s+static\s+void\s+main/i,
      /System\.out\.print/i,
      /import\s+java\./i
    ]
  },
  cpp: {
    extensions: ['.cpp', '.cc', '.h', '.hpp'],
    patterns: [
      /#include\s*<\w+>/i,
      /using\s+namespace\s+std/i,
      /std::/i,
      /int\s+main\s*\(/i,
      /cout\s*<</i
    ]
  },
  php: {
    extensions: ['.php'],
    patterns: [
      /<\?php/i,
      /echo\s+/i,
      /\$\w+\s*=/i,
      /function\s+\w+\s*\(/i
    ]
  },
  html: {
    extensions: ['.html', '.htm'],
    patterns: [
      /<html/i,
      /<body/i,
      /<div/i,
      /<script/i,
      /<head/i
    ]
  },
  css: {
    extensions: ['.css'],
    patterns: [
      /body\s*{/i,
      /\.\w+\s*{/i,
      /#\w+\s*{/i,
      /@media/i
    ]
  }
};

// Docker container configurations for different languages
const dockerConfigs = {
  javascript: {
    image: 'node:16-alpine',
    command: 'node',
    filename: 'code.js'
  },
  python: {
    image: 'python:3.9-alpine',
    command: 'python',
    filename: 'code.py'
  },
  java: {
    image: 'openjdk:11-jdk-alpine',
    command: 'java',
    filename: 'Main.java'
  },
  cpp: {
    image: 'gcc:latest',
    command: 'g++ -o program code.cpp && ./program',
    filename: 'code.cpp'
  },
  php: {
    image: 'php:7.4-cli',
    command: 'php',
    filename: 'code.php'
  }
};

const EditCode = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const textareaRef = useRef(null);
  const editorRef = useRef(null);
  
  // Group all useState hooks together
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lessonDetails, setLessonDetails] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [aiInputMode, setAiInputMode] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [isBottomHalf, setIsBottomHalf] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const [selectedText, setSelectedText] = useState('');
  const [selectedLineNumber, setSelectedLineNumber] = useState(0);
  const [editorTheme, setEditorTheme] = useState('vs-light'); // 'vs-light' or 'vs-dark'
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [executionId, setExecutionId] = useState(null);
  const [output, setOutput] = useState('');
  const inputRef = useRef(null);
  
  // Monaco editor setup
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Setup editor events
    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      const lineNumber = position.lineNumber;
      const column = position.column;
      
      setCursorPosition({
        lineNumber: lineNumber,
        column: column,
        // Get editor coordinates for AI prompt positioning
        top: editor.getTopForLineNumber(lineNumber),
        left: editor.getOffsetForColumn(lineNumber, column)
      });
    });
    
    editor.onDidChangeModelContent(() => {
      const count = editor.getModel().getLineCount();
      setLineCount(count);
    });
    
    editor.onDidFocusEditorText(() => {
      // Setup keyboard event handling in the editor
      editor.onKeyDown((e) => {
        // Handle slash command
        if (e.code === 'Slash' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
          e.preventDefault();
          setAiInputMode(true);
          setShowAiPrompt(true);
          setAiPrompt('');
        }
        
        // Handle Ctrl+I or Cmd+I
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyI') {
          e.preventDefault();
          
          const selection = editor.getSelection();
          const selectedText = editor.getModel().getValueInRange(selection);
          
          setSelectedText(selectedText);
          setSelectedLineNumber(selection.startLineNumber);
          
          let initialPrompt = '';
          if (selectedText && selectedText.trim() !== '') {
            initialPrompt = `Giải thích đoạn mã này:\n${selectedText}`;
          }
          
          setAiInputMode(true);
          setShowAiPrompt(true);
          setAiPrompt(initialPrompt);
        }
      });
    });
  };
  
  // Handle AI code assistance
  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) {
      toast.warning('Vui lòng nhập yêu cầu cho AI');
      return;
    }

    try {
      setIsAiProcessing(true);
      
      // Initialize the AI chat
      const chat = await aiService.initChat();
      
      // Send the prompt to AI with context about the code
      const prompt = `Tôi đang làm bài tập với ngôn ngữ ${language}. Đây là code hiện tại của tôi:\n\n${code}\n\nYêu cầu: ${aiPrompt}\n\nVui lòng giúp tôi giải quyết và cung cấp code ví dụ.`;
      const aiResponse = await aiService.sendMessage(chat, prompt);
      
      // Extract code from AI response if available
      let codeResponse = aiResponse;
      
      // Extract code blocks if they exist (typically between ```code``` markdown syntax)
      const codeBlockRegex = /```(?:javascript|js|python|java|c\+\+|cpp|php|html|css|[a-z]*)\n([\s\S]*?)```/g;
      const codeBlocks = [...aiResponse.matchAll(codeBlockRegex)];
      
      if (codeBlocks.length > 0) {
        codeResponse = codeBlocks.map(match => match[1]).join('\n\n');
      }
      
      // Insert AI suggestion at cursor position
      if (editorRef.current) {
        const editor = editorRef.current;
        const selection = editor.getSelection();
        const position = selection ? selection : editor.getPosition();
        
        // Insert the code at the current position
        editor.executeEdits('ai-insert', [{
          range: {
            startLineNumber: position.startLineNumber || position.lineNumber,
            startColumn: position.startColumn || position.column,
            endLineNumber: position.endLineNumber || position.lineNumber,
            endColumn: position.endColumn || position.column,
          },
          text: codeResponse,
          forceMoveMarkers: true
        }]);
        
        // Update the code state
        setCode(editor.getValue());
      }
      
      setAiPrompt('');
      setShowAiPrompt(false);
      setAiInputMode(false);
      toast.success('AI đã tạo code thành công!');
    } catch (error) {
      console.error('Error calling AI service:', error);
      toast.error('Có lỗi khi gọi dịch vụ AI. Vui lòng thử lại sau.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Handle keyboard input for AI prompt
  const handleAiKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiAssist();
    } else if (e.key === 'Escape') {
      setShowAiPrompt(false);
      setAiInputMode(false);
      setAiPrompt('');
      // Focus back on the editor
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  };

  // Detect language based on code content
  const detectLanguage = (code) => {
    // Default to javascript if can't detect
    if (!code || code.trim() === '') return 'javascript';
    
    // Check each language's patterns
    for (const [lang, config] of Object.entries(languagePatterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(code)) {
          console.log(`Detected language: ${lang}`);
          return lang;
        }
      }
    }
    
    // Fallback to javascript if no patterns match
    return 'javascript';
  };

  // Run code function - modified to use Docker
  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setTestResults(null);
      setOutput('');
      setIsWaitingForInput(false);
      setExecutionId(null);
      
      // Get Docker configuration for current language
      const dockerConfig = dockerConfigs[language] || dockerConfigs.javascript;
      
      // Run code with error handling
      try {
        console.log(`Running ${language} code`);
        // Using executeCode API to run the code without test cases
        const response = await courseApi.executeCode(code, language);
        
        if (response && response.success) {
          const result = response.data || {};
          
          // Check if program is waiting for input
          if (result.needsInput) {
            console.log('Program is waiting for input');
            setOutput(result.stdout || '');
            setIsWaitingForInput(true);
            setExecutionId(result.executionId);
            
            // Create minimal test results to show output
            setTestResults({
              passed: 1,
              total: 1,
              tests: [{
                name: 'Code execution',
                passed: true,
                message: 'Chương trình đang chờ nhập dữ liệu',
                output: result.stdout || '',
                needsInput: true
              }]
            });
          } else {
            // Normal result without interactive input
            setOutput(result.stdout || result.output || '');
            setTestResults({
              passed: 1,
              total: 1,
              tests: [{
                name: 'Code execution',
                passed: true,
                message: 'Code đã được chạy thành công!',
                output: result.stdout || result.output || ''
              }]
            });
            toast.success('Code đã được chạy thành công!');
          }
        } else {
          setOutput(response?.data?.stdout || response?.data?.output || '');
          setTestResults({
            passed: 0,
            total: 1,
            tests: [{
              name: 'Code execution',
              passed: false,
              message: response?.message || response?.error || 'Có lỗi xảy ra khi chạy code',
              output: response?.data?.stdout || response?.data?.output || ''
            }]
          });
          toast.error('Có lỗi xảy ra khi chạy code');
        }
      } catch (innerError) {
        console.error('Error executing code on server:', innerError);
        
        // Create a more user-friendly error message
        let errorMessage = 'Không thể kết nối đến máy chủ thực thi code.';
        let errorDetails = '';
        
        if (innerError.isNetworkError) {
          errorMessage = 'Lỗi kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
        } else if (innerError.response && innerError.response.status === 500) {
          errorMessage = 'Lỗi máy chủ khi chạy code. Vui lòng thử lại sau.';
        } else if (innerError.message) {
          errorDetails = innerError.message;
        }
        
        setOutput(errorDetails || 'Không có thông tin chi tiết.');
        setTestResults({
          passed: 0,
          total: 1,
          tests: [{
            name: 'Error',
            passed: false,
            message: errorMessage,
            output: errorDetails || 'Không có thông tin chi tiết.'
          }]
        });
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error in handleRunCode:', error);
      setOutput('Lỗi không xác định khi chạy code. Vui lòng thử lại.');
      setTestResults({
        passed: 0,
        total: 1,
        tests: [{
          name: 'Error',
          passed: false,
          message: 'Lỗi không xác định khi chạy code. Vui lòng thử lại.'
        }]
      });
      toast.error('Có lỗi xảy ra khi chạy code');
    } finally {
      setIsRunning(false);
    }
  };

  // Send input to running program
  const handleSendInput = async (e) => {
    e.preventDefault();
    
    if (!executionId || !isWaitingForInput) return;
    
    try {
      console.log(`Sending input "${userInput}" to execution ${executionId}`);
      
      // Append input to current output with a newline
      setOutput(prevOutput => `${prevOutput}${userInput}\n`);
      
      const response = await courseApi.sendInput(executionId, userInput);
      
      console.log('Input response:', response);
      
      if (response && response.success) {
        const result = response.data || {};
        
        // Update output with the latest stdout
        setOutput(result.stdout || '');
        
        // Update test results
        const updatedTestResults = {...testResults};
        if (updatedTestResults.tests && updatedTestResults.tests.length > 0) {
          updatedTestResults.tests[0].output = result.stdout || '';
        }
        
        if (result.isWaitingForInput) {
          // Still waiting for more input
          setIsWaitingForInput(true);
          setUserInput('');
          
          // Update test message
          if (updatedTestResults.tests && updatedTestResults.tests.length > 0) {
            updatedTestResults.tests[0].needsInput = true;
            updatedTestResults.tests[0].message = 'Chương trình đang chờ nhập dữ liệu';
          }
        } else {
          // Program is done
          setIsWaitingForInput(false);
          setExecutionId(null);
          setUserInput('');
          
          // Update test results for completion
          if (updatedTestResults.tests && updatedTestResults.tests.length > 0) {
            updatedTestResults.tests[0].needsInput = false;
            updatedTestResults.tests[0].message = 'Code đã được chạy thành công!';
          }
        }
        
        setTestResults(updatedTestResults);
      } else {
        setIsWaitingForInput(false);
        setExecutionId(null);
        setUserInput('');
        toast.error(response?.message || 'Lỗi khi gửi dữ liệu đầu vào');
      }
    } catch (error) {
      console.error('Error sending input:', error);
      setIsWaitingForInput(false);
      setExecutionId(null);
      setOutput(prev => `${prev}\nLỗi: ${error.message || 'Không thể gửi dữ liệu đầu vào'}`);
      toast.error('Có lỗi khi gửi dữ liệu đầu vào');
    }
  };

  // Stop running program
  const handleStopExecution = async () => {
    if (!executionId) return;
    
    try {
      console.log(`Stopping execution ${executionId}`);
      
      const response = await courseApi.stopExecution(executionId);
      
      console.log('Stop response:', response);
      
      setIsWaitingForInput(false);
      setExecutionId(null);
      setUserInput('');
      
      // Update output and test results
      setOutput(prev => `${prev}\n[Chương trình đã bị dừng]`);
      
      const updatedTestResults = {...testResults};
      if (updatedTestResults.tests && updatedTestResults.tests.length > 0) {
        updatedTestResults.tests[0].output = `${updatedTestResults.tests[0].output || ''}\n[Chương trình đã bị dừng]`;
        updatedTestResults.tests[0].needsInput = false;
        updatedTestResults.tests[0].message = 'Chương trình đã bị dừng bởi người dùng';
      }
      
      setTestResults(updatedTestResults);
      toast.info('Đã dừng chương trình');
    } catch (error) {
      console.error('Error stopping execution:', error);
      setIsWaitingForInput(false);
      setExecutionId(null);
      setUserInput('');
      toast.error('Có lỗi khi dừng chương trình');
    }
  };

  // Focus input field when waiting for input
  useEffect(() => {
    if (isWaitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isWaitingForInput]);

  // Map language from our definitions to Monaco's supported languages
  const mapLanguageToMonaco = (lang) => {
    const langMap = {
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'php': 'php',
      'html': 'html',
      'css': 'css'
    };
    
    return langMap[lang] || 'javascript';
  };

  // GROUP ALL useEffect HOOKS TOGETHER IN A CONSISTENT ORDER

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để truy cập bài tập');
      navigate('/login', { state: { from: `/courses/${courseId}/edit-code/${lessonId}` } });
    }
  }, [isAuthenticated, courseId, lessonId, navigate]);
  
  // Load exercise data
  useEffect(() => {
    const fetchExerciseData = async () => {
      try {
        setLoading(true);
        
        console.log('EditCode: Loading exercise data with courseId:', courseId, 'lessonId:', lessonId);
        
        if (!courseId || !lessonId) {
          setError('Thông tin bài tập không hợp lệ');
          setLoading(false);
          return;
        }
        
        // Check if user is enrolled
        const enrollResponse = await courseApi.checkEnrollment(courseId);
        console.log('EditCode: Enrollment check response:', enrollResponse);
        
        if (!enrollResponse.success || !enrollResponse.isEnrolled) {
          setError('Bạn chưa đăng ký khóa học này');
          setLoading(false);
          navigate(`/courses/${courseId}`);
          return;
        }
        
        // First try to get lesson content to see if this is a code exercise or regular lesson
        try {
          const lessonResponse = await courseApi.getCourseContent(courseId);
          
          if (lessonResponse && lessonResponse.success) {
            // Find the current lesson in the modules
            let currentLesson = null;
            let currentModule = null;
            
            if (lessonResponse.data && lessonResponse.data.Modules) {
              for (const module of lessonResponse.data.Modules) {
                if (module.Lessons) {
                  const lesson = module.Lessons.find(l => 
                    l.LessonID === lessonId || l.LessonID === parseInt(lessonId)
                  );
                  if (lesson) {
                    currentLesson = lesson;
                    currentModule = module;
                    break;
                  }
                }
              }
            }
            
            // If we found the lesson, render its content
            if (currentLesson) {
              // Store lesson details and module title
              setLessonDetails(currentLesson);
              setModuleTitle(currentModule?.Title || '');
              
              // Update page title
              document.title = `${currentLesson.Title} | Bài tập lập trình`;
              
              // Check if it's a proper code exercise
              const hasCodeExercise = !!currentLesson.CodeExercise || 
                                    !!currentLesson.codeExercise || 
                                    !!currentLesson.Exercise;
              
              const isPracticeExercise = hasCodeExercise && 
                                        (currentLesson.Type === 'coding' || 
                                        currentLesson.Type === 'exercise');
              
              if (isPracticeExercise) {
                // It's a proper code exercise, continue with the normal flow
                // Try to fetch it with the specific API endpoint
                fetchCodeExercise();
              } else {
                // It's not a proper code exercise, but we want to show the code editor anyway
                // Create a simple exercise object from the lesson data
                const simpleExercise = {
                  title: currentLesson.Title,
                  description: currentLesson.Content || 'Không có nội dung cho bài học này.',
                  initialCode: currentLesson.CodeSnippet || '// Hãy viết code của bạn ở đây\n\n',
                  language: 'javascript',
                  tests: []
                };
                
                setExercise(simpleExercise);
                setCode(simpleExercise.initialCode);
                setLanguage(simpleExercise.language);
                setLoading(false);
              }
            } else {
              // Lesson not found, try to fetch as code exercise
              fetchCodeExercise();
            }
          } else {
            // Lesson content API failed, try to fetch as code exercise
            fetchCodeExercise();
          }
        } catch (err) {
          console.error('Error loading lesson:', err);
          // Fall back to code exercise API
          fetchCodeExercise();
        }
      } catch (err) {
        console.error('Error in main fetchExerciseData:', err);
        setError('Có lỗi xảy ra khi tải thông tin bài tập. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    // Function to fetch code exercise data
    const fetchCodeExercise = async () => {
      try {
        // Fetch exercise data from API
        const exerciseResponse = await courseApi.getCodeExercise(courseId, lessonId);
        
        if (!exerciseResponse || !exerciseResponse.success) {
          setError(exerciseResponse?.message || 'Không thể tải thông tin bài tập');
          setLoading(false);
          return;
        }
        
        const exerciseData = exerciseResponse.data;
        console.log('EditCode: Exercise data from API:', exerciseData);
        
        setExercise(exerciseData);
        setCode(exerciseData.initialCode);
        setLanguage(exerciseData.language);
        
        // Set module title from API response if available
        if (exerciseData.moduleTitle) {
          setModuleTitle(exerciseData.moduleTitle);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading exercise:', err);
        setError('Có lỗi xảy ra khi tải thông tin bài tập. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    if (courseId && lessonId && isAuthenticated) {
      fetchExerciseData();
    }
  }, [courseId, lessonId, isAuthenticated, navigate]);
  
  // Update line count whenever code changes
  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
  }, [code]);
  
  // Automatically detect language when code changes
  useEffect(() => {
    if (code && code.trim() !== '') {
      const detectedLang = detectLanguage(code);
      if (detectedLang !== language) {
        setLanguage(detectedLang);
      }
    }
  }, [code, language]);

  // Submit solution
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Check if this is a proper exercise with tests
      if (!exercise.tests || exercise.tests.length === 0) {
        // No tests, just mark as complete
        await courseApi.markLessonAsComplete(courseId, lessonId);
        toast.success('Đã đánh dấu bài học hoàn thành!');
        
        // Navigate back to the course after a short delay
        setTimeout(() => {
          navigate(`/courses/${courseId}/learn`);
        }, 1500);
      } else {
        // Has tests, submit normally
        const response = await courseApi.submitCodeExercise(courseId, lessonId, code);
        
        if (response && response.success) {
          toast.success(response.message || 'Đã nộp bài thành công!');
          
          // Mark this lesson as complete
          await courseApi.markLessonAsComplete(courseId, lessonId);
          
          // Navigate back to the course after a short delay
          setTimeout(() => {
            navigate(`/courses/${courseId}/learn`);
          }, 1500);
        } else {
          toast.error(response?.message || 'Không thể nộp bài');
        }
      }
    } catch (error) {
      console.error('Error submitting solution:', error);
      toast.error('Đã xảy ra lỗi khi nộp bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-md">
          <p className="font-medium">{error}</p>
        </div>
        <button 
          onClick={() => navigate(`/courses/${courseId}`)} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại khóa học
        </button>
      </div>
    );
  }
  
  // Empty state
  if (!exercise) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4">
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-4 max-w-md">
          <p className="font-medium">Không tìm thấy thông tin bài tập</p>
        </div>
        <button 
          onClick={() => navigate(`/courses/${courseId}/learn`)} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại bài học
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[90vh] bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <Link to={`/courses/${courseId}/learn`} className="text-gray-500 hover:text-blue-600 flex items-center text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Quay lại bài học
          </Link>
          <div>
            <h1 className="font-bold text-lg text-gray-800">{exercise?.title || lessonDetails?.Title || 'Bài tập lập trình'}</h1>
            {(moduleTitle || exercise?.moduleTitle) && (
              <div className="text-xs text-gray-600 text-right">
                Module: {moduleTitle || exercise?.moduleTitle}
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Instructions panel */}
        <div className="w-full md:w-1/3 bg-white border-r border-gray-200 overflow-y-auto p-3">
          <h2 className="font-bold text-base mb-2 text-gray-800">Nội dung bài học</h2>
          
          {/* Render content with Markdown support */}
          <div className="prose prose-sm max-w-none mb-4">
            {exercise?.description ? (
              <ReactMarkdown>
                {exercise.description}
              </ReactMarkdown>
            ) : lessonDetails?.Content ? (
              <ReactMarkdown>
                {lessonDetails.Content}
              </ReactMarkdown>
            ) : (
              <p>Không có nội dung cho bài học này.</p>
            )}
          </div>
          
          {/* Display practice notes if available */}
          {lessonDetails?.Notes && (
            <div className="mt-3 mb-4">
              <h3 className="font-semibold text-sm mb-1 text-gray-800">Ghi chú bài tập</h3>
              <div className="prose max-w-none text-gray-700 bg-blue-50 p-4 rounded-md border border-blue-100">
                <ReactMarkdown>
                  {lessonDetails.Notes}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
          {/* Test Results */}
          {testResults && (
            <div className="mt-5 border rounded-lg overflow-hidden shadow-md">
              <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                <h3 className="font-medium">Kết quả kiểm tra</h3>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    testResults.passed === testResults.total
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {testResults.passed}/{testResults.total} test{testResults.total > 1 ? 's' : ''} passed
                  </span>
                  {isWaitingForInput && (
                    <button
                      onClick={handleStopExecution}
                      className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      Dừng chương trình
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-white p-4">
                {testResults.tests && testResults.tests.map((test, i) => (
                  <div key={i} className="mb-4">
                    <div className={`p-2 rounded-md border ${
                      test.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full mr-2 ${
                          test.passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {test.passed ? 
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
                            </svg>
                            :
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" clipRule="evenodd" />
                            </svg>
                          }
                        </span>
                        <span className="font-medium">{test.name || `Test ${i + 1}`}</span>
                      </div>
                      {!test.passed && test.message && !test.output && (
                        <div className="ml-7 mt-1 text-red-700 text-xs bg-red-100 p-2 rounded">
                          {test.message}
                        </div>
                      )}
                      {test.passed && test.message && !test.output && (
                        <div className="ml-7 mt-1 text-green-700 text-xs bg-green-100 p-2 rounded">
                          {test.message}
                        </div>
                      )}
                    </div>
                    
                    {/* Terminal-style output */}
                    {test.output && (
                      <div className="mt-2 rounded-md overflow-hidden border border-gray-300 shadow-sm">
                        <div className="bg-gray-800 p-1 flex items-center justify-between">
                          <div className="flex space-x-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <div className="text-xs text-gray-400">Terminal</div>
                          <div className="w-4"></div>
                        </div>
                        <div 
                          className="bg-white text-black p-3 font-mono text-sm overflow-auto min-h-[150px] max-h-[300px] border border-gray-300"
                          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace" }}
                        >
                          {/* Terminal content */}
                          <div className="whitespace-pre-wrap terminal-output">
                            {test.output}
                          </div>
                          
                          {/* Terminal input field */}
                          {test.needsInput && isWaitingForInput && (
                            <div className="flex items-center mt-1 terminal-input-line">
                              <span className="text-blue-600 mr-1">$</span>
                              <form onSubmit={handleSendInput} className="flex-1">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={userInput}
                                  onChange={(e) => setUserInput(e.target.value)}
                                  className="w-full bg-transparent text-black focus:outline-none border-b border-gray-400"
                                  autoFocus
                                />
                              </form>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Code editor panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Monaco Editor */}
          <div className="flex-1 bg-white overflow-hidden border border-gray-300 rounded-md mx-2 my-2 shadow-md relative">
            <Editor
              height="100%"
              language={mapLanguageToMonaco(language)}
              value={code}
              onChange={(newValue) => setCode(newValue)}
              theme={editorTheme}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 16,
                lineHeight: 1.6,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                lineNumbers: "on",
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                },
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
                fontLigatures: true,
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                formatOnPaste: true,
                formatOnType: true,
                tabSize: 2,
              }}
            />
            
            {/* Simplified AI prompt at cursor line or selection */}
            {showAiPrompt && editorRef.current && (
              <div 
                className="absolute bg-purple-100 border-l-4 border-purple-500 shadow-sm z-10 w-full left-0 pl-2 pr-4 py-1 flex items-center"
                style={{
                  top: `${cursorPosition.top}px`,
                  left: `${cursorPosition.left > 0 ? cursorPosition.left : 0}px`,
                  maxWidth: 'calc(100% - 20px)',
                }}
              >
                <span className="text-purple-700 font-medium text-xs mr-2">AI:</span>
                {isAiProcessing ? (
                  <div className="flex items-center text-purple-700">
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-purple-700" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs">Đang xử lý...</span>
                  </div>
                ) : (
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={handleAiKeyPress}
                    className="flex-1 bg-transparent border-none text-sm text-purple-700 focus:outline-none placeholder-purple-400 min-h-[40px] resize-y"
                    placeholder={selectedText ? "Nhấn Enter để giải thích đoạn mã đã chọn..." : "Nhập yêu cầu và nhấn Enter..."}
                    autoFocus
                  />
                )}
                <div className="flex items-center ml-2 text-xs text-purple-500">
                  <span className="mr-1">(Enter: Gửi, Esc: Hủy)</span>
                  <button 
                    onClick={() => {
                      setShowAiPrompt(false);
                      setAiInputMode(false);
                      setAiPrompt('');
                      setSelectedText('');
                      if (editorRef.current) editorRef.current.focus();
                    }}
                    className="text-purple-500 hover:text-purple-700 ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="bg-white px-4 py-2 flex justify-between items-center border-t border-gray-300 m-2 mt-0 rounded-b-md shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="text-gray-700 text-sm flex items-center">
                <span className="font-medium text-blue-600 mr-1">{language}</span>
                <span className="text-gray-500 text-xs">(Tự động phát hiện)</span>
              </div>
              <div className="flex items-center ml-3 space-x-2">
                <button
                  onClick={() => setEditorTheme(editorTheme === 'vs-light' ? 'vs-dark' : 'vs-light')}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center"
                  title="Đổi giao diện sáng/tối"
                >
                  {editorTheme === 'vs-light' ? (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path>
                    </svg>
                  )}
                  {editorTheme === 'vs-light' ? 'Tối' : 'Sáng'}
                </button>
              </div>
              <button
                onClick={() => {
                  if (editorRef.current) {
                    const selection = editorRef.current.getSelection();
                    const position = selection ? selection : editorRef.current.getPosition();
                    setCursorPosition({
                      lineNumber: position.lineNumber,
                      column: position.column,
                      top: editorRef.current.getTopForLineNumber(position.lineNumber),
                      left: editorRef.current.getOffsetForColumn(position.lineNumber, position.column)
                    });
                  }
                  setAiInputMode(true);
                  setShowAiPrompt(true);
                  setAiPrompt('');
                }}
                className="ml-2 px-4 py-1.5 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 flex items-center shadow-sm transition-all duration-200 hover:shadow"
                title="AI Hỗ trợ (⌘I, Ctrl+I, hoặc / ) "
              >
                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                AI Hỗ trợ
              </button>
            </div>
            <div className="space-x-3">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className={`px-4 py-1.5 rounded-md text-sm font-medium shadow-sm transition-all duration-200 ${
                  isRunning 
                    ? 'bg-green-200 text-green-700 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow'
                }`}
              >
                {isRunning ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang chạy...
                  </span>
                ) : 'Chạy code'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-4 py-1.5 rounded-md text-sm font-medium shadow-sm transition-all duration-200 ${
                  isSubmitting 
                    ? 'bg-blue-200 text-blue-700 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang nộp...
                  </span>
                ) : 'Nộp bài'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCode;
