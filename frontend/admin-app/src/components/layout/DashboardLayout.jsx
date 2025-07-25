/*-----------------------------------------------------------------
* File: DashboardLayout.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Drawer,
  AppBar, 
  Toolbar, 
  List, 
  Typography, 
  Divider, 
  IconButton, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
  Badge,
  ListItemButton
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Assessment as AssessmentIcon,
  EmojiEvents as EmojiEventsIcon,
  Flag as FlagIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import NotificationsPanel from '../common/NotificationsPanel';

const drawerWidth = 260;

// Styled components
const StyledRoot = styled('div')({
  display: 'flex',
  minHeight: '100vh',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: '#f4f6f8'
});

const Main = styled('main')(({ theme }) => ({
  flexGrow: 1,
  width: `calc(100% - ${drawerWidth}px)`,
  minHeight: '100vh',
  overflow: 'hidden',
  position: 'relative'
}));

const MainContent = styled(Box)(({ theme }) => ({
  height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
  overflow: 'auto',
  marginTop: theme.mixins.toolbar.minHeight,
  padding: theme.spacing(3),
  backgroundColor: 'inherit',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
  '& > *': {
    marginBottom: theme.spacing(3),
    '&:last-child': {
      marginBottom: 0
    }
  }
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  position: 'fixed',
  zIndex: theme.zIndex.drawer + 1,
  boxShadow: 'none',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  backgroundColor: alpha(theme.palette.background.default, 0.95),
  borderBottom: `1px solid ${theme.palette.divider}`,
  width: `calc(100% - ${drawerWidth}px)`,
  marginLeft: drawerWidth
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    border: 'none',
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    overflowX: 'hidden',
    position: 'fixed',
    height: '100vh',
    top: 0,
    left: 0,
    boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.24)'
  },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  minHeight: 48,
  justifyContent: 'initial',
  px: 2.5,
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
    },
  },
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 700,
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: '0.5px'
}));

const menuItems = [
  { text: 'Trang chủ', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Người dùng', icon: <PersonIcon />, path: '/users' },
  { text: 'Khóa học', icon: <SchoolIcon />, path: '/courses' },
  { text: 'Sự kiện', icon: <EventIcon />, path: '/events' },
  { text: 'Bài Thi', icon: <AssessmentIcon />, path: '/exams' },
  { text: 'Thi Đấu', icon: <EmojiEventsIcon />, path: '/competitions' },
  { text: 'Báo cáo', icon: <FlagIcon />, path: '/reports' },
  { text: 'Cài đặt', icon: <SettingsIcon />, path: '/settings' },
];

// Sửa lại MarqueeText component
const MarqueeText = styled('div')(({ theme }) => ({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  position: 'relative',
  flex: 1,
  '& .marquee-container': {
    display: 'flex',
    width: 'fit-content',
    animation: 'marquee 30s linear infinite',
    '&:hover': {
      animationPlayState: 'running', // Tiếp tục chạy khi hover
    }
  },
  '& .marquee-item': {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 10px', // Khoảng cách 10px giữa các items
    '&::after': {
      content: '"•"',
      marginLeft: '10px',
      color: theme.palette.primary.main,
      opacity: 0.5
    },
    '&:last-child::after': {
      display: 'none' // Ẩn dấu bullet ở item cuối
    }
  },
  '@keyframes marquee': {
    '0%': { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(-50%)' } // Chỉ dịch chuyển 50% để tạo hiệu ứng liên tục
  }
}));

// Mảng các quotes về quản lý
const managementQuotes = [
  "Quản lý hiệu quả - Thành công bền vững",
  "Đổi mới sáng tạo - Phát triển không ngừng",
  "Kết nối tri thức - Chia sẻ thành công",
  "Học tập suốt đời - Phát triển bản thân",
  "Quản lý thời gian - Tối ưu hiệu suất"
];

const DashboardLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  return (
    <StyledRoot>
      <StyledAppBar>
        <Toolbar>
          <MarqueeText>
            <Box className="marquee-container">
              {/* Render quotes 2 lần để tạo hiệu ứng liên tục */}
              {[...managementQuotes, ...managementQuotes].map((quote, index) => (
                <Typography
                  key={index}
                  className="marquee-item"
                  variant="body1"
                  sx={{
                    color: (theme) => theme.palette.primary.main,
                    fontWeight: 500,
                    fontSize: '1rem',
                    opacity: 0.8,
                    letterSpacing: '0.5px',
                  }}
                >
                  {quote}
                </Typography>
              ))}
            </Box>
          </MarqueeText>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              color="default" 
              onClick={toggleNotifications}
              sx={{ 
                '&:hover': { 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1) 
                } 
              }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <Tooltip title="Account settings">
              <IconButton
                onClick={handleProfileMenuOpen}
                size="small"
                sx={{
                  ml: 1,
                  '&:hover': { 
                    backgroundColor: alpha(theme.palette.primary.main, 0.1) 
                  }
                }}
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {currentUser?.firstName?.charAt(0) || 'A'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </StyledAppBar>

      <StyledDrawer
        variant="permanent"
        ModalProps={{
          keepMounted: true,
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: [1],
            minHeight: theme.mixins.toolbar.minHeight,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LogoText>
              ADMIN
            </LogoText>
          </Box>
        </Toolbar>
        <Divider />
        
        <List 
          component="nav" 
          sx={{ 
            px: 2,
            height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
            overflow: 'auto'
          }}
        >
          {menuItems.map((item) => (
            <ListItem 
              key={item.text} 
              disablePadding 
              sx={{ display: 'block', mb: 0.5 }}
            >
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 2,
                    justifyContent: 'center',
                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{
                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </StyledDrawer>

      <Main>
        <MainContent>
          {children}
        </MainContent>
      </Main>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            '& .MuiMenuItem-root': {
              typography: 'body2',
              borderRadius: 0.75,
            },
          },
        }}
      >
        <MenuItem component={Link} to="/profile">
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="My Profile" />
        </MenuItem>
        
        <MenuItem component={Link} to="/settings">
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        
        <Divider sx={{ borderStyle: 'dashed' }} />
        
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>

      <NotificationsPanel 
        open={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
    </StyledRoot>
  );
};

export default DashboardLayout; 
