/*-----------------------------------------------------------------
* File: MainLayout.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student portal application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, useMediaQuery, Fade, Paper, Backdrop, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

// Background image URL
const BACKGROUND_IMAGE = 'https://cdn.amebaowndme.com/madrid-prd/madrid-web/images/sites/558221/b7a846fbe1acc937e6e7af673c329404_0b4068fb3dd7a82a39637443331844b1.jpg';

// Responsive drawer width settings
const DRAWER_WIDTH = {
  xs: '100%',      // Mobile - full width when opened
  sm: '300px',     // Tablet - fixed width
  md: '280px',     // Small desktop - fixed width
  lg: '20%'        // Large desktop - percentage based
};

const MainLayout = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const location = useLocation();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isSmallDesktop = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  // State to track if sidebar is open - always true for desktop, toggle on mobile/tablet
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [loading, setLoading] = useState(false);

  // Auto-close sidebar on mobile
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
    
    // Show loading animation on route change
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [location, isMobile]);

  // Toggle sidebar
  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Determine current drawer width based on screen size
  const getDrawerWidth = () => {
    if (isMobile) return DRAWER_WIDTH.xs;
    if (isTablet) return DRAWER_WIDTH.sm;
    if (isSmallDesktop) return DRAWER_WIDTH.md;
    return DRAWER_WIDTH.lg;
  };
  
  const currentDrawerWidth = getDrawerWidth();

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'relative',
      p: 0,
      transition: theme.transitions.create(['padding'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.standard,
      }),
      bgcolor: theme.palette.background.default,
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
        opacity: 0.05,
        zIndex: -1
      }
    }}>
      <CssBaseline />
      
      {/* Main container - full screen */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          borderRadius: 0,
          overflow: 'hidden',
          flexGrow: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          transition: theme.transitions.create(['box-shadow'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        {/* Header */}
        <Box sx={{ 
          width: '100%', 
          zIndex: theme.zIndex.drawer + 1,
          flexShrink: 0,
          height: { xs: '60px', sm: '64px', md: '70px' },
          transition: theme.transitions.create(['height'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shorter,
          }),
        }}>
          <Header 
            insideUnifiedForm={false}
            open={sidebarOpen}
            handleDrawerToggle={handleDrawerToggle}
            isMobile={isMobile}
            drawerWidth={currentDrawerWidth}
          />
        </Box>
        
        {/* Content area */}
        <Box sx={{ 
          display: 'flex', 
          flexGrow: 1,
          width: '100%',
          height: { 
            xs: 'calc(100% - 60px)', 
            sm: 'calc(100% - 64px)',
            md: 'calc(100% - 70px)' 
          },
          overflow: 'hidden',
        }}>
          {/* Sidebar - different behavior for mobile vs. desktop */}
          <Box
            component="aside"
            sx={{
              width: sidebarOpen ? currentDrawerWidth : 0,
              height: '100%',
              borderRight: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
              position: isMobile ? 'absolute' : 'relative',
              zIndex: isMobile ? theme.zIndex.drawer : 'auto',
              transition: theme.transitions.create(['width', 'transform'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              boxShadow: isMobile ? '0 0 20px rgba(0, 0, 0, 0.1)' : 'none',
              transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              visibility: (sidebarOpen) ? 'visible' : 'hidden',
            }}
          >
            {sidebarOpen && (
              <Sidebar 
                insideUnifiedForm={false}
                drawerWidth="100%"
                open={sidebarOpen}
                handleDrawerToggle={handleDrawerToggle}
                isMobile={isMobile}
                currentUser={currentUser}
              />
            )}
          </Box>
          
          {/* Backdrop for mobile when sidebar is open */}
          {isMobile && sidebarOpen && (
            <Backdrop
              sx={{ 
                position: 'absolute', 
                zIndex: theme.zIndex.drawer - 1,
                color: '#fff',
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
              }}
              open={true}
              onClick={handleDrawerToggle}
            />
          )}
          
          {/* Main Content area with loading indicator */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: isMobile 
                ? '100%' 
                : `calc(100% - ${sidebarOpen ? currentDrawerWidth : '0px'})`,
              height: '100%',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              bgcolor: 'rgba(255, 255, 255, 0.5)',
              p: { xs: 1, md: 2 },
            }}
          >
            {loading ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <CircularProgress color="primary" size={40} />
              </Box>
            ) : (
              <Fade in={!loading} timeout={300}>
                <Box sx={{ height: '100%' }}>
                  <Outlet />
                </Box>
              </Fade>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout; 
