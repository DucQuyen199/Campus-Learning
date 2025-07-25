/*-----------------------------------------------------------------
* File: Sidebar.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student admin application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
  MenuBook,
  AutoStories,
  Support,
  Assignment,
  List as ListIcon,
  BarChart,
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
    if (location.pathname.includes('/services')) {
      setServicesOpen(true);
    }
  }, [location.pathname]);
  
  // Menu item states
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [academicOpen, setAcademicOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  
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
  
  const handleServicesClick = () => {
    setServicesOpen(!servicesOpen);
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

  const isInServicesGroup = () => {
    return location.pathname.includes('/services');
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
      {/* Main Navigation Menu (scrollable) */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List sx={{ p: 2 }}>
          {renderMenuItem('Tổng quan', <Dashboard />, '/dashboard')}
          
          {/* Student Management */}
          {renderMenuItem('Quản lý sinh viên', <People />, '/students', isInStudentsGroup, handleStudentsClick, studentsOpen)}
          <Collapse in={studentsOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {renderSubMenuItem('Danh sách sinh viên', <Person />, '/students')}
              {renderSubMenuItem('Thêm sinh viên mới', <AddBox />, '/students/add')}
            </List>
          </Collapse>
          
          {/* Academic Management */}
          {renderMenuItem('Quản lý học vụ', <School />, '/academic', isInAcademicGroup, handleAcademicClick, academicOpen)}
          <Collapse in={academicOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {renderSubMenuItem('Chương trình đào tạo', <MenuBook />, '/academic/programs')}
              {renderSubMenuItem('Học phần / Môn học', <AutoStories />, '/academic/subjects')}
              {renderSubMenuItem('Học kỳ', <CalendarMonth />, '/academic/semesters')}
              {renderSubMenuItem('Kết quả học tập', <Assessment />, '/academic/results')}
              {renderSubMenuItem('Cảnh báo học vụ', <Warning />, '/academic/warnings')}
              {renderSubMenuItem('Lớp học', <Class />, '/academic/classes')}
            </List>
          </Collapse>
          
          {/* Finance Management */}
          {renderMenuItem('Quản lý học phí', <AccountBalance />, '/finance', isInFinanceGroup, handleFinanceClick, financeOpen)}
          <Collapse in={financeOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {renderSubMenuItem('Danh sách học phí', <Receipt />, '/finance/tuition')}
              {renderSubMenuItem('Tạo học phí', <AddBox />, '/finance/tuition/generate')}
              {renderSubMenuItem('Thống kê học phí', <BarChart />, '/finance/tuition/statistics')}
            </List>
          </Collapse>
          
          {/* Services Management */}
          {renderMenuItem('Dịch vụ sinh viên', <Support />, '/services', isInServicesGroup, handleServicesClick, servicesOpen)}
          <Collapse in={servicesOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {renderSubMenuItem('Thống kê dịch vụ', <Dashboard />, '/services/dashboard')}
              {renderSubMenuItem('Yêu cầu dịch vụ', <Assignment />, '/services/requests')}
              {renderSubMenuItem('Danh sách dịch vụ', <ListIcon />, '/services')}
              {renderSubMenuItem('Thêm dịch vụ mới', <AddBox />, '/services/add')}
            </List>
          </Collapse>

          {/* Settings */}
          {renderMenuItem('Cài đặt', <Settings />, '/settings')}
        </List>
      </Box>
      
      {/* User Info fixed at bottom */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
        <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" color="success">
          <Avatar alt={user?.name || 'Admin'} src={user?.avatar} sx={{ width: 48, height: 48, border: `2px solid ${theme.palette.background.paper}` }} />
        </Badge>
        <Box sx={{ ml: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{user?.name || 'Admin User'}</Typography>
          <Typography variant="body2" color="text.secondary">{user?.role || 'Quản trị viên'}</Typography>
        </Box>
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
