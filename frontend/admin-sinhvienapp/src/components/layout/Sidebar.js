import React from 'react';
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
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ drawerWidth, open, handleDrawerToggle, isMobile }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Menu item states
  const [studentsOpen, setStudentsOpen] = React.useState(false);
  const [academicOpen, setAcademicOpen] = React.useState(false);
  const [financeOpen, setFinanceOpen] = React.useState(false);
  
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
    return location.pathname === path;
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
  
  // Drawer content
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo & App Name */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
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
        }}
      >
        <Avatar
          alt={currentUser?.fullName || 'Admin'}
          src={currentUser?.avatar}
          sx={{ width: 60, height: 60, mb: 1 }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {currentUser?.fullName || 'Admin User'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {currentUser?.email || 'admin@example.com'}
        </Typography>
      </Box>
      
      {/* Navigation */}
      <List sx={{ flexGrow: 1, px: 2, py: 1 }} component="nav">
        {/* Dashboard */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            selected={isActive('/dashboard') || isActive('/')}
            onClick={() => handleNavigate('/dashboard')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: (isActive('/dashboard') || isActive('/')) ? alpha(theme.palette.primary.main, 0.1) : null,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
              },
            }}
          >
            <ListItemIcon>
              <Dashboard color={isActive('/dashboard') || isActive('/') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        
        {/* Students */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={handleStudentsClick}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: isInStudentsGroup() ? alpha(theme.palette.primary.main, 0.1) : null,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <ListItemIcon>
              <People color={isInStudentsGroup() ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Quản lý sinh viên" />
            {studentsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={studentsOpen || isInStudentsGroup()} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
              selected={isActive('/students')}
              onClick={() => handleNavigate('/students')}
            >
              <ListItemIcon>
                <People fontSize="small" color={isActive('/students') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Danh sách sinh viên" />
            </ListItemButton>
            
            <ListItemButton
              sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
              selected={isActive('/students/add')}
              onClick={() => handleNavigate('/students/add')}
            >
              <ListItemIcon>
                <AddBox fontSize="small" color={isActive('/students/add') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Thêm sinh viên" />
            </ListItemButton>
          </List>
        </Collapse>
        
        {/* Academic */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={handleAcademicClick}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: isInAcademicGroup() ? alpha(theme.palette.primary.main, 0.1) : null,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <ListItemIcon>
              <School color={isInAcademicGroup() ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Quản lý học tập" />
            {academicOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={academicOpen || isInAcademicGroup()} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
              selected={isActive('/academic/programs')}
              onClick={() => handleNavigate('/academic/programs')}
            >
              <ListItemIcon>
                <School fontSize="small" color={isActive('/academic/programs') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Chương trình đào tạo" />
            </ListItemButton>
            
            <ListItemButton
              sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
              selected={isActive('/academic/subjects')}
              onClick={() => handleNavigate('/academic/subjects')}
            >
              <ListItemIcon>
                <Book fontSize="small" color={isActive('/academic/subjects') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Môn học" />
            </ListItemButton>
            
            <ListItemButton
              sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
              selected={isActive('/academic/semesters')}
              onClick={() => handleNavigate('/academic/semesters')}
            >
              <ListItemIcon>
                <CalendarMonth fontSize="small" color={isActive('/academic/semesters') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Học kỳ" />
            </ListItemButton>
            
            <ListItemButton
              sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
              selected={isActive('/academic/results')}
              onClick={() => handleNavigate('/academic/results')}
            >
              <ListItemIcon>
                <Assessment fontSize="small" color={isActive('/academic/results') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Kết quả học tập" />
            </ListItemButton>

            <ListItemButton
              sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
              selected={isActive('/academic/warnings')}
              onClick={() => handleNavigate('/academic/warnings')}
            >
              <ListItemIcon>
                <Warning fontSize="small" color={isActive('/academic/warnings') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Cảnh báo học tập" />
            </ListItemButton>
          </List>
        </Collapse>
        
        {/* Finance */}
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            onClick={handleFinanceClick}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: isInFinanceGroup() ? alpha(theme.palette.primary.main, 0.1) : null,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <ListItemIcon>
              <AccountBalance color={isInFinanceGroup() ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Quản lý tài chính" />
            {financeOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={financeOpen || isInFinanceGroup()} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
              selected={isActive('/finance/tuition')}
              onClick={() => handleNavigate('/finance/tuition')}
            >
              <ListItemIcon>
                <Receipt fontSize="small" color={isActive('/finance/tuition') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Học phí" />
            </ListItemButton>
            
            <ListItemButton
              sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
              selected={isActive('/finance/tuition/statistics')}
              onClick={() => handleNavigate('/finance/tuition/statistics')}
            >
              <ListItemIcon>
                <Assessment fontSize="small" color={isActive('/finance/tuition/statistics') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Thống kê học phí" />
            </ListItemButton>
            
            <ListItemButton
              sx={{ pl: 4, borderRadius: 1, mb: 0.5 }}
              selected={isActive('/finance/tuition/generate')}
              onClick={() => handleNavigate('/finance/tuition/generate')}
            >
              <ListItemIcon>
                <CreditCard fontSize="small" color={isActive('/finance/tuition/generate') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Tạo hoá đơn học phí" />
            </ListItemButton>
          </List>
        </Collapse>
        
        {/* Profile & Settings */}
        <ListItem disablePadding>
          <ListItemButton
            selected={isActive('/profile')}
            onClick={() => handleNavigate('/profile')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: isActive('/profile') ? alpha(theme.palette.primary.main, 0.1) : null,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
              },
            }}
          >
            <ListItemIcon>
              <Person color={isActive('/profile') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Hồ sơ cá nhân" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton
            selected={isActive('/settings')}
            onClick={() => handleNavigate('/settings')}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              backgroundColor: isActive('/settings') ? alpha(theme.palette.primary.main, 0.1) : null,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
              },
            }}
          >
            <ListItemIcon>
              <Settings color={isActive('/settings') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Cài đặt" />
          </ListItemButton>
        </ListItem>
      </List>
      
      {/* Version */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ textAlign: 'center' }}>
          HUBT Admin Portal v1.0.0
        </Typography>
      </Box>
    </Box>
  );
  
  return (
    <Box
      component="nav"
      sx={{ width: { sm: open ? drawerWidth : 0 }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={isMobile && open}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="persistent"
        open={open}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

const alpha = (color, opacity) => {
  return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
};

export default Sidebar; 