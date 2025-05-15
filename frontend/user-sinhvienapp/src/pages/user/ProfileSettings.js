import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Person, 
  Lock, 
  Notifications,
  Save,
  Email,
  AccountCircle 
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

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

function a11yProps(index) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const ProfileSettings = () => {
  const { currentUser } = useAuth();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // Styles matching other pages
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
    formField: {
      marginBottom: theme.spacing(2)
    },
    buttonContainer: {
      marginTop: theme.spacing(3)
    },
    infoSection: {
      marginBottom: theme.spacing(3),
      padding: theme.spacing(2),
      backgroundColor: theme.palette.background.default
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  if (loading && !currentUser) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        </Paper>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Cài đặt tài khoản
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Quản lý thông tin đăng nhập và thiết lập hệ thống
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="settings tabs"
            variant={isSmallScreen ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                minHeight: 48,
              }
            }}
          >
            <Tab 
              label="Thông tin tài khoản" 
              icon={<Person />} 
              iconPosition="start" 
              {...a11yProps(0)} 
            />
            <Tab 
              label="Đổi mật khẩu" 
              icon={<Lock />} 
              iconPosition="start" 
              {...a11yProps(1)} 
            />
            <Tab 
              label="Thông báo" 
              icon={<Notifications />} 
              iconPosition="start" 
              {...a11yProps(2)} 
            />
          </Tabs>
        </Box>
        
        <TabPanel value={value} index={0}>
          <Paper sx={styles.paper} elevation={0} variant="outlined">
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1.5,
                mb: 2
              }}
            >
              <AccountCircle color="primary" />
              Thông tin tài khoản của bạn
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={styles.infoSection}>
              <Typography variant="body1" gutterBottom>
                <strong>Thông tin đăng nhập:</strong>
              </Typography>
              <Typography variant="body2" component="ul">
                <li>Tài khoản: {currentUser?.Username || 'N/A'}</li>
                <li>Email: {currentUser?.Email || 'N/A'}</li>
                <li>Loại tài khoản: {currentUser?.Role || 'Sinh viên'}</li>
              </Typography>
            </Box>
            
            <Box component="form" noValidate>
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                defaultValue={currentUser?.Email}
                disabled
                sx={styles.formField}
              />
              <TextField
                margin="normal"
                fullWidth
                id="username"
                label="Tên đăng nhập"
                name="username"
                defaultValue={currentUser?.Username}
                disabled
                sx={styles.formField}
              />
              <Box sx={styles.buttonContainer}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Cập nhật thông tin'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <Paper sx={styles.paper} elevation={0} variant="outlined">
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1.5,
                mb: 2
              }}
            >
              <Lock color="primary" />
              Đổi mật khẩu
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.
            </Alert>
            
            <Box component="form" noValidate>
              <TextField
                margin="normal"
                fullWidth
                name="currentPassword"
                label="Mật khẩu hiện tại"
                type="password"
                id="currentPassword"
                sx={styles.formField}
              />
              <TextField
                margin="normal"
                fullWidth
                name="newPassword"
                label="Mật khẩu mới"
                type="password"
                id="newPassword"
                sx={styles.formField}
              />
              <TextField
                margin="normal"
                fullWidth
                name="confirmPassword"
                label="Xác nhận mật khẩu mới"
                type="password"
                id="confirmPassword"
                sx={styles.formField}
              />
              <Box sx={styles.buttonContainer}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Đổi mật khẩu'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <Paper sx={styles.paper} elevation={0} variant="outlined">
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1.5,
                mb: 2
              }}
            >
              <Notifications color="primary" />
              Cài đặt thông báo
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Các cài đặt thông báo sẽ được áp dụng cho email và thông báo trong hệ thống.
            </Alert>
            
            <Box sx={styles.infoSection}>
              <Typography variant="body1" gutterBottom>
                <strong>Các loại thông báo:</strong>
              </Typography>
              <Typography variant="body2" component="ul">
                <li>Thông báo học tập</li>
                <li>Thông báo học phí</li>
                <li>Thông báo thời khóa biểu</li>
                <li>Thông báo khẩn cấp</li>
              </Typography>
            </Box>
            
            <Box sx={styles.buttonContainer}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Lưu cài đặt'}
              </Button>
            </Box>
          </Paper>
        </TabPanel>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ProfileSettings; 