/*-----------------------------------------------------------------
* File: Header.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student portal application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  Button,
  useTheme,
  alpha,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ handleDrawerToggle, insideUnifiedForm = false, open, drawerWidthPercentage = 20 }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Menu states
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  
  // Handle menu open/close
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  const handleOpenNotifMenu = (event) => {
    setAnchorElNotif(event.currentTarget);
  };
  
  const handleCloseNotifMenu = () => {
    setAnchorElNotif(null);
  };
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(10px)',
        background: alpha(theme.palette.background.default, 0.95),
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between',
        height: '100%',
        px: { xs: 1, sm: 2 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2, 
              display: { sm: 'none' },
              color: theme.palette.primary.main
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{
              fontWeight: 600,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
              Hệ thống thông tin tín chỉ
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Notifications */}
          <Tooltip title="Thông báo">
            <IconButton
              aria-label="show notifications"
              aria-controls="notifications-menu"
              aria-haspopup="true"
              onClick={handleOpenNotifMenu}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <Badge badgeContent={3} color="error" variant="dot">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Logout Button */}
          <Tooltip title="Đăng xuất">
            <Button 
              variant="text"
              color="primary" 
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{ 
                ml: { xs: 0.5, md: 1 }, 
                display: { xs: 'none', md: 'flex' },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              Đăng xuất
            </Button>
          </Tooltip>
          
          <Menu
            id="notifications-menu"
            anchorEl={anchorElNotif}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElNotif)}
            onClose={handleCloseNotifMenu}
            TransitionComponent={Fade}
            PaperProps={{
              elevation: 2,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
                mt: 1.5,
                width: 320,
                borderRadius: '10px',
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
          >
            <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Thông báo
              </Typography>
            </Box>
            
            <MenuItem onClick={handleCloseNotifMenu} sx={{ py: 1.5 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                width: '100%'
              }}>
                <Typography variant="body2" fontWeight={500}>
                  Lịch thi giữa kỳ đã được cập nhật
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  2 giờ trước
                </Typography>
              </Box>
            </MenuItem>
            
            <MenuItem onClick={handleCloseNotifMenu} sx={{ py: 1.5 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                width: '100%'
              }}>
                <Typography variant="body2" fontWeight={500}>
                  Hạn đóng học phí: 15/10/2023
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  1 ngày trước
                </Typography>
              </Box>
            </MenuItem>
            
            <MenuItem onClick={handleCloseNotifMenu} sx={{ py: 1.5 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                width: '100%'
              }}>
                <Typography variant="body2" fontWeight={500}>
                  Mở đăng ký học kỳ mới
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  3 ngày trước
                </Typography>
              </Box>
            </MenuItem>
            
            <Box sx={{ p: 1, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography 
                variant="body2" 
                color="primary" 
                sx={{ cursor: 'pointer', fontWeight: 500 }}
                onClick={() => {
                  navigate('/notifications');
                  handleCloseNotifMenu();
                }}
              >
                Xem tất cả thông báo
              </Typography>
            </Box>
          </Menu>
          
          {/* User menu */}
          <Box sx={{ flexGrow: 0, ml: 0.5 }}>
            <Tooltip title="Tùy chọn tài khoản">
              <IconButton 
                onClick={handleOpenUserMenu} 
                sx={{ 
                  p: 0,
                  ml: 0.5,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                {currentUser?.Avatar ? (
                  <Avatar 
                    alt={currentUser.FullName} 
                    src={currentUser.Avatar}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <AccountCircle sx={{ width: 32, height: 32 }} />
                )}
              </IconButton>
            </Tooltip>
            
            <Menu
              id="user-menu"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              TransitionComponent={Fade}
              PaperProps={{
                elevation: 2,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
                  mt: 1.5,
                  minWidth: 180,
                  borderRadius: '10px',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
            >
              <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {currentUser?.FullName || 'Tài khoản'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentUser?.Email || currentUser?.StudentID || ''}
                </Typography>
              </Box>
              
              <MenuItem onClick={() => {
                navigate('/profile');
                handleCloseUserMenu();
              }} sx={{ py: 1.5 }}>
                <Typography variant="body2">
                  Thông tin cá nhân
                </Typography>
              </MenuItem>
              
              <MenuItem onClick={() => {
                navigate('/profile-settings');
                handleCloseUserMenu();
              }} sx={{ py: 1.5 }}>
                <Typography variant="body2">
                  Thiết lập tài khoản
                </Typography>
              </MenuItem>
              
              <Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                <MenuItem 
                  onClick={handleLogout} 
                  sx={{ 
                    py: 1.5,
                    color: theme.palette.error.main 
                  }}
                >
                  <Typography variant="body2">
                    Đăng xuất
                  </Typography>
                </MenuItem>
              </Box>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 
