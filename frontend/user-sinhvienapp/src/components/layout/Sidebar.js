import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  Typography,
  Avatar,
  useTheme,
  alpha,
  Paper,
  Badge,
  Tooltip,
  IconButton,
  Button
} from '@mui/material';
import {
  Person,
  School,
  Warning,
  Assignment,
  AssignmentTurnedIn,
  AssignmentInd,
  ListAlt,
  AddToQueue,
  EmojiEvents,
  Payment,
  History,
  AttachMoney,
  Schedule,
  LibraryBooks,
  Grade,
  StarRate,
  Feedback,
  Settings,
  Bookmark,
  HowToReg,
  Work,
  ExpandLess,
  ExpandMore,
  Dashboard,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/api';

const Sidebar = ({ 
  drawerWidth = 240, 
  mobileOpen, 
  handleDrawerToggle, 
  isMobile,
  insideUnifiedForm = false,
  open = true
}) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for collapse menus
  const [openMenus, setOpenMenus] = useState({
    academic: false,
    registration: false,
    tuition: false,
    schedule: false,
    results: false
  });
  
  // Auto expand menu based on current route
  useEffect(() => {
    if (location.pathname.includes('/academic')) {
      setOpenMenus(prev => ({ ...prev, academic: true }));
    }
    if (location.pathname.includes('/course-registration') || 
        location.pathname.includes('/retake-registration') ||
        location.pathname.includes('/exam-registration') ||
        location.pathname.includes('/registered-courses') ||
        location.pathname.includes('/second-major') ||
        location.pathname.includes('/graduation-registration')) {
      setOpenMenus(prev => ({ ...prev, registration: true }));
    }
    if (location.pathname.includes('/tuition')) {
      setOpenMenus(prev => ({ ...prev, tuition: true }));
    }
    if (location.pathname.includes('/schedule')) {
      setOpenMenus(prev => ({ ...prev, schedule: true }));
    }
    if (location.pathname.includes('/academic-transcript') || 
        location.pathname.includes('/conduct-score') ||
        location.pathname.includes('/awards')) {
      setOpenMenus(prev => ({ ...prev, results: true }));
    }
  }, [location.pathname]);
  
  // Fetch fresh profile from backend
  useEffect(() => {
    if (currentUser?.UserID) {
      userService.getProfile(currentUser.UserID)
        .then(data => setProfileData(data))
        .catch(err => console.error('Error loading profile for sidebar:', err));
    }
  }, [currentUser]);
  
  // Toggle collapse menu
  const handleMenuToggle = (menu) => {
    setOpenMenus({
      ...openMenus,
      [menu]: !openMenus[menu]
    });
  };
  
  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Sidebar items with nested structure
  const sidebarItems = [
    {
      title: 'Dashboard',
      path: '/',
      icon: <Dashboard />
    },
    {
      title: 'Sơ yếu lý lịch',
      path: '/profile',
      icon: <Person />
    },
    {
      title: 'Học vụ',
      key: 'academic',
      icon: <LibraryBooks />,
      children: [
        {
          title: 'Chương trình đào tạo',
          path: '/academic-program',
          icon: <School />
        },
        {
          title: 'Cảnh báo học vụ',
          path: '/academic-warning',
          icon: <Warning />
        }
      ]
    },
    {
      title: 'Đăng ký học',
      key: 'registration',
      icon: <Assignment />,
      children: [
        {
          title: 'Đăng ký môn học',
          path: '/course-registration',
          icon: <Assignment />
        },
        {
          title: 'Đăng ký học lại & cải thiện',
          path: '/retake-registration',
          icon: <AssignmentTurnedIn />
        },
        {
          title: 'Đăng ký thi cải thiện',
          path: '/exam-registration',
          icon: <AssignmentInd />
        },
        {
          title: 'Lớp học phần đã đăng ký',
          path: '/registered-courses',
          icon: <ListAlt />
        },
        {
          title: 'Đăng ký học ngành 2',
          path: '/second-major',
          icon: <AddToQueue />
        },
        {
          title: 'Đăng ký xét tốt nghiệp',
          path: '/graduation-registration',
          icon: <EmojiEvents />
        }
      ]
    },
    {
      title: 'Học phí',
      key: 'tuition',
      icon: <Payment />,
      children: [
        {
          title: 'Thanh toán online',
          path: '/tuition-payment',
          icon: <Payment />
        },
        {
          title: 'Lịch sử giao dịch',
          path: '/payment-history',
          icon: <History />
        },
        {
          title: 'Xem học phí',
          path: '/tuition-fees',
          icon: <AttachMoney />
        }
      ]
    },
    {
      title: 'Lịch học/thi',
      key: 'schedule',
      icon: <Schedule />,
      children: [
        {
          title: 'Xem lịch học',
          path: '/class-schedule',
          icon: <Schedule />
        },
        {
          title: 'Xem lịch thi',
          path: '/exam-schedule',
          icon: <Schedule />
        }
      ]
    },
    {
      title: 'Kết quả học tập',
      key: 'results',
      icon: <Grade />,
      children: [
        {
          title: 'Xem điểm học tập',
          path: '/academic-transcript',
          icon: <Grade />
        },
        {
          title: 'Xem điểm rèn luyện',
          path: '/conduct-score',
          icon: <StarRate />
        },
        {
          title: 'Khen thưởng, kỷ luật',
          path: '/awards',
          icon: <EmojiEvents />
        }
      ]
    },
    {
      title: 'Đánh giá giảng viên',
      path: '/teacher-evaluation',
      icon: <Feedback />
    },
    {
      title: 'Gửi ý kiến',
      path: '/feedback',
      icon: <Feedback />
    },
    {
      title: 'Sửa thông tin cá nhân',
      path: '/profile-settings',
      icon: <Settings />
    },
    {
      title: 'Đăng ký dịch vụ',
      path: '/online-services',
      icon: <Bookmark />
    },
    {
      title: 'Xem điểm danh',
      path: '/attendance',
      icon: <HowToReg />
    },
    {
      title: 'Thông tin thực tập',
      path: '/internship',
      icon: <Work />
    }
  ];
  
  // Render menu item
  const renderMenuItem = (item, index) => {
    const isItemActive = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isMenuOpen = item.key ? openMenus[item.key] : false;
    const isChildActive = hasChildren && item.children.some(child => isActive(child.path));
    const active = isItemActive || isChildActive;

    if (hasChildren) {
      return (
        <React.Fragment key={index}>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleMenuToggle(item.key)}
              sx={{
                borderRadius: 1.5,
                py: 1,
                backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <ListItemIcon>
                {React.cloneElement(item.icon, { 
                  color: active ? 'primary' : 'action',
                  sx: { fontSize: '1.25rem' }
                })}
              </ListItemIcon>
              <ListItemText 
                primary={item.title} 
                primaryTypographyProps={{ 
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.95rem',
                  color: active ? 'primary.main' : 'text.primary'
                }} 
              />
              {isMenuOpen ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
            </ListItemButton>
          </ListItem>
          <Collapse in={isMenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child, childIndex) => {
                const isSubItemActive = isActive(child.path);
                return (
                  <ListItemButton
                    key={childIndex}
                    sx={{ 
                      pl: 4, 
                      py: 0.75,
                      borderRadius: 1.5, 
                      mb: 0.5,
                      ml: 1,
                      borderLeft: `1px solid ${isSubItemActive ? theme.palette.primary.main : theme.palette.divider}`,
                    }}
                    selected={isSubItemActive}
                    onClick={() => navigate(child.path)}
                  >
                    <ListItemIcon sx={{ minWidth: '36px' }}>
                      {React.cloneElement(child.icon, { 
                        fontSize: "small",
                        color: isSubItemActive ? 'primary' : 'action',
                      })}
                    </ListItemIcon>
                    <ListItemText 
                      primary={child.title} 
                      primaryTypographyProps={{ 
                        fontSize: '0.875rem',
                        fontWeight: isSubItemActive ? 600 : 400,
                        color: isSubItemActive ? 'primary.main' : 'text.secondary'
                      }} 
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }
    
    return (
      <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton 
          selected={isItemActive}
          onClick={() => navigate(item.path)}
          sx={{
            borderRadius: 1.5,
            py: 1,
            backgroundColor: isItemActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
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
            {React.cloneElement(item.icon, { 
              color: isItemActive ? 'primary' : 'action',
              sx: { fontSize: '1.25rem' }
            })}
          </ListItemIcon>
          <ListItemText 
            primary={item.title} 
            primaryTypographyProps={{ 
              fontWeight: isItemActive ? 600 : 500,
              fontSize: '0.95rem',
              color: isItemActive ? 'primary.main' : 'text.primary'
            }} 
          />
        </ListItemButton>
      </ListItem>
    );
  };
  
  // Container styling based on whether it's inside unified form or standalone
  const containerStyles = insideUnifiedForm
    ? {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)'
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)'
      };

  return (
    <Box
      sx={containerStyles}
      component="nav"
      aria-label="sidebar navigation"
    >
      {/* User Info Section */}
      <Box 
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          mb: 1,
          position: 'relative'
        }}
      >
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: theme.palette.text.secondary
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}
        
        <Avatar
          src={profileData?.Avatar || currentUser?.Avatar}
          alt={profileData?.FullName || currentUser?.FullName || 'User'}
          sx={{
            width: 80,
            height: 80,
            mb: 1,
            border: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.15)}`
          }}
        />
        
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            textAlign: 'center',
            mt: 1
          }}
        >
          {profileData?.FullName || currentUser?.FullName || 'Chưa cập nhật'}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          {currentUser?.UserID ? `MSSV: ${currentUser.UserID}` : 'MSSV: -'}
        </Typography>
      </Box>
      
      {/* Menu List */}
      <Box
        sx={{
          overflowY: 'auto',
          overflowX: 'hidden',
          flexGrow: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
            backgroundColor: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.primary.main, 0.2),
            borderRadius: '10px'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.4)
          }
        }}
      >
        <List
          sx={{
            px: 1.5,
            py: 0.5,
          }}
        >
          {sidebarItems.map(renderMenuItem)}
        </List>
      </Box>
      
      {/* System status at bottom */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          mt: 'auto',
          backgroundColor: alpha(theme.palette.background.default, 0.5),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ fontSize: '0.75rem' }}
        >
          Học kỳ 1 năm học 2023-2024
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.success.main,
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.75rem'
          }}
        >
          <Badge
            variant="dot"
            color="success"
            sx={{ mr: 0.5 }}
          /> Hệ thống đang hoạt động
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar; 