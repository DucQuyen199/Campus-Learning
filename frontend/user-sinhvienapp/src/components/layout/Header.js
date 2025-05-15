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
  alpha,
  Divider,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Person,
  Settings,
  School,
  Dashboard,
  DarkMode,
  LightMode,
  NotificationsActive
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

  // Shared menu components
  const userMenuItems = (
    <>
      <Box sx={{ 
        px: 3, 
        py: 1.5, 
        display: 'flex', 
        alignItems: 'center', 
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Avatar 
          sx={{ 
            width: 40, 
            height: 40, 
            bgcolor: theme.palette.primary.main,
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {currentUser?.FullName?.charAt(0) || 'S'}
        </Avatar>
        <Box sx={{ ml: 1.5 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {currentUser?.FullName || 'Sinh viên'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {currentUser?.Email || 'student@hubt.edu.vn'}
          </Typography>
        </Box>
      </Box>
      
      <MenuItem 
        onClick={() => {
          navigate('/profile');
          handleCloseUserMenu();
        }}
        sx={{ 
          py: 1.5,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08)
          }
        }}
      >
        <ListItemIcon>
          <Person fontSize="small" color="primary" />
        </ListItemIcon>
        Thông tin cá nhân
      </MenuItem>
      
      <MenuItem 
        onClick={() => {
          navigate('/profile-settings');
          handleCloseUserMenu();
        }}
        sx={{ 
          py: 1.5,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08)
          }
        }}
      >
        <ListItemIcon>
          <Settings fontSize="small" color="primary" />
        </ListItemIcon>
        Thiết lập tài khoản
      </MenuItem>
      
      <Divider />
      
      <MenuItem 
        onClick={handleLogout}
        sx={{ 
          py: 1.5, 
          color: theme.palette.error.main,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.error.main, 0.08)
          }
        }}
      >
        <ListItemIcon>
          <LogoutIcon fontSize="small" color="error" />
        </ListItemIcon>
        Đăng xuất
      </MenuItem>
    </>
  );
  
  const notificationMenuItems = (
    <>
      <Box sx={{ 
        p: 1.5, 
        borderBottom: '1px solid', 
        borderColor: 'divider', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Thông báo
        </Typography>
        <Chip 
          size="small" 
          color="primary" 
          label="3 mới" 
          sx={{ 
            height: 24, 
            fontWeight: 'bold',
            '& .MuiChip-label': { px: 1 }
          }}
        />
      </Box>
      
      <MenuItem 
        onClick={handleCloseNotifMenu} 
        sx={{ 
          py: 1.5,
          px: 2,
          borderLeft: `4px solid ${theme.palette.info.main}`, 
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.info.main, 0.08)
          }
        }}
      >
        <Box>
          <Typography variant="body2" fontWeight="medium">
            Lịch thi giữa kỳ đã được cập nhật
          </Typography>
          <Typography variant="caption" color="text.secondary">
            15 phút trước
          </Typography>
        </Box>
      </MenuItem>
      
      <MenuItem 
        onClick={handleCloseNotifMenu} 
        sx={{ 
          py: 1.5,
          px: 2,
          borderLeft: `4px solid ${theme.palette.warning.main}`, 
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.warning.main, 0.08)
          }
        }}
      >
        <Box>
          <Typography variant="body2" fontWeight="medium">
            Hạn đóng học phí: 15/10/2023
          </Typography>
          <Typography variant="caption" color="text.secondary">
            2 giờ trước
          </Typography>
        </Box>
      </MenuItem>
      
      <MenuItem 
        onClick={handleCloseNotifMenu}
        sx={{ 
          py: 1.5,
          px: 2,
          borderLeft: `4px solid ${theme.palette.success.main}`, 
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.success.main, 0.08)
          }
        }}
      >
        <Box>
          <Typography variant="body2" fontWeight="medium">
            Mở đăng ký học kỳ mới
          </Typography>
          <Typography variant="caption" color="text.secondary">
            1 ngày trước
          </Typography>
        </Box>
      </MenuItem>
      
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
        <Button size="small" onClick={handleCloseNotifMenu}>
          Xem tất cả
        </Button>
      </Box>
    </>
  );
  
  // Common menu props
  const menuPaperProps = {
    elevation: 3,
    sx: {
      overflow: 'visible',
      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
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
  };

  // Modern header - inside unified form
  if (insideUnifiedForm) {
    return (
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 70 }, px: { xs: 2, sm: 3 } }}>
          {/* Mobile menu toggle */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* App title */}
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mr: 2
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 36,
                height: 36,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <School sx={{ color: 'white', fontSize: 20 }} />
            </Avatar>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.1rem', sm: '1.3rem' },
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              HUBT Connect
            </Typography>
          </Box>

          <Box 
            sx={{ 
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1
            }}
          >
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          
          {/* Notifications */}
          <Tooltip title="Thông báo">
            <IconButton
              aria-label="show notifications"
              aria-controls="notifications-menu"
              aria-haspopup="true"
              onClick={handleOpenNotifMenu}
              sx={{ 
                p: 1,
                borderRadius: 2,
                bgcolor: Boolean(anchorElNotif) ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: Boolean(anchorElNotif) ? 'primary.main' : 'text.primary',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                },
                transition: 'all 0.2s ease'
              }}
            >
              <Badge 
                badgeContent={3} 
                color="error"
                sx={{ 
                  '& .MuiBadge-badge': {
                    top: 3,
                    right: 3,
                    border: `2px solid ${theme.palette.background.paper}`,
                    padding: '0 4px'
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Logout button */}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              ml: 2,
              px: 2,
              py: 0.7,
              borderRadius: 2,
              fontWeight: 600,
              display: { xs: 'none', md: 'flex' },
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
              }
            }}
          >
            Đăng xuất
          </Button>
          
          {/* User menu */}
          <Box sx={{ ml: 1.5 }}>
            <Tooltip title="Tài khoản">
              <IconButton 
                onClick={handleOpenUserMenu}
                sx={{ 
                  p: 0.5,
                  border: Boolean(anchorElUser) ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    border: `2px solid ${theme.palette.primary.main}`
                  }
                }}
              >
                {currentUser?.Avatar ? (
                  <Avatar 
                    alt={currentUser.FullName} 
                    src={currentUser.Avatar} 
                    sx={{ 
                      width: 36, 
                      height: 36,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  />
                ) : (
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      bgcolor: theme.palette.primary.main,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
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
                ...menuPaperProps,
                sx: {
                  ...menuPaperProps.sx,
                  mt: 1.5,
                  borderRadius: 2,
                  minWidth: 220
                }
              }}
            >
              {userMenuItems}
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
              ...menuPaperProps,
              sx: {
                ...menuPaperProps.sx,
                width: 320,
                mt: 1.5,
                borderRadius: 2
              }
            }}
          >
            {notificationMenuItems}
          </Menu>
        </Toolbar>
      </AppBar>
    );
  }
  
  // Modern header - regular mode
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { xs: '100%', sm: `calc(100% - 240px)` },
        ml: { xs: 0, sm: `240px` },
        zIndex: (theme) => theme.zIndex.drawer + 1,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        backdropFilter: 'blur(8px)'
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 64, sm: 70 }, px: { xs: 2, sm: 3 } }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ 
            mr: 2, 
            display: { sm: 'none' },
            color: 'white'
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <School sx={{ fontSize: 28 }} />
          Hệ thống Quản lý Sinh viên
        </Typography>
        
        {/* Notifications */}
        <Tooltip title="Thông báo">
          <IconButton
            aria-label="show notifications"
            aria-controls="notifications-menu"
            aria-haspopup="true"
            onClick={handleOpenNotifMenu}
            sx={{ 
              color: 'white',
              p: 1,
              mr: 1,
              bgcolor: Boolean(anchorElNotif) ? 'rgba(255,255,255,0.2)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <Badge 
              badgeContent={3} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  top: 3,
                  right: 3,
                  border: `2px solid ${theme.palette.primary.main}`,
                  padding: '0 4px'
                }
              }}
            >
              <NotificationsActive />
            </Badge>
          </IconButton>
        </Tooltip>
        
        {/* Logout Button */}
        <Button 
          variant="contained"
          color="secondary"
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          sx={{ 
            px: 2,
            py: 0.8,
            display: { xs: 'none', md: 'flex' },
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          Đăng xuất
        </Button>
        
        {/* User menu */}
        <Box sx={{ flexGrow: 0, ml: 1.5 }}>
          <Tooltip title="Tài khoản">
            <IconButton 
              onClick={handleOpenUserMenu} 
              sx={{ 
                p: 0.5,
                border: '2px solid white',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }
              }}
            >
              {currentUser?.Avatar ? (
                <Avatar 
                  alt={currentUser.FullName} 
                  src={currentUser.Avatar} 
                  sx={{ 
                    width: 36, 
                    height: 36,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
              ) : (
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36,
                    bgcolor: 'secondary.main',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
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
              ...menuPaperProps,
              sx: {
                ...menuPaperProps.sx,
                mt: 1.5,
                borderRadius: 2,
                minWidth: 220
              }
            }}
          >
            {userMenuItems}
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
            ...menuPaperProps,
            sx: {
              ...menuPaperProps.sx,
              width: 320,
              mt: 1.5,
              borderRadius: 2
            }
          }}
        >
          {notificationMenuItems}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 