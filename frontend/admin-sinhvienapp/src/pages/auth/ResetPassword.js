import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Paper, Box, Alert } from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Link, useParams, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [tokenValid, setTokenValid] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({ success: false, error: null });

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await authService.verifyResetToken(token);
        setTokenValid(true);
      } catch (error) {
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await authService.resetPassword(token, values.password);
      setSubmitStatus({ success: true, error: null });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setSubmitStatus({ 
        success: false, 
        error: error.response?.data?.message || 'An error occurred. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (tokenValid === null) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', p: 2 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h6" align="center">
            Verifying reset token...
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (tokenValid === false) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', p: 2 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h6" align="center" gutterBottom>
            Invalid or Expired Token
          </Typography>
          <Typography variant="body1" align="center" paragraph>
            The password reset link is invalid or has expired.
          </Typography>
          <Box textAlign="center">
            <Button 
              component={Link} 
              to="/forgot-password" 
              variant="contained" 
              color="primary"
            >
              Request New Reset Link
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>

        {submitStatus.success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Password reset successful! Redirecting to login...
          </Alert>
        )}

        {submitStatus.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitStatus.error}
          </Alert>
        )}

        <Formik
          initialValues={{ password: '', confirmPassword: '' }}
          validationSchema={resetPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
            <Form>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="New Password"
                type="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
                margin="normal"
                variant="outlined"
              />

              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                helperText={touched.confirmPassword && errors.confirmPassword}
                margin="normal"
                variant="outlined"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isSubmitting || submitStatus.success}
                sx={{ mt: 3, mb: 2 }}
              >
                Reset Password
              </Button>

              <Box mt={2} textAlign="center">
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Back to Login
                  </Typography>
                </Link>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

export default ResetPassword; 