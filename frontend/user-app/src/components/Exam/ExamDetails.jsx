import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
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
  Tooltip
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
  MonetizationOn
} from '@mui/icons-material';
import { getExamById, registerForExam } from '../../api/examApi';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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

  useEffect(() => {
    fetchExamDetails();
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const response = await getExamById(examId);
      setExam(response.data);
      setError(null);
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
    <Box
      sx={{
        minHeight: '100vh',
        background: examTheme.colors.background,
        py: 5
      }}
    >
      <Container maxWidth="lg">
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          component={Link}
          to="/exams"
          sx={{ 
            mb: 4, 
            borderRadius: 3, 
            textTransform: 'none',
            fontWeight: 600,
            color: examTheme.colors.primary,
            borderColor: examTheme.colors.primary,
            '&:hover': {
              borderColor: examTheme.colors.primaryLight,
              backgroundColor: `${examTheme.colors.primary}05`,
            }
          }}
        >
          Quay lại danh sách kỳ thi
        </Button>
        
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: examTheme.shadows.card,
            mb: 4
          }}
        >
          {/* Header Section */}
          <Box sx={{ 
            p: 4, 
            position: 'relative',
            background: '#fff',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '8px',
              background: difficulty.color
            }
          }}>
            <Grid container spacing={3} alignItems="flex-start">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {exam.CourseName && (
                    <Chip 
                      size="small"
                      label={exam.CourseName}
                      icon={<School />}
                      sx={{ 
                        borderRadius: 2,
                        backgroundColor: `${examTheme.colors.primary}15`,
                        color: examTheme.colors.primary,
                        fontWeight: 600
                      }} 
                    />
                  )}
                  
                  <Chip 
                    size="small"
                    label={status.text}
                    sx={{ 
                      borderRadius: 2,
                      backgroundColor: `${status.color}15`,
                      color: status.color,
                      fontWeight: 600
                    }} 
                  />
                  
                  <Chip 
                    size="small"
                    label={difficulty.text}
                    sx={{ 
                      borderRadius: 2,
                      backgroundColor: `${difficulty.color}15`,
                      color: difficulty.color,
                      fontWeight: 600
                    }} 
                  />
                </Box>
                
                <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 2, color: examTheme.colors.text.primary }}>
                  {exam.Title}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {exam.Description || 'Không có mô tả cho kỳ thi này.'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    backgroundColor: '#f8fafc',
                    border: '1px solid',
                    borderColor: examTheme.colors.border
                  }}
                >
                  <Stack spacing={2.5}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Timer sx={{ color: examTheme.colors.primary, mr: 1.5, mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Thời gian làm bài
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {exam.Duration} phút
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <CalendarMonth sx={{ color: examTheme.colors.primary, mr: 1.5, mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Thời gian bắt đầu
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {format(new Date(exam.StartTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <CalendarMonth sx={{ color: examTheme.colors.primary, mr: 1.5, mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Thời gian kết thúc
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {format(new Date(exam.EndTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <SportsScore sx={{ color: examTheme.colors.primary, mr: 1.5, mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Điểm đạt
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          <Box component="span" sx={{ color: difficulty.color, fontWeight: 700 }}>
                            {exam.PassingScore}
                          </Box>
                          /{exam.TotalPoints} ({Math.round(exam.PassingScore / exam.TotalPoints * 100)}%)
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          <Divider />
          
          {/* Content Section */}
          <Box sx={{ p: 4, background: '#fff' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: examTheme.colors.text.primary }}>
              Thông tin bổ sung
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    border: '1px solid',
                    borderColor: examTheme.colors.border,
                    height: '100%'
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                    <AssignmentTurnedIn sx={{ mr: 1, color: examTheme.colors.primary }} />
                    Quy định kỳ thi
                  </Typography>
                  
                  <List disablePadding>
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <CheckCircle fontSize="small" sx={{ color: examTheme.colors.success }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Làm bài trong thời gian quy định" 
                        secondary="Bài thi sẽ tự động nộp khi hết thời gian"
                      />
                    </ListItem>
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <CheckCircle fontSize="small" sx={{ color: examTheme.colors.success }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Không tham khảo tài liệu trái phép" 
                        secondary="Trừ khi đề bài cho phép sử dụng tài liệu"
                      />
                    </ListItem>
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <CheckCircle fontSize="small" sx={{ color: examTheme.colors.success }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Không thoát khỏi chế độ toàn màn hình" 
                        secondary="Hệ thống có thể ghi nhận các hành vi vi phạm"
                      />
                    </ListItem>
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <CheckCircle fontSize="small" sx={{ color: examTheme.colors.success }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Lưu bài thường xuyên" 
                        secondary="Nhấn nút lưu bài định kỳ để tránh mất dữ liệu"
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    border: '1px solid',
                    borderColor: examTheme.colors.border,
                    height: '100%'
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Info sx={{ mr: 1, color: examTheme.colors.primary }} />
                    Thông tin khác
                  </Typography>
                  
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 3, 
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
                  
                  <List disablePadding>
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <HelpOutline fontSize="small" sx={{ color: examTheme.colors.info }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Số lượng câu hỏi" 
                        secondary={`${exam.QuestionCount || 'Chưa xác định'} câu hỏi`} 
                      />
                    </ListItem>
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <GppGood fontSize="small" sx={{ color: examTheme.colors.info }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Loại hình thi" 
                        secondary="Trắc nghiệm trực tuyến"
                      />
                    </ListItem>
                    {exam.Price && (
                      <ListItem disableGutters sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <MonetizationOn fontSize="small" sx={{ color: examTheme.colors.info }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Phí tham gia" 
                          secondary={`${exam.Price} đồng`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          {/* Action Section */}
          <Box 
            sx={{ 
              p: 4, 
              backgroundColor: '#f8fafc',
              borderTop: '1px solid',
              borderColor: examTheme.colors.border,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}
          >
            {new Date(exam.StartTime) > new Date() && (
              <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
                Kỳ thi sẽ bắt đầu sau {Math.ceil((new Date(exam.StartTime) - new Date()) / (1000 * 60 * 60 * 24))} ngày nữa
              </Typography>
            )}
            
            {exam.IsRegistered ? (
              <Button 
                component={Link} 
                to={`/exams/${examId}/session`}
                variant="contained" 
                color="primary"
                endIcon={<Launch />}
                disabled={new Date(exam.StartTime) > new Date() || new Date(exam.EndTime) < new Date()}
                sx={{ 
                  px: 4,
                  py: 1.5, 
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  backgroundColor: examTheme.colors.primary,
                  '&:hover': {
                    backgroundColor: examTheme.colors.primaryLight,
                  },
                  '&.Mui-disabled': {
                    backgroundColor: `${examTheme.colors.primary}40`,
                    color: '#fff'
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
              <Tooltip 
                title={new Date(exam.EndTime) < new Date() ? "Kỳ thi đã kết thúc, không thể đăng ký" : ""} 
                placement="top"
              >
                <span>
                  <Button 
                    variant="contained" 
                    color="primary"
                    endIcon={registering ? null : <ArrowForward />}
                    onClick={handleRegister}
                    disabled={registering || new Date(exam.EndTime) < new Date()}
                    sx={{ 
                      px: 4,
                      py: 1.5, 
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      backgroundColor: examTheme.colors.primary,
                      '&:hover': {
                        backgroundColor: examTheme.colors.primaryLight,
                      },
                      '&.Mui-disabled': {
                        backgroundColor: `${examTheme.colors.primary}40`,
                        color: '#fff'
                      }
                    }}
                  >
                    {registering ? (
                      <>
                        <CircularProgress size={20} thickness={4} sx={{ color: '#fff', mr: 1 }} />
                        Đang đăng ký...
                      </>
                    ) : new Date(exam.EndTime) < new Date() ? 'Kỳ thi đã kết thúc' : 'Đăng ký tham gia'}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ExamDetails;
