/*-----------------------------------------------------------------
* File: ExamDetails.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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

  // Helper to safely format date/time or show placeholder
  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return !dateTime || isNaN(date.getTime())
      ? '—'
      : format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
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

        {/* Hero Section - Simplified */}
        <Paper elevation={1} sx={{ p: 4, borderRadius: 2, mb: 4 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700 }}>
            {exam.Title}
          </Typography>
          <Typography variant="subtitle2" align="center" color="text.secondary" gutterBottom>
            {exam.CourseName}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={4} justifyContent="center">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Timer fontSize="small" />
              <Typography variant="body2">{exam.Duration} phút</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CalendarMonth fontSize="small" />
              <Typography variant="body2">
                {format(new Date(exam.StartTime), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <People fontSize="small" />
              <Typography variant="body2">{exam.RegisteredCount} đã đăng ký</Typography>
            </Stack>
          </Stack>
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
                              <TableCell>{formatDateTime(attempt.StartedAt)}</TableCell>
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

