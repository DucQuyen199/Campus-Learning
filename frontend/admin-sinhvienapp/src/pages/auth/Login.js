import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Login = () => {
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Formik validation schema
  const validationSchema = Yup.object({
    username: Yup.string()
      .required('Tên đăng nhập hoặc email không được để trống'),
    password: Yup.string()
      .required('Mật khẩu không được để trống'),
  });
  
  // Formik form handling
  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      remember: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError('');
        
        await login(values.username, values.password);
        
        // If login successful, redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        const errorMsg = error?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
  });
  
  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      component="form"
      onSubmit={formik.handleSubmit}
      noValidate
      sx={{ mt: 1 }}
    >
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
        Đăng nhập quản trị
      </Typography>
      
      {(error || authError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || authError}
        </Alert>
      )}
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="username"
        label="Tên đăng nhập hoặc Email"
        name="username"
        autoComplete="username"
        autoFocus
        value={formik.values.username}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.username && Boolean(formik.errors.username)}
        helperText={formik.touched.username && formik.errors.username}
        disabled={loading}
        sx={{ mb: 2 }}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Mật khẩu"
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="current-password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password}
        disabled={loading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleTogglePassword}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1 }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              name="remember"
              color="primary"
              checked={formik.values.remember}
              onChange={formik.handleChange}
            />
          }
          label="Ghi nhớ đăng nhập"
        />
        
        <Link
          component={RouterLink}
          to="/forgot-password"
          variant="body2"
          underline="hover"
        >
          Quên mật khẩu?
        </Link>
      </Box>
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        size="large"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
        sx={{
          mt: 2,
          mb: 2,
          py: 1.2,
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: (theme) => theme.shadows[2],
          '&:hover': {
            boxShadow: (theme) => theme.shadows[4],
          },
        }}
      >
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </Button>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2">
          Bạn cần hỗ trợ? <Link href="mailto:support@hubt.edu.vn">Liên hệ IT</Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Login; 