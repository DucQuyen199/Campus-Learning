import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card,
  CardContent,
  Grid,
  Button,
  Container,
  useTheme,
  useMediaQuery,
  Avatar,
  CircularProgress,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Flag as FlagIcon,
  Dashboard as DashboardIcon,
  ArrowForward as ArrowForwardIcon,
  AccessTime as ClockIcon,
  Notifications as NotificationsIcon,
  HelpOutline as HelpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../api';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const FeatureCard = ({ title, icon, description, color, route }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        borderRadius: 4,
        boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s, box-shadow 0.3s',
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 50px -15px rgba(0,0,0,0.2)'
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '5px',
          backgroundColor: color,
          zIndex: 1
        }
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: `${color}15`, 
              color: color,
              width: 48, 
              height: 48,
              mr: 2
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="h6" component="div" fontWeight="600">
            {title}
          </Typography>
        </Box>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 'auto', 
            minHeight: '3em',
            lineHeight: 1.6
          }}
        >
          {description}
        </Typography>
        <Button 
          variant="text" 
          endIcon={<ArrowForwardIcon />}
          href={route}
          sx={{ 
            mt: 2, 
            color: color, 
            justifyContent: 'flex-start',
            p: 0,
            fontWeight: 500,
            '&:hover': { 
              bgcolor: 'transparent',
              transform: 'translateX(5px)'
            }
          }}
        >
          Truy cập quản lý
        </Button>
      </CardContent>
    </Card>
  );
};

