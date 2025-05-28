import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchEnrolledCourses, addEnrolledCourse, loadCachedAllCourses, preloadAllCourses } from '@/store/slices/courseSlice';
import courseApi from '@/api/courseApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import CoursesRoutes from './CoursesRoutes';

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

// Enhanced Skeleton loading component for courses
const CourseCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-200 shadow-lg h-full flex flex-col">
    <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 relative">
      <div className="absolute top-3 right-3 flex gap-2">
        <div className="h-5 w-12 bg-gray-300 rounded-xl"></div>
      </div>
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <div className="h-5 w-16 bg-gray-300 rounded-xl"></div>
        <div className="h-5 w-12 bg-gray-300 rounded-xl"></div>
      </div>
    </div>
    <div className="p-5 space-y-3 flex-1 flex flex-col">
      <div className="space-y-2">
        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-full"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5"></div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
          <div className="h-3 bg-gray-300 rounded-full w-3"></div>
          <div className="h-3 bg-gray-300 rounded-lg w-8"></div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
          <div className="h-3 bg-gray-300 rounded-full w-3"></div>
          <div className="h-3 bg-gray-300 rounded-lg w-6"></div>
        </div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-auto">
        <div className="space-y-1">
          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-16"></div>
          <div className="h-3 bg-gray-200 rounded-lg w-12"></div>
        </div>
        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-16"></div>
      </div>
    </div>
  </div>
);

