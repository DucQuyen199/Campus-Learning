import React, { useState } from 'react';
import { Box, CssBaseline, AppBar, Toolbar, IconButton, Typography, Drawer, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

// Background image URL
const BACKGROUND_IMAGE = 'https://cdn.amebaowndme.com/madrid-prd/madrid-web/images/sites/558221/b7a846fbe1acc937e6e7af673c329404_0b4068fb3dd7a82a39637443331844b1.jpg';

// Drawer width
const drawerWidth = 240;

const MainLayout = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'relative',
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
      
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          color: 'primary.main',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {currentUser ? `Xin chào, ${currentUser.FullName || currentUser.Username || 'Sinh viên'}` : 'HUBT Connect'}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          overflow: 'auto',
          p: { xs: 2, sm: 3 },
          pt: { xs: 8, sm: 9 },
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout; 