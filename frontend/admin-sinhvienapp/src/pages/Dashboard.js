import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import {
  Person,
  School,
  Book,
  CalendarMonth,
  PeopleAlt,
  Assignment,
  Warning,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageContainer from '../components/layout/PageContainer';
import { academicService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const StatCard = ({ icon, title, value, color, bgColor }) => {
  return (
    <Card sx={{ 
      height: '100%', 
      boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
      borderRadius: 3,
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        width: '30%',
        height: '100%',
        background: `linear-gradient(to right, transparent, ${bgColor}40)`,
        zIndex: 0,
      }
    }}>
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight={600}>
              {value}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: bgColor,
              width: 56,
              height: 56,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    programs: 0,
    subjects: 0,
    currentSemester: null,
  });
  const [recentActions, setRecentActions] = useState([]);
  const [warnings, setWarnings] = useState([]);
  
  // Fetch dashboard data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await academicService.getDashboardStats();
        
        if (response && response.success) {
          const { students, programs, subjects, currentSemester, recentActivities, warnings } = response.data;
          
          setStats({
            totalStudents: students.total,
            activeStudents: students.active,
            programs: programs,
            subjects: subjects,
            currentSemester: currentSemester,
          });
          
          setRecentActions(recentActivities);
          setWarnings(warnings || []);
        } else {
          throw new Error(response?.message || 'Không thể tải dữ liệu thống kê');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Get formatted time for display
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    
    if (hours < 12) {
      return 'Chào buổi sáng';
    } else if (hours < 18) {
      return 'Chào buổi chiều';
    } else {
      return 'Chào buổi tối';
    }
  };
  
  // Get formatted date
  const getFormattedDate = () => {
    return new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format semester date range
  const formatSemesterDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };
  
  // Generate avatar for action types
  const getActionAvatar = (type) => {
    const avatars = {
      student_created: <Person />,
      grade_updated: <Assignment />,
      program_updated: <School />,
      semester_created: <CalendarMonth />,
      student_updated: <Person />,
    };
    
    const colors = {
      student_created: 'primary.main',
      grade_updated: 'success.main',
      program_updated: 'secondary.main',
      semester_created: 'info.main',
      student_updated: 'warning.main',
    };
    
    return (
      <Avatar sx={{ bgcolor: colors[type] }}>
        {avatars[type] || <Person />}
      </Avatar>
    );
  };
  
  const getWarningTypeLabel = (type) => {
    const types = {
      academic_performance: 'Kết quả học tập kém',
      attendance: 'Vắng mặt quá nhiều',
      conduct: 'Vi phạm quy chế',
      tuition: 'Chưa đóng học phí',
      other: 'Lý do khác',
      Level1: 'Cảnh báo mức 1',
      Level2: 'Cảnh báo mức 2',
      Level3: 'Cảnh báo mức 3',
      Suspension: 'Đình chỉ học tập',
    };
    return types[type] || 'Cảnh báo';
  };
  
  if (loading) {
    return (
      <PageContainer fullHeight>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Tải lại trang
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Welcome Section */}
      <Card sx={{ mb: 4, p: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              {getCurrentTime()}, {currentUser?.name || 'Quản trị viên'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {getFormattedDate()}
            </Typography>
          </Box>
          <Avatar 
            sx={{ 
              width: 64, 
              height: 64, 
              bgcolor: 'primary.main',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            {currentUser?.name?.charAt(0) || 'A'}
          </Avatar>
        </Box>
      </Card>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.secondary' }}>
          Tổng quan hệ thống quản lý sinh viên
        </Typography>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<PeopleAlt />}
            title="Tổng sinh viên"
            value={stats.totalStudents}
            color="primary.main"
            bgColor="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Person />}
            title="Sinh viên đang học"
            value={stats.activeStudents}
            color="success.main"
            bgColor="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<School />}
            title="Chương trình đào tạo"
            value={stats.programs}
            color="secondary.main"
            bgColor="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Book />}
            title="Môn học"
            value={stats.subjects}
            color="warning.main"
            bgColor="#ed6c02"
          />
        </Grid>
      </Grid>
      
      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Current Period */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ 
            height: '100%', 
            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
            borderRadius: 3 
          }}>
            <CardHeader 
              title="Thông tin học kỳ hiện tại" 
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} 
            />
            <Divider />
            <CardContent>
              {stats.currentSemester ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {stats.currentSemester.SemesterName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Thời gian: {formatSemesterDateRange(stats.currentSemester.StartDate, stats.currentSemester.EndDate)}
                    </Typography>
                  </Box>
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Đăng ký học phần:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 
                        stats.currentSemester.RegistrationStartDate && 
                        new Date(stats.currentSemester.RegistrationStartDate) <= new Date() && 
                        new Date(stats.currentSemester.RegistrationEndDate) >= new Date() 
                          ? 'success.main' 
                          : 'text.secondary'
                      }}>
                        {stats.currentSemester.RegistrationStartDate && 
                         new Date(stats.currentSemester.RegistrationStartDate) <= new Date() && 
                         new Date(stats.currentSemester.RegistrationEndDate) >= new Date() 
                          ? 'Đang mở'
                          : 'Đã đóng'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Tuần học hiện tại:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {(() => {
                          const startDate = new Date(stats.currentSemester.StartDate);
                          const now = new Date();
                          const diffTime = Math.abs(now - startDate);
                          const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
                          
                          const endDate = new Date(stats.currentSemester.EndDate);
                          const totalWeeks = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24 * 7));
                          
                          return `Tuần ${diffWeeks > totalWeeks ? totalWeeks : diffWeeks}/${totalWeeks}`;
                        })()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Trạng thái:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                        {stats.currentSemester.Status === 'Ongoing' ? 'Đang diễn ra' : 
                         stats.currentSemester.Status === 'Upcoming' ? 'Sắp tới' :
                         stats.currentSemester.Status === 'Completed' ? 'Đã kết thúc' : 
                         stats.currentSemester.Status === 'Cancelled' ? 'Đã hủy' : 'Không xác định'}
                      </Typography>
                    </Box>
                  </Stack>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">Không có học kỳ hiện tại</Typography>
                </Box>
              )}
              
              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 3 }}
                startIcon={<CalendarMonth />}
                component={RouterLink}
                to="/academic/semesters"
              >
                Quản lý học kỳ
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ 
            height: '100%', 
            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
            borderRadius: 3 
          }}>
            <CardHeader 
              title="Hoạt động gần đây" 
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              action={
                <Button size="small" color="primary">
                  Xem tất cả
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <List>
                {recentActions.length > 0 ? (
                  recentActions.map((action) => (
                    <ListItem
                      key={action.id}
                      divider={action.id !== recentActions[recentActions.length - 1].id}
                      sx={{ px: 1, py: 1.5 }}
                    >
                      <ListItemAvatar>
                        {getActionAvatar(action.type)}
                      </ListItemAvatar>
                      <ListItemText
                        primary={action.content}
                        secondary={`${action.user} - ${action.time}`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color="text.secondary">Không có hoạt động gần đây</Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Warnings */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ 
            height: '100%', 
            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
            borderRadius: 3 
          }}>
            <CardHeader 
              title="Cảnh báo học tập" 
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              action={
                <Button 
                  size="small" 
                  color="primary"
                  component={RouterLink}
                  to="/academic/warnings"
                >
                  Xem tất cả
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <List disablePadding>
                {warnings.length > 0 ? (
                  warnings.map((warning, index, array) => (
                    <ListItem
                      key={warning.id}
                      divider={index !== array.length - 1}
                      sx={{ px: 1, py: 1.5 }}
                      component={RouterLink}
                      to={`/academic/warnings/${warning.id}`}
                      button
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'error.main' }}>
                          <Warning />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${warning.studentCode} - ${warning.studentName}`}
                        secondary={`${getWarningTypeLabel(warning.type)} - ${warning.created}`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color="text.secondary">Không có cảnh báo học tập</Typography>
                  </Box>
                )}
              </List>

              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
                startIcon={<Warning />}
                component={RouterLink}
                to="/academic/warnings/add"
              >
                Thêm cảnh báo mới
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Dashboard; 