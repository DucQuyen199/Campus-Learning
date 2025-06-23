import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Chip, 
  Divider, 
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Avatar,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow
} from '@mui/material';
import { 
  CalendarMonth, 
  Timer, 
  School, 
  SportsScore, 
  ArrowBack,
  ArrowForward,
  AssignmentTurnedIn,
  CheckCircle,
  ErrorOutline,
  Info,
  Launch,
  HelpOutline,
  GppGood,
  MonetizationOn,
  Star,
  People,
  AccessTime,
  History
} from '@mui/icons-material';
import { getExamById, registerForExam } from '../../api/examApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import axiosInstance from '../../utils/axiosInstance';

// Define a local fallback theme in case the import fails
const localExamTheme = {
  colors: {
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    primaryDark: '#1d4ed8',
    secondary: '#8b5cf6',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    neutral: '#64748b',
    background: '#f1f5f9',
    backgroundSecondary: '#f8fafc',
    border: '#e2e8f0',
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      light: '#94a3b8'
    }
  },
  shadows: {
    card: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    button: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    hover: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  borderRadius: {
    small: '0.375rem',
    medium: '0.75rem',
    large: '1rem',
    xl: '1.5rem'
  },
  transitions: {
    fast: 'all 0.2s ease',
    default: 'all 0.3s ease',
    slow: 'all 0.5s ease'
  }
};

// Use the imported theme or fall back to the local one if import fails
let examTheme;
try {
  examTheme = require('./index').examTheme;
} catch (error) {
  console.warn('Failed to import examTheme from index.js, using local fallback');
  examTheme = localExamTheme;
}

