// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import {
  Box,
  Typography,
  TextField,
  Button,
// eslint-disable-next-line no-unused-vars
  Paper,
  Avatar,
  Checkbox,
  FormControlLabel,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme,
  Card,
  Fade,
// eslint-disable-next-line no-unused-vars
  Grow,
  Slide,
// eslint-disable-next-line no-unused-vars
  useScrollTrigger
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Google, 
  School,
  LocationOn,
  Groups,
// eslint-disable-next-line no-unused-vars
  InsertChart,
  Laptop,
// eslint-disable-next-line no-unused-vars
  Handshake,
  LocalLibrary
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// HUBT Logo URL
const HUBT_LOGO = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFwb4-UCLggA0500PyGBgpWWo-3SYgXgbT3g&s';

// University info data - Updated with more comprehensive information
const universityInfo = [
  {
    title: 'Đội ngũ giảng viên',
    icon: <School />,
    items: [
      { name: 'Tổng số giảng viên', value: 'Hơn 500 giảng viên' },
      { name: 'Giảng viên có trình độ Tiến sĩ', value: '35%' },
      { name: 'Giảng viên có trình độ Thạc sĩ', value: '60%' },
      { name: 'Giảng viên quốc tế', value: 'Hơn 20 giảng viên' }
    ]
  },
  {
    title: 'Cơ sở vật chất',
    icon: <Laptop />,
    items: [
      { name: 'Diện tích khuôn viên', value: '10 hecta' },
      { name: 'Phòng học thông minh', value: '120 phòng' },
      { name: 'Phòng thí nghiệm', value: '25 phòng' },
      { name: 'Thư viện', value: 'Hơn 100,000 đầu sách' }
    ]
  },
  {
    title: 'Chương trình đào tạo',
    icon: <LocalLibrary />,
    items: [
      { name: 'Số ngành đào tạo đại học', value: '30 ngành' },
      { name: 'Số ngành đào tạo sau đại học', value: '12 ngành' },
      { name: 'Chương trình liên kết quốc tế', value: '8 chương trình' },
      { name: 'Tỷ lệ sinh viên có việc làm sau tốt nghiệp', value: '95%' }
    ]
  }
];

