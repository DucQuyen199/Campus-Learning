import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  Grid, 
  Chip, 
  Button, 
  CircularProgress,
  Container,
  Paper,
  Divider,
  Fade,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Avatar,
  Tooltip,
  Stack,
  Badge,
  IconButton,
  CardContent,
  alpha,
  CardActions,
  LinearProgress
} from '@mui/material';
import { 
  CalendarMonth, 
  Timer, 
  School, 
  Search,
  ArrowForward,
  Info,
  InfoOutlined,
  Launch,
  SportsScore,
  CheckCircle,
  AccessTime,
  FilterAlt,
  Refresh,
  NotificationsNone,
  FilterList,
  AutoAwesome,
  EmojiEvents,
  Description
} from '@mui/icons-material';
import { getAllExams, registerForExam } from '../../api/examApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// Skeleton component for loading state
const ExamCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-200 shadow-sm">
    <div className="h-2 bg-indigo-100 w-full"></div>
    <div className="p-5">
      <div className="flex justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-24"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-7 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
      <div className="h-px bg-gray-200 my-4"></div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-24"></div>
        </div>
        <div>
          <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
      <div className="h-5 bg-gray-200 rounded w-32 mb-6"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

const ExamList = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (exams.length > 0) {
      let filtered = [...exams];
      
      // Filter based on search term
      if (searchTerm) {
        filtered = filtered.filter(exam => 
          exam.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (exam.Description && exam.Description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (exam.CourseName && exam.CourseName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // Filter based on current tab
      if (currentTab === 1) { // Upcoming exams
        filtered = filtered.filter(exam => new Date(exam.StartTime) > new Date());
      } else if (currentTab === 2) { // Ongoing exams
        const now = new Date();
        filtered = filtered.filter(exam => 
          new Date(exam.StartTime) <= now && new Date(exam.EndTime) >= now
        );
      } else if (currentTab === 3) { // Completed exams
        filtered = filtered.filter(exam => new Date(exam.EndTime) < new Date());
      } else if (currentTab === 4) { // Registered exams
        filtered = filtered.filter(exam => exam.IsRegistered);
      }
      
      setFilteredExams(filtered);
    } else {
      setFilteredExams([]);
    }
  }, [exams, searchTerm, currentTab]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await getAllExams();
      setExams(response.data || []);
      setFilteredExams(response.data || []);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách kỳ thi. Vui lòng thử lại sau.');
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExams();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleRegister = async (examId) => {
    try {
      setRegistering(prev => ({ ...prev, [examId]: true }));
      await registerForExam(examId);
      
      setExams(exams.map(exam => 
        exam.ExamID === examId 
          ? { ...exam, IsRegistered: true } 
          : exam
      ));
    } catch (err) {
      console.error('Error registering for exam:', err);
      
      if (err.response && err.response.status === 400 && 
          err.response.data && err.response.data.message === 'Already registered for this exam') {
        setExams(exams.map(exam => 
          exam.ExamID === examId 
            ? { ...exam, IsRegistered: true } 
            : exam
        ));
      } else {
        alert('Đăng ký không thành công: ' + (err.response?.data?.message || 'Vui lòng thử lại sau.'));
      }
    } finally {
      setRegistering(prev => ({ ...prev, [examId]: false }));
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getDifficultyLevel = (passingScore, totalPoints) => {
    const ratio = passingScore / totalPoints;
    if (ratio < 0.5) return { text: 'Dễ', color: '#10b981', bgColor: '#ecfdf5' };
    if (ratio < 0.7) return { text: 'Trung bình', color: '#f59e0b', bgColor: '#fffbeb' };
    return { text: 'Khó', color: '#ef4444', bgColor: '#fef2f2' };
  };

  const getStatusInfo = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
      return { 
        text: 'Sắp diễn ra', 
        color: '#4f46e5',
        bgColor: '#eef2ff',
        icon: <AccessTime fontSize="small" />
      };
    } else if (now >= start && now <= end) {
      return { 
        text: 'Đang diễn ra', 
        color: '#10b981',
        bgColor: '#ecfdf5',
        icon: <Timer fontSize="small" />
      };
    } else {
      return { 
        text: 'Đã kết thúc', 
        color: '#6b7280',
        bgColor: '#f3f4f6',
        icon: <CheckCircle fontSize="small" />
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Animated Hero Section */}
        <div className="relative overflow-hidden bg-white">
          {/* Flower Bloom Animation */}
          <div className="absolute inset-0">
            {/* Random floating flowers */}
            <div className="absolute top-20 left-10 w-8 h-8 text-pink-300 opacity-60 animate-pulse">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="absolute top-32 right-20 w-6 h-6 text-purple-300 opacity-50 animate-bounce" style={{animationDelay: '0.5s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="absolute top-10 right-1/3 w-10 h-10 text-blue-300 opacity-40 animate-spin" style={{animationDuration: '8s', animationDelay: '1s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.5c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
                <circle cx="12" cy="8" r="2"/>
                <circle cx="8" cy="16" r="1.5"/>
                <circle cx="16" cy="16" r="1.5"/>
              </svg>
            </div>
            <div className="absolute bottom-20 left-1/4 w-12 h-12 text-rose-300 opacity-30 animate-pulse" style={{animationDelay: '2s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div className="absolute top-40 left-2/3 w-7 h-7 text-green-300 opacity-45 animate-bounce" style={{animationDelay: '1.5s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.46c.48-.06.96-.14 1.34-.27C9.34 18.93 10 14.91 11 11c3 1 6 3 8 4.5 2-1.5 3-4.5 1-6.5-1.5-1.5-3-1-3-1z"/>
              </svg>
            </div>
            <div className="absolute bottom-32 right-10 w-9 h-9 text-yellow-300 opacity-35 animate-spin" style={{animationDuration: '6s', animationDelay: '0.8s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.09 6.26L20 9.27l-5 4.87L16.18 21 12 17.77 7.82 21 9 14.14 4 9.27l5.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="absolute top-60 left-12 w-5 h-5 text-indigo-300 opacity-50 animate-pulse" style={{animationDelay: '3s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
              </svg>
            </div>
            <div className="absolute bottom-10 left-1/2 w-11 h-11 text-teal-300 opacity-25 animate-bounce" style={{animationDelay: '2.5s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
          </div>
          
          <div className="relative w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="text-center lg:text-left max-w-4xl">
              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Danh sách 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> kỳ thi </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
                Đăng tải danh sách các kỳ thi hiện có trên hệ thống. Đăng ký hoặc xem thông tin chi tiết về các kỳ thi.
              </p>
            </div>
          </div>

          {/* Wave separator */}
          <div className="absolute bottom-0 left-0 w-full">
            <svg className="w-full h-20 fill-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
            </svg>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="w-full px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {[...Array(8)].map((_, index) => (
              <ExamCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        {/* Animated Hero Section */}
        <div className="relative overflow-hidden bg-white">
          {/* Flower Bloom Animation - same as loading */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-8 h-8 text-pink-300 opacity-60 animate-pulse">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            {/* Other animated elements... */}
          </div>
          
          <div className="relative w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="text-center lg:text-left max-w-4xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Danh sách 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> kỳ thi </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
                Tìm kiếm và đăng ký các kỳ thi phù hợp với bạn
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full">
            <svg className="w-full h-20 fill-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
            </svg>
          </div>
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 py-12 flex justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Lỗi tải dữ liệu</h2>
            <p className="text-red-500 mb-8">{error}</p>
            <button 
              onClick={fetchExams} 
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header section */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Danh sách kỳ thi</h1>
          <div className="flex mt-6 space-x-6 overflow-x-auto pb-1">
            <button
              onClick={() => setCurrentTab(0)}
              className={`px-6 py-3 font-medium text-sm rounded-md transition-all ${
                currentTab === 0 ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Tất cả kỳ thi
            </button>
            
            <button
              onClick={() => setCurrentTab(1)}
              className={`px-6 py-3 font-medium text-sm rounded-md transition-all ${
                currentTab === 1 ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Sắp diễn ra
            </button>

            <button
              onClick={() => setCurrentTab(2)}
              className={`px-6 py-3 font-medium text-sm rounded-md transition-all ${
                currentTab === 2 ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Đang diễn ra
            </button>

            <button
              onClick={() => setCurrentTab(3)}
              className={`px-6 py-3 font-medium text-sm rounded-md transition-all ${
                currentTab === 3 ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Đã kết thúc
            </button>

            <button
              onClick={() => setCurrentTab(4)}
              className={`px-6 py-3 font-medium text-sm rounded-md transition-all ${
                currentTab === 4 ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Đã đăng ký
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Secondary filter bar */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentTab === 0 ? 'Tất cả kỳ thi' :
               currentTab === 1 ? 'Kỳ thi sắp diễn ra' :
               currentTab === 2 ? 'Kỳ thi đang diễn ra' :
               currentTab === 3 ? 'Kỳ thi đã kết thúc' :
               'Kỳ thi đã đăng ký'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredExams.length} kỳ thi có sẵn
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm kỳ thi..."
                className="w-64 px-4 py-2 rounded-md text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button
              onClick={handleRefresh}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                refreshing ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
              disabled={refreshing}
            >
              <Refresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Exam Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
            renderSkeletons()
          ) : filteredExams.length > 0 ? (
            filteredExams.map(exam => {
              const difficultyInfo = getDifficultyLevel(exam.PassingScore, exam.TotalPoints);
              const statusInfo = getStatusInfo(exam.StartTime, exam.EndTime);
              
              return (
                <div 
                  key={exam.ExamID}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 cursor-pointer h-full flex flex-col transform transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-2 w-full" style={{ backgroundColor: statusInfo.bgColor }}></div>
                  <div className="p-5 flex-grow flex flex-col">
                    <div className="flex justify-between mb-3">
                      <div 
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
                      >
                        {statusInfo.icon}
                        <span>{statusInfo.text}</span>
                      </div>
                      <div 
                        className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: difficultyInfo.bgColor, color: difficultyInfo.color }}
                      >
                        {difficultyInfo.text}
                      </div>
                    </div>
                    
                    <Link to={`/exams/${exam.ExamID}`} className="group-hover:text-blue-600 transition-colors">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 h-14" title={exam.Title}>
                        {exam.Title}
                      </h3>
                    </Link>
                    
                    {exam.CourseName && (
                      <div className="flex items-center mb-2 text-gray-500 text-sm h-6 overflow-hidden">
                        <School fontSize="small" className="mr-1.5 flex-shrink-0" />
                        <span className="truncate" title={exam.CourseName}>
                          {exam.CourseName}
                        </span>
                      </div>
                    )}
                    
                    <p className="text-gray-600 text-sm line-clamp-2 h-10 mb-2" title={exam.Description || 'Không có mô tả chi tiết.'}>
                      {exam.Description || 'Không có mô tả chi tiết.'}
                    </p>
                    
                    <hr className="my-4 border-gray-200" />
                    
                    <div className="mt-auto">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Thời gian</p>
                          <div className="flex items-center text-gray-700 font-medium">
                            <Timer fontSize="small" className="mr-1.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate">
                              {exam.Duration} phút
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Điểm đạt</p>
                          <div className="flex items-center text-gray-700 font-medium">
                            <SportsScore fontSize="small" className="mr-1.5 text-blue-600 flex-shrink-0" />
                            <span className="truncate">
                              {exam.PassingScore}/{exam.TotalPoints} đ
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-400 text-xs mb-1">Thời gian mở</p>
                        <div className="flex items-center text-gray-700 font-medium">
                          <CalendarMonth fontSize="small" className="mr-1.5 text-blue-600 flex-shrink-0" />
                          <span className="truncate">
                            {format(new Date(exam.StartTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 pt-0">
                    {exam.IsRegistered ? (
                      <Link 
                        to={`/exams/${exam.ExamID}`}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        Vào thi ngay
                        <ArrowForward fontSize="small" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleRegister(exam.ExamID)}
                        disabled={registering[exam.ExamID]}
                        className="flex items-center justify-center gap-2 w-full py-3 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium"
                      >
                        {registering[exam.ExamID] ? (
                          <>
                            <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang đăng ký...
                          </>
                        ) : (
                          'Đăng ký thi'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center">
              <div className="bg-white rounded-xl p-8 max-w-md mx-auto shadow-sm">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Không tìm thấy kỳ thi
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm 
                    ? `Không tìm thấy kỳ thi phù hợp với từ khóa "${searchTerm}". Vui lòng thử tìm kiếm với từ khóa khác.` 
                    : 'Không có kỳ thi nào trong danh mục này. Vui lòng chọn danh mục khác hoặc quay lại sau.'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Xóa tìm kiếm
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamList;