const CourseCard = ({ course, enrollmentFilter, courseCategory, navigate, enrolledCourses }) => {
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
    <div 
      className="group bg-white rounded-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 hover:shadow-lg border border-gray-100 cursor-pointer h-full flex flex-col"
      onClick={() => navigate(`/courses/${courseId}`)}
    >
      {/* Course Image with Enhanced Overlay */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={course.ImageUrl || course.thumbnail || 'https://placehold.co/600x400?text=No+Image'}
          alt={course.Title || course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Modern Badge Overlay */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 max-w-[calc(100%-1rem)]">
          <span className={`px-2 py-1 rounded-lg text-[10px] font-medium backdrop-blur-md inline-flex items-center gap-1.5
            ${courseType === 'it' 
              ? 'bg-blue-500/90 text-white' 
              : 'bg-green-500/90 text-white'}`}>
            {courseType === 'it' ? 'IT' : 'Thường'}
          </span>
          {enrolled && (
            <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-500/90 text-white backdrop-blur-md inline-flex items-center gap-1.5">
              Đã đăng ký
            </span>
          )}
          {isFreeCourse && (
            <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-orange-500/90 text-white backdrop-blur-md inline-flex items-center gap-1.5">
              Miễn phí
            </span>
          )}
        </div>
      </div>

      {/* Course Info */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
          {course.Title || course.title}
        </h3>
        
        <p className="text-gray-500 text-xs line-clamp-2 flex-1">
          {course.ShortDescription || course.Description || course.description || 'Một khóa học tuyệt vời để nâng cao kỹ năng của bạn'}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{course.Duration || course.duration || 0}p</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{course.EnrolledCount || course.enrolledCount || 0}</span>
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex flex-col">
            {isFreeCourse ? (
              <span className="text-sm font-semibold text-green-600">
                Miễn phí
              </span>
            ) : (
              <>
                <span className="text-sm font-semibold text-blue-600">
                  {formatPrice(course.DiscountPrice || course.Price).toLocaleString()}₫
                </span>
                {course.DiscountPrice && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {formatPrice(course.Price).toLocaleString()}₫
                  </span>
                )}
              </>
            )}
          </div>
          
          {!enrolled ? (
            <button
              onClick={handleEnrollFreeCourse}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all duration-300 hover:opacity-90
                ${isFreeCourse 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-500 text-white'}`}
            >
              {isFreeCourse ? 'Đăng ký' : 'Mua ngay'}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/courses/${courseId}/learn`);
              }}
              className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-500 text-white flex items-center gap-1 transition-all duration-300 hover:opacity-90"
            >
              Học tiếp
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Courses = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { enrolledCourses, allCourses, loading: enrolledLoading, dataLoaded } = useSelector((state) => state.course);
  const [courseCategory, setCourseCategory] = useState('it'); // 'it' or 'regular'
  const [enrollmentFilter, setEnrollmentFilter] = useState('all'); // 'all' or 'enrolled'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Reference to course section for scrolling
  const courseSectionRef = React.useRef(null);
  
  // Function to handle category change and scroll
  const handleCategoryChange = (category) => {
    setCourseCategory(category);
    
    // Scroll to course section with smooth behavior
    setTimeout(() => {
      if (courseSectionRef.current) {
        courseSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
        
        toast.success('Thanh toán thành công! Bạn đã đăng ký khóa học thành công.');
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
  }, [dispatch, dataLoaded]);
  
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
            toast.success('Khóa học đã được thêm vào danh sách đã đăng ký của bạn!');
          }
        } catch (error) {
          console.error('Error fetching course details after payment:', error);
          if (isMounted) {
            toast.error('Không thể tải thông tin khóa học');
          }
        }
      };
      
      processPaymentCallback();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, dispatch]);

  // Hàm định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Định dạng tên phương thức thanh toán
  const formatPaymentMethod = (method) => {
    switch (method) {
      case 'vnpay': return 'VNPAY';
      case 'paypal': return 'PayPal';
      case 'credit_card': return 'Thẻ tín dụng';
      case 'free': return 'Miễn phí';
      default: return method || 'Chưa thanh toán';
    }
  };

  // Filter courses based on selected category and enrollment status
  const filteredCourses = useMemo(() => {
    // Create sets for faster lookups
    const addedCourseIds = new Set();
    const result = [];
    
    // If we're in the enrolled tab and user is authenticated
    if (enrollmentFilter === 'enrolled' && isAuthenticated) {
      // Only process enrolled courses
      enrolledCourses.forEach(course => {
        const courseId = course.CourseID || course.id;
        const matchesCategory = courseCategory === 'all' || 
                              (courseCategory === 'it' ? isITCourse(course) : !isITCourse(course));
        
        if (courseId && matchesCategory && !addedCourseIds.has(courseId)) {
          addedCourseIds.add(courseId);
          result.push({...course, enrolled: true});
        }
      });
      return result;
    } 
    // In the "all" tab - prioritize showing available courses
    else {
      // Quick lookup for enrolled course IDs
      const enrolledIds = new Set(
        enrolledCourses.map(course => course.CourseID || course.id).filter(Boolean)
      );
      
      // Process all courses that match the category and aren't enrolled
      if (allCourses && allCourses.length > 0) {
        allCourses.forEach(course => {
          const courseId = course.CourseID || course.id;
          if (!courseId || addedCourseIds.has(courseId)) return;
          
          const isEnrolled = enrolledIds.has(courseId);
          const matchesCategory = courseCategory === 'all' || 
                                (courseCategory === 'it' ? isITCourse(course) : !isITCourse(course));
          
          if (matchesCategory && !isEnrolled) {
            addedCourseIds.add(courseId);
            result.push({...course, enrolled: false});
          }
        });
      }
      
      return result;
    }
  }, [courseCategory, enrollmentFilter, allCourses, enrolledCourses, isAuthenticated]);

  // Determine loading state - only show loading when actually needed
  const isLoading = useMemo(() => {
    // For the enrolled tab
    if (enrollmentFilter === 'enrolled') {
      // Only show loading if we're actively fetching and don't have data
      return enrolledLoading && (!enrolledCourses || enrolledCourses.length === 0);
    } 
    // For the all courses tab
    else {
      // Only show loading if we're actively fetching and don't have data
      return loading && (!allCourses || allCourses.length === 0);
    }
  }, [enrollmentFilter, enrolledLoading, loading, enrolledCourses?.length, allCourses?.length]);

  // Render skeleton placeholders during loading
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <CourseCardSkeleton key={`skeleton-${index}`} />
    ));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="bg-red-100 p-4 rounded-full mb-6">
                <svg className="w-14 h-14 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Đã xảy ra lỗi</h2>
            <p className="text-red-500 mb-8 text-lg">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>Tải lại trang</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Animated Hero Section */}
        <div className="relative overflow-hidden bg-white">
          {/* Flower Bloom Animation */}
          <div className="absolute inset-0">
            {/* Random floating flowers */}
            <div className="absolute top-20 left-10 w-8 h-8 text-pink-300 opacity-60 animate-pulse">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="absolute top-32 right-20 w-6 h-6 text-purple-300 opacity-50 animate-bounce" style={{animationDelay: '0.5s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="absolute top-10 right-1/3 w-10 h-10 text-blue-300 opacity-40 animate-spin" style={{animationDuration: '8s', animationDelay: '1s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.5c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
                <circle cx="12" cy="8" r="2"/>
                <circle cx="8" cy="16" r="1.5"/>
                <circle cx="16" cy="16" r="1.5"/>
              </svg>
            </div>
            <div className="absolute bottom-20 left-1/4 w-12 h-12 text-rose-300 opacity-30 animate-pulse" style={{animationDelay: '2s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div className="absolute top-40 left-2/3 w-7 h-7 text-green-300 opacity-45 animate-bounce" style={{animationDelay: '1.5s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.46c.48-.06.96-.14 1.34-.27C9.34 18.93 10 14.91 11 11c3 1 6 3 8 4.5 2-1.5 3-4.5 1-6.5-1.5-1.5-3-1-3-1z"/>
              </svg>
            </div>
            <div className="absolute bottom-32 right-10 w-9 h-9 text-yellow-300 opacity-35 animate-spin" style={{animationDuration: '6s', animationDelay: '0.8s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.09 6.26L20 9.27l-5 4.87L16.18 21 12 17.77 7.82 21 9 14.14 4 9.27l5.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="absolute top-60 left-12 w-5 h-5 text-indigo-300 opacity-50 animate-pulse" style={{animationDelay: '3s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
              </svg>
            </div>
            <div className="absolute bottom-10 left-1/2 w-11 h-11 text-teal-300 opacity-25 animate-bounce" style={{animationDelay: '2.5s'}}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
          </div>
          
          <div className="relative w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="text-center lg:text-left max-w-4xl">
              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Khám phá 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> kho tàng </span>
                khóa học
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
                Nâng cao kỹ năng của bạn với hơn {allCourses.length || 0}+ khóa học chất lượng cao được thiết kế bởi các chuyên gia hàng đầu trong ngành
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={() => handleCategoryChange('it')}
                  className={`group px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105
                    ${courseCategory === 'it' 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' 
                      : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'}`}
                >
                  <div className="p-2 bg-blue-500 rounded-xl">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Khóa học IT</div>
                    <div className="text-sm opacity-75">Lập trình & Công nghệ</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleCategoryChange('regular')}
                  className={`group px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-105
                    ${courseCategory === 'regular' 
                      ? 'bg-green-600 text-white shadow-xl shadow-green-200' 
                      : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'}`}
                >
                  <div className="p-2 bg-green-500 rounded-xl">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Khóa học Thường</div>
                    <div className="text-sm opacity-75">Kiến thức Cơ bản</div>
                  </div>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-gray-900">{allCourses.length || 0}+</div>
                  <div className="text-gray-600 text-sm">Khóa học</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-gray-900">{enrolledCourses.length || 0}</div>
                  <div className="text-gray-600 text-sm">Đã đăng ký</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-gray-900">{allCourses.filter(course => formatPrice(course.Price) === 0).length || 0}</div>
                  <div className="text-gray-600 text-sm">Miễn phí</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-gray-900">24/7</div>
                  <div className="text-gray-600 text-sm">Hỗ trợ</div>
                </div>
              </div>
            </div>
          </div>

          {/* Wave separator */}
          <div className="absolute bottom-0 left-0 w-full">
            <svg className="w-full h-20 fill-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
            </svg>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-4 sm:px-5 lg:px-8 -mt-[24px] relative z-10">
          {/* Enhanced Filter Section */}
          <div ref={courseSectionRef} className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200 mb-8">
            <div className="p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                {/* Category Title */}
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${courseCategory === 'it' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {courseCategory === 'it' ? (
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {courseCategory === 'it' ? 'Khóa học IT' : 'Khóa học Thường'}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {filteredCourses.length} khóa học có sẵn
                    </p>
                  </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setEnrollmentFilter('all')}
                    className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 transform hover:scale-105
                      ${enrollmentFilter === 'all'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Tất cả khóa học
                  </button>
                  
                  {isAuthenticated && (
                    <button
                      onClick={() => setEnrollmentFilter('enrolled')}
                      className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 transform hover:scale-105
                        ${enrollmentFilter === 'enrolled'
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Đã đăng ký 
                      <span className="bg-white/20 text-white px-2 py-1 rounded-lg text-sm font-bold">
                        {enrolledCourses.filter(course => 
                          courseCategory === 'it' ? isITCourse(course) : !isITCourse(course)
                        ).length}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Course Grid */}
          <div className="mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {isLoading ? (
                renderSkeletons()
              ) : filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <CourseCard
                    key={`course-${courseCategory}-${course.CourseID || course.id}`}
                    course={course}
                    enrollmentFilter={enrollmentFilter}
                    courseCategory={courseCategory}
                    navigate={navigate}
                    enrolledCourses={enrolledCourses}
                  />
                ))
              ) : (
                // Enhanced empty state
                (allCourses.length > 0 || enrolledCourses.length > 0) ? (
                  <div className="col-span-full py-20">
                    <div className="max-w-md mx-auto text-center">
                      <div className="relative mb-8">
                        <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto">
                          <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Không tìm thấy khóa học
                      </h3>
                      <p className="text-gray-600 mb-8 text-lg">
                        Hiện tại chưa có khóa học nào trong danh mục này. Hãy thử khám phá danh mục khác!
                      </p>
                      <button
                        onClick={() => setCourseCategory(courseCategory === 'it' ? 'regular' : 'it')}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 inline-flex items-center gap-3 font-semibold transform hover:scale-105 shadow-lg shadow-blue-200"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Khám phá khóa học {courseCategory === 'it' ? 'Thường' : 'IT'}
                      </button>
                    </div>
                  </div>
                ) : (
                  renderSkeletons()
                )
              )}
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu hành trình học tập?</h3>
                <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
                  Đăng ký ngay để truy cập hàng nghìn khóa học chất lượng cao và nâng cao kỹ năng của bạn
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/register')}
                    className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Đăng ký miễn phí
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-4 bg-indigo-500/20 backdrop-blur-sm border border-white/20 text-white rounded-2xl font-semibold hover:bg-indigo-500/30 transition-all duration-300 transform hover:scale-105"
                  >
                    Đăng nhập
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Courses; 