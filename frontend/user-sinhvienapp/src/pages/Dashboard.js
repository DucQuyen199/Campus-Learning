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
  Slide
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
  Timeline
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5008/api';

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
    }, 100);
    
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
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);
  
  // Loading state
  if (loading) {
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100%',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body1" color="text.secondary">
          Đang tải dữ liệu...
        </Typography>
      </Container>
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
    if (value >= 3.5) return 'success';
    if (value >= 2.5) return 'info';
    if (value >= 1.5) return 'warning';
    return 'error';
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Welcome Section */}
      <Fade in={animate} timeout={800}>
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 3, md: 4 }, 
            mb: 4, 
            borderRadius: 3,
            backgroundImage: 'linear-gradient(to right, rgba(236, 240, 253, 0.8), rgba(252, 245, 237, 0.8))',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Box sx={{ position: 'absolute', top: -15, right: -15, opacity: 0.05, transform: 'rotate(10deg)' }}>
            <DashboardIcon sx={{ fontSize: 180 }} />
          </Box>
          
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            Xin chào, {currentUser?.FullName || 'Sinh viên'}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            Học kỳ hiện tại: <b>{academicData?.Semester || 'Học kỳ 1'}, {academicData?.AcademicYear || '2023-2024'}</b>
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <School sx={{ color: 'primary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Điểm GPA</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight="bold">{academicData?.CumulativeGPA || '0.0'}</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(academicData?.CumulativeGPA / 4) * 100 || 0}
                      color={getProgressColor(academicData?.CumulativeGPA || 0)}
                      sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TrendingUp sx={{ color: 'primary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Tín chỉ tích lũy</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {academicData?.EarnedCredits || '0'}/{academicData?.TotalCredits || '120'}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(academicData?.EarnedCredits / academicData?.TotalCredits) * 100 || 0}
                      color="info"
                      sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Timeline sx={{ color: 'primary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Trạng thái học tập</Typography>
                  <Typography variant="h6" fontWeight="bold" color={academicData?.AcademicStanding === 'Good Standing' ? 'success.main' : 'warning.main'}>
                    {academicData?.AcademicStanding === 'Good Standing' ? 'Đạt yêu cầu' : 'Cảnh báo học vụ'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      <Grid container spacing={3}>
        {/* Quick Links Section */}
        {!isMobile && (
          <Grid item xs={12} md={3}>
            <Slide direction="right" in={animate} timeout={800}>
              <Card sx={{ 
                height: '100%', 
                borderRadius: 3, 
                boxShadow: 'none', 
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    Truy cập nhanh
                  </Typography>
                  <List disablePadding>
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        size="small"
                        color="primary"
                        onClick={() => navigate('/course-registration')}
                        startIcon={<Assignment />}
                        sx={{ 
                          justifyContent: 'flex-start', 
                          borderRadius: 2,
                          py: 1
                        }}
                      >
                        Đăng ký học
                      </Button>
                    </ListItem>
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        size="small"
                        color="primary"
                        onClick={() => navigate('/academic-transcript')}
                        startIcon={<School />}
                        sx={{ 
                          justifyContent: 'flex-start', 
                          borderRadius: 2,
                          py: 1
                        }}
                      >
                        Xem điểm
                      </Button>
                    </ListItem>
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        size="small"
                        color="primary"
                        onClick={() => navigate('/tuition-payment')}
                        startIcon={<AttachMoney />}
                        sx={{ 
                          justifyContent: 'flex-start', 
                          borderRadius: 2,
                          py: 1
                        }}
                      >
                        Thanh toán học phí
                      </Button>
                    </ListItem>
                    <ListItem disablePadding>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        size="small"
                        color="primary"
                        onClick={() => navigate('/class-schedule')}
                        startIcon={<Schedule />}
                        sx={{ 
                          justifyContent: 'flex-start', 
                          borderRadius: 2,
                          py: 1
                        }}
                      >
                        Lịch học
                      </Button>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Slide>
          </Grid>
        )}
        
        {/* Main Dashboard Content */}
        <Grid item xs={12} md={isMobile ? 12 : 9}>
          <Grid container spacing={3}>
            {/* Academic Warning */}
            <Grid item xs={12} md={6}>
              <Slide direction="up" in={animate} timeout={900}>
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: 'none', 
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)',
                  }
                }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Warning sx={{ fontSize: 24, mr: 1, color: 'warning.main' }} />
                      <Typography variant="h6">
                        Cảnh báo học vụ
                      </Typography>
                    </Box>
                    
                    {/* Show warning or safe status */}
                    {academicData && academicData.AcademicStanding !== 'Good Standing' ? (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        Bạn đang có cảnh báo học vụ. Vui lòng kiểm tra chi tiết.
                      </Alert>
                    ) : (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Không có cảnh báo học vụ nào.
                      </Alert>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    <Button 
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/academic-warning')}
                      size="small"
                    >
                      Chi tiết
                    </Button>
                  </CardActions>
                </Card>
              </Slide>
            </Grid>
            
            {/* Course Registration */}
            <Grid item xs={12} md={6}>
              <Slide direction="up" in={animate} timeout={1000}>
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: 'none', 
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)',
                  }
                }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Assignment sx={{ fontSize: 24, mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Đăng ký môn học
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <b>Học kỳ hiện tại:</b> {academicData?.Semester || 'Học kỳ 1'}, {academicData?.AcademicYear || '2023-2024'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <b>Tình trạng đăng ký:</b> <span style={{ color: '#2e7d32' }}>Đang mở</span>
                      </Typography>
                      <Typography variant="body2">
                        <b>Thời hạn:</b> 30/09/2023
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    <Button 
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/course-registration')}
                      size="small"
                    >
                      Đăng ký ngay
                    </Button>
                  </CardActions>
                </Card>
              </Slide>
            </Grid>
            
            {/* Tuition */}
            <Grid item xs={12} md={6}>
              <Slide direction="up" in={animate} timeout={1100}>
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: 'none', 
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)',
                  }
                }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AttachMoney sx={{ fontSize: 24, mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Học phí
                      </Typography>
                    </Box>
                    
                    {tuitionData ? (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <b>Học kỳ:</b> {tuitionData.SemesterName}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <b>Số tiền:</b> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tuitionData.FinalAmount)}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <b>Trạng thái:</b> <span style={{ color: tuitionData.Status === 'Paid' ? '#2e7d32' : '#d32f2f' }}>
                            {tuitionData.Status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </Typography>
                        <Typography variant="body2">
                          <b>Hạn nộp:</b> {new Date(tuitionData.DueDate).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Không có thông tin học phí
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    <Button 
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/tuition-payment')}
                      size="small"
                    >
                      Thanh toán
                    </Button>
                  </CardActions>
                </Card>
              </Slide>
            </Grid>
            
            {/* Today's Schedule */}
            <Grid item xs={12} md={6}>
              <Slide direction="up" in={animate} timeout={1200}>
                <Card sx={{ 
                  borderRadius: 3,
                  boxShadow: 'none', 
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)',
                  }
                }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Schedule sx={{ fontSize: 24, mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Lịch học hôm nay
                      </Typography>
                    </Box>
                    
                    {scheduleData.length > 0 ? (
                      <List dense sx={{ mb: 1 }}>
                        {scheduleData.map((item, index) => (
                          <React.Fragment key={index}>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemText
                                primary={item.SubjectName}
                                secondary={`${item.StartTime} - ${item.EndTime} | ${item.Location}`}
                              />
                            </ListItem>
                            {index < scheduleData.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Không có lịch học hôm nay
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    <Button 
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/class-schedule')}
                      size="small"
                    >
                      Xem lịch
                    </Button>
                  </CardActions>
                </Card>
              </Slide>
            </Grid>
            
            {/* Notifications */}
            <Grid item xs={12}>
              <Slide direction="up" in={animate} timeout={1300}>
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: 'none', 
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Notifications sx={{ fontSize: 24, mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        Thông báo
                      </Typography>
                    </Box>
                    
                    {notificationsData.length > 0 ? (
                      <List dense>
                        {notificationsData.slice(0, 5).map((notification, index) => (
                          <React.Fragment key={index}>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemText
                                primary={notification.Title}
                                secondary={new Date(notification.CreatedAt).toLocaleDateString('vi-VN')}
                              />
                            </ListItem>
                            {index < Math.min(notificationsData.length, 5) - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Không có thông báo mới
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Slide>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 