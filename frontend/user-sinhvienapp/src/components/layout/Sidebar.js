import React from 'react';
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
  Toolbar
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
  ExpandMore
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// Drawer width
const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for collapse menus
  const [openMenus, setOpenMenus] = React.useState({
    academic: false,
    registration: false,
    tuition: false,
    schedule: false,
    results: false
  });
  
  // Toggle collapse menu
  const handleMenuToggle = (menu) => {
    setOpenMenus({
      ...openMenus,
      [menu]: !openMenus[menu]
    });
  };
  
  // Sidebar items with nested structure
  const sidebarItems = [
    {
      title: 'Dashboard',
      path: '/',
      icon: <School />
    },
    {
      title: 'Sơ yếu lý lịch',
      path: '/profile',
      icon: <Person />
    },
    {
      title: 'Học vụ',
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
  
  // Render nested menu items
  const renderMenuItems = (items) => {
    return items.map((item, index) => {
      if (item.children) {
        return (
          <React.Fragment key={index}>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleMenuToggle(item.title.toLowerCase())}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
                {openMenus[item.title.toLowerCase()] ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={openMenus[item.title.toLowerCase()]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.children.map((child, childIndex) => (
                  <ListItem key={childIndex} disablePadding>
                    <ListItemButton 
                      sx={{ pl: 4 }}
                      selected={location.pathname === child.path}
                      onClick={() => navigate(child.path)}
                    >
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText primary={child.title} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        );
      }
      
      return (
        <ListItem key={index} disablePadding>
          <ListItemButton 
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.title} />
          </ListItemButton>
        </ListItem>
      );
    });
  };
  
  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ p: 1 }}>
          <Typography variant="h6" noWrap component="div">
            CAMPUS CONNECT
          </Typography>
          {currentUser && (
            <Typography variant="body2" noWrap component="div">
              {currentUser.FullName}
            </Typography>
          )}
        </Box>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
        <List>{renderMenuItems(sidebarItems)}</List>
      </Box>
    </div>
  );
  
  return (
    <Box
      component="nav"
      sx={{ 
        width: { sm: drawerWidth }, 
        flexShrink: { sm: 0 },
        height: '100%'
      }}
      aria-label="menu navigation"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            height: '100%'
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            height: '100%',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar; 