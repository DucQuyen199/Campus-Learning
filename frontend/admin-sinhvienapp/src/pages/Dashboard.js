import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
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
} from '@mui/material';
import {
  Person,
  School,
  Book,
  CalendarMonth,
  TrendingUp,
  Assignment,
  PeopleAlt,
  Paid,
  Warning,
} from '@mui/icons-material';
import { studentsService, academicService } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';

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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    programs: 0,
    subjects: 0,
    currentSemester: '',
  });
  const [recentActions, setRecentActions] = useState([]);
  
  // Simulated data fetch, replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulate API call delay
        setTimeout(() => {
          setStats({
            totalStudents: 1523,
            activeStudents: 1498,
            programs: 24,
            subjects: 347,
            currentSemester: 'Học kỳ 2, 2023-2024',
          });
          
          setRecentActions([
            { id: 1, type: 'student_created', user: 'Admin', content: 'Tạo tài khoản sinh viên mới', time: '15 phút trước' },
            { id: 2, type: 'grade_updated', user: 'Admin', content: 'Cập nhật điểm học phần CS101', time: '30 phút trước' },
            { id: 3, type: 'program_updated', user: 'Admin', content: 'Cập nhật chương trình CNTT', time: '1 giờ trước' },
            { id: 4, type: 'semester_created', user: 'Admin', content: 'Tạo học kỳ mới', time: '2 giờ trước' },
            { id: 5, type: 'student_updated', user: 'Admin', content: 'Cập nhật thông tin sinh viên', time: '1 ngày trước' },
          ]);
          
          setLoading(false);
        }, 1200);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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
    };
    return types[type] || 'Cảnh báo';
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
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
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {stats.currentSemester}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Thời gian: 01/02/2024 - 31/05/2024
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Đăng ký học phần:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>
                    Đang mở
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Tuần học hiện tại:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Tuần 8/15</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Trạng thái:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                    Đang diễn ra
                  </Typography>
                </Box>
              </Stack>
              
              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 3 }}
                startIcon={<CalendarMonth />}
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
                {recentActions.map((action) => (
                  <ListItem
                    key={action.id}
                    divider={action.id !== recentActions.length}
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
                ))}
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
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <List disablePadding>
                  {/* Sample data, should be replaced with real API data */}
                  {[
                    { id: 1, studentName: 'Nguyễn Văn A', studentCode: 'SV001', type: 'academic_performance', created: '2 ngày trước' },
                    { id: 2, studentName: 'Trần Thị B', studentCode: 'SV045', type: 'attendance', created: '3 ngày trước' },
                    { id: 3, studentName: 'Lê Văn C', studentCode: 'SV112', type: 'tuition', created: '1 tuần trước' },
                    { id: 4, studentName: 'Phạm Thị D', studentCode: 'SV078', type: 'conduct', created: '1 tuần trước' },
                  ].map((warning, index, array) => (
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
                  ))}
                </List>
              )}

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
    </Box>
  );
};

export default Dashboard; 