// University rankings and achievements
// eslint-disable-next-line no-unused-vars
const achievements = [
  { year: '2023', title: 'Top 15 trường đại học về đào tạo Công nghệ thông tin tại Việt Nam' },
  { year: '2023', title: 'Đơn vị đào tạo xuất sắc trong lĩnh vực Kinh doanh và Quản trị' },
  { year: '2022', title: 'Top 20 trường đại học có tỷ lệ sinh viên tốt nghiệp có việc làm cao nhất' },
  { year: '2021', title: 'Trường đại học có môi trường giáo dục quốc tế hóa' }
];

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
// eslint-disable-next-line no-unused-vars
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { login, loginWithGmail, error: authError, loading, isAuthenticated } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  
  // Animation states
  const [showLogin, setShowLogin] = useState(false);
  const [infoSectionVisible, setInfoSectionVisible] = useState(false);
  
  // Trigger animations on mount
  useEffect(() => {
    const timer1 = setTimeout(() => setShowLogin(true), 300);
    const timer2 = setTimeout(() => setInfoSectionVisible(true), 600);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);
  
  // Animation options
  const transitionDuration = { enter: 800, exit: 400 };
  
  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  // Form validation
  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Vui lòng nhập tên đăng nhập hoặc email');
      return false;
    }
    
    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu');
      return false;
    }
    
    setError('');
    return true;
  };
  
  // Handle login submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setError('');
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        // Check if user is admin - make this case-insensitive
        const userRole = result.user.role?.toUpperCase() || '';
        if (userRole !== 'ADMIN') {
          toast.error('Bạn không có quyền truy cập vào hệ thống quản trị');
          setError('Bạn không có quyền truy cập vào hệ thống quản trị');
          return;
        }
        
        // Store user data in Redux
        dispatch(setUser(result.user));
        
        // Show success message
        toast.success('Đăng nhập thành công');
        
        // Redirect to dashboard after successful login
        navigate('/');
      } else {
        setError(result.error || 'Đăng nhập thất bại');
        toast.error(result.error || 'Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = 
        err.response?.data?.message || 
        err.message || 
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };
  
  // Handle Gmail login
  const handleGmailLogin = async () => {
    // Prompt for Gmail address
    const email = prompt('Nhập địa chỉ Gmail của bạn:');
    
    if (!email) return;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@gmail\.com$/i;
    if (!emailRegex.test(email)) {
      setError('Vui lòng nhập một địa chỉ Gmail hợp lệ.');
      toast.error('Vui lòng nhập một địa chỉ Gmail hợp lệ.');
      return;
    }
    
    try {
      setGmailLoading(true);
      setError('');
      const result = await loginWithGmail(email);
      
      if (result.success) {
        // Check if user is admin - make this case-insensitive
        const userRole = result.user.role?.toUpperCase() || '';
        if (userRole !== 'ADMIN') {
          toast.error('Bạn không có quyền truy cập vào hệ thống quản trị');
          setError('Bạn không có quyền truy cập vào hệ thống quản trị');
          return;
        }
        
        // Store user data in Redux
        dispatch(setUser(result.user));
        
        // Show success message
        toast.success('Đăng nhập thành công');
        
        // Redirect to dashboard after successful login
        navigate('/');
      } else {
        setError(result.error || 'Đăng nhập bằng Gmail thất bại');
        toast.error(result.error || 'Đăng nhập bằng Gmail thất bại');
      }
    } catch (err) {
      console.error('Gmail login error:', err);
      const errorMsg = 
        err.response?.data?.message || 
        err.message || 
        'Đăng nhập bằng Gmail thất bại. Vui lòng thử lại sau.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setGmailLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Box sx={{
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Two-column layout */}
      <Box sx={{
        display: 'flex',
        width: '100%',
        height: '100%'
      }}>
        {/* Login Form - Left Side */}
        <Slide direction="right" in={showLogin} timeout={transitionDuration} mountOnEnter>
          <Box
            sx={{
              width: { xs: '100%', md: '40%' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: { xs: 2, sm: 4 },
              boxSizing: 'border-box',
              backgroundColor: 'white',
              overflowY: 'auto',
              height: '100%'
            }}
          >
            <Box sx={{ width: '100%', maxWidth: 500, py: 4 }}>
              <Box sx={{ mb: 5, textAlign: 'center' }}>
                <Box 
                  component="img"
                  src={HUBT_LOGO}
                  alt="HUBT Logo"
                  sx={{
                    height: 100, 
                    mb: 2
                  }}
                />
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5, color: '#0c4da2' }}>
                  HUBT Admin
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 1, color: '#0c4da2' }}>
                  Hệ thống quản lý sinh viên
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Đại học Kinh doanh và Công nghệ Hà Nội
                </Typography>
              </Box>
          
              {(error || authError) && (
                <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
                  {error || authError}
                </Alert>
              )}
          
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#0c4da2' }}>
                Đăng nhập
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Nhập thông tin đăng nhập để tiếp tục
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Tên đăng nhập hoặc email"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  disabled={loading}
                  error={Boolean(error && error.includes('đăng nhập'))}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Mật khẩu"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  disabled={loading}
                  error={Boolean(error && error.includes('mật khẩu'))}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={togglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        value="remember"
                        color="primary"
                        checked={formData.remember}
                        onChange={(e) => setFormData({...formData, remember: e.target.checked})}
                        disabled={loading}
                      />
                    }
                    label="Nhớ mật khẩu"
                  />
                  
                  <Link to="#" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" color="primary">
                      Quên mật khẩu?
                    </Typography>
                  </Link>
                </Box>
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ 
                    mt: 1, 
                    mb: 3, 
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#0c4da2',
                    '&:hover': {
                      backgroundColor: '#0a3d82',
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Đăng nhập'}
                </Button>
                
                
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Hoặc
                  </Typography>
                </Divider>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Google />}
                  onClick={handleGmailLogin}
                  disabled={gmailLoading || loading}
                  sx={{ 
                    mb: 3, 
                    py: 1.5,
                    borderRadius: 2
                  }}
                >
                  {gmailLoading ? <CircularProgress size={24} /> : 'Đăng nhập bằng Gmail'}
                </Button>
                
                <Typography variant="body2" color="text.secondary" align="center">
                  © {new Date().getFullYear()} HUBT University. All rights reserved.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Slide>
        
        {/* University Information Section - Right Side */}
        {!isMobile && (
          <Slide direction="left" in={showLogin} timeout={transitionDuration} mountOnEnter>
            <Box 
              sx={{
                width: { md: '60%' },
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                backgroundImage: 'url("https://hubt.edu.vn/uploads/news/1677216557_z4121432142113_f52bdeb3ad9e0c99dffcc96acd3c60fc.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: 'white',
                overflowY: 'auto',
                height: '100%',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(12, 77, 162, 0.85)', // HUBT blue overlay
                  zIndex: 0
                }
              }}
            >
              <Box sx={{ 
                position: 'relative',
                zIndex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: { xs: 3, sm: 5, md: 6 },
                overflow: 'auto'
              }}>
                {/* University header removed */}
                
                {/* University intro */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    Trường Đại học Kinh doanh và Công nghệ Hà Nội
                  </Typography>
                  
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                    Hanoi University of Business and Technology
                  </Typography>
                  
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)', width: '60%', mb: 4 }} />
                  
                  <Typography variant="body1" sx={{ maxWidth: '90%' }}>
                    Trường Đại học Kinh doanh và Công nghệ Hà Nội là cơ sở giáo dục đại học đa ngành, 
                    đa lĩnh vực hàng đầu tại Việt Nam, đào tạo nguồn nhân lực chất lượng cao 
                    và nghiên cứu khoa học phục vụ phát triển kinh tế - xã hội.
                  </Typography>
                </Box>
                
                {/* Information cards */}
                <Fade in={infoSectionVisible} timeout={transitionDuration}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                      Thông tin trường
                    </Typography>
                    
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={12} lg={6}>
                        <Card sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.15)', 
                          backdropFilter: 'blur(10px)',
                          borderRadius: 3,
                          p: 3,
                          height: '100%',
                          transition: 'transform 0.3s',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                          }
                        }}>
                          <Box sx={{ display: 'flex', mb: 2 }}>
                            <LocationOn sx={{ fontSize: 40, color: 'white' }} />
                          </Box>
                          <Typography variant="h6" gutterBottom>
                            Địa chỉ
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Số 29A, Ngõ 124, Phố Vĩnh Tuy, Quận Hai Bà Trưng, Hà Nội
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} lg={6}>
                        <Card sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.15)', 
                          backdropFilter: 'blur(10px)',
                          borderRadius: 3,
                          p: 3,
                          height: '100%',
                          transition: 'transform 0.3s',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                          }
                        }}>
                          <Box sx={{ display: 'flex', mb: 2 }}>
                            <Groups sx={{ fontSize: 40, color: 'white' }} />
                          </Box>
                          <Typography variant="h6" gutterBottom>
                            Sinh viên
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Đào tạo đa ngành, đa lĩnh vực với hơn 20,000 sinh viên
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    {/* University Stats */}
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mt: 5, mb: 3 }}>
                      Thống kê
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {universityInfo.map((section, index) => (
                        <Grid item xs={12} md={6} lg={4} key={index}>
                          <Card sx={{ 
                            backgroundColor: 'rgba(255,255,255,0.15)', 
                            backdropFilter: 'blur(10px)',
                            borderRadius: 3,
                            p: 3,
                            height: '100%',
                            transition: 'transform 0.3s',
                            '&:hover': {
                              transform: 'translateY(-5px)'
                            }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar 
                                sx={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                                  width: 40, 
                                  height: 40,
                                  mr: 2
                                }}
                              >
                                {section.icon}
                              </Avatar>
                              <Typography variant="h6" fontWeight="bold">
                                {section.title}
                              </Typography>
                            </Box>
                            
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mb: 2 }} />
                            
                            {section.items.map((item, itemIndex) => (
                              <Box key={itemIndex} sx={{ mb: 1 }}>
                                <Typography variant="body2" color="rgba(255,255,255,0.7)" gutterBottom>
                                  {item.name}
                                </Typography>
                                <Typography variant="body1" fontWeight="500">
                                  {item.value}
                                </Typography>
                              </Box>
                            ))}
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Fade>
                
                {/* School motto */}
                <Box sx={{ mt: 'auto', pt: 4 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Phương châm đào tạo
                  </Typography>
                  <Typography variant="h6" sx={{ fontStyle: 'italic', opacity: 0.9 }}>
                    "Kiến thức - Kỹ năng - Trách nhiệm - Sáng tạo"
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Slide>
        )}
      </Box>
    </Box>
  );
};

export default Login; 