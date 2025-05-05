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

// Skeleton loading component for courses
const CourseCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-200">
    <div className="h-52 bg-gray-200 relative rounded-t-2xl">
      <div className="absolute top-0 right-0 m-2 h-5 w-16 bg-gray-300 rounded-md"></div>
      <div className="absolute top-0 left-0 m-2 h-5 w-14 bg-gray-300 rounded-md"></div>
    </div>
    <div className="p-6 space-y-3 rounded-b-2xl">
      <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded-md w-full"></div>
      <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
      <div className="flex items-center space-x-2 pt-1">
        <div className="h-4 bg-gray-200 rounded-full w-4"></div>
        <div className="h-3 bg-gray-200 rounded-md w-16"></div>
        <div className="h-4 bg-gray-200 rounded-full w-4 ml-3"></div>
        <div className="h-3 bg-gray-200 rounded-md w-20"></div>
      </div>
      <div className="mt-4 flex justify-between items-center pt-2">
        <div className="h-6 bg-gray-200 rounded-md w-1/4"></div>
        <div className="h-8 bg-gray-200 rounded-md w-1/4"></div>
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
    <div className="group bg-white rounded-2xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 hover:shadow-xl border border-gray-200">
      {/* Course Image with Overlay */}
      <div className="relative aspect-video rounded-t-2xl overflow-hidden">
        <img
          src={course.ImageUrl || course.thumbnail || 'https://placehold.co/600x400?text=No+Image'}
          alt={course.Title || course.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            {enrolled ? (
              <button
                onClick={() => navigate(`/courses/${courseId}/learn`)}
                className="w-full py-2.5 bg-white/90 backdrop-blur-sm text-gray-900 rounded-xl font-medium text-sm hover:bg-white transition-colors"
              >
                Tiếp tục học
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate(`/courses/${courseId}`)}
                  className="w-full py-2.5 bg-white/90 backdrop-blur-sm text-gray-900 rounded-xl font-medium text-sm hover:bg-white transition-colors"
                >
                  Xem chi tiết
                </button>
                <button
                  onClick={handleEnrollFreeCourse}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm backdrop-blur-sm transition-colors flex items-center justify-center gap-2
                    ${isFreeCourse 
                      ? 'bg-green-500/90 text-white hover:bg-green-600/90' 
                      : 'bg-blue-500/90 text-white hover:bg-blue-600/90'}`}
                >
                  {isFreeCourse ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Đăng ký miễn phí
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Đăng ký ({formatPrice(course.DiscountPrice || course.Price).toLocaleString()} VND)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md inline-flex items-center gap-1.5
              ${courseType === 'it' ? 'bg-blue-500/90 text-white' : 'bg-green-500/90 text-white'}`}>
              {courseType === 'it' ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Khóa học IT
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Khóa học Thường
                </>
              )}
            </span>
            {enrolled && (
              <span className="px-3 py-1.5 rounded-xl text-xs font-medium bg-green-500/90 text-white backdrop-blur-md inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Đã đăng ký
              </span>
            )}
          </div>
          <span className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/90 text-gray-700 backdrop-blur-md">
            {course.Level || course.level || 'All Levels'}
          </span>
        </div>
      </div>

      {/* Course Info */}
      <div className="p-5 rounded-b-2xl">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.Title || course.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.ShortDescription || course.Description || course.description || 'Không có mô tả'}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {course.Duration || course.duration || 0} phút
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {course.EnrolledCount || course.enrolledCount || 0} học viên
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          {isFreeCourse ? (
            <span className="text-lg font-bold text-green-600">Miễn phí</span>
          ) : (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-blue-600">
                {formatPrice(course.DiscountPrice || course.Price).toLocaleString()} VND
              </span>
              {course.DiscountPrice && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(course.Price).toLocaleString()} VND
                </span>
              )}
            </div>
          )}
          
          {!enrolled && (
            <button
              onClick={handleEnrollFreeCourse}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all
                ${isFreeCourse 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              {isFreeCourse ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Đăng ký
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Đăng ký
                </>
              )}
            </button>
          )}
          
          {enrolled && (
            <button
              onClick={() => navigate(`/courses/${courseId}/learn`)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Học ngay
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
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white border-b border-gray-200">
          <div className="max-w-full mx-4 xl:mx-8 py-12">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Khám phá kho khóa học chất lượng
              </h1>
              <p className="text-blue-100 text-lg mb-8">
                Nâng cao kỹ năng của bạn với các khóa học được thiết kế bởi các chuyên gia hàng đầu
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setCourseCategory('it')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2
                    ${courseCategory === 'it' 
                      ? 'bg-white text-blue-700' 
                      : 'bg-blue-800/50 text-white hover:bg-blue-800'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Khóa học IT
                </button>
                <button
                  onClick={() => setCourseCategory('regular')}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2
                    ${courseCategory === 'regular' 
                      ? 'bg-white text-blue-700' 
                      : 'bg-blue-800/50 text-white hover:bg-blue-800'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Khóa học Thường
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="border-t border-gray-200">
          <div className="max-w-full mx-4 xl:mx-8">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                {courseCategory === 'it' ? (
                  <>
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Khóa học IT
                  </>
                ) : (
                  <>
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Khóa học Thường
                  </>
                )}
              </h2>

              <div className="flex gap-3">
                <button
                  onClick={() => setEnrollmentFilter('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                    ${enrollmentFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Tất cả
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => setEnrollmentFilter('enrolled')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                      ${enrollmentFilter === 'enrolled'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Đã đăng ký ({enrolledCourses.filter(course => 
                      courseCategory === 'it' ? isITCourse(course) : !isITCourse(course)
                    ).length})
                  </button>
                )}
              </div>
            </div>

            {/* Course Grid */}
            <div className="py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
                  // Only show "no courses" message if we've finished loading and data is available
                  // but no courses match the current filters
                  (allCourses.length > 0 || enrolledCourses.length > 0) ? (
                    <div className="col-span-full py-32 text-center">
                      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm">
                        <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Không tìm thấy khóa học
                        </h3>
                        <p className="text-gray-500 mb-6">
                          Hiện tại chưa có khóa học nào trong danh mục này
                        </p>
                        <button
                          onClick={() => setCourseCategory(courseCategory === 'it' ? 'regular' : 'it')}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Xem khóa học {courseCategory === 'it' ? 'Thường' : 'IT'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Show loading skeletons if we're still waiting for data
                    renderSkeletons()
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Courses; 