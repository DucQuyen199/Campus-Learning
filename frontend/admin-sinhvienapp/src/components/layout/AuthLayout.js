import React from 'react';
import { Box, Paper, Container, Typography, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.grey[50],
        backgroundImage: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: theme.spacing(3),
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(25,118,210,0.1) 0%, rgba(25,118,210,0) 70%)',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(156,39,176,0.1) 0%, rgba(156,39,176,0) 70%)',
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="sm" sx={{ zIndex: 1 }}>
        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            padding: 0,
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }}
        >
          <Box
            sx={{
              padding: 3,
              textAlign: 'center',
              background: 'linear-gradient(to right, #1976d2, #2196f3)',
              color: 'white',
            }}
          >
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              HUBT Admin
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 1, opacity: 0.9 }}>
              Hệ thống quản lý sinh viên
            </Typography>
          </Box>
          
          <Box sx={{ padding: 4 }}>
            <Outlet />
          </Box>
        </Paper>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} HUBT University. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthLayout; 