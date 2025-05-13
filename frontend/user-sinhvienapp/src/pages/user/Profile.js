import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  useTheme,
  useMediaQuery,
  alpha,
  Card,
  CardContent
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  School,
  CreditCard,
  Home,
  Cake,
  Person,
  Edit,
  Save,
  Close,
  AccountCircle,
  Badge,
  Assignment
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/api';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
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
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

const Profile = () => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [academicData, setAcademicData] = useState(null);
  const [updateHistory, setUpdateHistory] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [openDialog, setOpenDialog] = useState(false);
  
  // Tab change handler
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };
  
  // Handle edit mode toggle
  const handleEditMode = () => {
    if (!editMode) {
      // Enter edit mode
      setEditedProfile({
        phoneNumber: profileData?.PhoneNumber || '',
        address: profileData?.Address || '',
        city: profileData?.City || '',
        country: profileData?.Country || '',
        bio: profileData?.Bio || ''
      });
    }
    setEditMode(!editMode);
  };
  
  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await userService.updateProfile(currentUser.UserID, editedProfile);
      
      // Update local state with new values
      setProfileData({
        ...profileData,
        PhoneNumber: editedProfile.phoneNumber,
        Address: editedProfile.address,
        City: editedProfile.city,
        Country: editedProfile.country,
        Bio: editedProfile.bio
      });
      
      setSnackbar({
        open: true,
        message: 'Thông tin cá nhân đã được cập nhật',
        severity: 'success'
      });
      
      setEditMode(false);
      
      // Refresh profile data
      fetchProfileData();
    } catch (err) {
      console.error('Error updating profile:', err);
      setSnackbar({
        open: true,
        message: 'Không thể cập nhật thông tin. Vui lòng thử lại sau.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input change for edited profile
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile({
      ...editedProfile,
      [name]: value
    });
  };
  
  // Open dialog to show update history
  const handleOpenHistoryDialog = () => {
    setOpenDialog(true);
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Fetch profile data
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUser || !currentUser.UserID) {
        console.error('No current user ID available');
        setError('Không thể xác thực người dùng. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }

      console.log('Fetching profile data for user ID:', currentUser.UserID);
      
      try {
        // Fetch student profile
        const profile = await userService.getProfile(currentUser.UserID);
        console.log('Profile data received:', profile);
        setProfileData(profile);
      } catch (profileError) {
        console.error('Error fetching profile details:', profileError);
        setSnackbar({
          open: true,
          message: 'Không thể tải thông tin hồ sơ sinh viên',
          severity: 'error'
        });
        
        // Set basic profile from currentUser for fallback
        setProfileData({
          UserID: currentUser.UserID,
          Username: currentUser.Username || '',
          Email: currentUser.Email || '',
          FullName: currentUser.FullName || '',
          Role: currentUser.Role || 'STUDENT',
          Status: currentUser.Status || 'ONLINE',
          PhoneNumber: currentUser.PhoneNumber || '',
        });
      }
      
      try {
        // Fetch academic program information
        const program = await userService.getAcademicInfo(currentUser.UserID);
        console.log('Academic info received:', program);
        if (Array.isArray(program) && program.length > 0) {
          setAcademicData(program[0]);
        }
      } catch (academicError) {
        console.error('Error fetching academic information:', academicError);
      }
      
      try {
        // Fetch profile update history
        const updates = await userService.getProfileUpdates(currentUser.UserID);
        console.log('Update history received:', updates);
        setUpdateHistory(updates);
      } catch (updatesError) {
        console.error('Error fetching profile updates:', updatesError);
        setUpdateHistory([]);
      }
    } catch (err) {
      console.error('Error in fetchProfileData:', err);
      setError('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    if (currentUser) {
      fetchProfileData();
    }
  }, [currentUser]);
  
  // Loading state
  if (loading && !profileData) {
    return (
      <Box sx={{ 
        height: '80vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }
  
  // Error state
  if (error && !profileData) {
    return (
      <Box sx={{ m: 4 }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      py: 4, 
      px: { xs: 2, sm: 4 },
      backgroundColor: alpha(theme.palette.background.default, 0.6),
      minHeight: '100vh'
    }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold', 
          color: theme.palette.primary.main,
          mb: 3,
          textAlign: { xs: 'center', md: 'left' }
        }}
      >
        Sơ yếu lý lịch
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left column - Basic info and photo */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={profileData?.Avatar}
                alt={profileData?.FullName}
                sx={{ width: 150, height: 150, mb: 2 }}
              />
              <Typography variant="h5" component="div" align="center">
                {profileData?.FullName}
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center">
                MSSV: {profileData?.StudentCode}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={editMode ? <Close /> : <Edit />}
                  onClick={handleEditMode}
                >
                  {editMode ? 'Hủy' : 'Chỉnh sửa'}
                </Button>
                {editMode && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Save />}
                    onClick={handleUpdateProfile}
                    disabled={loading}
                  >
                    Lưu
                  </Button>
                )}
              </Box>
              <Button
                variant="text"
                size="small"
                sx={{ mt: 1 }}
                onClick={handleOpenHistoryDialog}
              >
                Xem lịch sử thay đổi
              </Button>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <List dense>
              <ListItem>
                <Email sx={{ marginRight: 1, color: 'primary.main' }} />
                <ListItemText primary="Email" secondary={profileData?.Email} />
              </ListItem>
              <ListItem>
                <Phone sx={{ marginRight: 1, color: 'primary.main' }} />
                {editMode ? (
                  <TextField
                    name="phoneNumber"
                    label="Điện thoại"
                    size="small"
                    fullWidth
                    value={editedProfile.phoneNumber}
                    onChange={handleInputChange}
                  />
                ) : (
                  <ListItemText primary="Điện thoại" secondary={profileData?.PhoneNumber || 'Chưa cập nhật'} />
                )}
              </ListItem>
              <ListItem>
                <LocationOn sx={{ marginRight: 1, color: 'primary.main' }} />
                {editMode ? (
                  <Box sx={{ width: '100%' }}>
                    <TextField
                      name="address"
                      label="Địa chỉ"
                      size="small"
                      fullWidth
                      value={editedProfile.address}
                      onChange={handleInputChange}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      name="city"
                      label="Thành phố"
                      size="small"
                      fullWidth
                      value={editedProfile.city}
                      onChange={handleInputChange}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      name="country"
                      label="Quốc gia"
                      size="small"
                      fullWidth
                      value={editedProfile.country}
                      onChange={handleInputChange}
                    />
                  </Box>
                ) : (
                  <ListItemText 
                    primary="Địa chỉ" 
                    secondary={
                      profileData?.Address 
                        ? `${profileData.Address}, ${profileData.City || ''}, ${profileData.Country || ''}`
                        : 'Chưa cập nhật'
                    } 
                  />
                )}
              </ListItem>
              <ListItem>
                <School sx={{ marginRight: 1, color: 'primary.main' }} />
                <ListItemText 
                  primary="Ngành học" 
                  secondary={academicData?.ProgramName || 'Chưa cập nhật'} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        {/* Right column - Detailed information */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={value} onChange={handleChange} aria-label="profile tabs">
                <Tab label="Thông tin cá nhân" {...a11yProps(0)} />
                <Tab label="Thông tin học tập" {...a11yProps(1)} />
                <Tab label="Thông tin liên hệ" {...a11yProps(2)} />
              </Tabs>
            </Box>
            
            {/* Personal Information Tab */}
            <TabPanel value={value} index={0}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <Person sx={{ marginRight: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                    Thông tin cơ bản
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Họ và tên" secondary={profileData?.FullName} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Ngày sinh" secondary={
                        profileData?.DateOfBirth ? new Date(profileData.DateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'
                      } />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Giới tính" secondary={profileData?.Gender || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Nơi sinh" secondary={profileData?.BirthPlace || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Dân tộc" secondary={profileData?.Ethnicity || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Tôn giáo" secondary={profileData?.Religion || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Quê quán" secondary={profileData?.HomeTown || 'Chưa cập nhật'} />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <CreditCard sx={{ marginRight: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                    Giấy tờ
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="CMND/CCCD" secondary={profileData?.IdentityCardNumber || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Ngày cấp" secondary={
                        profileData?.IdentityCardIssueDate ? new Date(profileData.IdentityCardIssueDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'
                      } />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Nơi cấp" secondary={profileData?.IdentityCardIssuePlace || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Số BHYT" secondary={profileData?.HealthInsuranceNumber || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Tài khoản ngân hàng" secondary={profileData?.BankAccountNumber || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Ngân hàng" secondary={profileData?.BankName || 'Chưa cập nhật'} />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
              
              {editMode && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Giới thiệu bản thân
                  </Typography>
                  <TextField
                    name="bio"
                    label="Mô tả bản thân"
                    multiline
                    rows={4}
                    fullWidth
                    value={editedProfile.bio}
                    onChange={handleInputChange}
                  />
                </Box>
              )}
              
              {!editMode && profileData?.Bio && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Giới thiệu bản thân
                  </Typography>
                  <Typography variant="body2">
                    {profileData.Bio}
                  </Typography>
                </Box>
              )}
            </TabPanel>
            
            {/* Academic Information Tab */}
            <TabPanel value={value} index={1}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <School sx={{ marginRight: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                    Thông tin học tập
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Mã sinh viên" secondary={profileData?.StudentCode || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Lớp" secondary={profileData?.Class || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Ngành học" secondary={academicData?.ProgramName || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Khoa" secondary={academicData?.Faculty || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Bộ môn" secondary={academicData?.Department || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Học kỳ hiện tại" secondary={profileData?.CurrentSemester?.toString() || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Ngày nhập học" secondary={
                        profileData?.EnrollmentDate ? new Date(profileData.EnrollmentDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'
                      } />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Ngày tốt nghiệp dự kiến" secondary={
                        profileData?.GraduationDate ? new Date(profileData.GraduationDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'
                      } />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Tình trạng học tập" secondary={profileData?.AcademicStatus || 'Regular'} />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <Person sx={{ marginRight: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                    Thông tin cố vấn học tập
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Tên cố vấn" secondary={academicData?.AdvisorName || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Email" secondary={academicData?.AdvisorEmail || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Điện thoại" secondary={academicData?.AdvisorPhone || 'Chưa cập nhật'} />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </TabPanel>
            
            {/* Contact Information Tab */}
            <TabPanel value={value} index={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <Phone sx={{ marginRight: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                    Thông tin liên hệ cá nhân
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Điện thoại" secondary={profileData?.PhoneNumber || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Email" secondary={profileData?.Email} />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Địa chỉ hiện tại" 
                        secondary={
                          profileData?.Address 
                            ? `${profileData.Address}, ${profileData.City || ''}, ${profileData.Country || ''}`
                            : 'Chưa cập nhật'
                        } 
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <Home sx={{ marginRight: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                    Thông tin gia đình
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Tên phụ huynh" secondary={profileData?.ParentName || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Điện thoại phụ huynh" secondary={profileData?.ParentPhone || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Email phụ huynh" secondary={profileData?.ParentEmail || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Người liên hệ khẩn cấp" secondary={profileData?.EmergencyContact || 'Chưa cập nhật'} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="SĐT liên hệ khẩn cấp" secondary={profileData?.EmergencyPhone || 'Chưa cập nhật'} />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Update History Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Lịch sử cập nhật thông tin</DialogTitle>
        <DialogContent dividers>
          {updateHistory.length === 0 ? (
            <Typography>Không có thông tin cập nhật nào.</Typography>
          ) : (
            <List>
              {updateHistory.map((update, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={`${update.FieldName} - ${new Date(update.UpdateTime).toLocaleString('vi-VN')}`}
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          Trạng thái: {update.Status}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Thay đổi từ: {update.OldValue}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Thành: {update.NewValue}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
};

export default Profile; 