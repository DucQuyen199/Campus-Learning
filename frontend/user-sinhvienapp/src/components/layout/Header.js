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
  ListItemIcon,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Person,
  Settings,
  School
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ 
  open, 
  handleDrawerToggle, 
  isMobile, 
  insideUnifiedForm = false, 
  drawerWidthPercentage = 20 
}) => {
  const theme = useTheme();
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
    handleCloseUserMenu();
  };

  // Khi header nằm trong form thống nhất
  if (insideUnifiedForm) {
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          height: { xs: '64px', sm: '70px' },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 70 }, px: { xs: 1, sm: 2 } }}>
          {/* Mobile menu toggle - chỉ hiển thị trên mobile */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* App title - luôn hiển thị */}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            <School sx={{ mr: 1 }} />
            HUBT Connect
          </Typography>

          <Box sx={{ flexGrow: 1 }} />
          
          {/* Notifications */}
          <Tooltip title="Thông báo">
            <IconButton
              size="large"
              aria-label="show notifications"
              aria-controls="notifications-menu"
              aria-haspopup="true"
              onClick={handleOpenNotifMenu}
              sx={{ 
                ml: 1,
                bgcolor: Boolean(anchorElNotif) ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon color="action" />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User menu */}
          <Box sx={{ ml: 1 }}>
            <Tooltip title="Tài khoản">
              <IconButton 
                onClick={handleOpenUserMenu}
                sx={{ 
                  p: 0.5,
                  bgcolor: Boolean(anchorElUser) ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
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
                  <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                    {currentUser?.FullName?.charAt(0) || 'S'}
                  </Avatar>
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
              PaperProps={{
                elevation: 2,
                sx: {
                  borderRadius: 1.5,
                  minWidth: 180,
                  overflow: 'visible',
                  mt: 1.5,
                  boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)',
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
                }
              }}
            >
              <MenuItem 
                onClick={() => {
                  navigate('/profile');
                  handleCloseUserMenu();
                }}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                Thông tin cá nhân
              </MenuItem>
              
              <MenuItem 
                onClick={() => {
                  navigate('/profile-settings');
                  handleCloseUserMenu();
                }}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                Thiết lập tài khoản
              </MenuItem>
              
              <MenuItem 
                onClick={handleLogout}
                sx={{ py: 1.5, color: theme.palette.error.main }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                Đăng xuất
              </MenuItem>
            </Menu>
          </Box>
          
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
            PaperProps={{
              elevation: 2,
              sx: {
                borderRadius: 1.5,
                width: 320,
                mt: 1.5,
                boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.15)',
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
              }
            }}
          >
            <MenuItem 
              onClick={handleCloseNotifMenu} 
              sx={{ 
                py: 1.5,
                borderLeft: `4px solid ${theme.palette.info.main}`, 
                pl: 2
              }}
            >
              <Typography variant="body2">
                Lịch thi giữa kỳ đã được cập nhật
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={handleCloseNotifMenu} 
              sx={{ 
                py: 1.5,
                borderLeft: `4px solid ${theme.palette.warning.main}`, 
                pl: 2
              }}
            >
              <Typography variant="body2">
                Hạn đóng học phí: 15/10/2023
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={handleCloseNotifMenu}
              sx={{ 
                py: 1.5,
                borderLeft: `4px solid ${theme.palette.success.main}`, 
                pl: 2
              }}
            >
              <Typography variant="body2">
                Mở đăng ký học kỳ mới
              </Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </Box>
    );
  }
  
  // Original header (maintaining backward compatibility)
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