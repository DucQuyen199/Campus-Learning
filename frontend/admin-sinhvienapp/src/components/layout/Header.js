import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useTheme,
  Tooltip,
  ListItemIcon,
  Divider,
  InputBase,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Chip,
  Button,
  alpha,
  Stack,
  Popover,
  Fab,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Logout,
  Settings,
  Person,
  Search as SearchIcon,
  Help,
  NightsStay,
  LightMode,
  ArrowDropDown,
  Dashboard,
  School,
  MoreVert,
  Close,
  AccessTime,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ drawerWidth, drawerWidthPercentage = 20, open, handleDrawerToggle, isMobile, fullWidth = false, insideUnifiedForm = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Mock notifications for demo
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Cảnh báo học phí',
      message: 'Có 5 sinh viên chưa đóng học phí kỳ này',
      time: '10 phút trước',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Lịch họp mới',
      message: 'Cuộc họp giáo viên đã được lên lịch vào 10/06/2023',
      time: '1 giờ trước',
      read: false
    },
    {
      id: 3,
      type: 'success',
      title: 'Cập nhật hệ thống',
      message: 'Hệ thống đã được cập nhật lên phiên bản mới nhất',
      time: '1 ngày trước',
      read: true
    }
  ]);
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsMenu = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };
  
  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notif => ({...notif, read: true}))
    );
  };
  
  // Mark a single notification as read
  const markAsRead = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notif => 
        notif.id === id ? {...notif, read: true} : notif
      )
    );
  };
  
  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/auth/login');
  };
  
  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'warning':
        return <Badge sx={{ bgcolor: alpha(theme.palette.warning.main, 0.2), p: 1, borderRadius: '50%' }}>
          <School fontSize="small" color="warning" />
        </Badge>;
      case 'info':
        return <Badge sx={{ bgcolor: alpha(theme.palette.info.main, 0.2), p: 1, borderRadius: '50%' }}>
          <Dashboard fontSize="small" color="info" />
        </Badge>;
      case 'success':
        return <Badge sx={{ bgcolor: alpha(theme.palette.success.main, 0.2), p: 1, borderRadius: '50%' }}>
          <Settings fontSize="small" color="success" />
        </Badge>;
      default:
        return <Badge sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), p: 1, borderRadius: '50%' }}>
          <NotificationsIcon fontSize="small" color="primary" />
        </Badge>;
    }
  };

  // Khi header nằm trong form thống nhất
  if (insideUnifiedForm) {
    return (
      <>
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
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
              HUBT Admin
            </Typography>
            
            {/* Search bar */}
            <Box 
              sx={{ 
                flexGrow: 1,
                display: 'flex',
                justifyContent: 'center',
                mx: { xs: 0, md: 2 },
                ml: { xs: 1, sm: 3 }
              }}
            >
              <Paper
                component="form"
                sx={{
                  p: '2px 4px',
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                  width: searchFocused ? 450 : 320,
                  borderRadius: 20,
                  border: `1px solid ${alpha(theme.palette.primary.main, searchFocused ? 0.3 : 0)}`,
                  boxShadow: searchFocused 
                    ? `0 0 8px ${alpha(theme.palette.primary.main, 0.2)}` 
                    : `0 2px 6px ${alpha(theme.palette.common.black, 0.08)}`,
                  transition: theme.transitions.create(['width', 'box-shadow', 'border-color'], {
                    duration: 200,
                  }),
                }}
              >
                <IconButton sx={{ p: '10px', color: theme.palette.text.secondary }}>
                  <SearchIcon />
                </IconButton>
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Tìm kiếm sinh viên, lớp học..."
                  inputProps={{ 'aria-label': 'tìm kiếm' }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </Paper>
            </Box>
            
            {/* Desktop actions */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
              {/* Help */}
              <Tooltip title="Trợ giúp">
                <IconButton 
                  color="inherit" 
                  sx={{ 
                    mx: 0.5, 
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <Help />
                </IconButton>
              </Tooltip>
              
              {/* Theme toggle - placeholder */}
              <Tooltip title="Chế độ tối">
                <IconButton 
                  color="inherit" 
                  sx={{ 
                    mx: 0.5, 
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <NightsStay />
                </IconButton>
              </Tooltip>
              
              {/* Notifications */}
              <Tooltip title="Thông báo">
                <IconButton
                  size="large"
                  aria-label="show new notifications"
                  color="inherit"
                  onClick={handleNotificationsMenu}
                  sx={{ 
                    mx: 0.5, 
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              {/* User menu */}
              <Box sx={{ ml: 1 }}>
                <Tooltip title="Tài khoản">
                  <Button
                    onClick={handleMenu}
                    color="inherit"
                    sx={{ 
                      border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 1,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      }
                    }}
                  >
                    <Avatar 
                      alt={user?.name || "User"} 
                      src={user?.avatar} 
                      sx={{ width: 32, height: 32, mr: 1 }}
                    />
                    <Typography variant="body2" sx={{ display: { xs: 'none', lg: 'block' }, fontWeight: 500 }}>
                      {user?.name || "Quản trị viên"}
                    </Typography>
                    <ArrowDropDown />
                  </Button>
                </Tooltip>
              </Box>
            </Box>
            
            {/* Mobile actions */}
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="show more"
                aria-haspopup="true"
                onClick={handleMobileMenuOpen}
                color="inherit"
              >
                <MoreVert />
              </IconButton>
            </Box>
          </Toolbar>
        </Box>
        
        {/* Các menu vẫn hiển thị */}
        <Popover
          id="notifications-menu"
          anchorEl={notificationsAnchorEl}
          open={Boolean(notificationsAnchorEl)}
          onClose={handleNotificationsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            '& .MuiPaper-root': {
              width: 360,
              maxWidth: '100%',
              overflow: 'hidden',
              mt: 1.5,
              boxShadow: '0 0 20px rgba(0,0,0,0.1)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              zIndex: theme.zIndex.modal,
            },
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Thông báo</Typography>
            <Box>
              <Tooltip title="Đánh dấu tất cả đã đọc">
                <IconButton size="small" onClick={markAllAsRead}>
                  <Badge fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Đóng">
                <IconButton size="small" onClick={handleNotificationsClose}>
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Divider />
          
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Không có thông báo mới
              </Typography>
            </Box>
          ) : (
            <>
              <List sx={{ 
                maxHeight: 320, 
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  borderRadius: '10px',
                },
              }}>
                {notifications.map(notification => (
                  <ListItem 
                    key={notification.id}
                    alignItems="flex-start"
                    sx={{ 
                      px: 2, 
                      py: 1.5,
                      backgroundColor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                    secondaryAction={
                      <Tooltip title="Đánh dấu đã đọc">
                        <IconButton edge="end" size="small" onClick={() => markAsRead(notification.id)}>
                          <Close fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemAvatar>
                      {getNotificationIcon(notification.type)}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" component="span" color="text.primary" sx={{ display: 'block' }}>
                            {notification.message}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                            <AccessTime sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }} />
                            <Typography variant="caption" color="text.secondary">
                              {notification.time}
                            </Typography>
                          </Stack>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Divider />
              <Box sx={{ p: 1 }}>
                <Button 
                  fullWidth 
                  sx={{ 
                    py: 1, 
                    textTransform: 'none',
                    fontWeight: 500,
                    color: theme.palette.primary.main,
                  }}
                  onClick={handleNotificationsClose}
                >
                  Xem tất cả thông báo
                </Button>
              </Box>
            </>
          )}
        </Popover>
        
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          sx={{
            '& .MuiPaper-root': {
              width: 210,
              mt: 1.5,
              overflow: 'visible',
              boxShadow: '0 0 20px rgba(0,0,0,0.1)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              zIndex: theme.zIndex.modal,
              '&:before': {
                content: '""',
                position: 'absolute',
                top: -10,
                right: 20,
                width: 20,
                height: 20,
                transform: 'rotate(45deg)',
                backgroundColor: theme.palette.background.paper,
                borderTop: `1px solid ${theme.palette.divider}`,
                borderLeft: `1px solid ${theme.palette.divider}`,
                zIndex: 0,
              },
            },
          }}
        >
          <Box sx={{ pt: 2, pb: 1, px: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.name || "Quản trị viên"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || "admin@hubt.edu.vn"}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => handleNavigate('/profile')}>
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            Hồ sơ cá nhân
          </MenuItem>
          <MenuItem onClick={() => handleNavigate('/settings')}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Cài đặt
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Đăng xuất
          </MenuItem>
        </Menu>
        
        <Menu
          id="mobile-menu"
          anchorEl={mobileMoreAnchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(mobileMoreAnchorEl)}
          onClose={handleMobileMenuClose}
          sx={{
            '& .MuiPaper-root': {
              width: 200,
              mt: 1.5,
              boxShadow: '0 0 20px rgba(0,0,0,0.1)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              zIndex: theme.zIndex.modal,
            },
          }}
        >
          <MenuItem onClick={() => {
            handleMobileMenuClose();
            handleNotificationsMenu({ currentTarget: document.body });
          }}>
            <ListItemIcon>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </ListItemIcon>
            <Typography>Thông báo</Typography>
          </MenuItem>
          <MenuItem onClick={() => {
            handleMobileMenuClose();
            handleMenu({ currentTarget: document.body });
          }}>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <Typography>Tài khoản</Typography>
          </MenuItem>
          <MenuItem onClick={() => navigate('/settings')}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <Typography>Cài đặt</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <Typography>Đăng xuất</Typography>
          </MenuItem>
        </Menu>
      </>
    );
  }

  // Original AppBar for when not inside unified form
  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{
        width: fullWidth ? '100%' : {
          xs: '100%',
          md: `${100 - drawerWidthPercentage}%` 
        },
        ml: fullWidth ? 0 : {
          xs: 0, 
          md: drawerWidth
        },
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        backgroundColor: theme.palette.mode === 'light' 
          ? alpha(theme.palette.background.paper, 0.9) 
          : theme.palette.background.paper,
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
        height: { xs: '64px', sm: '70px' },
        px: { xs: 1, md: 2 },
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
          HUBT Admin
        </Typography>
        
        {/* Search bar */}
        <Box 
          sx={{ 
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            mx: { xs: 0, md: 2 },
            ml: { xs: 1, sm: 3 }
          }}
        >
          <Paper
            component="form"
            sx={{
              p: '2px 4px',
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              width: searchFocused ? 450 : 320,
              borderRadius: 20,
              border: `1px solid ${alpha(theme.palette.primary.main, searchFocused ? 0.3 : 0)}`,
              boxShadow: searchFocused 
                ? `0 0 8px ${alpha(theme.palette.primary.main, 0.2)}` 
                : `0 2px 6px ${alpha(theme.palette.common.black, 0.08)}`,
              transition: theme.transitions.create(['width', 'box-shadow', 'border-color'], {
                duration: 200,
              }),
            }}
          >
            <IconButton sx={{ p: '10px', color: theme.palette.text.secondary }}>
              <SearchIcon />
            </IconButton>
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Tìm kiếm sinh viên, lớp học..."
              inputProps={{ 'aria-label': 'tìm kiếm' }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </Paper>
        </Box>
        
        {/* Desktop actions */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
          {/* Help */}
          <Tooltip title="Trợ giúp">
            <IconButton 
              color="inherit" 
              sx={{ 
                mx: 0.5, 
                border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <Help />
            </IconButton>
          </Tooltip>
          
          {/* Theme toggle - placeholder */}
          <Tooltip title="Chế độ tối">
            <IconButton 
              color="inherit" 
              sx={{ 
                mx: 0.5, 
                border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <NightsStay />
            </IconButton>
          </Tooltip>
          
          {/* Notifications */}
          <Tooltip title="Thông báo">
            <IconButton
              size="large"
              aria-label="show new notifications"
              color="inherit"
              onClick={handleNotificationsMenu}
              sx={{ 
                mx: 0.5, 
                border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User menu */}
          <Box sx={{ ml: 1 }}>
            <Tooltip title="Tài khoản">
              <Button
                onClick={handleMenu}
                color="inherit"
                sx={{ 
                  border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                <Avatar 
                  alt={user?.name || "User"} 
                  src={user?.avatar} 
                  sx={{ width: 32, height: 32, mr: 1 }}
                />
                <Typography variant="body2" sx={{ display: { xs: 'none', lg: 'block' }, fontWeight: 500 }}>
                  {user?.name || "Quản trị viên"}
                </Typography>
                <ArrowDropDown />
              </Button>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Mobile actions */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            aria-label="show more"
            aria-haspopup="true"
            onClick={handleMobileMenuOpen}
            color="inherit"
          >
            <MoreVert />
          </IconButton>
        </Box>
        
        {/* Notifications menu */}
        <Popover
          id="notifications-menu"
          anchorEl={notificationsAnchorEl}
          open={Boolean(notificationsAnchorEl)}
          onClose={handleNotificationsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          sx={{
            '& .MuiPaper-root': {
              width: 360,
              maxWidth: '100%',
              overflow: 'hidden',
              mt: 1.5,
              boxShadow: '0 0 20px rgba(0,0,0,0.1)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            },
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Thông báo</Typography>
            <Box>
              <Tooltip title="Đánh dấu tất cả đã đọc">
                <IconButton size="small" onClick={markAllAsRead}>
                  <Badge fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Đóng">
                <IconButton size="small" onClick={handleNotificationsClose}>
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Divider />
          
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Không có thông báo mới
              </Typography>
            </Box>
          ) : (
            <>
              <List sx={{ 
                maxHeight: 320, 
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  borderRadius: '10px',
                },
              }}>
                {notifications.map(notification => (
                  <ListItem 
                    key={notification.id}
                    alignItems="flex-start"
                    sx={{ 
                      px: 2, 
                      py: 1.5,
                      backgroundColor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                    secondaryAction={
                      <Tooltip title="Đánh dấu đã đọc">
                        <IconButton edge="end" size="small" onClick={() => markAsRead(notification.id)}>
                          <Close fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemAvatar>
                      {getNotificationIcon(notification.type)}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" component="span" color="text.primary" sx={{ display: 'block' }}>
                            {notification.message}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                            <AccessTime sx={{ fontSize: '0.75rem', color: theme.palette.text.secondary }} />
                            <Typography variant="caption" color="text.secondary">
                              {notification.time}
                            </Typography>
                          </Stack>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Divider />
              <Box sx={{ p: 1 }}>
                <Button 
                  fullWidth 
                  sx={{ 
                    py: 1, 
                    textTransform: 'none',
                    fontWeight: 500,
                    color: theme.palette.primary.main,
                  }}
                  onClick={handleNotificationsClose}
                >
                  Xem tất cả thông báo
                </Button>
              </Box>
            </>
          )}
        </Popover>
        
        {/* User menu */}
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          sx={{
            '& .MuiPaper-root': {
              width: 210,
              mt: 1.5,
              overflow: 'visible',
              boxShadow: '0 0 20px rgba(0,0,0,0.1)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              '&:before': {
                content: '""',
                position: 'absolute',
                top: -10,
                right: 20,
                width: 20,
                height: 20,
                transform: 'rotate(45deg)',
                backgroundColor: theme.palette.background.paper,
                borderTop: `1px solid ${theme.palette.divider}`,
                borderLeft: `1px solid ${theme.palette.divider}`,
                zIndex: 0,
              },
            },
          }}
        >
          <Box sx={{ pt: 2, pb: 1, px: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.name || "Quản trị viên"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || "admin@hubt.edu.vn"}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => handleNavigate('/profile')}>
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            Hồ sơ cá nhân
          </MenuItem>
          <MenuItem onClick={() => handleNavigate('/settings')}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Cài đặt
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Đăng xuất
          </MenuItem>
        </Menu>
        
        {/* Mobile menu */}
        <Menu
          id="mobile-menu"
          anchorEl={mobileMoreAnchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(mobileMoreAnchorEl)}
          onClose={handleMobileMenuClose}
          sx={{
            '& .MuiPaper-root': {
              width: 200,
              mt: 1.5,
              boxShadow: '0 0 20px rgba(0,0,0,0.1)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            },
          }}
        >
          <MenuItem onClick={() => {
            handleMobileMenuClose();
            handleNotificationsMenu({ currentTarget: document.body });
          }}>
            <ListItemIcon>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </ListItemIcon>
            <Typography>Thông báo</Typography>
          </MenuItem>
          <MenuItem onClick={() => {
            handleMobileMenuClose();
            handleMenu({ currentTarget: document.body });
          }}>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <Typography>Tài khoản</Typography>
          </MenuItem>
          <MenuItem onClick={() => navigate('/settings')}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <Typography>Cài đặt</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <Typography>Đăng xuất</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 