const ExamDetails = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchExamDetails();
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const response = await getExamById(examId);
      
      // If AllowRetakes is null or undefined, default to false for backward compatibility
      const examData = {
        ...response.data,
        AllowRetakes: response.data.AllowRetakes ?? false,
        MaxRetakes: response.data.MaxRetakes ?? 0
      };
      
      setExam(examData);
      setError(null);
      
      // After getting general exam details, try to fetch attempt history if user is registered
      if (examData.IsRegistered) {
        try {
          const attemptsResponse = await axiosInstance.get(`/exams/${examId}/attempts`);
          if (attemptsResponse.data.success) {
            // Update exam with attempt information
            setExam(prev => ({
              ...prev, 
              attempts: attemptsResponse.data.data.attempts,
              attemptsUsed: attemptsResponse.data.data.attemptsUsed,
              attemptsRemaining: attemptsResponse.data.data.attemptsRemaining
            }));
          }
        } catch (err) {
          // Silently handle error, not critical
          console.warn('Could not fetch attempt history', err);
        }
      }
    } catch (err) {
      console.error('Error fetching exam details:', err);
      setError('Không thể tải thông tin kỳ thi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      await registerForExam(examId);
      setExam({ ...exam, IsRegistered: true });
    } catch (err) {
      console.error('Error registering for exam:', err);
      if (err.response?.status === 400 && 
          err.response?.data?.message === 'Already registered for this exam') {
        setExam({ ...exam, IsRegistered: true });
      } else {
        alert('Đăng ký không thành công: ' + (err.response?.data?.message || 'Vui lòng thử lại sau.'));
      }
    } finally {
      setRegistering(false);
    }
  };

  const getDifficultyLevel = (passingScore, totalPoints) => {
    const ratio = passingScore / totalPoints;
    if (ratio < 0.5) return { text: 'Dễ', color: examTheme.colors.success };
    if (ratio < 0.7) return { text: 'Trung bình', color: examTheme.colors.warning };
    return { text: 'Khó', color: examTheme.colors.danger };
  };

  const getStatusInfo = (startTime, endTime) => {
    if (!startTime || !endTime) return { text: 'Chưa xác định', color: examTheme.colors.neutral };
    
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
      return { 
        text: 'Sắp diễn ra', 
        color: examTheme.colors.info
      };
    } else if (now >= start && now <= end) {
      return { 
        text: 'Đang diễn ra', 
        color: examTheme.colors.success
      };
    } else {
      return { 
        text: 'Đã kết thúc', 
        color: examTheme.colors.neutral
      };
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: examTheme.colors.background
      }}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: examTheme.shadows.card,
            backgroundColor: '#fff',
            width: { xs: '90%', sm: '400px' }
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: 100,
              height: 100,
              mb: 3
            }}
          >
            <CircularProgress
              variant="determinate"
              value={100}
              size={100}
              thickness={5}
              sx={{
                color: 'rgba(22, 78, 99, 0.1)'
              }}
            />
            <CircularProgress
              size={100}
              thickness={5}
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                color: examTheme.colors.primary,
                animation: 'rotate 1.5s linear infinite',
                '@keyframes rotate': {
                  '0%': {
                    transform: 'rotate(0deg)',
                  },
                  '100%': {
                    transform: 'rotate(360deg)',
                  },
                },
              }}
            />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: examTheme.colors.primary, mb: 1 }}>
            Đang tải thông tin kỳ thi
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Vui lòng đợi trong giây lát
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (error || !exam) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: examTheme.colors.background
        }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            maxWidth: 500,
            width: '90%',
            textAlign: 'center', 
            p: 5, 
            borderRadius: 4,
            boxShadow: examTheme.shadows.card,
            backgroundColor: '#fff',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: examTheme.colors.danger
          }} />
          
          <ErrorOutline sx={{ fontSize: 70, color: examTheme.colors.danger, mb: 2 }} />
          
          <Typography variant="h5" sx={{ fontWeight: 700, color: examTheme.colors.text.primary, mb: 1 }}>
            {error || 'Không tìm thấy thông tin kỳ thi'}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Không thể tải thông tin chi tiết. Vui lòng thử lại sau hoặc quay lại danh sách kỳ thi.
          </Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/exams')}
              sx={{ 
                px: 3,
                py: 1.2, 
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                color: examTheme.colors.primary,
                borderColor: examTheme.colors.primary,
                '&:hover': {
                  borderColor: examTheme.colors.primaryLight,
                }
              }}
            >
              Quay lại danh sách
            </Button>
            
            <Button 
              variant="contained" 
              onClick={fetchExamDetails} 
              sx={{ 
                px: 3,
                py: 1.2, 
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: examTheme.colors.primary,
                '&:hover': {
                  backgroundColor: examTheme.colors.primaryLight,
                }
              }}
            >
              Thử lại
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  const difficulty = getDifficultyLevel(exam.PassingScore, exam.TotalPoints);
  const status = getStatusInfo(exam.StartTime, exam.EndTime);

  return (
    <Box sx={{ minHeight: '100vh', background: examTheme.colors.background }}>
      <Box sx={{ px: { xs: 2, md: 4, lg: 6 }, py: { xs: 3, md: 5 } }}>
        {/* Breadcrumb */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', color: 'text.secondary', typography: 'body2' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: examTheme.colors.primary } }}>
            Trang chủ
          </Link>
          <Box component="span" sx={{ mx: 1 }}>/</Box>
          <Link to="/exams" style={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: examTheme.colors.primary } }}>
            Kỳ thi
          </Link>
          <Box component="span" sx={{ mx: 1 }}>/</Box>
          <Typography color="text.primary">{exam.Title}</Typography>
        </Box>

        {/* Hero Section */}
        <Paper 
          elevation={0}
          sx={{
            background: `linear-gradient(to right, ${examTheme.colors.primaryDark}, ${examTheme.colors.primary})`,
            color: 'white',
            borderRadius: 4,
            overflow: 'hidden',
            mb: 4,
            boxShadow: examTheme.shadows.card,
            position: 'relative'
          }}
        >
          <Box sx={{ p: { xs: 3, md: 4, lg: 6 } }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label={exam.CourseName || 'Khóa học'}
                      icon={<School />}
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        '& .MuiChip-icon': { color: 'white' }
                      }}
                    />
                    <Chip 
                      label={status.text}
                      sx={{ 
                        backgroundColor: `${status.color}40`,
                        color: 'white'
                      }}
                    />
                    <Chip 
                      label={difficulty.text}
                      sx={{ 
                        backgroundColor: `${difficulty.color}40`,
                        color: 'white'
                      }}
                    />
                  </Box>

                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 800,
                      fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' }
                    }}
                  >
                    {exam.Title}
                  </Typography>

                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      lineHeight: 1.7
                    }}
                  >
                    {exam.Description || 'Không có mô tả cho kỳ thi này.'}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Star sx={{ mr: 1, color: '#FFD700' }} />
                      <Typography>Điểm đạt: {exam.PassingScore}/{exam.TotalPoints}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <People sx={{ mr: 1 }} />
                      <Typography>{exam.RegisteredCount || 0} thí sinh</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTime sx={{ mr: 1 }} />
                      <Typography>{exam.Duration} phút</Typography>
                    </Box>
                  </Box>

                  {exam.IsRegistered ? (
                    <Button
                      component={Link}
                      to={`/exams/${examId}/session`}
                      variant="contained"
                      disabled={new Date(exam.StartTime) > new Date() || new Date(exam.EndTime) < new Date()}
                      endIcon={<Launch />}
                      sx={{
                        alignSelf: 'flex-start',
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        backgroundColor: '#10B981',
                        '&:hover': {
                          backgroundColor: '#059669',
                          transform: 'translateY(-2px)',
                          boxShadow: examTheme.shadows.button
                        },
                        '&.Mui-disabled': {
                          backgroundColor: 'rgba(16, 185, 129, 0.4)',
                          color: 'white'
                        }
                      }}
                    >
                      {new Date(exam.StartTime) > new Date() 
                        ? 'Chưa đến thời gian thi' 
                        : new Date(exam.EndTime) < new Date() 
                          ? 'Kỳ thi đã kết thúc' 
                          : 'Vào thi ngay'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleRegister}
                      disabled={registering || new Date(exam.EndTime) < new Date()}
                      endIcon={registering ? null : <ArrowForward />}
                      sx={{
                        alignSelf: 'flex-start',
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        backgroundColor: '#F59E0B',
                        '&:hover': {
                          backgroundColor: '#D97706',
                          transform: 'translateY(-2px)',
                          boxShadow: examTheme.shadows.button
                        },
                        '&.Mui-disabled': {
                          backgroundColor: 'rgba(245, 158, 11, 0.4)',
                          color: 'white'
                        }
                      }}
                    >
                      {registering ? (
                        <>
                          <CircularProgress size={20} thickness={4} sx={{ color: 'white', mr: 1 }} />
                          Đang đăng ký...
                        </>
                      ) : new Date(exam.EndTime) < new Date() ? 'Kỳ thi đã kết thúc' : 'Đăng ký tham gia'}
                    </Button>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    p: 3,
                    height: '100%',
                    border: '1px solid rgba(255,255,255,0.2)',
                    position: 'absolute',
                    right: { md: 24, lg: 48 },
                    top: { md: 24, lg: 48 },
                    width: { md: '300px', lg: '350px' }
                  }}
                >
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Thời gian làm bài
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        {exam.Duration} phút
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Thời gian bắt đầu
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        {format(new Date(exam.StartTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Thời gian kết thúc
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        {format(new Date(exam.EndTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Điểm đạt
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        <Box component="span" sx={{ color: difficulty.color }}>
                          {exam.PassingScore}
                        </Box>
                        /{exam.TotalPoints} ({Math.round(exam.PassingScore / exam.TotalPoints * 100)}%)
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Tabs Section */}
        <Paper 
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            mb: 4,
            boxShadow: examTheme.shadows.card
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row">
              <Button
                onClick={() => setActiveTab('overview')}
                sx={{
                  px: 4,
                  py: 2,
                  color: activeTab === 'overview' ? examTheme.colors.primary : 'text.secondary',
                  borderBottom: activeTab === 'overview' ? 2 : 0,
                  borderColor: examTheme.colors.primary,
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: 'transparent'
                  }
                }}
              >
                Tổng quan
              </Button>
              <Button
                onClick={() => setActiveTab('rules')}
                sx={{
                  px: 4,
                  py: 2,
                  color: activeTab === 'rules' ? examTheme.colors.primary : 'text.secondary',
                  borderBottom: activeTab === 'rules' ? 2 : 0,
                  borderColor: examTheme.colors.primary,
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: 'transparent'
                  }
                }}
              >
                Quy định
              </Button>
              <Button
                onClick={() => setActiveTab('info')}
                sx={{
                  px: 4,
                  py: 2,
                  color: activeTab === 'info' ? examTheme.colors.primary : 'text.secondary',
                  borderBottom: activeTab === 'info' ? 2 : 0,
                  borderColor: examTheme.colors.primary,
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: 'transparent'
                  }
                }}
              >
                Thông tin khác
              </Button>
              <Button
                onClick={() => setActiveTab('history')}
                sx={{
                  px: 4,
                  py: 2,
                  color: activeTab === 'history' ? examTheme.colors.primary : 'text.secondary',
                  borderBottom: activeTab === 'history' ? 2 : 0,
                  borderColor: examTheme.colors.primary,
                  borderRadius: 0,
                  '&:hover': {
                    backgroundColor: 'transparent'
                  }
                }}
              >
                Lịch sử thi
              </Button>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 3, md: 4, lg: 6 } }}>
            {activeTab === 'overview' && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 4 }}>
                  Mô tả kỳ thi
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                  {exam.Description || 'Không có mô tả chi tiết cho kỳ thi này.'}
                </Typography>

                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 4, 
                    borderRadius: 2,
                    '.MuiAlert-icon': {
                      color: examTheme.colors.info
                    }
                  }}
                >
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    Bạn cần đạt tối thiểu {exam.PassingScore} điểm để hoàn thành kỳ thi này.
                  </Typography>
                </Alert>
              </Box>
            )}

            {activeTab === 'rules' && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 4 }}>
                  Quy định kỳ thi
                </Typography>
                <List>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>
                      <CheckCircle sx={{ color: examTheme.colors.success }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Làm bài trong thời gian quy định"
                      secondary="Bài thi sẽ tự động nộp khi hết thời gian"
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>
                      <CheckCircle sx={{ color: examTheme.colors.success }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Không tham khảo tài liệu trái phép"
                      secondary="Trừ khi đề bài cho phép sử dụng tài liệu"
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>
                      <CheckCircle sx={{ color: examTheme.colors.success }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Không thoát khỏi chế độ toàn màn hình"
                      secondary="Hệ thống có thể ghi nhận các hành vi vi phạm"
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>
                      <CheckCircle sx={{ color: examTheme.colors.success }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Lưu bài thường xuyên"
                      secondary="Nhấn nút lưu bài định kỳ để tránh mất dữ liệu"
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                </List>
              </Box>
            )}

            {activeTab === 'info' && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 4 }}>
                  Thông tin khác
                </Typography>
                <List>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>
                      <HelpOutline sx={{ color: examTheme.colors.info }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Số lượng câu hỏi"
                      secondary={`${exam.QuestionCount || 'Chưa xác định'} câu hỏi`}
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>
                      <GppGood sx={{ color: examTheme.colors.info }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Loại hình thi"
                      secondary="Trắc nghiệm trực tuyến"
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                  {exam.Price && (
                    <ListItem sx={{ py: 2 }}>
                      <ListItemIcon>
                        <MonetizationOn sx={{ color: examTheme.colors.info }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Phí tham gia"
                        secondary={`${exam.Price} đồng`}
                        primaryTypographyProps={{ fontWeight: 600 }}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            )}

            {activeTab === 'history' && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 4 }}>
                  Lịch sử thi và số lần thử
                </Typography>
                
                <Box mb={4}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Chính sách thi lại:</strong> {exam.AllowRetakes ? (
                      exam.MaxRetakes > 0 ? 
                        `Được phép thi lại tối đa ${exam.MaxRetakes + 1} lần` :
                        'Được phép thi lại không giới hạn số lần'
                    ) : (
                      'Không được phép thi lại'
                    )}
                  </Typography>

                  {exam.attemptsUsed && (
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Số lần đã thi:</strong> {exam.attemptsUsed} {exam.attemptsRemaining && `(còn ${exam.attemptsRemaining === 'unlimited' ? 'không giới hạn' : exam.attemptsRemaining} lượt)`}
                    </Typography>
                  )}
                  
                  {exam.attempts && exam.attempts.length > 0 ? (
                    <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Lần thi</TableCell>
                            <TableCell>Thời gian</TableCell>
                            <TableCell>Điểm số</TableCell>
                            <TableCell>Trạng thái</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {exam.attempts.map((attempt, index) => (
                            <TableRow key={attempt.ParticipantID}>
                              <TableCell>{attempt.AttemptNumber || (exam.attempts.length - index)}</TableCell>
                              <TableCell>{format(new Date(attempt.StartedAt || attempt.CreatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</TableCell>
                              <TableCell>
                                {attempt.Score !== null && attempt.Score !== undefined ? (
                                  `${attempt.Score}/${exam.TotalPoints} (${Math.round(attempt.Score / exam.TotalPoints * 100)}%)`
                                ) : attempt.score !== undefined && attempt.score !== null ? (
                                  `${attempt.score}/${exam.TotalPoints} (${Math.round(attempt.score / exam.TotalPoints * 100)}%)`
                                ) : attempt.Score === undefined && attempt.score === undefined && attempt['score'] !== undefined ? (
                                  `${attempt['score']}/${exam.TotalPoints}`
                                ) : 'Chưa có điểm'}
                              </TableCell>
                              <TableCell>
                                {attempt.Status === 'completed' && 'Đã hoàn thành'}
                                {attempt.Status === 'in_progress' && 'Đang làm bài'}
                                {attempt.Status === 'registered' && 'Đã đăng ký'}
                                {attempt.Status === 'reviewed' && 'Đã chấm điểm'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Paper>
                  ) : (
                    <Alert severity="info">Bạn chưa tham gia kỳ thi này</Alert>
                  )}
                </Box>
                
                <Stack direction="row" spacing={2}>
                  <Button
                    component={Link}
                    to={`/exams/${examId}/history`}
                    variant="outlined"
                    color="primary"
                    startIcon={<History />}
                  >
                    Xem chi tiết lịch sử thi
                  </Button>
                  
                  {exam.IsRegistered && exam.AllowRetakes && status.text !== 'Đã kết thúc' &&
                    (exam.attemptsRemaining === 'unlimited' || exam.attemptsRemaining > 0) && (
                    <Button
                      onClick={handleRegister}
                      variant="contained"
                      color="primary"
                      disabled={registering}
                      startIcon={registering ? <CircularProgress size={20} /> : null}
                    >
                      {registering ? 'Đang đăng ký...' : 'Đăng ký thi lại'}
                    </Button>
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ExamDetails;
