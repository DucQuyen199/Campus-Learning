/*-----------------------------------------------------------------
* File: Dashboard.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
// eslint-disable-next-line no-unused-vars
  Book,
  CalendarMonth,
// eslint-disable-next-line no-unused-vars
  PeopleAlt,
  Assignment,
// eslint-disable-next-line no-unused-vars
  Warning,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageContainer from '../components/layout/PageContainer';
import { academicService, studentsService } from '../services/api';
// eslint-disable-next-line no-unused-vars
import { formatDistanceToNow } from 'date-fns';
// eslint-disable-next-line no-unused-vars
import { vi } from 'date-fns/locale';
import { alpha } from '@mui/material/styles';

// eslint-disable-next-line no-unused-vars
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
// eslint-disable-next-line no-unused-vars
  const [warnings, setWarnings] = useState([]);
// eslint-disable-next-line no-unused-vars
  const [students, setStudents] = useState([]);
  
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
          // Fetch all students for display using direct endpoint
          const studentsResponse = await studentsService.getAllStudentsDirect();
          if (studentsResponse && studentsResponse.success) {
            setStudents(studentsResponse.data);
          } else {
            console.error('Failed to fetch students:', studentsResponse?.message);
          }
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
  
// eslint-disable-next-line no-unused-vars
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
    <PageContainer fullHeight noPadding>
      <Box sx={{ backgroundColor: '#f5f7fa', flexGrow: 1, p: { xs: 2, md: 4 } }}>
        {/* Welcome Section */}
        <Card sx={{ mb: 4, p: 4, borderRadius: 4, color: '#fff', background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#fff' }}>
                {getCurrentTime()}, {currentUser?.name || 'Quản trị viên'}
              </Typography>
              <Typography variant="body1" sx={{ color: '#e0e0e0' }}>
                {getFormattedDate()}
              </Typography>
            </Box>
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: alpha('#fff', 0.2),
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            >
              {currentUser?.name?.charAt(0) || 'A'}
            </Avatar>
          </Box>
        </Card>
        
        
        {/* Main Content */}
        <Grid container spacing={4} justifyContent="center">
          {/* Current Semester */}
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
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
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard; 