const StatusCard = ({ title, value, icon, color, loading }) => {
  return (
    <Card sx={{ 
      borderRadius: 4, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
      overflow: 'hidden',
      backgroundColor: color,
      color: 'white',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <Box sx={{ 
        position: 'absolute', 
        top: '-20px', 
        right: '-20px', 
        borderRadius: '50%',
        width: '100px',
        height: '100px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        zIndex: 0
      }} />
      <Box sx={{ 
        position: 'absolute', 
        bottom: '-10px', 
        left: '-10px', 
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        zIndex: 0
      }} />
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ mr: 2 }}>
            {icon}
          </Box>
          <Typography variant="body2" fontWeight="medium" sx={{ opacity: 0.9 }}>
            {title}
          </Typography>
        </Box>
        {loading ? (
          <Skeleton 
            variant="text" 
            width="60%" 
            height={50}
            sx={{ 
              mt: 2, 
              backgroundColor: 'rgba(255,255,255,0.2)' 
            }} 
          />
        ) : (
          <Typography variant="h4" fontWeight="bold" sx={{ mt: 2 }}>
            {value}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const ActivityItem = ({ activity }) => {
  // Format time to display how long ago
  const getTimeAgo = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true,
        locale: vi 
      });
    } catch (error) {
      return 'Không xác định';
    }
  };

  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'user_registration':
        return <PersonIcon />;
      case 'course_enrollment':
        return <SchoolIcon />;
      case 'event_registration':
        return <EventIcon />;
      default:
        return <DashboardIcon />;
    }
  };

  // Get color for activity type
  const getActivityColor = (type) => {
    switch (type.toLowerCase()) {
      case 'user_registration':
        return '#3f51b5';
      case 'course_enrollment':
        return '#f44336';
      case 'event_registration':
        return '#ff9800';
      default:
        return '#4caf50';
    }
  };

  return (
    <>
      <ListItem alignItems="flex-start">
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: getActivityColor(activity.type) }}>
            {getActivityIcon(activity.type)}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="body1" fontWeight="medium">
              {activity.name}
            </Typography>
          }
          secondary={
            <>
              <Typography variant="body2" color="text.secondary" component="span">
                {activity.description}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5 }}>
                {getTimeAgo(activity.timestamp)}
              </Typography>
            </>
          }
        />
      </ListItem>
      <Divider variant="inset" component="li" />
    </>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const userName = currentUser?.FullName || 'Quản trị viên';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for dashboard data
  const [stats, setStats] = useState({
    userStats: null,
    courseStats: null,
    eventStats: null,
    reportStats: null
  });
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    
    if (hours < 12) return 'buổi sáng';
    if (hours < 18) return 'buổi chiều';
    return 'buổi tối';
  };

  // Format current date
  const formatDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('vi-VN', options);
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch dashboard stats
      const [statsResponse, activitiesResponse, notificationsResponse] = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(),
        dashboardAPI.getSystemNotifications()
      ]);
      
      // Handle stats response
      if (statsResponse.status === 'fulfilled' && statsResponse.value?.data) {
        setStats(statsResponse.value.data);
      } else {
        console.error('Stats API error:', statsResponse.reason);
      }
      
      // Handle activities response
      if (activitiesResponse.status === 'fulfilled' && activitiesResponse.value?.data) {
        console.log('Activities response:', activitiesResponse.value.data);
        setActivities(Array.isArray(activitiesResponse.value.data) 
          ? activitiesResponse.value.data 
          : activitiesResponse.value.data.recentActivities || []);
      } else {
        console.error('Activities API error:', activitiesResponse.reason);
      }
      
      // Handle notifications response
      if (notificationsResponse.status === 'fulfilled' && notificationsResponse.value?.data) {
        console.log('Notifications response:', notificationsResponse.value.data);
        setNotifications(Array.isArray(notificationsResponse.value.data)
          ? notificationsResponse.value.data
          : notificationsResponse.value.data.notifications || []);
      } else {
        console.error('Notifications API error:', notificationsResponse.reason);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Không thể lấy dữ liệu từ máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Refresh dashboard data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'rgb(245, 247, 250)',
      p: 2
    }}>
      {/* Error alert if there's an error */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 3, md: 4 }, 
          mb: 3, 
          borderRadius: 4,
          background: 'linear-gradient(120deg, #3f51b5 0%, #2196f3 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: '-50px', 
          right: '-50px', 
          width: '200px', 
          height: '200px', 
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)'
        }} />
        <Box sx={{ 
          position: 'absolute', 
          bottom: '-30px', 
          left: '30%', 
          width: '100px', 
          height: '100px', 
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)'
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ClockIcon sx={{ mr: 1, fontSize: 20, opacity: 0.8 }} />
            <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'capitalize' }}>
              {formatDate()}
            </Typography>
          </Box>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Chào {getCurrentTime()}, {userName}!
          </Typography>
          <Typography variant="subtitle1" sx={{ maxWidth: '650px', lineHeight: 1.6 }}>
            Chào mừng bạn trở lại với hệ thống quản lý Campus HUBT. Từ đây, bạn có thể quản lý mọi hoạt động của hệ thống. Hãy chọn một trong các tính năng dưới đây để bắt đầu.
          </Typography>
        </Box>
      </Paper>

      {/* Quick Stats Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <StatusCard 
            title="Người dùng hoạt động" 
            value={stats.userStats?.activeUsers || '0'} 
            icon={<PersonIcon fontSize="large" />} 
            color="#3f51b5" 
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatusCard 
            title="Khóa học đang diễn ra" 
            value={stats.courseStats?.publishedCourses || '0'} 
            icon={<SchoolIcon fontSize="large" />} 
            color="#f44336" 
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatusCard 
            title="Sự kiện sắp tới" 
            value={stats.eventStats?.upcomingEvents || '0'} 
            icon={<EventIcon fontSize="large" />} 
            color="#ff9800" 
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatusCard 
            title="Báo cáo chờ xử lý" 
            value={stats.reportStats?.pendingReports || '0'} 
            icon={<FlagIcon fontSize="large" />} 
            color="#4caf50" 
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Main Features */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, pl: 1 }}>
        Quản lý hệ thống
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <FeatureCard 
            title="Quản lý người dùng" 
            icon={<PersonIcon />} 
            description="Quản lý tài khoản người dùng, phân quyền và theo dõi hoạt động của người dùng." 
            color="#3f51b5"
            route="/users/management"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <FeatureCard 
            title="Quản lý khóa học" 
            icon={<SchoolIcon />} 
            description="Tạo và quản lý các khóa học, nội dung học tập và hoạt động học tập." 
            color="#f44336"
            route="/courses"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <FeatureCard 
            title="Quản lý sự kiện" 
            icon={<EventIcon />} 
            description="Tạo và quản lý các sự kiện, cuộc thi và hoạt động ngoại khóa." 
            color="#ff9800"
            route="/events"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <FeatureCard 
            title="Quản lý báo cáo" 
            icon={<FlagIcon />} 
            description="Xem và xử lý các báo cáo vi phạm từ người dùng trong hệ thống." 
            color="#4caf50"
            route="/reports/management"
          />
        </Grid>
      </Grid>

      {/* Recent Activities Section */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: 4, 
            height: '100%', 
            minHeight: '60vh',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DashboardIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">Hoạt động gần đây</Typography>
              </Box>
              <IconButton size="small" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <CircularProgress size={20} thickness={4} />
                ) : (
                  <RefreshIcon />
                )}
              </IconButton>
            </Box>
            
            {loading ? (
              <Box sx={{ p: 2 }}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <Box key={item} sx={{ display: 'flex', mb: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                    <Box sx={{ width: '100%' }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : activities && activities.length > 0 ? (
              <List sx={{ p: 0 }}>
                {activities.slice(0, 10).map((activity, index) => (
                  <ActivityItem key={index} activity={activity} />
                ))}
              </List>
            ) : (
              <Box sx={{ 
                p: 4, 
                textAlign: 'center', 
                borderRadius: 2, 
                bgcolor: 'rgba(0,0,0,0.02)', 
                border: '1px dashed rgba(0,0,0,0.1)'
              }}>
                <Box sx={{ mb: 2, opacity: 0.7 }}>
                  <DashboardIcon sx={{ fontSize: 50 }} />
                </Box>
                <Typography variant="body1" fontWeight="medium">
                  Không có hoạt động nào gần đây
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Các hoạt động sẽ xuất hiện khi người dùng tương tác với hệ thống
                </Typography>
                <Button variant="outlined" onClick={handleRefresh} disabled={refreshing}>
                  {refreshing ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Help Section */}
      <Paper 
        sx={{ 
          p: 3, 
          mt: 3, 
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          bgcolor: 'rgba(33, 150, 243, 0.05)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'info.light', mr: 2 }}>
            <HelpIcon />
          </Avatar>
          <Box>
            <Typography variant="body1" fontWeight="medium">
              Cần trợ giúp với hệ thống quản lý?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Xem hướng dẫn chi tiết hoặc liên hệ với bộ phận hỗ trợ
            </Typography>
          </Box>
        </Box>
        <Button 
          variant="outlined" 
          color="info" 
          sx={{ mt: { xs: 2, sm: 0 }, borderRadius: 8, px: 3 }}
        >
          Xem hướng dẫn
        </Button>
      </Paper>
    </Box>
  );
};

export default Dashboard; 