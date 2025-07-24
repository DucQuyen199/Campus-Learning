/*-----------------------------------------------------------------
* File: CourseLearning.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import courseApi from '../../api/courseApi';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components';
import axios from 'axios';
import { CheckCircleIcon, XCircleIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import CodeServerEditor from '../AiTestLocal/components/CodeServerEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// CSS cho Markdown được thêm vào component
const markdownStyles = {
  table: 'min-w-full border border-gray-300 border-collapse my-4',
  thead: 'bg-gray-50',
  th: 'border border-gray-300 px-4 py-2 text-left font-semibold',
  td: 'border border-gray-300 px-4 py-2',
  ul: 'list-disc pl-6 space-y-1 my-4',
  ol: 'list-decimal pl-6 space-y-1 my-4',
  li: 'pl-1',
  'li > ul': 'mt-2 mb-0',
  'li > ol': 'mt-2 mb-0',
  h1: 'text-2xl font-bold mt-6 mb-4',
  h2: 'text-xl font-bold mt-5 mb-3',
  h3: 'text-lg font-bold mt-4 mb-2',
  p: 'my-3',
  blockquote: 'border-l-4 border-gray-200 pl-4 py-2 italic my-4',
  pre: 'bg-gray-50 p-4 rounded my-4 overflow-x-auto',
  code: 'bg-gray-50 p-1 rounded text-sm font-mono',
};

// Gemini API configuration
const GEMINI_API_KEY = "AIzaSyDLh0Md76lI4wZLgDrO9jAQemim6czJQE0";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const CourseLearning = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();
  
  // State for course data and UI
  const [course, setCourse] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progress, setProgress] = useState(() => {
    const loc = window.history.state && window.history.state.usr ? window.history.state.usr : null;
    return loc && loc.finishedCourse ? 100 : 0;
  });
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [contentType, setContentType] = useState('video'); // 'video', 'text', 'quiz', 'code'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [videoSummary, setVideoSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const contentRef = useRef(null);
  const videoContainerRef = useRef(null);
  
  // Get lessonId from URL if provided
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const lessonId = searchParams.get('lessonId');
    
    if (lessonId) {
      // We'll find and set this lesson after course data is loaded
      console.log('Lesson ID from URL:', lessonId);
    }
  }, [location.search]);

  // Check authentication and redirect if needed
  useEffect(() => {
    // Reset finishedCourse flag after first render
    if (location.state && location.state.finishedCourse) {
      // remove the state so navigating again doesn't keep flag
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để truy cập khóa học');
      navigate('/login', { state: { from: `/courses/${courseId}/learn` } });
    }
  }, [isAuthenticated, courseId, navigate]);

  // Format course data
  const formatCourseData = (courseData) => {
    if (!courseData) return null;
    
    let formattedData = { ...courseData };
    
    // Format Requirements if needed
    if (typeof formattedData.Requirements === 'string') {
      if (formattedData.Requirements.startsWith('[')) {
        try {
          formattedData.Requirements = JSON.parse(formattedData.Requirements);
        } catch (e) {
          formattedData.Requirements = formattedData.Requirements ? [formattedData.Requirements] : [];
        }
      } else {
        formattedData.Requirements = formattedData.Requirements ? [formattedData.Requirements] : [];
      }
    }
    
    // Format Objectives if needed
    if (typeof formattedData.Objectives === 'string') {
      if (formattedData.Objectives.startsWith('[')) {
        try {
          formattedData.Objectives = JSON.parse(formattedData.Objectives);
        } catch (e) {
          formattedData.Objectives = formattedData.Objectives ? [formattedData.Objectives] : [];
        }
      } else {
        formattedData.Objectives = formattedData.Objectives ? [formattedData.Objectives] : [];
      }
    }
    
    // Ensure Modules is an array
    if (!Array.isArray(formattedData.Modules)) {
      formattedData.Modules = [];
    }
    
    return formattedData;
  };

  // Load course data and user progress
  useEffect(() => {
    const fetchCourseAndProgress = async () => {
      try {
        setLoading(true);
        
        if (!courseId) {
          setError('ID khóa học không hợp lệ');
          setLoading(false);
          return;
        }
        
        // First check if user is enrolled
        const enrollResponse = await courseApi.checkEnrollment(courseId);
        if (!enrollResponse.success || !enrollResponse.isEnrolled) {
          setError('Bạn chưa đăng ký khóa học này');
          setLoading(false);
          navigate(`/courses/${courseId}`);
          return;
        }
        
        // Fetch course details
        const courseResponse = await courseApi.getCourseDetails(courseId);
        if (!courseResponse || !courseResponse.success) {
          setError(courseResponse?.message || 'Không thể tải thông tin khóa học');
          setLoading(false);
          return;
        }
        
        // Format and set course data
        const formattedCourse = formatCourseData(courseResponse.data);
        
        setCourse(formattedCourse);
        document.title = `Học: ${formattedCourse.Title} | CampusLearning`;
        
        // Get user progress for this course
        try {
          const progressResponse = await courseApi.getUserCourseProgress(courseId);
          if (progressResponse && progressResponse.success) {
            const userProgress = progressResponse.data;
            setProgress(userProgress.overallProgress || 0);
            setCompletedLessons(userProgress.completedLessons || []);
            
            // Get lessonId from URL if provided
            const searchParams = new URLSearchParams(location.search);
            const urlLessonId = searchParams.get('lessonId');
            
            // Find and set current lesson and module
            if (formattedCourse.Modules && formattedCourse.Modules.length > 0) {
              // If we have a specific lesson from URL, find it
              if (urlLessonId) {
                let foundLesson = null;
                let foundModule = null;
                
                // Search through modules and lessons to find the requested lesson
                for (const module of formattedCourse.Modules) {
                  if (module.Lessons) {
                    const lesson = module.Lessons.find(l => l.LessonID === urlLessonId || l.LessonID === parseInt(urlLessonId));
                    if (lesson) {
                      foundLesson = lesson;
                      foundModule = module;
                      break;
                    }
                  }
                }
                
                if (foundLesson && foundModule) {
                  setCurrentLesson(foundLesson);
                  setCurrentModule(foundModule);
                  setContentType(determineContentType(foundLesson));
                } else {
                  // If lesson not found, default to first non-completed lesson or first lesson
                  setDefaultCurrentLesson(formattedCourse, userProgress.completedLessons);
                }
              } else {
                // If no specific lesson requested, find the next uncompleted one
                setDefaultCurrentLesson(formattedCourse, userProgress.completedLessons);
              }
            }
          } else {
            console.warn('Failed to load progress, using empty progress data:', progressResponse?.message);
            setProgress(0);
            setCompletedLessons([]);
            
            // Continue with default lesson selection despite progress error
            const searchParams = new URLSearchParams(location.search);
            const urlLessonId = searchParams.get('lessonId');
            
            // Set up a default lesson using empty progress
            if (formattedCourse.Modules && formattedCourse.Modules.length > 0) {
              if (urlLessonId) {
                handleLessonFromUrl(formattedCourse, urlLessonId);
              } else {
                setDefaultCurrentLesson(formattedCourse, []);
              }
            }
          }
        } catch (progressError) {
          console.error('Error loading progress:', progressError);
          // Continue with empty progress
          setProgress(0);
          setCompletedLessons([]);
          
          // Still try to set up a default lesson
          // Get lessonId from URL if provided
          const searchParams = new URLSearchParams(location.search);
          const urlLessonId = searchParams.get('lessonId');
          
          // Find and set current lesson and module
          if (formattedCourse.Modules && formattedCourse.Modules.length > 0) {
            // If we have a specific lesson from URL, find it
            if (urlLessonId) {
              handleLessonFromUrl(formattedCourse, urlLessonId);
            } else {
              // If no specific lesson requested, use first lesson
              setDefaultCurrentLesson(formattedCourse, []);
            }
          }
        }
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Có lỗi xảy ra khi tải thông tin khóa học. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId && isAuthenticated) {
      fetchCourseAndProgress();
    }
  }, [courseId, isAuthenticated, navigate, location.search]);

  // Determine content type based on lesson data
  const determineContentType = (lesson) => {
    if (!lesson) return 'text';
    
    // Normalize type and properties
    const lessonType = (lesson.Type || '').toString().toLowerCase();
    const videoUrl = getLessonVideoUrl(lesson);
    
    // Detect if lesson contains any code exercise data
    const hasCodeExercise = !!lesson.CodeExercise || !!lesson.codeExercise || !!lesson.Exercise;
    // Consider lesson as coding practice if type indicates it OR exercise object exists with correct type
    const practiceTypes = ['coding', 'exercise', 'practice', 'code'];
    const isPracticeExercise = practiceTypes.includes(lessonType);
    
    // If the lesson is explicitly marked as coding / exercise, show code editor
    if (isPracticeExercise) {
      // For practice exercises, redirect to the dedicated EditCode view that shows split layout
      setTimeout(() => {
        window.location.href = `/courses/${courseId}/edit-code/${lesson.LessonID}`;
      }, 100);
      return 'loading'; // temporary state while redirecting
    }
    
    // Handle explicit video lessons
    if (lessonType === 'video') {
      // Show video if URL exists, otherwise fall back to text
      return videoUrl ? 'video' : 'text';
    }
    
    // Quiz lessons
    if (lessonType === 'quiz') {
      return 'quiz';
    }
    
    // Default fallbacks based on available data
    if (videoUrl) return 'video';
    
    return 'text';
  };

  // Set the default current lesson (first non-completed or first lesson)
  const setDefaultCurrentLesson = (courseData, completedLessonIds = []) => {
    if (!courseData.Modules || courseData.Modules.length === 0) return;
    
    // Find first incomplete lesson
    for (const module of courseData.Modules) {
      if (module.Lessons && module.Lessons.length > 0) {
        for (const lesson of module.Lessons) {
          if (!completedLessonIds.includes(lesson.LessonID)) {
            setCurrentModule(module);
            setCurrentLesson(lesson);
            setContentType(determineContentType(lesson));
            return;
          }
        }
      }
    }
    
    // If all lessons are completed, just show the first one
    const firstModule = courseData.Modules[0];
    if (firstModule.Lessons && firstModule.Lessons.length > 0) {
      setCurrentModule(firstModule);
      setCurrentLesson(firstModule.Lessons[0]);
      setContentType(determineContentType(firstModule.Lessons[0]));
    }
  };

  // Add a helper function to handle finding lessons from URL params (to avoid code duplication)
  const handleLessonFromUrl = (courseData, urlLessonId) => {
    let foundLesson = null;
    let foundModule = null;
    
    // Search through modules and lessons to find the requested lesson
    for (const module of courseData.Modules) {
      if (module.Lessons) {
        const lesson = module.Lessons.find(l => 
          l.LessonID === urlLessonId || 
          l.LessonID === parseInt(urlLessonId)
        );
        if (lesson) {
          foundLesson = lesson;
          foundModule = module;
          break;
        }
      }
    }
    
    if (foundLesson && foundModule) {
      setCurrentLesson(foundLesson);
      setCurrentModule(foundModule);
      setContentType(determineContentType(foundLesson));
    } else {
      // If lesson not found, use first lesson
      setDefaultCurrentLesson(courseData, []);
    }
  };

  // Handle marking a lesson as complete
  const handleMarkComplete = async () => {
    if (!currentLesson) return;
    
    try {
      // Check if already completed
      if (completedLessons.includes(currentLesson.LessonID)) {
        toast.info('Bài học này đã được đánh dấu hoàn thành');
        return;
      }
      
      const response = await courseApi.markLessonAsComplete(courseId, currentLesson.LessonID);
      
      if (response && response.success) {
        // Update completed lessons
        const updatedCompletedLessons = [...completedLessons, currentLesson.LessonID];
        setCompletedLessons(updatedCompletedLessons);
        
        // Update progress
        if (course && course.Modules) {
          let totalLessons = 0;
          course.Modules.forEach(module => {
            totalLessons += module.Lessons ? module.Lessons.length : 0;
          });
          
          const newProgress = Math.round((updatedCompletedLessons.length / totalLessons) * 100);
          setProgress(newProgress);
        }
        
        toast.success('Đã đánh dấu bài học hoàn thành');
        
        // Navigate to next lesson if available
        navigateToNextLesson();
      } else {
        toast.error(response?.message || 'Không thể đánh dấu bài học hoàn thành');
      }
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      toast.error('Có lỗi xảy ra khi đánh dấu bài học hoàn thành');
    }
  };

  // Get next lesson and navigate to it
  const navigateToNextLesson = () => {
    if (!course || !currentModule || !currentLesson) return;
    
    const currentModuleIndex = course.Modules.findIndex(m => m.ModuleID === currentModule.ModuleID);
    if (currentModuleIndex === -1) return;
    
    const currentLessonIndex = currentModule.Lessons.findIndex(l => l.LessonID === currentLesson.LessonID);
    if (currentLessonIndex === -1) return;
    
    // Check if there's another lesson in this module
    if (currentLessonIndex < currentModule.Lessons.length - 1) {
      const nextLesson = currentModule.Lessons[currentLessonIndex + 1];
      navigate(`/courses/${courseId}/learn?lessonId=${nextLesson.LessonID}`);
      return;
    }
    
    // Check if there's another module
    if (currentModuleIndex < course.Modules.length - 1) {
      const nextModule = course.Modules[currentModuleIndex + 1];
      if (nextModule.Lessons && nextModule.Lessons.length > 0) {
        navigate(`/courses/${courseId}/learn?lessonId=${nextModule.Lessons[0].LessonID}`);
        return;
      }
    }
    
    // If we get here, it's the last lesson
    toast.success('Chúc mừng! Bạn đã hoàn thành khóa học.');
  };

  // Get previous lesson and navigate to it
  const navigateToPrevLesson = () => {
    if (!course || !currentModule || !currentLesson) return;
    
    const currentModuleIndex = course.Modules.findIndex(m => m.ModuleID === currentModule.ModuleID);
    if (currentModuleIndex === -1) return;
    
    const currentLessonIndex = currentModule.Lessons.findIndex(l => l.LessonID === currentLesson.LessonID);
    if (currentLessonIndex === -1) return;
    
    // Check if there's a previous lesson in this module
    if (currentLessonIndex > 0) {
      const prevLesson = currentModule.Lessons[currentLessonIndex - 1];
      navigate(`/courses/${courseId}/learn?lessonId=${prevLesson.LessonID}`);
      return;
    }
    
    // Check if there's a previous module
    if (currentModuleIndex > 0) {
      const prevModule = course.Modules[currentModuleIndex - 1];
      if (prevModule.Lessons && prevModule.Lessons.length > 0) {
        const lastLesson = prevModule.Lessons[prevModule.Lessons.length - 1];
        navigate(`/courses/${courseId}/learn?lessonId=${lastLesson.LessonID}`);
        return;
      }
    }
  };

  // Handle selecting a lesson from the sidebar
  const handleSelectLesson = (module, lesson) => {
    setCurrentModule(module);
    setCurrentLesson(lesson);
    setContentType(determineContentType(lesson));
    navigate(`/courses/${courseId}/learn?lessonId=${lesson.LessonID}`);
  };

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    
    // If entering fullscreen, hide sidebar
    if (!isFullScreen) {
      setIsSidebarOpen(false);
    }
  };
  
  // Request video summary directly from Gemini API
  const requestVideoSummary = async () => {
    if (!currentLesson) return;
    
    setIsSummarizing(true);
    setVideoSummary(null);
    
    try {
      // Get video context from lesson
      const videoContext = currentLesson.Content || currentLesson.Description || 
                          `Video about ${currentLesson.Title} from ${course.Title}`;
      
      // Create prompt for Gemini - explicitly requesting Markdown format
      const prompt = `
        Tôi đang xem một video về: "${currentLesson.Title}" 
        từ khóa học "${course.Title}".
        
        Nội dung video:
        ${videoContext}
        
        Vui lòng tạo một bản tóm tắt ngắn gọn, trọng tâm về nội dung video này bằng tiếng Việt.
        Tóm tắt nên bao gồm:
        - Điểm chính của video
        - Các khái niệm quan trọng
        - Kết luận hoặc điểm then chốt
        
        QUAN TRỌNG: Định dạng kết quả theo cú pháp Markdown để dễ đọc, sử dụng:
        - Các tiêu đề (# hoặc ##)
        - Các điểm đánh dấu (-)
        - In đậm (**) cho các từ khóa quan trọng
        - Tạo bảng để tổng hợp thông tin quan trọng, định dạng theo Markdown standard như sau:
          | Tiêu đề 1 | Tiêu đề 2 | Tiêu đề 3 |
          | --------- | --------- | --------- |
          | Nội dung 1 | Nội dung 2 | Nội dung 3 |
      `;
      
      console.log("Calling Gemini API with URL:", GEMINI_API_URL);
      
      // Call Gemini API directly
      const response = await axios.post(GEMINI_API_URL, {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Gemini API response:", response.data);
      
      if (response.data && response.data.candidates && response.data.candidates.length > 0) {
        // Extract the summary text from Gemini response
        const summaryText = response.data.candidates[0].content.parts[0].text;
        setVideoSummary(summaryText);
      } else {
        console.error("Unexpected Gemini API response format:", response.data);
        toast.error('Không thể tạo tóm tắt video. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error summarizing with Gemini API:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Lỗi khi tạo tóm tắt video. Vui lòng thử lại sau.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Helper to convert YouTube links to embed format
  const toYouTubeEmbed = (url) => {
    if (!url) return url;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;

      // Playlist parameter (if any)
      const listId = parsed.searchParams.get('list');

      // 1. Short link youtu.be/{id}
      if (host === 'youtu.be') {
        const videoId = parsed.pathname.slice(1); // remove leading '/'
        return listId
          ? `https://www.youtube.com/embed/${videoId}?list=${listId}`
          : `https://www.youtube.com/embed/${videoId}`;
      }

      // 2. Standard watch link youtube.com/watch?v={id}
      const videoIdFromParam = parsed.searchParams.get('v');
      if (videoIdFromParam) {
        return listId
          ? `https://www.youtube.com/embed/${videoIdFromParam}?list=${listId}`
          : `https://www.youtube.com/embed/${videoIdFromParam}`;
      }

      // 3. Shorts link youtube.com/shorts/{id}
      if (parsed.pathname.startsWith('/shorts/')) {
        const videoId = parsed.pathname.split('/shorts/')[1].split(/[?&]/)[0];
        return listId
          ? `https://www.youtube.com/embed/${videoId}?list=${listId}`
          : `https://www.youtube.com/embed/${videoId}`;
      }

      // 4. Already embed or other provider → return as is
      return url;
    } catch (e) {
      return url;
    }
  };

  // Extract video url from lesson fields or content
  const getLessonVideoUrl = (lesson) => {
    if (!lesson) return null;
    const directUrl = lesson.VideoUrl || lesson.videoUrl || lesson.VideoURL;
    if (directUrl) return directUrl;
    // If URL is embedded inside content, extract first YouTube link
    if (typeof lesson.Content === 'string') {
      const match = lesson.Content.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/[\w\-?=&%#./]+|youtu\.be\/[\w\-?=&%#./]+)/i);
      if (match) return match[0];
    }
    return null;
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
          onClick={() => navigate('/courses')} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại danh sách khóa học
        </button>
      </div>
    );
  }

  // Empty state
  if (!course || !currentModule || !currentLesson) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4">
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-4 max-w-md">
          <p className="font-medium">Không tìm thấy thông tin bài học</p>
        </div>
        <button 
          onClick={() => navigate(`/courses/${courseId}`)} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại trang chi tiết khóa học
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className={`bg-white border-b border-gray-200 px-6 py-3 ${isFullScreen ? 'hidden' : ''}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-4 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/courses" className="text-gray-500 hover:text-blue-600 text-sm mr-4">
              Khóa học
            </Link>
            <span className="text-gray-400 mx-2">/</span>
            <Link to={`/courses/${courseId}`} className="text-gray-500 hover:text-blue-600 text-sm">
              {course?.Title}
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <div className="bg-blue-50 rounded-full h-2 w-48">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-600">{progress}% hoàn thành</div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`bg-white w-80 border-r border-gray-200 flex-shrink-0 transition-all duration-300 transform ${
            (isSidebarOpen && !isFullScreen) ? 'translate-x-0' : '-translate-x-full'
          } md:relative md:translate-x-0 ${isFullScreen ? 'hidden md:hidden' : ''} absolute z-10 h-full`}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-lg truncate">{course.Title}</h2>
              <div className="mt-2 flex items-center">
                <div className="mr-4">
                  <div className="bg-blue-50 rounded-full h-2 w-24">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 py-2">
              {course.Modules.map((module, moduleIndex) => (
                <div key={module.ModuleID || moduleIndex} className="mb-2">
                  <div className="px-4 py-2 font-medium text-gray-700 flex items-center">
                    <span>{moduleIndex + 1}. {module.Title}</span>
                  </div>
                  
                  <div className="space-y-1">
                    {module.Lessons && module.Lessons.map((lesson, lessonIndex) => {
                      const isActive = currentLesson && currentLesson.LessonID === lesson.LessonID;
                      const isCompleted = completedLessons.includes(lesson.LessonID);
                      const isPracticeExercise = lesson.CodeExercise && (lesson.Type === 'coding' || lesson.Type === 'exercise');
                      
                      return (
                        <button
                          key={lesson.LessonID || lessonIndex}
                          onClick={() => handleSelectLesson(module, lesson)}
                          className={`pl-8 pr-4 py-2 w-full text-left flex items-center ${
                            isActive ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 pl-7' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="mr-3 flex-shrink-0">
                            {isCompleted ? (
                              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center
                                ${isActive ? 'border-blue-600' : 'border-gray-300'}`}>
                                <span className="text-xs">{moduleIndex + 1}.{lessonIndex + 1}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 truncate text-sm">
                            {lesson.Title}
                            <span className="text-xs text-gray-400 ml-1">
                              ({lesson.Duration || 0} phút)
                            </span>
                          </div>
                          {lesson.Quiz && (
                            <span className="ml-2 flex-shrink-0">
                              <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                          )}
                          {isPracticeExercise ? (
                            <span className="ml-2 flex-shrink-0">
                              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </span>
                          ) : lesson.CodeExercise ? (
                            <span className="ml-2 flex-shrink-0">
                              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <Link 
                to={`/courses/${courseId}`}
                className="text-gray-500 hover:text-blue-600 flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Quay lại trang khóa học
              </Link>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto bg-white ${isFullScreen ? 'p-0' : ''}`}>
          <div className={`${isFullScreen ? 'w-full h-full p-0 max-w-none' : 'w-full px-4 py-8'}`}>
            {/* Title section */}
            {!isFullScreen && (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 max-w-7xl mx-auto">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    {currentLesson?.Title}
                    {currentLesson?.Type === 'coding' || currentLesson?.Type === 'exercise' ? (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Bài thực hành
                      </span>
                    ) : null}
                  </h1>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Module {course?.Modules?.findIndex(m => m.ModuleID === currentModule?.ModuleID) + 1}: {currentModule?.Title}</span>
                    <span className="mx-2">•</span>
                    <span>{currentLesson?.Duration || 0} phút</span>
                    {currentLesson?.Type && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{
                          currentLesson?.Type === 'video' ? 'Video' :
                          currentLesson?.Type === 'text' ? 'Bài đọc' :
                          currentLesson?.Type === 'quiz' ? 'Trắc nghiệm' :
                          currentLesson?.Type === 'coding' || currentLesson?.Type === 'exercise' ? 'Thực hành' :
                          currentLesson?.Type === 'assignment' ? 'Bài tập' :
                          'Bài học'
                        }</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  {completedLessons.includes(currentLesson?.LessonID) ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Đã hoàn thành
                    </span>
                  ) : (
                    <button
                      onClick={handleMarkComplete}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Đánh dấu hoàn thành
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div className={`${isFullScreen ? 'w-full h-full' : 'w-full bg-white overflow-hidden mb-6'}`}>
              <div ref={contentRef} className={`${isFullScreen ? 'p-0 h-full' : 'w-full'}`}>
                {console.log('Rendering content with type:', contentType)}
                {console.log('Current lesson has CodeExercise:', !!currentLesson?.CodeExercise || !!currentLesson?.codeExercise || !!currentLesson?.Exercise)}
                
                {contentType === 'loading' ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="ml-3 text-gray-600">Đang chuyển hướng...</p>
                  </div>
                ) : contentType === 'video' && getLessonVideoUrl(currentLesson) ? (
                  <div className={`${isFullScreen ? 'w-full h-full' : 'w-full aspect-video'} relative mx-auto`} ref={videoContainerRef}>
                    <iframe
                      title={currentLesson.Title}
                      src={toYouTubeEmbed(getLessonVideoUrl(currentLesson))}
                      className="w-full h-full rounded-lg"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                    
                    {/* Video controls overlay */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <button
                        onClick={toggleFullScreen}
                        className="p-2 bg-black bg-opacity-50 rounded-lg text-white hover:bg-opacity-70 transition-opacity"
                        title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                      >
                        {isFullScreen ? (
                          <ArrowsPointingInIcon className="h-5 w-5" />
                        ) : (
                          <ArrowsPointingOutIcon className="h-5 w-5" />
                        )}
                      </button>
                      
                      <button
                        onClick={requestVideoSummary}
                        disabled={isSummarizing}
                        className={`p-2 bg-black bg-opacity-50 rounded-lg text-white hover:bg-opacity-70 transition-opacity ${
                          isSummarizing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Tóm tắt video với AI"
                      >
                        <DocumentTextIcon className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {/* Exit fullscreen button when in fullscreen mode */}
                    {isFullScreen && (
                      <button
                        onClick={toggleFullScreen}
                        className="absolute top-4 left-4 p-2 bg-black bg-opacity-50 rounded-lg text-white hover:bg-opacity-70 transition-opacity"
                      >
                        <ArrowsPointingInIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ) : contentType === 'code' ? (
                  <div className="mb-6">
                    {console.log('Rendering code editor with lesson:', currentLesson)}
                    {/* Embedded Code Editor */}
                    <CodeExerciseEditor 
                      courseId={courseId} 
                      lessonId={currentLesson.LessonID} 
                      codeExercise={currentLesson.CodeExercise || currentLesson.codeExercise || currentLesson.Exercise} 
                      onComplete={() => {
                        // Update the completed lessons after successful completion
                        if (!completedLessons.includes(currentLesson.LessonID)) {
                          const updatedCompletedLessons = [...completedLessons, currentLesson.LessonID];
                          setCompletedLessons(updatedCompletedLessons);
                          
                          // Update progress
                          if (course && course.Modules) {
                            let totalLessons = 0;
                            course.Modules.forEach(module => {
                              totalLessons += module.Lessons ? module.Lessons.length : 0;
                            });
                            
                            const newProgress = Math.round((updatedCompletedLessons.length / totalLessons) * 100);
                            setProgress(newProgress);
                          }
                        }
                      }}
                      showControls={false}
                    />
                  </div>
                ) : (currentLesson?.CodeExercise || currentLesson?.codeExercise || currentLesson?.Exercise) && 
                   !(currentLesson?.Type === 'coding' || currentLesson?.Type === 'exercise') ? (
                  <div className="mb-6">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700 font-medium">
                            Thông tin mã nguồn
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            Bài học này có mã nguồn mẫu, nhưng không phải là bài thực hành. Trình soạn thảo mã chỉ hiển thị cho các bài được đánh dấu là bài thực hành trong cơ sở dữ liệu (có loại "coding" hoặc "exercise").
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 prose max-w-none" 
                        dangerouslySetInnerHTML={{ __html: currentLesson.Content || '<p>Không có nội dung cho bài học này.</p>' }} 
                      />
                    </div>
                  </div>
                ) : contentType === 'quiz' && currentLesson?.Quiz ? (
                  <div className="mb-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            Tính năng quiz đang được phát triển. Vui lòng quay lại sau.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none mb-6" 
                    dangerouslySetInnerHTML={{ __html: currentLesson.Content || '<p>Không có nội dung cho bài học này.</p>' }} 
                  />
                )}
                
                {/* AI Summary Section */}
                {contentType === 'video' && !isFullScreen && (
                  <div className="mt-6 max-w-7xl mx-auto">
                    {isSummarizing ? (
                      <div className="p-4 bg-blue-50 rounded-lg flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                        <p>Đang tạo tóm tắt video với AI...</p>
                      </div>
                    ) : videoSummary ? (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-4 flex items-center">
                          <DocumentTextIcon className="h-5 w-5 mr-2" />
                          Tóm tắt nội dung video
                        </h3>
                        <div className="prose prose-sm max-w-none overflow-x-auto">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Định dạng bảng với viền rõ ràng
                              table: ({node, ...props}) => <table className={markdownStyles.table} {...props} />,
                              thead: ({node, ...props}) => <thead className={markdownStyles.thead} {...props} />,
                              th: ({node, ...props}) => <th className={markdownStyles.th} {...props} />,
                              td: ({node, ...props}) => <td className={markdownStyles.td} {...props} />,
                              
                              // Định dạng danh sách với thụt lề đúng
                              ul: ({node, ...props}) => <ul className={markdownStyles.ul} {...props} />,
                              ol: ({node, ...props}) => <ol className={markdownStyles.ol} {...props} />,
                              li: ({node, ...props}) => <li className={markdownStyles.li} {...props} />,
                              
                              // Định dạng tiêu đề
                              h1: ({node, ...props}) => <h1 className={markdownStyles.h1} {...props} />,
                              h2: ({node, ...props}) => <h2 className={markdownStyles.h2} {...props} />,
                              h3: ({node, ...props}) => <h3 className={markdownStyles.h3} {...props} />,
                              
                              // Định dạng khác
                              p: ({node, ...props}) => <p className={markdownStyles.p} {...props} />,
                              blockquote: ({node, ...props}) => <blockquote className={markdownStyles.blockquote} {...props} />,
                              pre: ({node, ...props}) => <pre className={markdownStyles.pre} {...props} />,
                              code: ({inline, ...props}) => inline ? 
                                <code className={markdownStyles.code} {...props} /> : 
                                <code className={`block ${markdownStyles.pre}`} {...props} />,
                            }}
                          >
                            {videoSummary}
                          </ReactMarkdown>
                        </div>
                        <div className="flex justify-end mt-4">
                          <button 
                            onClick={() => setVideoSummary(null)}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            Ẩn tóm tắt
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <button
                          onClick={requestVideoSummary}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        >
                          <DocumentTextIcon className="h-5 w-5 mr-2" />
                          Tạo tóm tắt video với AI
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Additional Resources Section - only show when not in fullscreen */}
            {!isFullScreen && currentLesson?.Resources && currentLesson.Resources.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 max-w-7xl mx-auto">
                <h2 className="text-lg font-bold mb-4">Tài liệu bổ sung</h2>
                <ul className="space-y-2">
                  {currentLesson.Resources.map((resource, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <a 
                        href={resource.Url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {resource.Title || 'Tài liệu'}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Navigation Buttons - only show when not in fullscreen */}
            {!isFullScreen && (
              <div className="flex justify-between mt-8 max-w-7xl mx-auto">
                <button
                  onClick={navigateToPrevLesson}
                  className="px-4 py-2 border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Bài trước
                </button>
                
                <button
                  onClick={navigateToNextLesson}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700"
                >
                  Bài tiếp theo
                  <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Fullscreen exit button overlay */}
      {isFullScreen && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={toggleFullScreen}
            className="px-4 py-2 bg-black bg-opacity-50 rounded-lg text-white flex items-center hover:bg-opacity-70 transition-opacity"
          >
            <ArrowsPointingInIcon className="h-5 w-5 mr-2" />
            Thoát chế độ toàn màn hình
          </button>
        </div>
      )}
    </div>
  );
};

// Add CodeExerciseEditor component within the same file
const CodeExerciseEditor = ({ courseId, lessonId, codeExercise, onComplete, showControls = true }) => {
  console.log('CodeExerciseEditor initialized with:', { courseId, lessonId, codeExercise });
  
  // Map expected field names regardless of API response casing
  const exerciseData = codeExercise || {};
  console.log('Exercise data mapping:', exerciseData);
  
  // Language can be in different fields depending on API response
  const defaultLanguage = exerciseData.Language || 
                          exerciseData.language || 
                          exerciseData.ProgrammingLanguage || 
                          'javascript';
  
  const [language, setLanguage] = useState(defaultLanguage);
  
  // Initial code can also have different field names
  const initialCode = exerciseData.StartingCode || 
                      exerciseData.initialCode || 
                      exerciseData.InitialCode || 
                      '// Your code here';
  
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    // Reset code when exercise changes
    if (codeExercise) {
      const newInitialCode = codeExercise.StartingCode || 
                             codeExercise.initialCode ||
                             codeExercise.InitialCode || 
                             '// Your code here';
                             
      const newLanguage = codeExercise.Language || 
                          codeExercise.language ||
                          codeExercise.ProgrammingLanguage || 
                          'javascript';
                          
      setCode(newInitialCode);
      setLanguage(newLanguage);
      setTestResults(null);
      
      console.log('CodeExerciseEditor updated with new exercise data:', {
        initialCode: newInitialCode,
        language: newLanguage
      });
    }
  }, [codeExercise]);
  
  // Run code function
  const handleRunCode = async () => {
    console.log('Running code');
    setIsRunning(true);
    setTestResults(null);
    
    try {
      // Get the exercise ID from potentially different property names
      const exerciseId = codeExercise.ExerciseID || 
                         codeExercise.exerciseId || 
                         codeExercise.id || 
                         null;
                         
      // Get test cases from potentially different property names
      const testCases = codeExercise.TestCases || 
                       codeExercise.testCases ||
                       codeExercise.tests || 
                       [];
      
      console.log('Running code with:', { 
        code, 
        language, 
        exerciseId,
        testCases
      });
      
      const response = await axios.post('/api/code-exercises/run', {
        code,
        language,
        exerciseId,
        tests: testCases
      });
      
      console.log('Run response:', response.data);
      setTestResults(response.data);
    } catch (error) {
      console.error('Error running code:', error);
      setTestResults({
        success: false,
        error: error.response?.data?.message || 'An error occurred while running your code'
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  // Submit solution
  const handleSubmitCode = async () => {
    console.log('Submitting code');
    setIsSubmitting(true);
    
    try {
      // Get the exercise ID from potentially different property names
      const exerciseId = codeExercise.ExerciseID || 
                         codeExercise.exerciseId || 
                         codeExercise.id || 
                         null;
      
      console.log('Submitting solution with:', { 
        code, 
        language, 
        courseId, 
        lessonId, 
        exerciseId 
      });
      
      const response = await axios.post('/api/code-exercises/submit', {
        code,
        language,
        courseId,
        lessonId,
        exerciseId
      });
      
      console.log('Submit response:', response.data);
      
      if (response.data.success) {
        toast.success('Exercise completed successfully!');
        if (onComplete) onComplete();
      } else {
        toast.error(response.data.message || 'Some tests failed. Please fix your code and try again.');
      }
      
      setTestResults(response.data);
    } catch (error) {
      console.error('Error submitting code:', error);
      toast.error(error.response?.data?.message || 'An error occurred while submitting your code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle code changes from the CodeServerEditor component
  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  // Toggle fullscreen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    
    // If entering fullscreen, scroll editor into view
    if (!isFullScreen) {
      window.scrollTo(0, 0);
    }
  };
  
  // Apply fullscreen styles conditionally
  const editorStyle = isFullScreen 
    ? { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        height: '100vh',
        width: '100vw',
        zIndex: 9999, 
        margin: 0,
        padding: 0,
        border: 'none',
        borderRadius: 0,
      } 
    : { height: '400px', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden', marginBottom: '24px' };

  const wrapperStyle = isFullScreen 
    ? { backgroundColor: '#fff', padding: 0 } 
    : { backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };

  return (
    <div style={wrapperStyle}>
      { (codeExercise?.Title || codeExercise?.Description) && (
        <div className="mb-4">
          {codeExercise?.Title && (<h3 className="text-lg font-semibold mb-2">{codeExercise.Title}</h3>)}
          {codeExercise?.Description && (<p className="text-gray-700">{codeExercise.Description}</p>)}
        </div>
      )}

      {showControls && (
        <div className="mb-4">
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="csharp">C#</option>
            <option value="cpp">C++</option>
          </select>
        </div>
      )}

      <div style={editorStyle}>
        <div className="absolute top-2 right-2 z-[10000]">
          <button
            onClick={toggleFullScreen}
            className="p-2 bg-black bg-opacity-50 rounded-lg text-white hover:bg-opacity-70 transition-opacity"
          >
            {isFullScreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            )}
          </button>
        </div>
        <CodeServerEditor 
          code={code}
          language={language}
          onChange={handleCodeChange}
        />
      </div>

      {showControls && !isFullScreen && (
        <div className="flex justify-between mb-6">
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isRunning
                ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
          <button
            onClick={handleSubmitCode}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isSubmitting
                ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Solution'}
          </button>
        </div>
      )}

      {testResults && !isFullScreen && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-lg font-semibold mb-2">Test Results</h4>
          {testResults.error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p className="font-bold">Error</p>
              <p>{testResults.error}</p>
            </div>
          ) : (
            <>
              <div className={`mb-4 p-4 rounded-md ${testResults.success ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                <p className="font-semibold">
                  {testResults.success 
                    ? 'All tests passed! Great job!' 
                    : 'Some tests failed. Review the results below.'}
                </p>
              </div>
              
              {testResults.tests && (
                <div className="space-y-3">
                  {testResults.tests.map((test, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-md ${test.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
                    >
                      <div className="flex items-center">
                        {test.passed ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <p className={`font-medium ${test.passed ? 'text-green-800' : 'text-red-800'}`}>
                          Test {index + 1}: {test.name || 'Test case'}
                        </p>
                      </div>
                      {!test.passed && test.message && (
                        <p className="mt-1 text-sm text-red-700">{test.message}</p>
                      )}
                      {test.input && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Input:</span> {test.input}
                        </p>
                      )}
                      {test.expected && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Expected:</span> {test.expected}
                        </p>
                      )}
                      {test.actual && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Actual:</span> {test.actual}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseLearning;

