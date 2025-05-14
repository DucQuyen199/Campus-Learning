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
  CardContent,
  IconButton,
  Fade,
  Grow,
  Skeleton,
  Tooltip,
  Chip,
  Backdrop
} from '@mui/material';
import { styled } from '@mui/material/styles';
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
  Assignment,
  Info,
  History,
  CalendarMonth,
  WorkOutline,
  BusinessCenter,
  EventNote,
  Wc,
  PlaceOutlined,
  FingerprintOutlined,
  HealthAndSafetyOutlined,
  InsertDriveFileOutlined,
  SwitchAccount,
  Apartment,
  AccessTime,
  VerifiedUser
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/api';

// Styled components for modern UI
const ProfilePaper = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
  height: '100%',
  transition: 'transform 0.3s, box-shadow 0.3s',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: '3px 3px 0 0',
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
    minHeight: 64,
    '&.Mui-selected': {
      color: theme.palette.primary.main,
    },
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.9rem',
  minHeight: 64,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 150,
  height: 150,
  border: '4px solid white',
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s',
  '&:hover': {
    transform: 'scale(1.05)',
  }
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(2),
    color: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    padding: 8,
    borderRadius: 8,
  }
}));

const InfoCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: 12,
  boxShadow: 'none',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(8px)',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  }
}));

