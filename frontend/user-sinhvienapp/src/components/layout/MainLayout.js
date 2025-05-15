import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, useMediaQuery, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

// Background image URL (keep this for background)
const BACKGROUND_IMAGE = 'https://cdn.amebaowndme.com/madrid-prd/madrid-web/images/sites/558221/b7a846fbe1acc937e6e7af673c329404_0b4068fb3dd7a82a39637443331844b1.jpg';

// Drawer width as percentage
const drawerWidthPercent = 20;
const drawerWidth = `${drawerWidthPercent}%`;

const MainLayout = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  
  // State to track if sidebar is open
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Auto-close sidebar on mobile/tablet
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Close sidebar when location changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'relative',
      bgcolor: '#f5f7fa',
      p: { xs: 2, md: 3 },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${BACKGROUND_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        opacity: 0.15,
        zIndex: -1
      }
    }}>
      <CssBaseline />
      
      {/* Form thống nhất chứa header, sidebar và nội dung */}
      <Paper
        elevation={2}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          flexGrow: 1,
          bgcolor: 'background.paper',
        }}
      >
        {/* Header trong form thống nhất */}
        <Box sx={{ 
          width: '100%', 
          borderBottom: `1px solid ${theme.palette.divider}`,
          zIndex: theme.zIndex.drawer + 1,
        }}>
          <Header 
            insideUnifiedForm={true}
            open={sidebarOpen}
            handleDrawerToggle={handleDrawerToggle}
            isMobile={isMobile}
            drawerWidthPercentage={drawerWidthPercent}
          />
        </Box>
        
        {/* Container cho sidebar và nội dung */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row',
          flexGrow: 1,
          overflow: 'hidden',
          width: '100%',
          height: 'calc(100% - 70px)', // Chiều cao còn lại sau khi trừ header
        }}>
          {/* Sidebar bên trong form */}
          {(!isMobile || (isMobile && sidebarOpen)) && (
            <Box
              sx={{
                width: isMobile ? '250px' : isTablet ? '250px' : drawerWidth,
                height: '100%',
                borderRight: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                position: isMobile ? 'absolute' : 'relative',
                zIndex: isMobile ? theme.zIndex.drawer : 'auto',
                transition: theme.transitions.create(['width', 'transform'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                boxShadow: isMobile ? '0 0 15px rgba(0, 0, 0, 0.1)' : 'none',
                transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
              }}
            >
              <Sidebar 
                insideUnifiedForm={true}
                drawerWidth="100%"
                open={true}
                handleDrawerToggle={handleDrawerToggle}
                isMobile={isMobile}
              />
            </Box>
          )}
          
          {/* Main Content area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: isMobile ? '100%' : isTablet ? 'calc(100% - 250px)' : `${100 - drawerWidthPercent}%`,
              height: '100%',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default MainLayout; 