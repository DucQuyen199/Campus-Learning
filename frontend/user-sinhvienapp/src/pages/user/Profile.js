import React, { useState, useEffect } from 'react';
import {
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
  Card,
  CardContent,
  Chip,
  Backdrop,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead
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
  History,
  CalendarMonth,
  WorkOutline,
  Wc,
  PlaceOutlined,
  FingerprintOutlined,
  HealthAndSafetyOutlined,
  Apartment
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

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
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
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
  
  // Styles matching ExamRegistration.js
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
    tableContainer: {
      marginTop: theme.spacing(3)
    },
    chip: {
      margin: theme.spacing(0.5)
    },
    formControl: {
      minWidth: 200,
      marginRight: theme.spacing(2)
    },
    buttonGroup: {
      marginTop: theme.spacing(3)
    },
    infoSection: {
      marginBottom: theme.spacing(3),
      padding: theme.spacing(2),
      backgroundColor: theme.palette.background.default
    }
  };
  
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
        const profileResponse = await userService.getProfile(currentUser.UserID);
        console.log('Profile data received:', profileResponse);
        
        if (!profileResponse || !profileResponse.UserID) {
          throw new Error('Không thể tải thông tin sinh viên');
        }
        
        // Create a properly structured profile object with all necessary fields
        const processedProfile = {
          // User basic info
          UserID: profileResponse.UserID || currentUser.UserID,
          Username: profileResponse.Username || currentUser.Username || '',
          Email: profileResponse.Email || currentUser.Email || '',
          FullName: profileResponse.FullName || currentUser.FullName || '',
          DateOfBirth: profileResponse.DateOfBirth || null,
          School: profileResponse.School || '',
          Role: profileResponse.Role || currentUser.Role || 'STUDENT',
          Status: profileResponse.Status || currentUser.Status || 'ONLINE',
          AccountStatus: profileResponse.AccountStatus || 'ACTIVE',
          PhoneNumber: profileResponse.PhoneNumber || '',
          Address: profileResponse.Address || '',
          City: profileResponse.City || '',
          Country: profileResponse.Country || '',
          LastLoginAt: profileResponse.LastLoginAt || null,
          Avatar: profileResponse.Avatar || currentUser.Avatar || '',
          Bio: profileResponse.Bio || '',
          
          // Student specific fields from StudentDetails
          StudentCode: profileResponse.StudentCode || '',
          IdentityCardNumber: profileResponse.IdentityCardNumber || '',
          IdentityCardIssueDate: profileResponse.IdentityCardIssueDate || null,
          IdentityCardIssuePlace: profileResponse.IdentityCardIssuePlace || '',
          Gender: profileResponse.Gender || '',
          MaritalStatus: profileResponse.MaritalStatus || '',
          BirthPlace: profileResponse.BirthPlace || '',
          Ethnicity: profileResponse.Ethnicity || '',
          Religion: profileResponse.Religion || '',
          HomeTown: profileResponse.HomeTown || '',
          
          // Family and emergency contacts
          ParentName: profileResponse.ParentName || '',
          ParentPhone: profileResponse.ParentPhone || '',
          ParentEmail: profileResponse.ParentEmail || '',
          EmergencyContact: profileResponse.EmergencyContact || '',
          EmergencyPhone: profileResponse.EmergencyPhone || '',
          
          // Health and documents
          HealthInsuranceNumber: profileResponse.HealthInsuranceNumber || '',
          BloodType: profileResponse.BloodType || '',
          BankAccountNumber: profileResponse.BankAccountNumber || '',
          BankName: profileResponse.BankName || '',
          
          // Academic details
          EnrollmentDate: profileResponse.EnrollmentDate || null,
          GraduationDate: profileResponse.GraduationDate || null,
          Class: profileResponse.Class || '',
          CurrentSemester: profileResponse.CurrentSemester || 1,
          AcademicStatus: profileResponse.AcademicStatus || 'Regular',
          
          // Program information
          ProgramName: profileResponse.ProgramName || '',
          Department: profileResponse.Department || '',
          Faculty: profileResponse.Faculty || '',
          TotalCredits: profileResponse.TotalCredits || 0,
          ProgramDuration: profileResponse.ProgramDuration || 0,
          DegreeName: profileResponse.DegreeName || '',
          ProgramType: profileResponse.ProgramType || '',
          EntryYear: profileResponse.EntryYear || null,
          ExpectedGraduationYear: profileResponse.ExpectedGraduationYear || null,
          ProgramStatus: profileResponse.ProgramStatus || 'Active',
          
          // Advisor information
          AdvisorName: profileResponse.AdvisorName || '',
          AdvisorEmail: profileResponse.AdvisorEmail || '',
          AdvisorPhone: profileResponse.AdvisorPhone || '',
          
          // Additional info from UserProfiles
          Education: profileResponse.Education || '',
          WorkExperience: profileResponse.WorkExperience || '',
          Skills: profileResponse.Skills || '',
          Interests: profileResponse.Interests || '',
          Achievements: profileResponse.Achievements || '',
          PreferredLanguage: profileResponse.PreferredLanguage || 'vi',
        };
        
        setProfileData(processedProfile);

        // If program info exists in profile, use it directly
        if (processedProfile.ProgramName) {
          setAcademicData({
            ProgramName: processedProfile.ProgramName,
            Department: processedProfile.Department,
            Faculty: processedProfile.Faculty,
            TotalCredits: processedProfile.TotalCredits,
            ProgramDuration: processedProfile.ProgramDuration,
            DegreeName: processedProfile.DegreeName,
            ProgramType: processedProfile.ProgramType,
            AdvisorName: processedProfile.AdvisorName,
            AdvisorEmail: processedProfile.AdvisorEmail,
            AdvisorPhone: processedProfile.AdvisorPhone
          });
        } else {
          // If no program info in profile, try to fetch it separately
          try {
            const programResponse = await userService.getAcademicInfo(currentUser.UserID);
            if (programResponse && Array.isArray(programResponse) && programResponse.length > 0) {
              setAcademicData(programResponse[0]);
            }
          } catch (academicError) {
            console.error('Error fetching academic information:', academicError);
          }
        }
        
        try {
          // Fetch profile update history
          const updatesResponse = await userService.getProfileUpdates(currentUser.UserID);
          console.log('Update history received:', updatesResponse);
          setUpdateHistory(Array.isArray(updatesResponse) ? updatesResponse : []);
        } catch (updatesError) {
          console.error('Error fetching profile updates:', updatesError);
          setUpdateHistory([]);
        }
        
      } catch (profileError) {
        console.error('Error fetching profile details:', profileError);
        setSnackbar({
          open: true,
          message: 'Không thể tải thông tin hồ sơ sinh viên. ' + 
                   (profileError.message || 'Vui lòng thử lại sau.'),
          severity: 'error'
        });
        
        // Set basic profile from currentUser as fallback
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
    } catch (err) {
      console.error('Error in fetchProfileData:', err);
      setError('Không thể tải thông tin hồ sơ. ' + 
               (err.message || 'Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect to login if not authenticated, otherwise fetch profile
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    } else if (isAuthenticated && currentUser) {
      fetchProfileData();
    }
  }, [authLoading, isAuthenticated, currentUser, navigate]);
  
  // Loading state
  if (loading && !profileData) {
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
  
  // Error state
  if (error && !profileData) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Alert severity="error">{error}</Alert>
        </Paper>
      </div>
    );
  }
  
  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Sơ yếu lý lịch
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Quản lý và cập nhật thông tin cá nhân
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>
        
        {/* Basic Info Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={profileData?.Avatar}
                alt={profileData?.FullName}
                sx={{ 
                  width: 150, 
                  height: 150, 
                  mb: 2,
                  border: '4px solid white',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
                }}
              />
              <Typography variant="h6" align="center" gutterBottom>
                {profileData?.FullName}
              </Typography>
              <Chip 
                label={`MSSV: ${profileData?.StudentCode || 'N/A'}`} 
                color="primary"
                sx={{ mb: 2 }}
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button
                  variant={editMode ? "outlined" : "contained"}
                  startIcon={editMode ? <Close /> : <Edit />}
                  onClick={handleEditMode}
                  color={editMode ? "error" : "primary"}
                >
                  {editMode ? 'Hủy' : 'Chỉnh sửa'}
                </Button>
                {editMode && (
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    color="primary"
                  >
                    Lưu
                  </Button>
                )}
              </Box>
              <Button
                size="small"
                startIcon={<History />}
                onClick={handleOpenHistoryDialog}
                sx={{ mt: 2 }}
                color="primary"
              >
                Xem lịch sử thay đổi
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <TableContainer component={Paper} variant="outlined" sx={styles.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="30%" sx={{ fontWeight: 'bold' }}>Thông tin</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Chi tiết</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Email sx={{ mr: 1, color: 'primary.main' }} />
                        Email
                      </Box>
                    </TableCell>
                    <TableCell>{profileData?.Email}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Phone sx={{ mr: 1, color: 'primary.main' }} />
                        Điện thoại
                      </Box>
                    </TableCell>
                    <TableCell>
                      {editMode ? (
                        <TextField
                          name="phoneNumber"
                          size="small"
                          fullWidth
                          value={editedProfile.phoneNumber}
                          onChange={handleInputChange}
                          variant="outlined"
                        />
                      ) : (
                        profileData?.PhoneNumber || 'Chưa cập nhật'
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                        Địa chỉ
                      </Box>
                    </TableCell>
                    <TableCell>
                      {editMode ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <TextField
                            name="address"
                            label="Địa chỉ"
                            size="small"
                            fullWidth
                            value={editedProfile.address}
                            onChange={handleInputChange}
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              name="city"
                              label="Thành phố"
                              size="small"
                              fullWidth
                              value={editedProfile.city}
                              onChange={handleInputChange}
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
                        </Box>
                      ) : (
                        (profileData?.Address 
                          ? `${profileData.Address}, ${profileData.City || ''}, ${profileData.Country || ''}`
                          : 'Chưa cập nhật')
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <School sx={{ mr: 1, color: 'primary.main' }} />
                        Ngành học
                      </Box>
                    </TableCell>
                    <TableCell>{academicData?.ProgramName || 'Chưa cập nhật'}</TableCell>
                  </TableRow>
                  {editMode && (
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ mr: 1, color: 'primary.main' }} />
                          Giới thiệu
                        </Box>
                      </TableCell>
                      <TableCell>
                        <TextField
                          name="bio"
                          label="Mô tả bản thân"
                          multiline
                          rows={3}
                          fullWidth
                          value={editedProfile.bio}
                          onChange={handleInputChange}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
        
        {/* Tabs Section */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="profile tabs"
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
              label="Thông tin cá nhân" 
              icon={<Person />} 
              iconPosition="start" 
              {...a11yProps(0)} 
            />
            <Tab 
              label="Thông tin học tập" 
              icon={<School />} 
              iconPosition="start" 
              {...a11yProps(1)} 
            />
            <Tab 
              label="Thông tin liên hệ" 
              icon={<Phone />} 
              iconPosition="start" 
              {...a11yProps(2)} 
            />
          </Tabs>
        </Box>
        
        {/* Personal Information Tab */}
        <TabPanel value={value} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={styles.paper} elevation={0} variant="outlined">
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  Thông tin cơ bản
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row" width="40%">Họ và tên</TableCell>
                        <TableCell align="right">{profileData?.FullName}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Ngày sinh</TableCell>
                        <TableCell align="right">
                          {profileData?.DateOfBirth ? 
                            new Date(profileData.DateOfBirth).toLocaleDateString('vi-VN', {
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit'
                            }) : 
                            'Chưa cập nhật'
                          }
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Giới tính</TableCell>
                        <TableCell align="right">{profileData?.Gender || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Nơi sinh</TableCell>
                        <TableCell align="right">{profileData?.BirthPlace || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Quê quán</TableCell>
                        <TableCell align="right">{profileData?.HomeTown || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Dân tộc</TableCell>
                        <TableCell align="right">{profileData?.Ethnicity || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Tôn giáo</TableCell>
                        <TableCell align="right">{profileData?.Religion || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={styles.paper} elevation={0} variant="outlined">
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CreditCard sx={{ mr: 1, color: 'primary.main' }} />
                  Giấy tờ
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row" width="40%">CMND/CCCD</TableCell>
                        <TableCell align="right">{profileData?.IdentityCardNumber || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Ngày cấp</TableCell>
                        <TableCell align="right">
                          {profileData?.IdentityCardIssueDate ? new Date(profileData.IdentityCardIssueDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Nơi cấp</TableCell>
                        <TableCell align="right">{profileData?.IdentityCardIssuePlace || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Số BHYT</TableCell>
                        <TableCell align="right">{profileData?.HealthInsuranceNumber || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Tài khoản ngân hàng</TableCell>
                        <TableCell align="right">{profileData?.BankAccountNumber || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Ngân hàng</TableCell>
                        <TableCell align="right">{profileData?.BankName || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            
            {/* Bio Section */}
            {!editMode && (
              <Grid item xs={12}>
                <Paper sx={styles.paper} elevation={0} variant="outlined">
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, color: 'primary.main' }} />
                    Giới thiệu bản thân
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body1" sx={{ color: profileData?.Bio ? 'text.primary' : 'text.secondary' }}>
                    {profileData?.Bio || 'Chưa có thông tin giới thiệu bản thân.'}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* Academic Information Tab */}
        <TabPanel value={value} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={styles.paper} elevation={0} variant="outlined">
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <School sx={{ mr: 1, color: 'primary.main' }} />
                  Thông tin học tập
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row" width="40%">Mã sinh viên</TableCell>
                        <TableCell align="right">{profileData?.StudentCode || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Lớp</TableCell>
                        <TableCell align="right">{profileData?.Class || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Ngành học</TableCell>
                        <TableCell align="right">{academicData?.ProgramName || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Khoa</TableCell>
                        <TableCell align="right">{academicData?.Faculty || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Bộ môn</TableCell>
                        <TableCell align="right">{academicData?.Department || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Học kỳ hiện tại</TableCell>
                        <TableCell align="right">{profileData?.CurrentSemester?.toString() || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Ngày nhập học</TableCell>
                        <TableCell align="right">
                          {profileData?.EnrollmentDate ? new Date(profileData.EnrollmentDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Ngày tốt nghiệp dự kiến</TableCell>
                        <TableCell align="right">
                          {profileData?.GraduationDate ? new Date(profileData.GraduationDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Tình trạng học tập</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={profileData?.AcademicStatus || 'Regular'} 
                            color={profileData?.AcademicStatus === 'Warning' ? 'warning' : 'success'}
                            size="small"
                            sx={styles.chip}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={styles.paper} elevation={0} variant="outlined">
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  Thông tin cố vấn học tập
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row" width="40%">Tên cố vấn</TableCell>
                        <TableCell align="right">{academicData?.AdvisorName || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Email</TableCell>
                        <TableCell align="right">{academicData?.AdvisorEmail || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Điện thoại</TableCell>
                        <TableCell align="right">{academicData?.AdvisorPhone || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Contact Information Tab */}
        <TabPanel value={value} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={styles.paper} elevation={0} variant="outlined">
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Phone sx={{ mr: 1, color: 'primary.main' }} />
                  Thông tin liên hệ cá nhân
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row" width="40%">Điện thoại</TableCell>
                        <TableCell align="right">{profileData?.PhoneNumber || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Email</TableCell>
                        <TableCell align="right">{profileData?.Email}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Địa chỉ hiện tại</TableCell>
                        <TableCell align="right">
                          {profileData?.Address 
                            ? `${profileData.Address}, ${profileData.City || ''}, ${profileData.Country || ''}`
                            : 'Chưa cập nhật'
                          }
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={styles.paper} elevation={0} variant="outlined">
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Home sx={{ mr: 1, color: 'primary.main' }} />
                  Thông tin gia đình
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row" width="40%">Tên phụ huynh</TableCell>
                        <TableCell align="right">{profileData?.ParentName || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Điện thoại phụ huynh</TableCell>
                        <TableCell align="right">{profileData?.ParentPhone || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Email phụ huynh</TableCell>
                        <TableCell align="right">{profileData?.ParentEmail || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Người liên hệ khẩn cấp</TableCell>
                        <TableCell align="right">{profileData?.EmergencyContact || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">SĐT liên hệ khẩn cấp</TableCell>
                        <TableCell align="right">{profileData?.EmergencyPhone || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      {/* Update History Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <History sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Lịch sử cập nhật thông tin</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {!updateHistory || updateHistory.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <Typography color="text.secondary">Không có thông tin cập nhật nào.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Thông tin cập nhật</TableCell>
                    <TableCell align="right">Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {updateHistory.map((update, index) => (
                    <TableRow 
                      key={index}
                      hover
                    >
                      <TableCell>
                        <Typography variant="subtitle1" fontWeight={500}>
                          {update.FieldName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(update.UpdateTime).toLocaleString('vi-VN')}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">Giá trị cũ</Typography>
                            <Typography variant="body2">{update.OldValue || 'Trống'}</Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">Giá trị mới</Typography>
                            <Typography variant="body2">{update.NewValue || 'Trống'}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right" width="120px">
                        <Chip 
                          size="small" 
                          label={update.Status}
                          color={update.Status === 'Approved' ? 'success' : update.Status === 'Pending' ? 'warning' : 'primary'}
                          sx={styles.chip}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="outlined">Đóng</Button>
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
    </div>
  );
};

export default Profile; 