const GradientButton = styled(Button)(({ theme }) => ({
  backgroundImage: 'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)',
  color: 'white',
  borderRadius: 8,
  '&:hover': {
    backgroundImage: 'linear-gradient(to right, #5a10b0 0%, #1a65e0 100%)',
  },
}));

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
        <Box sx={{ p: { xs: 2, md: 3 } }}>
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
  const [pageLoaded, setPageLoaded] = useState(false);
  
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
        setUpdateHistory(Array.isArray(updates) ? updates : []);
      } catch (updatesError) {
        console.error('Error fetching profile updates:', updatesError);
        setUpdateHistory([]);
      }
    } catch (err) {
      console.error('Error in fetchProfileData:', err);
      setError('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');
    } finally {
      // Add a small delay to make transitions smoother
      setTimeout(() => {
        setLoading(false);
        setPageLoaded(true);
      }, 600);
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
        height: '100%', 
        width: '100%',
        display: 'flex', 
        flexDirection: 'column',
        gap: 3
      }}>
        {/* Skeleton for profile section */}
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 3 }} />
        
        {/* Skeleton for tabs */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" width="100%" height={500} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" width="100%" height={500} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
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
      backgroundColor: 'transparent',
      backgroundImage: 'linear-gradient(to bottom right, rgba(240, 245, 255, 0.5), rgba(255, 250, 245, 0.5))',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(100, 130, 255, 0.1) 0%, transparent 40%), radial-gradient(circle at 75% 75%, rgba(120, 80, 220, 0.08) 0%, transparent 40%)',
        zIndex: -1,
      }
    }}>
      <Fade in={pageLoaded} timeout={800}>
        <Box>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' } }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800, 
                mb: 1,
                background: 'linear-gradient(90deg, #3a7bd5, #6a11cb)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Sơ yếu lý lịch
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Quản lý và cập nhật thông tin cá nhân của bạn
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {/* Left column - Basic info and photo */}
            <Grid item xs={12} md={4}>
              <Grow in={pageLoaded} timeout={600}>
                <ProfilePaper>
                  <Box sx={{ 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    position: 'relative',
                    background: 'linear-gradient(120deg, #6a11cb 0%, #2575fc 100%)',
                    pb: 10,
                  }}>
                    <ProfileAvatar
                      src={profileData?.Avatar}
                      alt={profileData?.FullName}
                    />
                    <Typography variant="h5" sx={{ color: 'white', mt: 2, fontWeight: 600 }}>
                      {profileData?.FullName}
                    </Typography>
                    <Chip 
                      label={`MSSV: ${profileData?.StudentCode || 'N/A'}`} 
                      sx={{ 
                        mt: 1, 
                        color: 'white', 
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        '& .MuiChip-label': { fontWeight: 500 },
                      }} 
                    />
                  </Box>
                  
                  <Box sx={{ 
                    position: 'relative', 
                    mt: -7, 
                    mx: 3, 
                    p: 3, 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                      <Button
                        variant={editMode ? "outlined" : "contained"}
                        startIcon={editMode ? <Close /> : <Edit />}
                        onClick={handleEditMode}
                        color={editMode ? "error" : "primary"}
                        sx={{ borderRadius: 2 }}
                      >
                        {editMode ? 'Hủy' : 'Chỉnh sửa'}
                      </Button>
                      {editMode && (
                        <GradientButton
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleUpdateProfile}
                          disabled={loading}
                          sx={{ borderRadius: 2 }}
                        >
                          Lưu
                        </GradientButton>
                      )}
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <InfoItem>
                      <Email />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Email</Typography>
                        <Typography variant="body2" fontWeight={500}>{profileData?.Email}</Typography>
                      </Box>
                    </InfoItem>
                    
                    <InfoItem>
                      <Phone />
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="caption" color="text.secondary">Điện thoại</Typography>
                        {editMode ? (
                          <TextField
                            name="phoneNumber"
                            size="small"
                            fullWidth
                            value={editedProfile.phoneNumber}
                            onChange={handleInputChange}
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        ) : (
                          <Typography variant="body2" fontWeight={500}>
                            {profileData?.PhoneNumber || 'Chưa cập nhật'}
                          </Typography>
                        )}
                      </Box>
                    </InfoItem>
                    
                    <InfoItem>
                      <LocationOn />
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="caption" color="text.secondary">Địa chỉ</Typography>
                        {editMode ? (
                          <Box sx={{ width: '100%' }}>
                            <TextField
                              name="address"
                              label="Địa chỉ"
                              size="small"
                              fullWidth
                              value={editedProfile.address}
                              onChange={handleInputChange}
                              sx={{ mb: 1, mt: 0.5 }}
                            />
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <TextField
                                  name="city"
                                  label="Thành phố"
                                  size="small"
                                  fullWidth
                                  value={editedProfile.city}
                                  onChange={handleInputChange}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  name="country"
                                  label="Quốc gia"
                                  size="small"
                                  fullWidth
                                  value={editedProfile.country}
                                  onChange={handleInputChange}
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        ) : (
                          <Typography variant="body2" fontWeight={500}>
                            {profileData?.Address 
                              ? `${profileData.Address}, ${profileData.City || ''}, ${profileData.Country || ''}`
                              : 'Chưa cập nhật'
                            }
                          </Typography>
                        )}
                      </Box>
                    </InfoItem>
                    
                    <InfoItem>
                      <School />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Ngành học</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {academicData?.ProgramName || 'Chưa cập nhật'}
                        </Typography>
                      </Box>
                    </InfoItem>
                    
                    <Button
                      size="small"
                      startIcon={<History />}
                      onClick={handleOpenHistoryDialog}
                      sx={{ mt: 2, fontWeight: 500 }}
                      color="primary"
                    >
                      Xem lịch sử thay đổi
                    </Button>
                  </Box>
                </ProfilePaper>
              </Grow>
            </Grid>
            
            {/* Right column - Detailed information */}
            <Grid item xs={12} md={8}>
              <Grow in={pageLoaded} timeout={800}>
                <ProfilePaper>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <StyledTabs value={value} onChange={handleChange} aria-label="profile tabs" variant={isSmallScreen ? "fullWidth" : "standard"}>
                      <StyledTab label="Thông tin cá nhân" icon={<Person />} iconPosition="start" {...a11yProps(0)} />
                      <StyledTab label="Thông tin học tập" icon={<School />} iconPosition="start" {...a11yProps(1)} />
                      <StyledTab label="Thông tin liên hệ" icon={<ContactInfo />} iconPosition="start" {...a11yProps(2)} />
                    </StyledTabs>
                  </Box>
                  
                  {/* Personal Information Tab */}
                  <TabPanel value={value} index={0}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <InfoCard>
                          <CardContent sx={{ p: 3 }}>
                            <SectionTitle variant="h6">
                              <Person />
                              Thông tin cơ bản
                            </SectionTitle>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Họ và tên</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.FullName}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Ngày sinh</Typography>
                                  <Typography variant="body1" fontWeight={500}>
                                    {profileData?.DateOfBirth ? new Date(profileData.DateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Giới tính</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.Gender || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Nơi sinh</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.BirthPlace || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Quê quán</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.HomeTown || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Dân tộc</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.Ethnicity || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Tôn giáo</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.Religion || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </InfoCard>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <InfoCard>
                          <CardContent sx={{ p: 3 }}>
                            <SectionTitle variant="h6">
                              <CreditCard />
                              Giấy tờ
                            </SectionTitle>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">CMND/CCCD</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.IdentityCardNumber || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Ngày cấp</Typography>
                                  <Typography variant="body1" fontWeight={500}>
                                    {profileData?.IdentityCardIssueDate ? new Date(profileData.IdentityCardIssueDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Nơi cấp</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.IdentityCardIssuePlace || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Số BHYT</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.HealthInsuranceNumber || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Tài khoản ngân hàng</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.BankAccountNumber || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Ngân hàng</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.BankName || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </InfoCard>
                      </Grid>
                      
                      {/* Bio Section */}
                      <Grid item xs={12}>
                        <InfoCard>
                          <CardContent sx={{ p: 3 }}>
                            <SectionTitle variant="h6">
                              <Info />
                              Giới thiệu bản thân
                            </SectionTitle>
                            
                            {editMode ? (
                              <TextField
                                name="bio"
                                label="Mô tả bản thân"
                                multiline
                                rows={4}
                                fullWidth
                                value={editedProfile.bio}
                                onChange={handleInputChange}
                                sx={{ mt: 2 }}
                              />
                            ) : (
                              <Typography variant="body1" sx={{ mt: 2, fontStyle: profileData?.Bio ? 'normal' : 'italic', color: profileData?.Bio ? 'text.primary' : 'text.secondary' }}>
                                {profileData?.Bio || 'Chưa có thông tin giới thiệu bản thân.'}
                              </Typography>
                            )}
                          </CardContent>
                        </InfoCard>
                      </Grid>
                    </Grid>
                  </TabPanel>
                  
                  {/* Academic Information Tab */}
                  <TabPanel value={value} index={1}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <InfoCard>
                          <CardContent sx={{ p: 3 }}>
                            <SectionTitle variant="h6">
                              <School />
                              Thông tin học tập
                            </SectionTitle>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Mã sinh viên</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.StudentCode || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Lớp</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.Class || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Ngành học</Typography>
                                  <Typography variant="body1" fontWeight={500}>{academicData?.ProgramName || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Khoa</Typography>
                                  <Typography variant="body1" fontWeight={500}>{academicData?.Faculty || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Bộ môn</Typography>
                                  <Typography variant="body1" fontWeight={500}>{academicData?.Department || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Học kỳ hiện tại</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.CurrentSemester?.toString() || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Ngày nhập học</Typography>
                                  <Typography variant="body1" fontWeight={500}>
                                    {profileData?.EnrollmentDate ? new Date(profileData.EnrollmentDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Ngày tốt nghiệp dự kiến</Typography>
                                  <Typography variant="body1" fontWeight={500}>
                                    {profileData?.GraduationDate ? new Date(profileData.GraduationDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Tình trạng học tập</Typography>
                                  <Box sx={{ mt: 0.5 }}>
                                    <Chip 
                                      label={profileData?.AcademicStatus || 'Regular'} 
                                      color={profileData?.AcademicStatus === 'Warning' ? 'warning' : 'success'}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </Box>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </InfoCard>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <InfoCard>
                          <CardContent sx={{ p: 3 }}>
                            <SectionTitle variant="h6">
                              <Person />
                              Thông tin cố vấn học tập
                            </SectionTitle>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Tên cố vấn</Typography>
                                  <Typography variant="body1" fontWeight={500}>{academicData?.AdvisorName || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Email</Typography>
                                  <Typography variant="body1" fontWeight={500}>{academicData?.AdvisorEmail || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Điện thoại</Typography>
                                  <Typography variant="body1" fontWeight={500}>{academicData?.AdvisorPhone || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </InfoCard>
                      </Grid>
                    </Grid>
                  </TabPanel>
                  
                  {/* Contact Information Tab */}
                  <TabPanel value={value} index={2}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <InfoCard>
                          <CardContent sx={{ p: 3 }}>
                            <SectionTitle variant="h6">
                              <Phone />
                              Thông tin liên hệ cá nhân
                            </SectionTitle>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Điện thoại</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.PhoneNumber || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Email</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.Email}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Địa chỉ hiện tại</Typography>
                                  <Typography variant="body1" fontWeight={500}>
                                    {profileData?.Address 
                                      ? `${profileData.Address}, ${profileData.City || ''}, ${profileData.Country || ''}`
                                      : 'Chưa cập nhật'
                                    }
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </InfoCard>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <InfoCard>
                          <CardContent sx={{ p: 3 }}>
                            <SectionTitle variant="h6">
                              <Home />
                              Thông tin gia đình
                            </SectionTitle>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Tên phụ huynh</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.ParentName || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Điện thoại phụ huynh</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.ParentPhone || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Email phụ huynh</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.ParentEmail || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">Người liên hệ khẩn cấp</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.EmergencyContact || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">SĐT liên hệ khẩn cấp</Typography>
                                  <Typography variant="body1" fontWeight={500}>{profileData?.EmergencyPhone || 'Chưa cập nhật'}</Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </InfoCard>
                      </Grid>
                    </Grid>
                  </TabPanel>
                </ProfilePaper>
              </Grow>
            </Grid>
          </Grid>
        </Box>
      </Fade>
      
      {/* Update History Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3, 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <History sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>Lịch sử cập nhật thông tin</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {!updateHistory || updateHistory.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <History sx={{ color: 'text.disabled', fontSize: 48, mb: 2 }} />
              <Typography color="text.secondary">Không có thông tin cập nhật nào.</Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%' }}>
              {updateHistory.map((update, index) => (
                <ListItem 
                  key={index} 
                  divider={index < updateHistory.length - 1}
                  sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}
                >
                  <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {update.FieldName}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Chip 
                      size="small" 
                      label={update.Status}
                      color={update.Status === 'Approved' ? 'success' : update.Status === 'Pending' ? 'warning' : 'primary'}
                    />
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>
                    {new Date(update.UpdateTime).toLocaleString('vi-VN')}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.5, backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">Giá trị cũ</Typography>
                        <Typography variant="body2">{update.OldValue || 'Trống'}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.5, backgroundColor: 'rgba(25, 118, 210, 0.05)', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">Giá trị mới</Typography>
                        <Typography variant="body2">{update.NewValue || 'Trống'}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined" sx={{ borderRadius: 2 }}>Đóng</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
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
          sx={{ borderRadius: 2, width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Loading backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading && profileData !== null}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

// For Contact Info Icon
const ContactInfo = () => {
  return <Phone />;
};

export default Profile; 