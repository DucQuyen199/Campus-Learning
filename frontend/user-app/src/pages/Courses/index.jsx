import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchEnrolledCourses, addEnrolledCourse, loadCachedAllCourses, preloadAllCourses } from '@/store/slices/courseSlice';
import courseApi from '@/api/courseApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import CoursesRoutes from './CoursesRoutes';

// Material UI imports
import {
  Grid,
  Paper,
  Typography,
  Box,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Snackbar,
  Backdrop
} from '@mui/material';
import {
  Code as CodeIcon,
  MenuBook as MenuBookIcon,
  FilterAlt as FilterAltIcon,
  CheckCircle as CheckCircleIcon,
  LocalOffer as LocalOfferIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  PlayArrow as PlayArrowIcon,
  Money as MoneyIcon,
  Refresh as RefreshIcon,
  BookmarkAdded as BookmarkAddedIcon
} from '@mui/icons-material';

// Hàm helper để format giá
const formatPrice = (price) => {
  if (price === null || price === undefined) return 0;
  const numericPrice = parseFloat(price);
  return isNaN(numericPrice) ? 0 : numericPrice;
};

// Hàm helper để kiểm tra khóa học IT
const isITCourse = (course) => {
  // Ưu tiên sử dụng CourseType nếu có
  if (course.CourseType !== undefined || course.courseType !== undefined) {
    const courseType = (course.CourseType || course.courseType || '').toLowerCase();
    return courseType === 'it';
  }
  
  // Phương án dự phòng: kiểm tra tiêu đề khóa học
  const title = (course.Title || course.title || '').toLowerCase();
  
  // Nếu tiêu đề có từ khóa của khóa học thường, đây không phải khóa học IT
  if (
    title.includes('lịch sử') || 
    title.includes('tư tưởng') || 
    title.includes('chính trị') ||
    title.includes('đạo đức') ||
    title.includes('triết học') ||
    title.includes('xã hội') ||
    title.includes('kinh tế')
  ) {
    return false;
  }
  
  // Nếu tiêu đề có từ khóa IT, đây là khóa học IT
  if (
    title.includes('it') ||
    title.includes('code') ||
    title.includes('coding') ||
    title.includes('lập trình') ||
    title.includes('web') ||
    title.includes('app') ||
    title.includes('software') ||
    title.includes('phần mềm') ||
    title.includes('database') ||
    title.includes('dữ liệu') ||
    title.includes('python') ||
    title.includes('java') || 
    title.includes('javascript') ||
    title.includes('html') ||
    title.includes('css') ||
    title.includes('algorithm') ||
    title.includes('thuật toán')
  ) {
    return true;
  }
  
  // Kiểm tra category
  const category = (course.Category || course.category || '').toLowerCase();
  if (category.includes('it') || 
     category.includes('programming') || 
     category.includes('web') ||
     category.includes('mobile') ||
     category.includes('data') ||
     category.includes('computer')) {
    return true;
  }
  
  // Mặc định là khóa học IT
  return true;
};

// Hàm helper để kiểm tra khóa học đã đăng ký
const isEnrolledCourse = (course, enrolledCourses = []) => {
  if (!enrolledCourses || !Array.isArray(enrolledCourses) || enrolledCourses.length === 0) {
    return false;
  }
  
  // Nếu course đã có thuộc tính enrolled được đánh dấu
  if (course.enrolled === true) {
    return true;
  }
  
  const courseId = course.CourseID || course.id;
  if (!courseId) return false;
  
  // Kiểm tra ID trong danh sách đã đăng ký
  return enrolledCourses.some(enrolledCourse => {
    const enrolledId = enrolledCourse.CourseID || enrolledCourse.id;
    return enrolledId === courseId;
  });
};

// Skeleton loading component for courses
const CourseCardSkeleton = () => {
  const theme = useTheme();
  
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ height: 200, backgroundColor: 'action.hover', position: 'relative' }} />
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ height: 24, width: '70%', backgroundColor: 'action.hover', mb: 1, borderRadius: 1 }} />
        <Box sx={{ height: 16, width: '100%', backgroundColor: 'action.hover', mb: 1, borderRadius: 1 }} />
        <Box sx={{ height: 16, width: '90%', backgroundColor: 'action.hover', mb: 2, borderRadius: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ height: 24, width: 24, backgroundColor: 'action.hover', borderRadius: '50%' }} />
          <Box sx={{ height: 16, width: 80, backgroundColor: 'action.hover', borderRadius: 1 }} />
        </Box>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Box sx={{ height: 36, width: '100%', backgroundColor: 'action.hover', borderRadius: theme.shape.borderRadius }} />
      </CardActions>
    </Card>
  );
};

