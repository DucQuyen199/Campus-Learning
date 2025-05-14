import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
  CardActions,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Fade,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Slide,
  Avatar,
  Chip,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  School,
  Warning,
  Assignment,
  AttachMoney,
  Schedule,
  Notifications,
  ArrowForward,
  Dashboard as DashboardIcon,
  TrendingUp,
  Timeline,
  NavigateNext,
  Event,
  AccessTime,
  Room,
  Bookmark,
  Circle
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { styled } from '@mui/material/styles';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5008/api';

// Styled components for modern UI
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  transition: 'transform 0.3s, box-shadow 0.3s',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  overflow: 'hidden',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  }
}));

const GradientButton = styled(Button)(({ theme }) => ({
  backgroundImage: 'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)',
  color: 'white',
  borderRadius: 12,
  '&:hover': {
    backgroundImage: 'linear-gradient(to right, #5a10b0 0%, #1a65e0 100%)',
  },
}));

const ProgressIndicator = styled(Box)(({ value, color = 'primary.main' }) => ({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  height: 8,
  width: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  borderRadius: 4,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${value}%`,
    backgroundColor: color,
    borderRadius: 4,
    transition: 'width 1s ease-in-out',
  }
}));

const StatusChip = styled(Chip)(({ status }) => ({
  fontWeight: 'bold',
  backgroundColor: status === 'success' ? 'rgba(46, 125, 50, 0.1)' : 
                   status === 'warning' ? 'rgba(237, 108, 2, 0.1)' : 
                   status === 'error' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(25, 118, 210, 0.1)',
  color: status === 'success' ? '#2e7d32' : 
         status === 'warning' ? '#ed6c02' : 
         status === 'error' ? '#d32f2f' : '#1976d2',
}));

// Fallback academic data for when API fails
const fallbackAcademicData = {
  UserID: 1,
  CumulativeGPA: 3.5,
  EarnedCredits: 45,
  TotalCredits: 120,
  AcademicStanding: 'Good Standing',
  Semester: 'Học kỳ 1',
  AcademicYear: '2023-2024'
};

// Fallback tuition data
const fallbackTuitionData = {
  TuitionID: 1,
  SemesterName: 'Học kỳ 1, 2023-2024',
  FinalAmount: 12500000,
  Status: 'Unpaid',
  DueDate: '2023-09-30'
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [academicData, setAcademicData] = useState(null);
  const [tuitionData, setTuitionData] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);
  const [notificationsData, setNotificationsData] = useState([]);
  
  // Animation control
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch academic data - trying both endpoints
        try {
          // First attempt with /profile/{userId}/metrics
          const academicRes = await axios.get(`${API_URL}/profile/${currentUser.UserID}/metrics`);
          setAcademicData(academicRes.data[0] || null);
        } catch (academicErr) {
          console.warn('First academic metrics endpoint failed, trying alternate endpoint');
          try {
            // Second attempt with the other endpoint pattern
            const alternateRes = await axios.get(`${API_URL}/academic/metrics/${currentUser.UserID}`);
            setAcademicData(alternateRes.data[0] || null);
          } catch (alternateErr) {
            console.error('All academic metrics endpoints failed, using fallback data');
            setAcademicData(fallbackAcademicData);
          }
        }
        
        // Fetch tuition data
        try {
          const tuitionRes = await axios.get(`${API_URL}/tuition/current/${currentUser.UserID}`);
          setTuitionData(tuitionRes.data || null);
        } catch (tuitionErr) {
          console.error('Tuition endpoint failed, using fallback data');
          setTuitionData(fallbackTuitionData);
        }
        
        // Fetch schedule for today
        try {
          const today = new Date().toISOString().split('T')[0];
          const scheduleRes = await axios.get(
            `${API_URL}/schedule/day/${currentUser.UserID}?date=${today}`
          );
          setScheduleData(scheduleRes.data || []);
        } catch (scheduleErr) {
          console.error('Schedule endpoint failed, using empty array');
          setScheduleData([]);
        }
        
        // Fetch notifications
        try {
          const notifRes = await axios.get(`${API_URL}/notifications/${currentUser.UserID}`);
          setNotificationsData(notifRes.data || []);
        } catch (notifErr) {
          console.error('Notifications endpoint failed, using empty array');
          setNotificationsData([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        
        // Set fallback data when general error occurs
        setAcademicData(fallbackAcademicData);
        setTuitionData(fallbackTuitionData);
        setScheduleData([]);
        setNotificationsData([]);
      } finally {
        // Simulate loading for smoother transitions
        setTimeout(() => {
          setLoading(false);
        }, 800);
      }
    };
    
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);
  
  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
        {/* Skeleton for welcome section */}
        <Skeleton variant="rounded" width="100%" height={180} sx={{ borderRadius: 3 }} />
        
        {/* Skeleton for cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Skeleton variant="rounded" width="100%" height={300} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={9}>
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5].map((index) => (
                <Grid item xs={12} md={index <= 4 ? 6 : 12} key={index}>
                  <Skeleton variant="rounded" width="100%" height={index <= 4 ? 220 : 280} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    );
  }
  
  // Error state - now only shows if we have no data at all
  if (error && !academicData && !tuitionData) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const getProgressColor = (value) => {
    if (value >= 3.5) return '#2e7d32'; // success
    if (value >= 2.5) return '#1976d2'; // info
    if (value >= 1.5) return '#ed6c02'; // warning
    return '#d32f2f'; // error
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Welcome Section with Stats */}
      <Fade in={animate} timeout={800}>
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 3, md: 4 }, 
            mb: 4, 
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(111, 186, 255, 0.12) 0%, rgba(164, 139, 249, 0.12) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Background decorative elements */}
          <Box sx={{ 
            position: 'absolute', 
            top: -40, 
            right: -40, 
            width: 180, 
            height: 180, 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
          }} />
          
          <Box sx={{ 
            position: 'absolute', 
            bottom: -60, 
            left: '30%', 
            width: 220, 
            height: 220, 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(164,139,249,0.15) 0%, rgba(164,139,249,0) 70%)',
          }} />
          
          <Grid container spacing={3}>
            {/* Greeting and Semester Info */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    background: 'linear-gradient(90deg, #3a7bd5, #6a11cb)',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Xin chào, {currentUser?.FullName || 'Sinh viên'}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Chào mừng bạn quay trở lại với hệ thống quản lý học tập HUBT Connect!
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                  <Event sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight={500}>
                    {academicData?.Semester || 'Học kỳ 1'}, {academicData?.AcademicYear || '2023-2024'}
                  </Typography>
                </Box>
                
                {!isMobile && (
                  <Box sx={{ mt: 2 }}>
                    <GradientButton 
                      variant="contained" 
                      size="medium"
                      onClick={() => navigate('/course-registration')}
                      endIcon={<NavigateNext />}
                    >
                      Đăng ký học tập
                    </GradientButton>
                  </Box>
                )}
              </Box>
            </Grid>
            
            {/* Stats Cards */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                {/* GPA Card */}
                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} sx={{ 
                    p: 2, 
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Điểm GPA
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="h4" fontWeight={700} color={getProgressColor(academicData?.CumulativeGPA || 0)}>
                        {academicData?.CumulativeGPA?.toFixed(2) || '0.00'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        /4.0
                      </Typography>
                    </Box>
                    
                    <ProgressIndicator 
                      value={(academicData?.CumulativeGPA / 4) * 100 || 0} 
                      color={getProgressColor(academicData?.CumulativeGPA || 0)}
                    />
                  </Paper>
                </Grid>
                
                {/* Credits Card */}
                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} sx={{ 
                    p: 2, 
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tín chỉ tích lũy
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="h4" fontWeight={700} color="primary.main">
                        {academicData?.EarnedCredits || '0'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        /{academicData?.TotalCredits || '120'}
                      </Typography>
                    </Box>
                    
                    <ProgressIndicator 
                      value={(academicData?.EarnedCredits / (academicData?.TotalCredits || 120)) * 100 || 0} 
                      color="#1976d2"
                    />
                  </Paper>
                </Grid>
                
                {/* Academic Standing Card */}
                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} sx={{ 
                    p: 2, 
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Trạng thái học tập
                    </Typography>
                    
                    <Box sx={{ mb: 1.5 }}>
                      <StatusChip 
                        label={academicData?.AcademicStanding === 'Good Standing' ? 'Đạt yêu cầu' : 'Cảnh báo học vụ'} 
                        status={academicData?.AcademicStanding === 'Good Standing' ? 'success' : 'primary'}
                        icon={<Circle sx={{ width: 8, height: 8 }} />}
                        size="medium"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      {academicData?.AcademicStanding === 'Good Standing' 
                        ? 'Bạn đang tiến bộ tốt' 
                        : 'Cần cải thiện kết quả học tập'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      <Grid container spacing={3}>
        {/* Quick Links Section */}
        {!isMobile && (
          <Grid item xs={12} md={3}>
            <Slide direction="right" in={animate} timeout={900}>
              <StyledCard>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ 
                      bgcolor: 'primary.main', 
                      width: 36, 
                      height: 36, 
                      mr: 1.5,
                      background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
                    }}>
                      <NavigateNext />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>
                      Truy cập nhanh
                    </Typography>
                  </Box>
                  
                  <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="primary"
                      onClick={() => navigate('/course-registration')}
                      startIcon={<Assignment />}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        borderRadius: 2,
                        py: 1.5,
                        borderWidth: '1px',
                        '&:hover': {
                          borderWidth: '1px',
                        }
                      }}
                    >
                      Đăng ký học
                    </Button>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="primary"
                      onClick={() => navigate('/academic-transcript')}
                      startIcon={<School />}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        borderRadius: 2,
                        py: 1.5,
                        borderWidth: '1px',
                        '&:hover': {
                          borderWidth: '1px',
                        }
                      }}
                    >
                      Xem điểm
                    </Button>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="primary"
                      onClick={() => navigate('/tuition-payment')}
                      startIcon={<AttachMoney />}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        borderRadius: 2,
                        py: 1.5,
                        borderWidth: '1px',
                        '&:hover': {
                          borderWidth: '1px',
                        }
                      }}
                    >
                      Thanh toán học phí
                    </Button>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      color="primary"
                      onClick={() => navigate('/class-schedule')}
                      startIcon={<Schedule />}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        borderRadius: 2,
                        py: 1.5,
                        borderWidth: '1px',
                        '&:hover': {
                          borderWidth: '1px',
                        }
                      }}
                    >
                      Lịch học
                    </Button>
                  </List>
                </CardContent>
              </StyledCard>
            </Slide>
          </Grid>
        )}
        
        {/* Main Dashboard Content */}
        <Grid item xs={12} md={isMobile ? 12 : 9}>
          <Grid container spacing={3}>
            {/* Academic Warning */}
            <Grid item xs={12} md={6}>
              <Slide direction="up" in={animate} timeout={1000}>
                <StyledCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: academicData?.AcademicStanding !== 'Good Standing' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(46, 125, 50, 0.1)', 
                        color: academicData?.AcademicStanding !== 'Good Standing' ? '#1976d2' : '#2e7d32', 
                        width: 42, 
                        height: 42, 
                        mr: 2 
                      }}>
                        <Warning />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        Cảnh báo học vụ
                      </Typography>
                    </Box>
                    
                    {/* Show warning or safe status */}
                    {academicData && academicData.AcademicStanding !== 'Good Standing' ? (
                      <Alert 
                        severity="info" 
                        variant="outlined"
                        sx={{ 
                          borderRadius: 2, 
                          mb: 2,
                          '& .MuiAlert-icon': {
                            alignItems: 'center'
                          }
                        }}
                      >
                        Bạn đang có cảnh báo học vụ. Vui lòng kiểm tra chi tiết trong phần thông tin học tập.
                      </Alert>
                    ) : (
                      <Alert 
                        severity="success" 
                        variant="outlined"
                        sx={{ 
                          borderRadius: 2, 
                          mb: 2,
                          '& .MuiAlert-icon': {
                            alignItems: 'center'
                          }
                        }}
                      >
                        Hiện tại không có cảnh báo học vụ nào. Hãy tiếp tục duy trì kết quả tốt!
                      </Alert>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
                    <Button 
                      variant="text"
                      color="primary"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/academic-warning')}
                      size="small"
                    >
                      Xem chi tiết
                    </Button>
                  </CardActions>
                </StyledCard>
              </Slide>
            </Grid>
            
            {/* Course Registration */}
            <Grid item xs={12} md={6}>
              <Slide direction="up" in={animate} timeout={1100}>
                <StyledCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(25, 118, 210, 0.1)', 
                        color: 'primary.main', 
                        width: 42, 
                        height: 42,
                        mr: 2 
                      }}>
                        <Assignment />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        Đăng ký môn học
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Học kỳ hiện tại:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {academicData?.Semester || 'Học kỳ 1'}, {academicData?.AcademicYear || '2023-2024'}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Tình trạng đăng ký:</Typography>
                        <StatusChip label="Đang mở" status="success" size="small" />
                      </Box>
                      <Divider sx={{ my: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">Thời hạn:</Typography>
                        <Typography variant="body2" fontWeight={500}>30/09/2023</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
                    <GradientButton 
                      variant="contained" 
                      onClick={() => navigate('/course-registration')}
                      endIcon={<ArrowForward />}
                      size="small"
                    >
                      Đăng ký ngay
                    </GradientButton>
                  </CardActions>
                </StyledCard>
              </Slide>
            </Grid>
            
            {/* Tuition */}
            <Grid item xs={12} md={6}>
              <Slide direction="up" in={animate} timeout={1200}>
                <StyledCard sx={{ 
                  borderLeft: tuitionData?.Status === 'Unpaid' ? '4px solid #d32f2f' : undefined
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: tuitionData?.Status === 'Unpaid' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(25, 118, 210, 0.1)', 
                        color: tuitionData?.Status === 'Unpaid' ? '#d32f2f' : 'primary.main', 
                        width: 42, 
                        height: 42,
                        mr: 2
                      }}>
                        <AttachMoney />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        Học phí
                      </Typography>
                    </Box>
                    
                    {tuitionData ? (
                      <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Học kỳ:</Typography>
                          <Typography variant="body2" fontWeight={500}>{tuitionData.SemesterName}</Typography>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Số tiền:</Typography>
                          <Typography variant="body2" fontWeight={600} color="error.main">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tuitionData.FinalAmount)}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Trạng thái:</Typography>
                          <StatusChip 
                            label={tuitionData.Status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'} 
                            status={tuitionData.Status === 'Paid' ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">Hạn nộp:</Typography>
                          <Typography variant="body2" fontWeight={500} color={tuitionData.Status === 'Unpaid' ? 'error.main' : 'text.primary'}>
                            {new Date(tuitionData.DueDate).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Không có thông tin học phí
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
                    <GradientButton
                      variant="contained"
                      onClick={() => navigate('/tuition-payment')}
                      endIcon={<ArrowForward />}
                      size="small"
                      disabled={tuitionData?.Status === 'Paid'}
                    >
                      {tuitionData?.Status === 'Paid' ? 'Xem chi tiết' : 'Thanh toán ngay'}
                    </GradientButton>
                  </CardActions>
                </StyledCard>
              </Slide>
            </Grid>
            
            {/* Today's Schedule */}
            <Grid item xs={12} md={6}>
              <Slide direction="up" in={animate} timeout={1300}>
                <StyledCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(25, 118, 210, 0.1)', 
                        color: 'primary.main', 
                        width: 42, 
                        height: 42,
                        mr: 2 
                      }}>
                        <Schedule />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        Lịch học hôm nay
                      </Typography>
                    </Box>
                    
                    {scheduleData.length > 0 ? (
                      <Box sx={{ mx: -1 }}>
                        {scheduleData.map((item, index) => (
                          <Paper 
                            key={index} 
                            elevation={0} 
                            sx={{ 
                              p: 2, 
                              mb: 1.5, 
                              mx: 1,
                              borderRadius: 3,
                              backgroundColor: 'rgba(25, 118, 210, 0.05)',
                              border: '1px solid rgba(25, 118, 210, 0.1)',
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                              {item.SubjectName}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccessTime fontSize="small" sx={{ color: 'text.secondary', mr: 0.5, fontSize: 16 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {item.StartTime} - {item.EndTime}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Room fontSize="small" sx={{ color: 'text.secondary', mr: 0.5, fontSize: 16 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {item.Location}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        py: 4,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 3
                      }}>
                        <Event sx={{ color: 'text.disabled', fontSize: 40, mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                          Không có lịch học hôm nay
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
                    <Button 
                      variant="text"
                      color="primary"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/class-schedule')}
                    >
                      Xem lịch đầy đủ
                    </Button>
                  </CardActions>
                </StyledCard>
              </Slide>
            </Grid>
            
            {/* Notifications */}
            <Grid item xs={12}>
              <Slide direction="up" in={animate} timeout={1400}>
                <StyledCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(25, 118, 210, 0.1)', 
                        color: 'primary.main', 
                        width: 42, 
                        height: 42,
                        mr: 2 
                      }}>
                        <Notifications />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        Thông báo mới nhất
                      </Typography>
                    </Box>
                    
                    {notificationsData.length > 0 ? (
                      <List sx={{ 
                        width: '100%', 
                        bgcolor: 'background.paper',
                        borderRadius: 3,
                        border: '1px solid rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden'
                      }}>
                        {notificationsData.slice(0, 5).map((notification, index) => (
                          <React.Fragment key={index}>
                            <ListItem 
                              alignItems="flex-start"
                              secondaryAction={
                                <IconButton edge="end" size="small">
                                  <ArrowForward fontSize="small" />
                                </IconButton>
                              }
                              sx={{ 
                                px: 2,
                                py: 1.5,
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.02)'
                                }
                              }}
                            >
                              <Avatar sx={{ 
                                bgcolor: 'primary.main',
                                width: 36, 
                                height: 36, 
                                mr: 2,
                                background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
                              }}>
                                <Bookmark />
                              </Avatar>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {notification.Title}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {new Date(notification.CreatedAt).toLocaleDateString('vi-VN', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            {index < Math.min(notificationsData.length, 5) - 1 && 
                              <Divider component="li" variant="inset" />
                            }
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        py: 4,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 3
                      }}>
                        <Notifications sx={{ color: 'text.disabled', fontSize: 40, mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                          Không có thông báo mới
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
                    <Button 
                      variant="text"
                      color="primary"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/notifications')}
                    >
                      Xem tất cả thông báo
                    </Button>
                  </CardActions>
                </StyledCard>
              </Slide>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 