import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Collapse,
  useTheme,
  Badge,
  Tooltip,
  IconButton,
  alpha,
} from '@mui/material';
import {
  Dashboard,
  School,
  Book,
  Person,
  Settings,
  ExpandLess,
  ExpandMore,
  People,
  CalendarMonth,
  Class,
  Article,
  Assessment,
  AddBox,
  Warning,
  AttachMoney,
  Receipt,
  Payment,
  CreditCard,
  AccountBalance,
  ChevronLeft,
  Menu as MenuIcon,
  Notifications,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ drawerWidth, open, handleDrawerToggle, isMobile, insideUnifiedForm = false }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Auto expand menu based on current route
  useEffect(() => {
    if (location.pathname.includes('/students')) {
      setStudentsOpen(true);
    }
    if (location.pathname.includes('/academic')) {
      setAcademicOpen(true);
    }
    if (location.pathname.includes('/finance')) {
      setFinanceOpen(true);
    }
  }, [location.pathname]);
  
  // Menu item states
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [academicOpen, setAcademicOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  
  // Toggle menu items
  const handleStudentsClick = () => {
    setStudentsOpen(!studentsOpen);
  };
  
  const handleAcademicClick = () => {
    setAcademicOpen(!academicOpen);
  };

  const handleFinanceClick = () => {
    setFinanceOpen(!financeOpen);
  };
  
  // Navigation handler
  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      handleDrawerToggle();
    }
  };
  
  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
  };
  
  // Check if a path is part of a group
  const isInStudentsGroup = () => {
    return location.pathname.includes('/students');
  };
  
  const isInAcademicGroup = () => {
    return location.pathname.includes('/academic');
  };

  const isInFinanceGroup = () => {
    return location.pathname.includes('/finance');
  };

  // Sidebar item renderer
  const renderMenuItem = (text, icon, path, isActiveCheck, handleClick = null, isOpen = null) => {
    const active = isActiveCheck ? isActiveCheck() : isActive(path);
    return (
      <ListItem disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton
          selected={active}
          onClick={handleClick || (() => handleNavigate(path))}
          sx={{
            borderRadius: 1.5,
            py: 1,
            backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
        >
          <ListItemIcon>
            {React.cloneElement(icon, { 
              color: active ? 'primary' : 'action',
              sx: { fontSize: '1.25rem' }
            })}
          </ListItemIcon>
          <ListItemText 
            primary={text} 
            primaryTypographyProps={{ 
              fontWeight: active ? 600 : 500,
              fontSize: '0.95rem',
              color: active ? 'primary.main' : 'text.primary'
            }} 
          />
          {handleClick && (isOpen !== null ? (isOpen ? <ExpandLess color="action" /> : <ExpandMore color="action" />) : null)}
        </ListItemButton>
      </ListItem>
    );
  };

  // Submenu item renderer
  const renderSubMenuItem = (text, icon, path) => {
    const active = isActive(path);
    return (
      <ListItemButton
        sx={{ 
          pl: 4, 
          py: 0.75,
          borderRadius: 1.5, 
          mb: 0.5,
          ml: 1,
          borderLeft: `1px solid ${active ? theme.palette.primary.main : theme.palette.divider}`,
        }}
        selected={active}
        onClick={() => handleNavigate(path)}
      >
        <ListItemIcon sx={{ minWidth: '36px' }}>
          {React.cloneElement(icon, { 
            fontSize: "small",
            color: active ? 'primary' : 'action',
          })}
        </ListItemIcon>
        <ListItemText 
          primary={text} 
          primaryTypographyProps={{ 
            fontSize: '0.875rem',
            fontWeight: active ? 600 : 400,
            color: active ? 'primary.main' : 'text.secondary'
          }} 
        />
      </ListItemButton>
    );
  };
  
  // Drawer content
  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: theme.palette.background.paper,
      boxShadow: '0 0 15px rgba(0, 0, 0, 0.05)',
    }}>
      {/* Header with Logo - không còn nút toggle */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center', // Căn giữa logo
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.primary.main,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <School sx={{ mr: 1, fontSize: '2rem' }} />
          HUBT Admin
        </Typography>
      </Box>
      
      {/* User Info */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.primary.main, 0.03),
        }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          color="success"
        >
          <Avatar
            alt={user?.name || 'Admin'}
            src={user?.avatar}
            sx={{ 
              width: 64, 
              height: 64, 
              mb: 1,
              border: `3px solid ${theme.palette.background.paper}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          />
        </Badge>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
          {user?.name || 'Admin User'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.role || 'Quản trị viên'}
        </Typography>
      </Box>
      
      {/* Navigation */}
      <List sx={{ 
        flexGrow: 1, 
        px: 2, 
        py: 1.5, 
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(theme.palette.primary.main, 0.2),
          borderRadius: '10px',
        },
      }} component="nav">
        {/* Dashboard */}
        {renderMenuItem('Dashboard', <Dashboard />, '/dashboard', () => isActive('/dashboard') || isActive('/'))}
        
        <Divider sx={{ my: 1.5, opacity: 0.6 }} />
        
        {/* Main Sections */}
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.5, display: 'block' }}>
          QUẢN LÝ CHÍNH
        </Typography>
        
        {/* Students */}
        {renderMenuItem('Quản lý sinh viên', <People />, '/students', isInStudentsGroup, handleStudentsClick, studentsOpen)}
        
        <Collapse in={studentsOpen || isInStudentsGroup()} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {renderSubMenuItem('Danh sách sinh viên', <People />, '/students')}
            {renderSubMenuItem('Thêm sinh viên', <AddBox />, '/students/add')}
          </List>
        </Collapse>
        
        {/* Academic */}
        {renderMenuItem('Quản lý học tập', <School />, '/academic', isInAcademicGroup, handleAcademicClick, academicOpen)}
        
        <Collapse in={academicOpen || isInAcademicGroup()} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {renderSubMenuItem('Chương trình đào tạo', <School />, '/academic/programs')}
            {renderSubMenuItem('Môn học', <Book />, '/academic/subjects')}
            {renderSubMenuItem('Học kỳ', <CalendarMonth />, '/academic/semesters')}
            {renderSubMenuItem('Kết quả học tập', <Assessment />, '/academic/results')}
            {renderSubMenuItem('Cảnh báo học tập', <Warning />, '/academic/warnings')}
          </List>
        </Collapse>
        
        {/* Finance */}
        {renderMenuItem('Quản lý tài chính', <AccountBalance />, '/finance', isInFinanceGroup, handleFinanceClick, financeOpen)}
        
        <Collapse in={financeOpen || isInFinanceGroup()} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {renderSubMenuItem('Học phí', <Receipt />, '/finance/tuition')}
            {renderSubMenuItem('Thống kê học phí', <Assessment />, '/finance/tuition/statistics')}
            {renderSubMenuItem('Tạo hoá đơn học phí', <CreditCard />, '/finance/tuition/generate')}
          </List>
        </Collapse>
        
        <Divider sx={{ my: 1.5, opacity: 0.6 }} />
        
        {/* User Settings */}
        <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.5, display: 'block' }}>
          CÀI ĐẶT TÀI KHOẢN
        </Typography>
        
        {/* Profile & Settings */}
        {renderMenuItem('Hồ sơ cá nhân', <Person />, '/profile')}
        {renderMenuItem('Cài đặt hệ thống', <Settings />, '/settings')}
      </List>
      
      {/* Version */}
      <Box sx={{ 
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.primary.main, 0.03),
      }}>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ textAlign: 'center' }}>
          HUBT Admin Portal v1.1.0
        </Typography>
      </Box>
    </Box>
  );
  
  // Trong trường hợp sidebar nằm trong form thống nhất, chỉ trả về nội dung
  if (insideUnifiedForm) {
    return drawerContent;
  }
  
  // Trường hợp thông thường (sidebar độc lập)
  return (
    <Box
      component="nav"
      sx={{ 
        width: { 
          xs: 0, 
          md: open ? drawerWidth : 0 
        },
        flexShrink: { md: 0 },
        zIndex: theme.zIndex.drawer
      }}
    >
      {/* Mobile drawer - chỉ hiển thị khi click nút menu trên mobile */}
      <Drawer
        variant="temporary"
        open={isMobile && open}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: isMobile ? '80%' : drawerWidth,
            maxWidth: isMobile ? '300px' : 'none',
            borderRight: 'none',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
            zIndex: theme.zIndex.drawer,
            position: 'fixed',
            left: 0,
            top: 0,
            margin: 0,
            padding: 0
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer - luôn hiển thị */}
      <Drawer
        variant="permanent"
        open={true}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: 'none',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
            height: '100%',
            zIndex: theme.zIndex.drawer,
            position: 'fixed',
            left: 0,
            top: 0,
            margin: 0,
            padding: 0,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar; 