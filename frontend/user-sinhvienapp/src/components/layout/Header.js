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
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ handleDrawerToggle }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
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
      position="fixed"
      sx={{
        width: { xs: '100%', sm: `calc(100% - 240px)` },
        ml: { xs: 0, sm: `240px` },
        zIndex: (theme) => theme.zIndex.drawer + 1,
        boxShadow: 2
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
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Hệ thống Quản lý Sinh viên
        </Typography>
        
        {/* Notifications */}
        <IconButton
          size="large"
          aria-label="show notifications"
          aria-controls="notifications-menu"
          aria-haspopup="true"
          onClick={handleOpenNotifMenu}
          color="inherit"
        >
          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        
        {/* Logout Button */}
        <Button 
          color="inherit" 
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          sx={{ ml: 1, display: { xs: 'none', md: 'flex' } }}
        >
          Đăng xuất
        </Button>
        
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
        >
          <MenuItem onClick={handleCloseNotifMenu}>
            <Typography variant="body2">
              Lịch thi giữa kỳ đã được cập nhật
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleCloseNotifMenu}>
            <Typography variant="body2">
              Hạn đóng học phí: 15/10/2023
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleCloseNotifMenu}>
            <Typography variant="body2">
              Mở đăng ký học kỳ mới
            </Typography>
          </MenuItem>
        </Menu>
        
        {/* User menu */}
        <Box sx={{ flexGrow: 0, ml: 1 }}>
          <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
            {currentUser?.Avatar ? (
              <Avatar alt={currentUser.FullName} src={currentUser.Avatar} />
            ) : (
              <AccountCircle />
            )}
          </IconButton>
          
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
          >
            <MenuItem onClick={() => {
              navigate('/profile');
              handleCloseUserMenu();
            }}>
              Thông tin cá nhân
            </MenuItem>
            <MenuItem onClick={() => {
              navigate('/profile-settings');
              handleCloseUserMenu();
            }}>
              Thiết lập tài khoản
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              Đăng xuất
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 