const CourseCard = ({ course, enrollmentFilter, courseCategory, navigate, enrolledCourses }) => {
  const theme = useTheme();
  const courseId = course.CourseID || course.id;
  const isFreeCourse = formatPrice(course.Price) === 0;
  const enrolled = course.enrolled === true || isEnrolledCourse(course, enrolledCourses);
  const courseType = isITCourse(course) ? 'it' : 'regular';
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const handleEnrollFreeCourse = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để đăng ký khóa học');
      navigate('/login');
      return;
    }

    if (isFreeCourse) {
      try {
        const response = await courseApi.enrollFreeCourse(courseId);
        if (response.data && response.data.success) {
          toast.success('Đăng ký khóa học thành công!');
          dispatch(addEnrolledCourse(course));
          setTimeout(() => {
            navigate(`/courses/${courseId}/learn`);
          }, 1000);
        } else {
          toast.error(response.data?.message || 'Không thể đăng ký khóa học');
        }
      } catch (error) {
        toast.error('Đã xảy ra lỗi khi đăng ký khóa học');
        console.error('Error enrolling in course:', error);
      }
    } else {
      navigate(`/payment/${courseId}`);
    }
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        maxWidth: '100%',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: theme.shadows[5],
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardMedia
        component="img"
        height="140"
        image={course.ImageUrl || course.thumbnail || 'https://placehold.co/600x400?text=No+Image'}
        alt={course.Title || course.title}
        sx={{ objectFit: 'cover' }}
      />
      <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
        <Chip 
          label={course.Level || course.level || 'All Levels'} 
          size="small" 
          color="primary" 
          variant="outlined"
          sx={{ 
            backgroundColor: 'white',
            color: 'text.secondary',
            borderColor: 'divider',
            fontSize: '0.7rem',
            height: 20
          }}
        />
      </Box>
      <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Chip 
          icon={courseType === 'it' ? <CodeIcon fontSize="small" /> : <MenuBookIcon fontSize="small" />}
          label={courseType === 'it' ? 'Khóa học IT' : 'Khóa học Thường'} 
          size="small" 
          color={courseType === 'it' ? 'primary' : 'success'}
          sx={{ fontWeight: 500, fontSize: '0.7rem', height: 20 }}
        />
        {enrolled && (
          <Chip 
            icon={<CheckCircleIcon fontSize="small" />}
            label="Đã đăng ký" 
            size="small" 
            color="success"
            sx={{ fontWeight: 500, fontSize: '0.7rem', height: 20 }}
          />
        )}
      </Box>
      
      <CardContent sx={{ flexGrow: 1, p: 1.5, pt: 1.5 }}>
        <Typography variant="subtitle1" component="h3" gutterBottom noWrap sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
          {course.Title || course.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ 
          mb: 1.5, 
          fontSize: '0.8rem',
          display: '-webkit-box', 
          overflow: 'hidden', 
          WebkitBoxOrient: 'vertical', 
          WebkitLineClamp: 2,
          lineHeight: 1.3
        }}>
          {course.ShortDescription || course.Description || course.description || 'Không có mô tả'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon fontSize="small" sx={{ fontSize: '0.9rem' }} color="action" />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {course.EnrolledCount || 0} học viên
            </Typography>
          </Box>
          {!isFreeCourse && (
            <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ fontSize: '0.8rem' }}>
              {formatPrice(course.DiscountPrice || course.Price).toLocaleString()} VND
            </Typography>
          )}
          {isFreeCourse && (
            <Chip 
              label="Miễn phí" 
              size="small" 
              color="success"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>
      </CardContent>
      
      <CardActions sx={{ p: 1.5, pt: 0 }}>
        {enrolled ? (
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            size="small"
            startIcon={<PlayArrowIcon sx={{ fontSize: '0.9rem' }} />}
            onClick={() => navigate(`/courses/${courseId}/learn`)}
            sx={{ fontSize: '0.8rem' }}
          >
            Học ngay
          </Button>
        ) : (
          <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
            <Button 
              variant="outlined" 
              color="primary"
              size="small"
              sx={{ flexGrow: 1, fontSize: '0.75rem' }}
              onClick={() => navigate(`/courses/${courseId}`)}
            >
              Chi tiết
            </Button>
            <Button 
              variant="contained" 
              color={isFreeCourse ? "success" : "primary"}
              size="small"
              sx={{ flexGrow: 1, fontSize: '0.75rem' }}
              startIcon={isFreeCourse ? <CheckCircleIcon sx={{ fontSize: '0.9rem' }} /> : <MoneyIcon sx={{ fontSize: '0.9rem' }} />}
              onClick={handleEnrollFreeCourse}
            >
              Đăng ký
            </Button>
          </Box>
        )}
      </CardActions>
    </Card>
  );
};

