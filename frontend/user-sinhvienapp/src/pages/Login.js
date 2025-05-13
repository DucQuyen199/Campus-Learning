import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import {
  Box,
  Typography,
  TextField,
  Button,
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
  CardMedia,
  Chip,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineContent,
  TimelineDot,
  TimelineConnector,
  Fade,
  Grow,
  Zoom,
  Slide,
  useScrollTrigger
} from '@mui/material';
import { 
  LockOutlined, 
  Visibility, 
  VisibilityOff, 
  Google, 
  School,
  LocationOn,
  Groups,
  InsertChart,
  Assignment,
  Laptop,
  Timeline as TimelineIcon,
  Handshake,
  Bookmark,
  LocalLibrary
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

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
    icon: <Bookmark />,
    items: [
      { name: 'Số ngành đào tạo đại học', value: '30 ngành' },
      { name: 'Số ngành đào tạo sau đại học', value: '12 ngành' },
      { name: 'Chương trình liên kết quốc tế', value: '8 chương trình' },
      { name: 'Tỷ lệ sinh viên có việc làm sau tốt nghiệp', value: '95%' }
    ]
  }
];

// Admission score data by year for different majors
const admissionScoresByYear = [
  {
    year: '2024',
    scores: [
      { major: 'Công nghệ thông tin', score: '23.5', note: 'Tăng' },
      { major: 'Quản trị kinh doanh', score: '24.0', note: 'Tăng' },
      { major: 'Kế toán', score: '21.8', note: 'Tăng' },
      { major: 'Marketing', score: '22.5', note: 'Tăng' },
      { major: 'Ngôn ngữ Anh', score: '23.2', note: 'Tăng' },
      { major: 'Tài chính - Ngân hàng', score: '22.0', note: 'Tăng' }
    ]
  },
  {
    year: '2023',
    scores: [
      { major: 'Công nghệ thông tin', score: '22.0', note: 'Tăng' },
      { major: 'Quản trị kinh doanh', score: '22.5', note: 'Tăng' },
      { major: 'Kế toán', score: '20.5', note: 'Giữ nguyên' },
      { major: 'Marketing', score: '21.2', note: 'Tăng' },
      { major: 'Ngôn ngữ Anh', score: '22.0', note: 'Tăng' },
      { major: 'Tài chính - Ngân hàng', score: '20.8', note: 'Tăng' }
    ]
  },
  {
    year: '2022',
    scores: [
      { major: 'Công nghệ thông tin', score: '21.0', note: 'Tăng' },
      { major: 'Quản trị kinh doanh', score: '21.5', note: 'Tăng' },
      { major: 'Kế toán', score: '20.5', note: 'Tăng' },
      { major: 'Marketing', score: '20.0', note: 'Tăng' },
      { major: 'Ngôn ngữ Anh', score: '21.0', note: 'Tăng' },
      { major: 'Tài chính - Ngân hàng', score: '20.0', note: 'Giữ nguyên' }
    ]
  },
  {
    year: '2021',
    scores: [
      { major: 'Công nghệ thông tin', score: '20.0', note: '' },
      { major: 'Quản trị kinh doanh', score: '20.5', note: '' },
      { major: 'Kế toán', score: '19.5', note: '' },
      { major: 'Marketing', score: '19.0', note: '' },
      { major: 'Ngôn ngữ Anh', score: '20.0', note: '' },
      { major: 'Tài chính - Ngân hàng', score: '20.0', note: '' }
    ]
  }
];

// Partnerships data
const partnerships = [
  { name: 'FPT Corporation', type: 'Đối tác chiến lược', logo: 'fpt_logo.png', description: 'Hợp tác trong đào tạo công nghệ và cung cấp cơ hội thực tập' },
  { name: 'VinGroup', type: 'Đối tác tuyển dụng', logo: 'vingroup_logo.png', description: 'Tuyển dụng sinh viên tốt nghiệp và hỗ trợ học bổng' },
  { name: 'Samsung Việt Nam', type: 'Đối tác đào tạo', logo: 'samsung_logo.png', description: 'Phát triển chương trình đào tạo kỹ sư chất lượng cao' },
  { name: 'Microsoft Việt Nam', type: 'Đối tác công nghệ', logo: 'microsoft_logo.png', description: 'Cung cấp công nghệ và nền tảng học tập' },
  { name: 'KPMG Việt Nam', type: 'Đối tác tài chính', logo: 'kpmg_logo.png', description: 'Đào tạo chuyên sâu về tài chính, kiểm toán' }
];

