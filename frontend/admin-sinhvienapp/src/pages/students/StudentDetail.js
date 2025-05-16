import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Divider, Grid, Paper, Tabs, Tab,
  Card, CardContent, List, ListItem, ListItemText, Chip, CircularProgress, 
  Alert, Snackbar
} from '@mui/material';
import { 
  Person, School, Email, Phone, Home, CalendarToday,
  Edit, ArrowBack, Badge, CalendarMonth, LocationOn
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// API URL from environment or default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5011/api';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
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

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        // Fetch the student by ID from the real API
        const response = await axios.get(`${API_URL}/students/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data.success) {
          console.log('Student data:', response.data.data);
          setStudent(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch student details');
        }
      } catch (error) {
        console.error('Error fetching student details:', error);
        setError(error.message || 'Error loading student data');
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
    fetchStudentDetails();
    }
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Không tìm thấy sinh viên</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/students')}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  // Format date string helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/students')}
            sx={{ mr: 2 }}
          >
            Quay lại
          </Button>
          <Typography variant="h5" component="div">
            Chi tiết sinh viên
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Edit />}
          onClick={() => navigate(`/students/edit/${student.UserID}`)}
        >
          Chỉnh sửa
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ fontSize: 80, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4">{student.FullName}</Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Mã SV: {student.StudentCode || student.UserID}
                  </Typography>
                  <Chip 
                    label={student.AccountStatus === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'} 
                    color={student.AccountStatus === 'ACTIVE' ? 'success' : 'default'} 
                    size="small" 
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Trường học" 
                    secondary={student.School || 'Chưa cập nhật'} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Ngày tham gia" 
                    secondary={formatDate(student.CreatedAt)} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Vai trò" 
                    secondary={student.Role || 'STUDENT'} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="student detail tabs">
            <Tab label="Thông tin cá nhân" />
            <Tab label="Thông tin học tập" />
            <Tab label="Tài khoản" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Thông tin liên hệ
                  </Typography>
                  <List>
                    <ListItem>
                      <Email sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Email" secondary={student.Email || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <Phone sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Số điện thoại" secondary={student.PhoneNumber || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <Home sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Địa chỉ" secondary={student.Address || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <LocationOn sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Thành phố" secondary={student.City || 'Chưa cập nhật'} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Thông tin cá nhân
                  </Typography>
                  <List>
                    <ListItem>
                      <CalendarToday sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Ngày sinh" secondary={formatDate(student.DateOfBirth)} />
                    </ListItem>
                    <ListItem>
                      <Badge sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Username" secondary={student.Username || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <CalendarMonth sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText primary="Lần đăng nhập cuối" secondary={formatDate(student.LastLoginAt)} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Thông tin học tập
          </Typography>
          <Typography variant="body1">
            Đang cập nhật dữ liệu học tập của sinh viên...
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Thông tin tài khoản
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="UserID" secondary={student.UserID} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Trạng thái" secondary={student.AccountStatus || 'ACTIVE'} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Trạng thái online" secondary={student.Status || 'ONLINE'} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Xác thực email" secondary={student.EmailVerified ? 'Đã xác thực' : 'Chưa xác thực'} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Cập nhật lần cuối" secondary={formatDate(student.UpdatedAt)} />
            </ListItem>
          </List>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default StudentDetail; 