const Courses = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { enrolledCourses, allCourses, loading: enrolledLoading, dataLoaded } = useSelector((state) => state.course);
  const [courseCategory, setCourseCategory] = useState('it'); // 'it' or 'regular'
  const [enrollmentFilter, setEnrollmentFilter] = useState('all'); // 'all' or 'enrolled'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Styles matching Profile.js structure
  const styles = {
    root: {
      flexGrow: 1,
      padding: theme.spacing(2)
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(3)
    },
    titleSection: {
      marginBottom: theme.spacing(3)
    },
    tableContainer: {
      marginTop: theme.spacing(3)
    },
    chip: {
      margin: theme.spacing(0.5)
    },
    formControl: {
      minWidth: 200,
      marginRight: theme.spacing(2)
    },
    buttonGroup: {
      marginTop: theme.spacing(3)
    },
    infoSection: {
      marginBottom: theme.spacing(3),
      padding: theme.spacing(2),
      backgroundColor: theme.palette.background.default
    },
    categoryChip: {
      borderRadius: theme.shape.borderRadius,
      fontWeight: 500,
      color: 'white',
      padding: theme.spacing(1, 2)
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };
  
  // Immediately try to load cached data without loading state
  useEffect(() => {
    dispatch(loadCachedAllCourses());
  }, [dispatch]);
  
  // Separate effect to update loading state when allCourses changes
  useEffect(() => {
    // If we have cached data, we don't need to show loading state
    if (allCourses && allCourses.length > 0) {
      setLoading(false);
    }
  }, [allCourses]);

  // Check if we're coming from payment success page with activeTab in state
  useEffect(() => {
    if (location.state?.activeTab && isAuthenticated) {
      if (location.state.activeTab === 'enrolled') {
        setEnrollmentFilter('enrolled');
      }
      
      // Hiển thị thông báo thành công nếu là từ trang thanh toán
      if (location.state.paymentSuccess) {
        // Refresh enrolled courses explicitly when coming from successful payment
        dispatch(fetchEnrolledCourses({ forceRefresh: true }));
        
        setSnackbar({
          open: true,
          message: 'Thanh toán thành công! Bạn đã đăng ký khóa học thành công.',
          severity: 'success'
        });
      }
    }
  }, [location.state, isAuthenticated, dispatch]);

  // Reset to 'all' tab if not authenticated and tried to view enrolled courses
  useEffect(() => {
    if (!isAuthenticated && enrollmentFilter === 'enrolled') {
      setEnrollmentFilter('all');
    }
  }, [isAuthenticated, enrollmentFilter]);

  // Main data loading effect - separated for better performance
  useEffect(() => {
    let isMounted = true;
    
    // First, load all courses if needed - higher priority for new visitors
    const loadAllCourses = async () => {
      // Only load if not already loaded and we don't have data
      if (!dataLoaded && (!allCourses || allCourses.length === 0)) {
        setLoading(true);
        try {
          await dispatch(preloadAllCourses()).unwrap();
          if (isMounted) setLoading(false);
        } catch (err) {
          console.error('Error loading courses:', err);
          if (isMounted) {
            setError('Lỗi khi tải danh sách khóa học');
            setLoading(false);
          }
          
          // Fallback to direct API call if redux action fails
          try {
            const response = await courseApi.getAllCourses();
            if (response.data && response.data.success && isMounted) {
              dispatch({ type: 'course/preloadAllCourses/fulfilled', payload: response.data.data });
              setLoading(false);
            } else if (isMounted) {
              setError('Không thể tải danh sách khóa học');
            }
          } catch (directErr) {
            console.error('Error in direct API call:', directErr);
            if (isMounted) setError('Lỗi khi tải danh sách khóa học');
          } finally {
            if (isMounted) setLoading(false);
          }
        }
      }
    };
    
    // Load all courses first
    loadAllCourses();
    
    return () => {
      isMounted = false;
    };
  }, [dispatch, dataLoaded, allCourses]);
  
  // Separate effect for enrolled courses - lower priority
  useEffect(() => {
    // Only fetch enrolled courses if user is authenticated
    if (isAuthenticated && !enrolledCourses.length) {
      console.log('Fetching enrolled courses...');
      dispatch(fetchEnrolledCourses());
    }
  }, [dispatch, isAuthenticated, enrolledCourses.length]);

  // Separate effect for handling payment success
  useEffect(() => {
    if (isAuthenticated && location.state?.paymentSuccess) {
      dispatch(fetchEnrolledCourses({ forceRefresh: true }));
    }
  }, [dispatch, isAuthenticated, location.state?.paymentSuccess]);

  // Check URL for course ID and payment status - this handles direct navigation from payment pages
  useEffect(() => {
    let isMounted = true;
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    const paymentStatus = urlParams.get('status');
    
    // Only process if we have both parameters and user is authenticated
    if (courseId && paymentStatus === 'success' && isAuthenticated) {
      console.log('Detected successful payment for course ID:', courseId);
      
      // Process in the background without changing main view unless needed
      const processPaymentCallback = async () => {
        // Don't switch tabs immediately to avoid flickering
        // Only update enrolled courses in the background
        dispatch(fetchEnrolledCourses({ forceRefresh: true }));
        
        try {
          const response = await courseApi.getCourseDetails(courseId);
          if (response && response.success && isMounted) {
            // Normalize course data
            const courseData = response.data;
            if (!courseData.CourseType && !courseData.courseType) {
              // Determine course type based on title
              const title = (courseData.Title || courseData.title || '').toLowerCase();
              if (
                title.includes('lịch sử') || 
                title.includes('tư tưởng') || 
                title.includes('chính trị') ||
                title.includes('đạo đức') ||
                title.includes('triết học')
              ) {
                courseData.CourseType = 'regular';
              } else {
                courseData.CourseType = 'it';
              }
            }
            
            // Add to enrolled courses
            dispatch(addEnrolledCourse(courseData));
            
            // Notify user of success without switching tabs
            setSnackbar({
              open: true,
              message: 'Khóa học đã được thêm vào danh sách đã đăng ký của bạn!',
              severity: 'success'
            });
          }
        } catch (error) {
          console.error('Error fetching course details after payment:', error);
          if (isMounted) {
            setSnackbar({
              open: true,
              message: 'Không thể tải thông tin khóa học',
              severity: 'error'
            });
          }
        }
      };
      
      processPaymentCallback();
    }
    
    return () => {
      isMounted = false;
    };
  }, [dispatch, isAuthenticated]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format payment method for display
  const formatPaymentMethod = (method) => {
    if (!method) return 'N/A';
    
    const methodMap = {
      'vnpay': 'VNPay',
      'momo': 'MoMo',
      'zalopay': 'ZaloPay',
      'cash': 'Tiền mặt',
      'bank_transfer': 'Chuyển khoản',
      'credit_card': 'Thẻ tín dụng'
    };
    
    return methodMap[method.toLowerCase()] || method;
  };

  // Filter courses based on selected filters
  const filteredCourses = useMemo(() => {
    let result = [];
    
    if (enrollmentFilter === 'enrolled') {
      // Only show enrolled courses
      result = enrolledCourses.filter(course => 
        courseCategory === 'it' ? isITCourse(course) : !isITCourse(course)
      );
    } else {
      // Show all courses of the selected category
      result = allCourses.filter(course => 
        courseCategory === 'it' ? isITCourse(course) : !isITCourse(course)
      );
      
      // Mark enrolled courses
      result = result.map(course => {
        const enrolled = isEnrolledCourse(course, enrolledCourses);
        return {
          ...course,
          enrolled
        };
      });
    }
    
    return result;
  }, [enrollmentFilter, courseCategory, allCourses, enrolledCourses]);

  // Determine if we're in a loading state
  const isLoading = useMemo(() => {
    if (enrollmentFilter === 'enrolled') {
      return enrolledLoading || (enrolledCourses.length === 0 && isAuthenticated && loading);
    } else {
      return loading && (!allCourses || allCourses.length === 0);
    }
  }, [enrollmentFilter, enrolledLoading, loading, enrolledCourses?.length, allCourses?.length, isAuthenticated]);

  // Render skeleton placeholders during loading
  const renderSkeletons = () => {
    return (
      <Grid container spacing={2}>
        {Array(8).fill(0).map((_, index) => (
          <Grid item xs={6} sm={4} md={3} key={`skeleton-${index}`}>
            <CourseCardSkeleton />
          </Grid>
        ))}
      </Grid>
    );
  };

  // Loading state
  if (loading && !allCourses.length) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        </Paper>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.root}>
        <Paper sx={styles.paper}>
          <Alert 
            severity="error" 
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => window.location.reload()}
                startIcon={<RefreshIcon />}
              >
                Tải lại
              </Button>
            }
          >
            {error}
          </Alert>
        </Paper>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <Paper sx={styles.paper}>
        <Box sx={styles.titleSection}>
          <Typography variant="h4" gutterBottom>
            Danh sách khóa học
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Khám phá kho khóa học chất lượng, nâng cao kỹ năng của bạn
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>
        
        {/* Category Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterAltIcon sx={{ mr: 1, color: 'primary.main' }} />
            Loại khóa học
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant={courseCategory === 'it' ? "contained" : "outlined"}
              color="primary"
              startIcon={<CodeIcon />}
              onClick={() => setCourseCategory('it')}
            >
              Khóa học IT
            </Button>
            <Button
              variant={courseCategory === 'regular' ? "contained" : "outlined"}
              color="secondary"
              startIcon={<MenuBookIcon />}
              onClick={() => setCourseCategory('regular')}
            >
              Khóa học Thường
            </Button>
          </Box>
        </Box>
        
        {/* Tabs Section */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={enrollmentFilter}
            onChange={(e, newValue) => setEnrollmentFilter(newValue)}
            aria-label="course filter tabs"
            variant={isSmallScreen ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                minHeight: 48,
              }
            }}
          >
            <Tab 
              label="Tất cả khóa học" 
              value="all"
              icon={<SchoolIcon />} 
              iconPosition="start" 
            />
            {isAuthenticated && (
              <Tab 
                label={`Khóa học đã đăng ký (${enrolledCourses.filter(c => courseCategory === 'it' ? isITCourse(c) : !isITCourse(c)).length})`} 
                value="enrolled"
                icon={<BookmarkAddedIcon />} 
                iconPosition="start" 
                disabled={!isAuthenticated}
              />
            )}
          </Tabs>
        </Box>
        
        {/* Course Grid */}
        <Box sx={{ mt: 3 }}>
          {isLoading ? (
            renderSkeletons()
          ) : filteredCourses.length > 0 ? (
            <Grid container spacing={2}>
              {filteredCourses.map((course) => (
                <Grid item xs={6} sm={4} md={3} key={`course-${courseCategory}-${course.CourseID || course.id}`}>
                  <CourseCard
                    course={course}
                    enrollmentFilter={enrollmentFilter}
                    courseCategory={courseCategory}
                    navigate={navigate}
                    enrolledCourses={enrolledCourses}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <Box 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: '50%', 
                    bgcolor: 'action.hover', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mb: 2
                  }}
                >
                  <SchoolIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Không tìm thấy khóa học
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Hiện tại chưa có khóa học nào trong danh mục này
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={() => setCourseCategory(courseCategory === 'it' ? 'regular' : 'it')}
                >
                  Xem khóa học {courseCategory === 'it' ? 'Thường' : 'IT'}
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Loading backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading && allCourses.length > 0}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
};

export default Courses; 