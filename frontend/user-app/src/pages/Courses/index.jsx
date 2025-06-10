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
  <div className="bg-white rounded-xl overflow-hidden animate-pulse border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative"></div>
    <div className="p-5 space-y-3 flex-1 flex flex-col">
      <div className="h-4 bg-gray-100 rounded-md w-1/2 mb-1"></div>
      <div className="h-5 bg-gray-200 rounded-md w-4/5"></div>
      <div className="h-4 bg-gray-100 rounded-md w-full"></div>
      <div className="h-4 bg-gray-100 rounded-md w-2/3"></div>
      <div className="flex items-center gap-2 mt-2">
        <div className="h-4 w-4 rounded-full bg-gray-200"></div>
        <div className="h-3 bg-gray-100 rounded-md w-12"></div>
        <div className="h-4 w-4 rounded-full bg-gray-200"></div>
        <div className="h-3 bg-gray-100 rounded-md w-16"></div>
      </div>
      <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-100 mt-3">
        <div className="h-5 bg-gray-200 rounded-md w-16"></div>
        <div className="h-8 bg-gray-200 rounded-md w-20"></div>
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

  // Random duration between 2-12 hours for demo purposes
  const courseDuration = course.Duration || course.duration || Math.floor(Math.random() * 10 + 2);
  // Random enrollment count between 100-9999 for demo purposes
  const enrollmentCount = course.EnrolledCount || course.enrolledCount || Math.floor(Math.random() * 9900 + 100);
  // Random difficulty level
  const difficultyLevels = ["Cơ bản", "Trung bình", "Nâng cao"];
  const difficulty = course.DifficultyLevel || difficultyLevels[Math.floor(Math.random() * 3)];
  // Random star rating (4.0-5.0)
  const rating = course.Rating || (4 + Math.random()).toFixed(1);

  return (
    <div 
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 cursor-pointer h-full flex flex-col transform transition-all duration-300 hover:-translate-y-1"
      onClick={() => navigate(`/courses/${courseId}`)}
    >
      {/* Course Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={course.ImageUrl || course.thumbnail || 'https://placehold.co/600x400?text=No+Image'}
          alt={course.Title || course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Course provider badge - positioned on top of the image */}
        <div className="absolute top-0 left-0 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1.5">
          CampusT
        </div>
        
        {/* Badge Overlay */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5 max-w-[calc(100%-1rem)]">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
            courseType === 'it' 
              ? 'bg-blue-600 text-white' 
              : 'bg-green-600 text-white'
          }`}>
            {courseType === 'it' ? 'IT & Công nghệ' : 'Kiến thức cơ bản'}
          </span>
          {enrolled && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-600 text-white">
              Đã đăng ký
            </span>
          )}
        </div>
      </div>

      {/* Course Info */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Course category */}
        <div className="text-xs font-medium text-blue-600 mb-1">
          {courseType === 'it' ? 'Khoa học máy tính' : 'Kiến thức xã hội'}
        </div>
        
        {/* Course title */}
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 text-base hover:text-blue-700 transition-colors">
          {course.Title || course.title}
        </h3>
        
        {/* Course short description */}
        <p className="text-gray-500 text-xs line-clamp-2 mb-2">
          {course.ShortDescription || course.Description || course.description || 'Khóa học này sẽ giúp bạn nắm vững những kiến thức quan trọng và kỹ năng cần thiết.'}
        </p>
        
        {/* Course stats */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap mb-auto">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{courseDuration} giờ</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{enrollmentCount.toLocaleString()} học viên</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>{difficulty}</span>
          </div>
        </div>
        
        {/* Footer with price and button */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-100">
          <div>
            {isFreeCourse ? (
              <span className="text-sm font-semibold text-green-600">
                Miễn phí
              </span>
            ) : (
              <span className="text-sm font-semibold text-blue-600">
                {formatPrice(course.DiscountPrice || course.Price).toLocaleString()}₫
              </span>
            )}
          </div>
          
          {!enrolled ? (
            <button
              onClick={handleEnrollFreeCourse}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                isFreeCourse ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              } shadow-sm`}
            >
              {isFreeCourse ? 'Đăng ký ngay' : 'Mua ngay'}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/courses/${courseId}/learn`);
              }}
              className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 shadow-sm"
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
    return Array(8).fill(0).map((_, index) => (
      <CourseCardSkeleton key={`skeleton-${index}`} />
    ));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-100 p-4 rounded-full mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Đã xảy ra lỗi</h2>
            <p className="text-red-500 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Define tab styles
  const getTabStyle = (isActive) => {
    return isActive 
      ? "bg-blue-50 text-blue-700"
      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50";
  };

  // Define button styles
  const getButtonStyle = (isActive, color) => {
    return isActive 
      ? `bg-${color}-600 text-white shadow-sm`
      : `bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200`;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header section */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Khám phá khóa học</h1>
          <div className="flex mt-6 space-x-6 overflow-x-auto pb-1">
            <button
              onClick={() => setCourseCategory('it')}
              className={`px-6 py-3 font-medium text-sm rounded-md transition-all ${getTabStyle(courseCategory === 'it')}`}
            >
              Khóa học IT & Công nghệ
            </button>
            
            <button
              onClick={() => setCourseCategory('regular')}
              className={`px-6 py-3 font-medium text-sm rounded-md transition-all ${getTabStyle(courseCategory === 'regular')}`}
            >
              Khóa học Thường
            </button>

            {isAuthenticated && (
              <button
                onClick={() => setEnrollmentFilter(enrollmentFilter === 'enrolled' ? 'all' : 'enrolled')}
                className={`px-6 py-3 font-medium text-sm rounded-md transition-all ${getTabStyle(enrollmentFilter === 'enrolled')}`}
              >
                Đã đăng ký ({enrolledCourses.filter(course => 
                  courseCategory === 'it' ? isITCourse(course) : !isITCourse(course)
                ).length})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Secondary filter bar */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {courseCategory === 'it' 
                ? 'Khóa học IT & Công nghệ' 
                : 'Khóa học Kiến thức cơ bản'}
              {enrollmentFilter === 'enrolled' ? ' — Đã đăng ký' : ''}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredCourses.length} khóa học có sẵn
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setEnrollmentFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                getButtonStyle(enrollmentFilter === 'all', 'blue')
              }`}
            >
              Tất cả khóa học
            </button>
            
            {isAuthenticated && (
              <button
                onClick={() => setEnrollmentFilter('enrolled')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  getButtonStyle(enrollmentFilter === 'enrolled', 'green')  
                }`}
              >
                Đã đăng ký
              </button>
            )}
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
            <div className="col-span-full py-12 text-center">
              <div className="bg-white rounded-xl p-8 max-w-md mx-auto shadow-sm">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Không tìm thấy khóa học
                </h3>
                <p className="text-gray-600 mb-6">
                  Hiện tại chưa có khóa học nào trong danh mục này. Hãy thử danh mục khác!
                </p>
                <button
                  onClick={() => setCourseCategory(courseCategory === 'it' ? 'regular' : 'it')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Xem khóa học {courseCategory === 'it' ? 'Thường' : 'IT'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Courses; 