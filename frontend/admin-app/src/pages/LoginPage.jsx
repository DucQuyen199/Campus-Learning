/*-----------------------------------------------------------------
* File: LoginPage.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  LinearProgress,
  Link,
  useTheme,
  useMediaQuery,
  Grid,
  Fade,
  Grow
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  School,
  ChevronRight
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const { login, loading, isAuthenticated } = useAuth();
  const { error: notifyError } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  useEffect(() => {
    if (isAuthenticated) {
      const savedPath = localStorage.getItem('auth_redirect');
      if (savedPath) {
        console.log('Redirecting to saved path:', savedPath);
        localStorage.removeItem('auth_redirect');
        navigate(savedPath, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, navigate]);
  
  const validateForm = () => {
    let isValid = true;
    
    if (!identifier) {
      setIdentifierError('Vui lòng nhập username hoặc email');
      isValid = false;
    } else {
      setIdentifierError('');
    }
    
    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await login({
        username: identifier,
        password: password,
        role: 'ADMIN'
      });
      
      // After successful login, check if there's a saved redirect path
      const savedPath = localStorage.getItem('auth_redirect');
      if (savedPath) {
        console.log('Login successful, redirecting to:', savedPath);
        localStorage.removeItem('auth_redirect');
        navigate(savedPath, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.'
      );
    }
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  if (loading) {
    return (
      <Box sx={{ width: '100%', position: 'fixed', top: 0, zIndex: 9999 }}>
        <LinearProgress color="secondary" />
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Background elements */}
      <Box
        sx={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          backgroundColor: theme.palette.primary.main,
          opacity: 0.1,
          borderRadius: '50%',
          top: '-100px',
          left: '-100px',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          backgroundColor: theme.palette.secondary.main,
          opacity: 0.1,
          borderRadius: '50%',
          bottom: '-50px',
          right: '-50px',
          zIndex: 0
        }}
      />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grow in={true} timeout={800}>
          <Paper
            elevation={8}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              height: isMobile ? 'auto' : '600px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row'
            }}
          >
            {/* Left side - Branding panel */}
            {!isMobile && (
              <Box
                sx={{
                  flex: '0 0 45%',
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 4,
                  color: 'white',
                  position: 'relative'
                }}
              >
                <Box
                  component="div"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.1,
                    backgroundImage: 'url(/campus-pattern.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                
                <Fade in={true} timeout={1000}>
                  <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <School sx={{ fontSize: 80, mb: 2 }} />
                    
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                      Campus HUBT
                    </Typography>
                    
                    <Typography variant="h5" fontWeight="light" gutterBottom>
                      Admin Portal
                    </Typography>
                    
                    <Box sx={{ mt: 4, width: '80%', mx: 'auto' }}>
                      <Typography variant="body1" sx={{ opacity: 0.8, mb: 3 }}>
                        Hệ thống quản lý trường học thông minh và hiện đại
                      </Typography>
                      
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          mt: 4
                        }}
                      >
                        {['Quản lý sinh viên', 'Quản lý khóa học', 'Quản lý tài chính'].map((text, index) => (
                          <Box 
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              borderRadius: 2,
                              p: 1,
                              pl: 2
                            }}
                          >
                            <ChevronRight sx={{ fontSize: 18 }} />
                            <Typography variant="body2">{text}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Fade>
              </Box>
            )}
            
            {/* Right side - Login form */}
            <Box
              sx={{
                flex: isMobile ? '1' : '0 0 55%',
                p: { xs: 3, sm: 4, md: 5 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {isMobile && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 4
                  }}
                >
                  <AdminPanelSettings sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    Campus HUBT
                  </Typography>
                </Box>
              )}
              
              <Fade in={true} timeout={1000}>
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    sx={{ mb: 1 }}
                  >
                    Đăng nhập
                  </Typography>
                  
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 4 }}
                  >
                    Vui lòng đăng nhập để truy cập hệ thống quản trị
                  </Typography>
                  
                  {error && (
                    <Alert
                      severity="error"
                      variant="filled"
                      sx={{
                        width: '100%',
                        mb: 3,
                        borderRadius: 2,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      {error}
                    </Alert>
                  )}
                  
                  <Box
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                    sx={{
                      width: '100%',
                      '& .MuiTextField-root': { mb: 3 }
                    }}
                  >
                    <TextField
                      required
                      fullWidth
                      id="identifier"
                      label="Username hoặc Email"
                      name="identifier"
                      autoComplete="username email"
                      autoFocus
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      error={!!identifierError}
                      helperText={identifierError}
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: 2, backgroundColor: 'white' }
                      }}
                      inputProps={{
                        maxLength: 50
                      }}
                    />
                    
                    <TextField
                      required
                      fullWidth
                      name="password"
                      label="Mật khẩu"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={!!passwordError}
                      helperText={passwordError}
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: 2, backgroundColor: 'white' },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{
                        maxLength: 50
                      }}
                    />
                    
                    <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                      <Grid item>
                        <Link
                          href="#"
                          variant="body2"
                          sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            fontWeight: 'medium',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          Quên mật khẩu?
                        </Link>
                      </Grid>
                    </Grid>
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 15px rgba(0,0,0,0.2)'
                        }
                      }}
                      disabled={loading}
                    >
                      Đăng nhập
                    </Button>
                    
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Campus HUBT Admin Portal &copy; {new Date().getFullYear()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Fade>
            </Box>
          </Paper>
        </Grow>
      </Container>
    </Box>
  );
};

export default LoginPage;