// University rankings and achievements
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
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { login, loginWithGmail, error: authError, loading, isAuthenticated } = useAuth();
  
  // Refs for scroll animations
  const infoSectionRef = useRef(null);
  const scoresSectionRef = useRef(null);
  const partnershipsSectionRef = useRef(null);
  const achievementsSectionRef = useRef(null);
  
  // Scroll trigger
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100
  });
  
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
  const [showInfo, setShowInfo] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [showPartners, setShowPartners] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  
  // Scroll animation states
  const [infoSectionVisible, setInfoSectionVisible] = useState(false);
  const [scoresSectionVisible, setScoresSectionVisible] = useState(false);
  const [partnershipsSectionVisible, setPartnershipsSectionVisible] = useState(false);
  const [achievementsSectionVisible, setAchievementsSectionVisible] = useState(false);
  
  // Setup intersection observers for scroll animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2
    };
    
    const infoObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setInfoSectionVisible(true);
      }
    }, observerOptions);
    
    const scoresObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setScoresSectionVisible(true);
      }
    }, observerOptions);
    
    const partnershipsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPartnershipsSectionVisible(true);
      }
    }, observerOptions);
    
    const achievementsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setAchievementsSectionVisible(true);
      }
    }, observerOptions);
    
    if (infoSectionRef.current) infoObserver.observe(infoSectionRef.current);
    if (scoresSectionRef.current) scoresObserver.observe(scoresSectionRef.current);
    if (partnershipsSectionRef.current) partnershipsObserver.observe(partnershipsSectionRef.current);
    if (achievementsSectionRef.current) achievementsObserver.observe(achievementsSectionRef.current);
    
    return () => {
      if (infoSectionRef.current) infoObserver.unobserve(infoSectionRef.current);
      if (scoresSectionRef.current) scoresObserver.unobserve(scoresSectionRef.current);
      if (partnershipsSectionRef.current) partnershipsObserver.unobserve(partnershipsSectionRef.current);
      if (achievementsSectionRef.current) achievementsObserver.unobserve(achievementsSectionRef.current);
    };
  }, []);
  
  // Trigger animations on mount with sequenced timing
  useEffect(() => {
    const timer1 = setTimeout(() => setShowLogin(true), 300);
    const timer2 = setTimeout(() => setShowInfo(true), 600);
    const timer3 = setTimeout(() => setShowScores(true), 900);
    const timer4 = setTimeout(() => setShowPartners(true), 1200);
    const timer5 = setTimeout(() => setShowAchievements(true), 1500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
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
        // Store user data in Redux
        dispatch(setUser(result.user));
        
        // Redirect to dashboard after successful login
        navigate('/');
      } else {
        setError(result.error || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.');
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
      return;
    }
    
    try {
      setGmailLoading(true);
      setError('');
      const result = await loginWithGmail(email);
      
      if (result.success) {
        // Store user data in Redux
        dispatch(setUser(result.user));
        
        // Redirect to dashboard after successful login
        navigate('/');
      } else {
        setError(result.error || 'Đăng nhập bằng Gmail thất bại');
      }
    } catch (err) {
      setError('Đăng nhập bằng Gmail thất bại. Vui lòng thử lại sau.');
    } finally {
      setGmailLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#f5f5f5'
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        minHeight: { xs: 'auto', md: '100vh' }
      }}>
        {/* Login Form - Left Side with Slide from Left Animation */}
        <Slide direction="right" in={showLogin} timeout={transitionDuration} mountOnEnter unmountOnExit>
      <Box
        sx={{
              flex: { md: '0 0 40%' },
          display: 'flex',
          alignItems: 'center',
              justifyContent: 'center',
              padding: { xs: 2, sm: 4, md: 6 },
              boxSizing: 'border-box',
              backgroundColor: 'white'
            }}
          >
            <Box sx={{ width: '100%', maxWidth: 450 }}>
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
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: '#0c4da2' }}>
                  Đại học Kinh doanh và Công nghệ Hà Nội
          </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Hệ thống Quản lý Sinh viên
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
                Nhập thông tin đăng nhập của bạn để tiếp tục
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
                  © 2023 HUBT Connect
                </Typography>
              </Box>
            </Box>
          </Box>
        </Slide>
        
        {/* HUBT Information Section - Right Side with Slide from Right Animation */}
        {!isMobile && (
          <Slide direction="left" in={showLogin} timeout={transitionDuration} mountOnEnter unmountOnExit>
            <Box 
              sx={{
                flex: { md: '0 0 60%' },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: 8,
                position: 'relative',
                backgroundImage: 'url("https://hubt.edu.vn/uploads/news/1677216557_z4121432142113_f52bdeb3ad9e0c99dffcc96acd3c60fc.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: 'white',
                overflow: 'hidden',
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
                flexDirection: 'column'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <Box 
                    component="img"
                    src={HUBT_LOGO}
                    alt="HUBT Logo"
                    sx={{ 
                      height: 60, 
                      mr: 2,
                      backgroundColor: 'white',
                      padding: 1,
                      borderRadius: 1
                    }}
                  />
                  <Typography variant="h4" fontWeight="bold">
                    HUBT
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 6 }}>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    Trường Đại học Kinh doanh và Công nghệ Hà Nội
                  </Typography>
                  
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                    Hanoi University of Business and Technology
                  </Typography>
                  
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)', width: '60%', mb: 4 }} />
                  
                  <Typography variant="body1" sx={{ maxWidth: '80%' }}>
                    Trường Đại học Kinh doanh và Công nghệ Hà Nội là cơ sở giáo dục đại học đa ngành, đa lĩnh vực hàng đầu tại Việt Nam, đào tạo nguồn nhân lực chất lượng cao và nghiên cứu khoa học phục vụ phát triển kinh tế - xã hội.
                  </Typography>
                </Box>
                
                <Grid container spacing={4} sx={{ mb: 6 }}>
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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
                        <InsertChart sx={{ fontSize: 40, color: 'white' }} />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        Tỷ lệ việc làm
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Tỷ lệ sinh viên có việc làm sau tốt nghiệp: 95%
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
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
                        <Laptop sx={{ fontSize: 40, color: 'white' }} />
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        Công nghệ
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Áp dụng công nghệ hiện đại trong giảng dạy và nghiên cứu
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 'auto' }}>
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

      {/* Additional University Information Section - Below Login Form */}
      <Box 
        ref={infoSectionRef}
        sx={{ 
          py: 6, 
          px: { xs: 2, sm: 4, md: 8 },
          backgroundColor: 'white',
          borderTop: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <Fade in={infoSectionVisible} timeout={transitionDuration}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight="bold" color="#0c4da2" gutterBottom>
              Thông tin Trường Đại học Kinh doanh và Công nghệ Hà Nội
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
              HUBT là trường đại học hàng đầu trong lĩnh vực đào tạo kinh doanh và công nghệ, 
              với chất lượng giảng dạy xuất sắc và cơ sở vật chất hiện đại.
            </Typography>
          </Box>
        </Fade>

        {/* University general information section with alternating side animations */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {universityInfo.map((section, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Slide 
                direction={index % 2 === 0 ? "right" : "left"} 
                in={infoSectionVisible} 
                timeout={transitionDuration} 
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    height: '100%',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 3,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar 
                      sx={{ 
                        backgroundColor: '#0c4da2', 
                        width: 50, 
                        height: 50,
                        mr: 2
                      }}
                    >
                      {section.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      {section.title}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Stack spacing={2}>
                    {section.items.map((item, itemIndex) => (
                      <Box key={itemIndex}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {item.name}
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Slide>
            </Grid>
          ))}
        </Grid>

        {/* Admission Scores Section */}
        <Box 
          ref={scoresSectionRef}
          sx={{ mb: 6 }}
        >
          <Fade in={scoresSectionVisible} timeout={transitionDuration}>
            <Typography variant="h5" fontWeight="bold" color="#0c4da2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
              Điểm Chuẩn Đại Học HUBT (2021-2024)
            </Typography>
          </Fade>
          
          <Slide direction="up" in={scoresSectionVisible} timeout={transitionDuration}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: { xs: 2, md: 4 }, 
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 3
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                  <Box>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      sx={{ 
                        mb: 2,
                        pb: 1,
                        borderBottom: '2px solid #0c4da2'
                      }}
                    >
                      Năm 2024
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Công nghệ thông tin</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">23.5</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Quản trị kinh doanh</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">24.0</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Kế toán</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">21.8</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Marketing</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">22.5</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Ngôn ngữ Anh</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">23.2</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Tài chính - Ngân hàng</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">22.0</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                  <Box>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      sx={{ 
                        mb: 2,
                        pb: 1,
                        borderBottom: '2px solid #0c4da2'
                      }}
                    >
                      Năm 2023
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Công nghệ thông tin</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">22.0</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Quản trị kinh doanh</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">22.5</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Kế toán</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">20.5</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Marketing</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">21.2</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Ngôn ngữ Anh</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">22.0</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Tài chính - Ngân hàng</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">20.8</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                  <Box>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      sx={{ 
                        mb: 2,
                        pb: 1,
                        borderBottom: '2px solid #0c4da2'
                      }}
                    >
                      Năm 2022
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Công nghệ thông tin</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">21.0</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Quản trị kinh doanh</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">21.5</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Kế toán</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">20.5</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Marketing</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">20.0</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Ngôn ngữ Anh</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">21.0</Typography>
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}
                        >
                          ▲
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Tài chính - Ngân hàng</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">20.0</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                  <Box>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      sx={{ 
                        mb: 2,
                        pb: 1,
                        borderBottom: '2px solid #0c4da2'
                      }}
                    >
                      Năm 2021
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Công nghệ thông tin</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">20.0</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Quản trị kinh doanh</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">20.5</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Kế toán</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">19.5</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Marketing</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">19.0</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Ngôn ngữ Anh</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">20.0</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography fontWeight="500">Tài chính - Ngân hàng</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography fontWeight="500">20.0</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Slide>
        </Box>

        {/* Partnerships Section with alternating animations */}
        <Box 
          ref={partnershipsSectionRef}
          sx={{ mb: 6 }}
        >
          <Fade in={partnershipsSectionVisible} timeout={transitionDuration}>
            <Typography variant="h5" fontWeight="bold" color="#0c4da2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
              Đối Tác Hợp Tác
            </Typography>
          </Fade>
          
          <Grid container spacing={3}>
            {partnerships.map((partner, index) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                <Slide 
                  direction={index % 2 === 0 ? "right" : "left"} 
                  in={partnershipsSectionVisible} 
                  timeout={transitionDuration} 
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      height: '100%',
                      textAlign: 'center',
                      borderRadius: 3,
                      border: '1px solid rgba(0,0,0,0.08)',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        mx: 'auto', 
                        mb: 2,
                        backgroundColor: '#f5f5f5',
                        color: '#0c4da2'
                      }}
                    >
                      <Handshake />
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {partner.name}
                    </Typography>
                    <Chip 
                      label={partner.type} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                      sx={{ mb: 2 }} 
                    />
                <Typography variant="body2" color="text.secondary">
                      {partner.description}
                </Typography>
                  </Paper>
                </Slide>
              </Grid>
            ))}
            </Grid>
        </Box>

        {/* Achievements Section */}
        <Box 
          ref={achievementsSectionRef}
          sx={{ mb: 6 }}
        >
          <Fade in={achievementsSectionVisible} timeout={transitionDuration}>
            <Typography variant="h5" fontWeight="bold" color="#0c4da2" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
              Thành Tựu & Giải Thưởng
            </Typography>
          </Fade>
          
          <Slide direction="up" in={achievementsSectionVisible} timeout={transitionDuration}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: { xs: 2, md: 4 }, 
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 3
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {achievements.map((achievement, index) => (
                  <Grow 
                    key={index}
                    in={achievementsSectionVisible} 
                    timeout={transitionDuration}
                    style={{ transformOrigin: '0 0 0', transitionDelay: `${index * 150}ms` }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: '#0c4da2', 
                          width: 40, 
                          height: 40, 
                          fontSize: 16, 
                          fontWeight: 'bold',
                          mr: 2 
                        }}
                      >
                        {achievement.year}
                      </Avatar>
                      <Typography variant="body1" fontWeight="500">
                        {achievement.title}
                      </Typography>
                    </Box>
                  </Grow>
                ))}
              </Box>
            </Paper>
          </Slide>
        </Box>

        {/* Badges and Chips with staggered fade in */}
        <Slide direction="up" in={achievementsSectionVisible} timeout={transitionDuration}>
          <Box sx={{ textAlign: 'center' }}>
            {["Đơn vị đào tạo xuất sắc 2023", "Top 10 trường đại học về công nghệ", 
              "Môi trường học tập năng động", "Liên kết doanh nghiệp mạnh mẽ", 
              "Tỷ lệ việc làm sau tốt nghiệp cao"].map((chipText, index) => (
              <Fade
                key={index}
                in={achievementsSectionVisible}
                timeout={transitionDuration}
                style={{ transitionDelay: `${800 + (index * 200)}ms` }}
              >
                <Chip 
                  icon={index === 0 ? <LocalLibrary /> : 
                        index === 1 ? <School /> :
                        index === 2 ? <Groups /> :
                        index === 3 ? <Handshake /> : <InsertChart />}
                  label={chipText} 
                  color="primary" 
                  variant={index % 2 === 0 ? "filled" : "outlined"}
                  sx={{ mr: 1, mb: 1 }} 
                />
              </Fade>
            ))}
          </Box>
        </Slide>
      </Box>
    </Box>
  );
};

export default Login; 