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
  Alert
} from '@mui/material';
import {
  School,
  Warning,
  Assignment,
  AttachMoney,
  Schedule,
  Notifications
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5008/api';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [academicData, setAcademicData] = useState(null);
  const [tuitionData, setTuitionData] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);
  const [notificationsData, setNotificationsData] = useState([]);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch academic data
        const academicRes = await axios.get(`${API_URL}/academic/metrics/${currentUser.UserID}`);
        setAcademicData(academicRes.data[0] || null);
        
        // Fetch tuition data
        const tuitionRes = await axios.get(`${API_URL}/tuition/current/${currentUser.UserID}`);
        setTuitionData(tuitionRes.data || null);
        
        // Fetch schedule for today
        const today = new Date().toISOString().split('T')[0];
        const scheduleRes = await axios.get(
          `${API_URL}/schedule/day/${currentUser.UserID}?date=${today}`
        );
        setScheduleData(scheduleRes.data || []);
        
        // Fetch notifications
        const notifRes = await axios.get(`${API_URL}/notifications/${currentUser.UserID}`);
        setNotificationsData(notifRes.data || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
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
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ 
      mt: 4, 
      mb: 4, 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      padding: { xs: 2, sm: 3 },
      boxSizing: 'border-box' 
    }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Welcome Card */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5">
          Xin chào, {currentUser?.FullName || 'Sinh viên'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Chào mừng bạn đến với hệ thống quản lý sinh viên. Dưới đây là tóm tắt thông tin học tập của bạn.
        </Typography>
      </Paper>
      
      <Grid container spacing={3}>
        {/* Academic Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <School sx={{ fontSize: 30, mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Tình trạng học tập
                </Typography>
              </Box>
              
              {academicData ? (
                <>
                  <Typography variant="body2" gutterBottom>
                    GPA hiện tại: <strong>{academicData.CumulativeGPA}</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Số tín chỉ tích lũy: <strong>{academicData.EarnedCredits}/{academicData.TotalCredits}</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Xếp loại: <strong>{academicData.AcademicStanding}</strong>
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Không có dữ liệu học tập
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/academic-transcript')}
              >
                Xem điểm học tập
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Academic Warnings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ fontSize: 30, mr: 1, color: 'error.main' }} />
                <Typography variant="h6">
                  Cảnh báo học vụ
                </Typography>
              </Box>
              
              {/* Show warning or safe status */}
              {academicData && academicData.AcademicStanding !== 'Good Standing' ? (
                <Alert severity="warning">
                  Bạn đang có cảnh báo học vụ. Vui lòng kiểm tra chi tiết.
                </Alert>
              ) : (
                <Alert severity="success">
                  Không có cảnh báo học vụ nào.
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/academic-warning')}
              >
                Chi tiết
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Course Registration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment sx={{ fontSize: 30, mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Đăng ký học
                </Typography>
              </Box>
              
              <Typography variant="body2" gutterBottom>
                Học kỳ hiện tại: <strong>2023-2024 Học kỳ 1</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Tình trạng đăng ký: <strong>Đang mở</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Thời hạn: <strong>30/09/2023</strong>
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/course-registration')}
              >
                Đăng ký học
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Tuition */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ fontSize: 30, mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Học phí
                </Typography>
              </Box>
              
              {tuitionData ? (
                <>
                  <Typography variant="body2" gutterBottom>
                    Học kỳ: <strong>{tuitionData.SemesterName}</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Số tiền: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tuitionData.FinalAmount)}</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Trạng thái: <strong>{tuitionData.Status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Hạn nộp: <strong>{new Date(tuitionData.DueDate).toLocaleDateString('vi-VN')}</strong>
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Không có thông tin học phí
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/tuition-payment')}
              >
                Thanh toán
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Today's Schedule */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ fontSize: 30, mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Lịch học hôm nay
                </Typography>
              </Box>
              
              {scheduleData.length > 0 ? (
                <List dense>
                  {scheduleData.map((item, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
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
                <Typography variant="body2" color="text.secondary">
                  Không có lịch học hôm nay
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                onClick={() => navigate('/class-schedule')}
              >
                Xem lịch học
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Notifications sx={{ fontSize: 30, mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Thông báo
                </Typography>
              </Box>
              
              {notificationsData.length > 0 ? (
                <List dense>
                  {notificationsData.slice(0, 5).map((notification, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
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
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 