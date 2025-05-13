import React, { useState, useEffect } from 'react';
import {
  Container,
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
  Snackbar
} from '@mui/material';
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
        <Box sx={{ p: 3 }}>
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

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Cài đặt tài khoản
      </Typography>
      
      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="settings tabs">
            <Tab label="Thông tin tài khoản" {...a11yProps(0)} />
            <Tab label="Đổi mật khẩu" {...a11yProps(1)} />
            <Tab label="Thông báo" {...a11yProps(2)} />
          </Tabs>
        </Box>
        
        <TabPanel value={value} index={0}>
          <Typography variant="h6" gutterBottom>
            Thông tin tài khoản của bạn
          </Typography>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              defaultValue={currentUser?.Email}
              disabled
            />
            <TextField
              margin="normal"
              fullWidth
              id="username"
              label="Tên đăng nhập"
              name="username"
              defaultValue={currentUser?.Username}
              disabled
            />
            <Divider sx={{ my: 3 }} />
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Cập nhật thông tin'}
            </Button>
          </Box>
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <Typography variant="h6" gutterBottom>
            Đổi mật khẩu
          </Typography>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              name="currentPassword"
              label="Mật khẩu hiện tại"
              type="password"
              id="currentPassword"
            />
            <TextField
              margin="normal"
              fullWidth
              name="newPassword"
              label="Mật khẩu mới"
              type="password"
              id="newPassword"
            />
            <TextField
              margin="normal"
              fullWidth
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              type="password"
              id="confirmPassword"
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Đổi mật khẩu'}
            </Button>
          </Box>
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <Typography variant="h6" gutterBottom>
            Cài đặt thông báo
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Các cài đặt thông báo sẽ được áp dụng cho email và thông báo trong hệ thống.
          </Alert>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Lưu cài đặt'}
            </Button>
          </Box>
        </TabPanel>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Container>
  );
};

export default ProfileSettings; 