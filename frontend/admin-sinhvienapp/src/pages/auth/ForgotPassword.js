/*-----------------------------------------------------------------
* File: ForgotPassword.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState } from 'react';
import { TextField, Button, Typography, Paper, Box, Alert } from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const ForgotPassword = () => {
  const [submitStatus, setSubmitStatus] = useState({ success: false, error: null });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await authService.forgotPassword(values.email);
      setSubmitStatus({ success: true, error: null });
    } catch (error) {
      setSubmitStatus({ 
        success: false, 
        error: error.response?.data?.message || 'An error occurred. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Forgot Password
        </Typography>

        {submitStatus.success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Password reset link sent. Please check your email.
          </Alert>
        )}

        {submitStatus.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitStatus.error}
          </Alert>
        )}

        <Formik
          initialValues={{ email: '' }}
          validationSchema={forgotPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
            <Form>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
                margin="normal"
                variant="outlined"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                sx={{ mt: 3, mb: 2 }}
              >
                Send Reset Link
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

export default ForgotPassword; 
