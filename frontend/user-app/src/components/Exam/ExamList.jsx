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
      <div className="min-h-screen bg-gray-50">
        <div className="py-12 bg-gradient-to-br from-indigo-900 to-indigo-700 text-white">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">Danh sách kỳ thi</h1>
            <p className="text-indigo-100 max-w-3xl">Đang tải danh sách kỳ thi. Vui lòng đợi trong giây lát...</p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
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
      <div className="min-h-screen bg-gray-50">
        <div className="py-12 bg-gradient-to-br from-indigo-900 to-indigo-700 text-white">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">Danh sách kỳ thi</h1>
            <p className="text-indigo-100 max-w-3xl">Tìm kiếm và đăng ký các kỳ thi phù hợp với bạn</p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Lỗi tải dữ liệu</h2>
            <p className="text-red-500 mb-8">{error}</p>
            <button 
              onClick={fetchExams} 
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="py-12 bg-gradient-to-br from-indigo-900 to-indigo-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Danh sách kỳ thi</h1>
            <p className="text-indigo-100 text-lg mb-8">
              Danh sách các kỳ thi hiện có trên hệ thống. Đăng ký hoặc xem thông tin chi tiết về các kỳ thi.
            </p>
            
            {/* Search Box */}
            <div className="relative max-w-lg">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm kỳ thi..."
                className="w-full px-5 py-3 pr-12 rounded-xl text-gray-700 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md"
              />
              <div className="absolute right-0 top-0 h-full px-4 flex items-center">
                {refreshing ? (
                  <svg className="w-5 h-5 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <button onClick={handleRefresh} className="text-indigo-600 hover:text-indigo-800">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <div className="flex p-1 gap-1">
            <button 
              onClick={() => setCurrentTab(0)}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium rounded-lg flex-shrink-0 transition-all
                ${currentTab === 0 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Description className="w-4 h-4" />
              Tất cả
            </button>
            <button 
              onClick={() => setCurrentTab(1)}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium rounded-lg flex-shrink-0 transition-all
                ${currentTab === 1
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <AccessTime className="w-4 h-4" />
              Sắp diễn ra
            </button>
            <button 
              onClick={() => setCurrentTab(2)}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium rounded-lg flex-shrink-0 transition-all
                ${currentTab === 2
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Timer className="w-4 h-4" />
              Đang diễn ra
            </button>
            <button 
              onClick={() => setCurrentTab(3)}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium rounded-lg flex-shrink-0 transition-all
                ${currentTab === 3
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <CheckCircle className="w-4 h-4" />
              Đã kết thúc
            </button>
            <button 
              onClick={() => setCurrentTab(4)}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium rounded-lg flex-shrink-0 transition-all
                ${currentTab === 4
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <AutoAwesome className="w-4 h-4" />
              Đã đăng ký
            </button>
          </div>
        </div>
      </div>
      
      {/* Exam List */}
      <div className="container mx-auto px-4 py-8">
        {filteredExams.length === 0 ? (
          <div className="flex justify-center pt-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy kỳ thi</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? `Không tìm thấy kỳ thi phù hợp với từ khóa "${searchTerm}". Vui lòng thử tìm kiếm với từ khóa khác.` 
                  : 'Không có kỳ thi nào trong danh mục này. Vui lòng chọn danh mục khác hoặc quay lại sau.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-2 border border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Xóa tìm kiếm
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {filteredExams.map(exam => {
              const difficultyInfo = getDifficultyLevel(exam.PassingScore, exam.TotalPoints);
              const statusInfo = getStatusInfo(exam.StartTime, exam.EndTime);
              
              return (
                <div 
                  key={exam.ExamID}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-[520px] flex flex-col"
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
                    
                    <Link to={`/exams/${exam.ExamID}`} className="group-hover:text-indigo-600 transition-colors">
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
                            <Timer fontSize="small" className="mr-1.5 text-indigo-600 flex-shrink-0" />
                            <span className="truncate">
                              {exam.Duration} phút
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Điểm đạt</p>
                          <div className="flex items-center text-gray-700 font-medium">
                            <SportsScore fontSize="small" className="mr-1.5 text-indigo-600 flex-shrink-0" />
                            <span className="truncate">
                              {exam.PassingScore}/{exam.TotalPoints} đ
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-400 text-xs mb-1">Thời gian mở</p>
                        <div className="flex items-center text-gray-700 font-medium">
                          <CalendarMonth fontSize="small" className="mr-1.5 text-indigo-600 flex-shrink-0" />
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
                        className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                      >
                        Xem chi tiết
                        <ArrowForward fontSize="small" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleRegister(exam.ExamID)}
                        disabled={registering[exam.ExamID]}
                        className="flex items-center justify-center gap-2 w-full py-3 border border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors font-medium"
                      >
                        {registering[exam.ExamID] ? (
                          <>
                            <svg className="w-4 h-4 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamList;
