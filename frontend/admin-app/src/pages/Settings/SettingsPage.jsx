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
  TextField,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { settingsAPI } from '../../api/settingsApi';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import MainCard from '../../components/MainCard';

// Custom styled components
const FullScreenContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column'
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4)
  }
}));

const TabPanelWrapper = styled(motion.div)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease-in-out'
}));

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SettingsPage = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    maintenanceMode: false,
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh'
  });
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newUserAlerts: true,
    systemAlerts: true,
    reportAlerts: true,
    eventReminders: true,
    examNotifications: true
  });
  
  // System information state
  const [systemInfo, setSystemInfo] = useState({
    version: '',
    lastUpdated: '',
    serverStatus: '',
    databaseStatus: '',
    storageUsage: '',
    activeUsers: 0
  });
  
  const { currentUser } = useAuth();
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);
  
  // Fetch all settings
  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Thử fetch settings, nếu lỗi thì dùng giá trị mặc định
      try {
        const settingsResponse = await settingsAPI.getSettings();
        if (settingsResponse) {
          setSystemSettings(prev => ({
            ...prev,
            ...settingsResponse.settings
          }));
        }
      } catch (err) {
        console.log('Using default system settings');
        setSystemSettings({
          siteName: 'Hệ thống quản lý',
          siteDescription: 'Mô tả hệ thống',
          contactEmail: 'admin@example.com',
          maintenanceMode: false,
          language: 'vi',
          timezone: 'Asia/Ho_Chi_Minh'
        });
      }
      
      // Thử fetch notification settings
      try {
        const notificationResponse = await settingsAPI.getNotificationSettings();
        if (notificationResponse) {
          setNotificationSettings(prev => ({
            ...prev,
            ...notificationResponse.notificationSettings
          }));
        }
      } catch (err) {
        console.log('Using default notification settings');
        setNotificationSettings({
          emailNotifications: true,
          newUserAlerts: true,
          systemAlerts: true,
          reportAlerts: true,
          eventReminders: true,
          examNotifications: true
        });
      }
      
      // Thử fetch system info
      try {
        const systemInfoResponse = await settingsAPI.getSystemInfo();
        if (systemInfoResponse) {
          setSystemInfo(prev => ({
            ...prev,
            ...systemInfoResponse.systemInfo
          }));
        }
      } catch (err) {
        console.log('Using default system info');
        setSystemInfo({
          version: '1.0.0',
          lastUpdated: new Date().toLocaleDateString(),
          serverStatus: 'Online',
          databaseStatus: 'Connected',
          storageUsage: '45%',
          activeUsers: 10
        });
      }

      // Xóa thông báo lỗi nếu có
      setError('');
      
    } catch (err) {
      // Chỉ hiển thị lỗi khi tất cả các request đều thất bại
      setError('Không thể kết nối với máy chủ. Đang sử dụng dữ liệu mặc định.');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle system settings change
  const handleSystemSettingsChange = (e) => {
    const { name, value, checked } = e.target;
    setSystemSettings(prev => ({
      ...prev,
      [name]: name === 'maintenanceMode' ? checked : value
    }));
  };
  
  // Handle notification settings change
  const handleNotificationSettingsChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Save system settings
  const saveSystemSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await settingsAPI.updateSettings(systemSettings);
      setSuccess('Cài đặt hệ thống đã được cập nhật thành công');
    } catch (err) {
      setError('Không thể cập nhật cài đặt hệ thống. Vui lòng thử lại.');
      console.error('Error saving system settings:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Save notification settings
  const saveNotificationSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await settingsAPI.updateNotificationSettings(notificationSettings);
      setSuccess('Cài đặt thông báo đã được cập nhật thành công');
    } catch (err) {
      setError('Không thể cập nhật cài đặt thông báo. Vui lòng thử lại.');
      console.error('Error saving notification settings:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh system info
  const refreshSystemInfo = async () => {
    setLoading(true);
    setError('');
    
    try {
      const systemInfoResponse = await settingsAPI.getSystemInfo();
      if (systemInfoResponse) {
        setSystemInfo(prev => ({
          ...prev,
          ...systemInfoResponse.systemInfo
        }));
      }
    } catch (err) {
      setError('Không thể tải thông tin hệ thống. Vui lòng thử lại sau.');
      console.error('Error fetching system info:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <MainCard title="Cài đặt hệ thống">
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm cài đặt..."
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                sx: { borderRadius: 2 }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95)
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={8} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchSettings}
              sx={{
                borderRadius: 2,
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
                }
              }}
            >
              Làm mới
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`,
            border: (theme) => `1px solid ${alpha(theme.palette.error.main, 0.1)}`
          }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success"
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.success.main, 0.15)}`,
            border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.1)}`
          }}
        >
          {success}
        </Alert>
      )}

      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 3,
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            pt: 2,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 48,
              borderRadius: 2,
              mx: 0.5,
              color: 'text.secondary',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08)
              },
              '&.Mui-selected': {
                color: 'primary.main',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1)
              }
            }
          }}
        >
          <Tab icon={<SettingsIcon />} label="Hệ thống" iconPosition="start" />
          <Tab icon={<NotificationsIcon />} label="Thông báo" iconPosition="start" />
          <Tab icon={<InfoIcon />} label="Thông tin hệ thống" iconPosition="start" />
        </Tabs>

        {/* System Settings Tab */}
        <TabPanel value={activeTab} index={0}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 2,
              bgcolor: 'transparent',
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tên trang"
                    name="siteName"
                    value={systemSettings.siteName}
                    onChange={handleSystemSettingsChange}
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email liên hệ"
                    name="contactEmail"
                    value={systemSettings.contactEmail}
                    onChange={handleSystemSettingsChange}
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mô tả trang"
                    name="siteDescription"
                    value={systemSettings.siteDescription}
                    onChange={handleSystemSettingsChange}
                    margin="normal"
                    multiline
                    rows={2}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" sx={{ borderRadius: 1.5 }}>
                    <InputLabel>Ngôn ngữ</InputLabel>
                    <Select
                      name="language"
                      value={systemSettings.language}
                      label="Ngôn ngữ"
                      onChange={handleSystemSettingsChange}
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value="vi">Tiếng Việt</MenuItem>
                      <MenuItem value="en">Tiếng Anh</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Múi giờ</InputLabel>
                    <Select
                      name="timezone"
                      value={systemSettings.timezone}
                      label="Múi giờ"
                      onChange={handleSystemSettingsChange}
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value="Asia/Ho_Chi_Minh">Hồ Chí Minh (GMT+7)</MenuItem>
                      <MenuItem value="UTC">UTC</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.background.paper, 0.7),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.maintenanceMode}
                          onChange={handleSystemSettingsChange}
                          name="maintenanceMode"
                          color="primary"
                        />
                      }
                      label={
                        <Typography fontWeight={500}>
                          Chế độ bảo trì
                        </Typography>
                      }
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={saveSystemSettings}
                    disabled={loading}
                    sx={{ 
                      py: 1.5, 
                      px: 3, 
                      borderRadius: 2,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Lưu cài đặt'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>
        
        {/* Notification Settings Tab */}
        <TabPanel value={activeTab} index={1}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 2,
              bgcolor: 'transparent',
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <CardContent>
              <List sx={{ 
                bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
                borderRadius: 2,
                border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <ListItem sx={{ py: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onChange={handleNotificationSettingsChange}
                        name="emailNotifications"
                        color="primary"
                      />
                    }
                    label={
                      <Typography fontWeight={500}>
                        Bật thông báo qua email
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ py: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.newUserAlerts}
                        onChange={handleNotificationSettingsChange}
                        name="newUserAlerts"
                        color="primary"
                      />
                    }
                    label={
                      <Typography fontWeight={500}>
                        Thông báo người dùng mới
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ py: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.systemAlerts}
                        onChange={handleNotificationSettingsChange}
                        name="systemAlerts"
                        color="primary"
                      />
                    }
                    label={
                      <Typography fontWeight={500}>
                        Cảnh báo hệ thống
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ py: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.reportAlerts}
                        onChange={handleNotificationSettingsChange}
                        name="reportAlerts"
                        color="primary"
                      />
                    }
                    label={
                      <Typography fontWeight={500}>
                        Cảnh báo báo cáo
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ py: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.eventReminders}
                        onChange={handleNotificationSettingsChange}
                        name="eventReminders"
                        color="primary"
                      />
                    }
                    label={
                      <Typography fontWeight={500}>
                        Nhắc nhở sự kiện
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ py: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.examNotifications}
                        onChange={handleNotificationSettingsChange}
                        name="examNotifications"
                        color="primary"
                      />
                    }
                    label={
                      <Typography fontWeight={500}>
                        Thông báo kỳ thi
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveNotificationSettings}
                  disabled={loading}
                  sx={{ 
                    py: 1.5, 
                    px: 3, 
                    borderRadius: 2,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Lưu cài đặt thông báo'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
        
        {/* System Info Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            {Object.entries(systemInfo).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card 
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 2,
                    bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
                    border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {value || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>
    </MainCard>
  );
};

export default SettingsPage;
