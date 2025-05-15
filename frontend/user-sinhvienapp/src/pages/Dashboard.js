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
  Skeleton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
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
  Circle,
  Person
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
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [academicData, setAcademicData] = useState(null);
  const [tuitionData, setTuitionData] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);
  const [notificationsData, setNotificationsData] = useState([]);
  
  // Styles matching RetakeRegistration.js
  const styles = {
    root: {
      flexGrow: 1,
      padding: theme.spacing(2)
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(3)
    },
    titleSection: {
      marginBottom: theme.spacing(3)
    },
    tableContainer: {
      marginTop: theme.spacing(3)
    },
    chip: {
      margin: theme.spacing(0.5)
    },
    buttonGroup: {
      marginTop: theme.spacing(3)
    }
  };
  
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
  
  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // Format HH:MM
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusChip = (status) => {
    if (!status) return <Chip size="small" label="N/A" />;
    
    const statusMap = {
      'Unpaid': { color: 'error', label: 'Chưa đóng' },
      'Paid': { color: 'success', label: 'Đã đóng' },
      'Partially Paid': { color: 'warning', label: 'Đóng một phần' },
      'Overdue': { color: 'error', label: 'Quá hạn' },
      'Good Standing': { color: 'success', label: 'Tốt' },
      'Academic Warning': { color: 'warning', label: 'Cảnh báo học vụ' },
      'Academic Probation': { color: 'error', label: 'Quản chế học vụ' }
    };
    
    const statusInfo = statusMap[status] || { color: 'default', label: status };
    return <Chip size="small" color={statusInfo.color} label={statusInfo.label} />;
  };

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
    <div style={styles.root}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Welcome Section */}
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Trang chủ
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Xin chào, {currentUser?.FullName || 'Sinh viên'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Học kỳ hiện tại: {academicData?.Semester || 'N/A'} - {academicData?.AcademicYear || 'N/A'}
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        <Grid container spacing={3}>
          {/* Academic Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Thông tin học tập
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={styles.tableContainer}>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">Điểm trung bình tích lũy</TableCell>
                    <TableCell align="right">{academicData?.CumulativeGPA?.toFixed(2) || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Số tín chỉ đã đạt</TableCell>
                    <TableCell align="right">{academicData?.EarnedCredits || 0}/{academicData?.TotalCredits || 0}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Tình trạng học tập</TableCell>
                    <TableCell align="right">{getStatusChip(academicData?.AcademicStanding)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={styles.buttonGroup}>
              <Button 
                variant="outlined" 
                color="primary" 
                endIcon={<ArrowForward />}
                onClick={() => navigate('/academic-transcript')}
              >
                Xem bảng điểm
              </Button>
            </Box>
          </Grid>

          {/* Tuition Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Thông tin học phí
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={styles.tableContainer}>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">Học kỳ</TableCell>
                    <TableCell align="right">{tuitionData?.SemesterName || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Số tiền</TableCell>
                    <TableCell align="right">{formatCurrency(tuitionData?.FinalAmount || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Trạng thái</TableCell>
                    <TableCell align="right">{getStatusChip(tuitionData?.Status)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Hạn nộp</TableCell>
                    <TableCell align="right">{formatDate(tuitionData?.DueDate)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={styles.buttonGroup}>
              <Button 
                variant="outlined" 
                color="primary" 
                endIcon={<ArrowForward />}
                onClick={() => navigate('/tuition-fees')}
              >
                Xem chi tiết học phí
              </Button>
            </Box>
          </Grid>

          {/* Class Schedule for Today */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Lịch học hôm nay
            </Typography>
            {scheduleData.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={styles.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Môn học</TableCell>
                      <TableCell>Phòng</TableCell>
                      <TableCell>Thời gian</TableCell>
                      <TableCell>Giảng viên</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scheduleData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 30, height: 30, mr: 1, bgcolor: 'primary.main' }}>
                              <School fontSize="small" />
                            </Avatar>
                            <Typography variant="body2">{item.CourseName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Room fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="body2">{item.Room}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTime fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="body2">
                              {formatTime(item.StartTime)} - {formatTime(item.EndTime)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="body2">{item.TeacherName}</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Không có lịch học nào cho hôm nay
              </Alert>
            )}
            <Box sx={styles.buttonGroup}>
              <Button 
                variant="outlined" 
                color="primary" 
                endIcon={<ArrowForward />}
                onClick={() => navigate('/class-schedule')}
              >
                Xem lịch học đầy đủ
              </Button>
            </Box>
          </Grid>

          {/* Notifications */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Thông báo mới
            </Typography>
            {notificationsData.length > 0 ? (
              <List sx={{ mt: 2 }}>
                {notificationsData.slice(0, 5).map((notification, index) => (
                  <React.Fragment key={notification.NotificationID || index}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Circle sx={{ width: 10, height: 10, mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle1">{notification.Title}</Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                              {notification.Content}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {formatDate(notification.CreatedAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < notificationsData.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Không có thông báo mới
              </Alert>
            )}
          </Grid>

          {/* Quick Access Buttons */}
          <Grid item xs={12} sx={styles.buttonGroup}>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Assignment />}
                onClick={() => navigate('/course-registration')}
              >
                Đăng ký môn học
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Event />}
                onClick={() => navigate('/exam-schedule')}
              >
                Lịch thi
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AttachMoney />}
                onClick={() => navigate('/tuition-payment')}
              >
                Thanh toán học phí
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default Dashboard; 