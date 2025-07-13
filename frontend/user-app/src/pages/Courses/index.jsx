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
  <div className="bg-white rounded-lg overflow-hidden animate-pulse shadow-md h-full flex flex-col">
    <div className="h-52 bg-gradient-to-br from-gray-100 to-gray-200 relative"></div>
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
        if (response && (response.success || response.alreadyEnrolled)) {
          toast.success('Đăng ký khóa học thành công!');
          dispatch(addEnrolledCourse(course));
          setTimeout(() => {
            navigate(`/courses/${courseId}/learn`);
          }, 1000);
        } else {
          toast.error(response?.message || 'Không thể đăng ký khóa học');
        }
      } catch (error) {
        toast.error('Đã xảy ra lỗi khi đăng ký khóa học');
        console.error('Error enrolling in course:', error);
      }
    } else {
      navigate(`/payment/${courseId}`);
    }
  };

  // Sử dụng dữ liệu thực tế từ API thay vì số ngẫu nhiên
  const courseDuration = course.Duration || course.duration || 0;
  // Sử dụng số học viên đăng ký từ dữ liệu thực tế
  const enrollmentCount = course.EnrolledCount || course.enrolledCount || 0;
  // Sử dụng độ khó từ dữ liệu khóa học nếu có
  const difficulty = course.DifficultyLevel || course.Level || course.level || "Cơ bản";
  // Sử dụng đánh giá thực tế từ dữ liệu
  const rating = course.Rating || course.rating || 0;
  // Lấy thêm số lượng đánh giá nếu có
  const ratingCount = course.RatingCount || course.ratingCount || 0;

  return (
    <div 
      className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg cursor-pointer h-full flex flex-col transition-shadow"
      onClick={() => navigate(`/courses/${courseId}`)}
    >
      {/* Course Image */}
      <div className="relative overflow-hidden">
        <img
          src={course.ImageUrl || course.thumbnail || 'https://placehold.co/600x400?text=No+Image'}
          alt={course.Title || course.title}
          className="w-full h-40 sm:h-48 md:h-52 object-cover"
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
      <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col">
        {/* Course category */}
        <div className="text-xs font-medium text-blue-600 mb-1">
          {courseType === 'it' ? 'Khoa học máy tính' : 'Kiến thức xã hội'}
        </div>
        
        {/* Course title */}
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 text-sm sm:text-base hover:text-blue-700 transition-colors">
          {course.Title || course.title}
        </h3>
        
        {/* Course short description */}
        <p className="text-gray-500 text-xs line-clamp-2 mb-2">
          {course.ShortDescription || course.Description || course.description || 'Khóa học này sẽ giúp bạn nắm vững những kiến thức quan trọng và kỹ năng cần thiết.'}
        </p>
        
        {/* Course stats */}
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] text-gray-500 flex-wrap mb-auto">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{rating > 0 ? rating : '4.0'}{ratingCount > 0 ? ` (${ratingCount})` : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{courseDuration > 0 ? `${courseDuration} giờ` : 'Chưa có'}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{enrollmentCount > 0 ? `${enrollmentCount.toLocaleString()} học viên` : '0 học viên'}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>{difficulty}</span>
          </div>
        </div>
        
        {/* Footer with price and button */}
        <div className="flex items-center justify-between pt-3 sm:pt-4 mt-2 sm:mt-3 border-t border-gray-100">
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
              className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium ${
                isFreeCourse ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              } transition-shadow shadow-sm`}
            >
              {isFreeCourse ? 'Đăng ký ngay' : 'Mua ngay'}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/courses/${courseId}/learn`);
              }}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-shadow shadow-sm"
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
  const [searchTerm, setSearchTerm] = useState(''); // Thêm state cho tìm kiếm
  
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
      toast.success('Thanh toán thành công! Bạn đã đăng ký khóa học thành công.');
      // Force refresh enrollment data to ensure updated UI
      dispatch(fetchEnrolledCourses({ forceRefresh: true }))
        .then(() => {
          console.log("Successfully refreshed enrollment data after payment");
        })
        .catch(err => {
          console.error("Error refreshing enrollment data after payment:", err);
        });
      
      // Clear the payment success flag from location state to prevent multiple refreshes
      window.history.replaceState(
        { ...window.history.state, state: { ...location.state, paymentSuccess: false } },
        document.title
      );
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

  // Thêm hàm xử lý search
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Cập nhật logic lọc courses để bao gồm cả tìm kiếm
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
        
        // Thêm điều kiện tìm kiếm
        const matchesSearch = !searchTerm || 
          (course.Title || course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (course.Description || course.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        if (courseId && matchesCategory && matchesSearch && !addedCourseIds.has(courseId)) {
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
          
          // Thêm điều kiện tìm kiếm
          const matchesSearch = !searchTerm || 
            (course.Title || course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.Description || course.description || '').toLowerCase().includes(searchTerm.toLowerCase());
          
          if (matchesCategory && matchesSearch && !isEnrolled) {
            addedCourseIds.add(courseId);
            result.push({...course, enrolled: false});
          }
        });
      }
      
      return result;
    }
  }, [courseCategory, enrollmentFilter, allCourses, enrolledCourses, isAuthenticated, searchTerm]);

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
      {/* Thêm CSS cho phần header */}
      <style jsx>{`
        @media (max-width: 400px) {
          .xs\\:hidden {
            display: none;
          }
          .xs\\:inline {
            display: inline;
          }
        }
        @media (min-width: 401px) {
          .xs\\:hidden {
            display: none;
          }
          .xs\\:inline {
            display: inline;
          }
        }
      `}</style>
      
      {/* Redesigned Header section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-6">
          {/* Main header with title and payment history button */}
          <div className="mb-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mr-2">Khám phá khóa học</h1>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {filteredCourses.length} khóa học
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Search box */}
                <div className="relative hidden sm:block w-60 lg:w-72">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Tìm kiếm khóa học..."
                    className="w-full px-4 py-1.5 pl-8 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg 
                    className="w-4 h-4 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" 
                    fill="none" 
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                
                {/* Payment History button for authenticated users */}
                {isAuthenticated && (
                  <button
                    onClick={() => navigate('/payment-history')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Lịch sử thanh toán</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Search and filter row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              {/* Mobile search box */}
              <div className="relative flex-1 sm:hidden">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Tìm kiếm khóa học..."
                  className="w-full px-4 py-2.5 pl-10 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg 
                  className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" 
                  fill="none" 
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              
              {/* Filter tabs */}
              <div className="flex items-center gap-2 whitespace-nowrap">
                {/* Course type filters */}
                <div className="flex rounded-md bg-white shadow-sm border border-gray-200 overflow-hidden w-[70%] h-9">
                  <button
                    onClick={() => setCourseCategory('it')}
                    className={`px-2.5 h-full text-xs font-medium transition-colors flex-1 ${
                      courseCategory === 'it' 
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 justify-center h-full">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Công nghệ</span>
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setCourseCategory('regular')}
                    className={`px-2.5 h-full text-xs font-medium transition-colors flex-1 ${
                      courseCategory === 'regular'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 justify-center h-full">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>Thường</span>
                    </span>
                  </button>
                </div>
                
                <div className="flex gap-2 w-[30%] h-9">
                  {/* Enrollment filter */}
                  {isAuthenticated && (
                    <button
                      onClick={() => setEnrollmentFilter(enrollmentFilter === 'enrolled' ? 'all' : 'enrolled')}
                      className={`px-2.5 h-full text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors flex-1 ${
                        enrollmentFilter === 'enrolled'
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="hidden sm:inline">
                        Đã đăng ký
                      </span>
                      <span className="sm:inline ml-1 bg-white bg-opacity-20 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                        {enrolledCourses.filter(course => 
                          courseCategory === 'it' ? isITCourse(course) : !isITCourse(course)
                        ).length}
                      </span>
                    </button>
                  )}
                  
                  {/* Reset filters button - only show when filters are applied */}
                  {(courseCategory !== 'it' || enrollmentFilter !== 'all' || searchTerm) && (
                    <button
                      onClick={() => {
                        setCourseCategory('it');
                        setEnrollmentFilter('all');
                        setSearchTerm('');
                      }}
                      className="px-2.5 h-full text-xs font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-center gap-1.5 flex-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="hidden sm:inline">Đặt lại bộ lọc</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 md:py-8">
        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
                  {searchTerm 
                    ? `Không tìm thấy khóa học phù hợp với từ khóa "${searchTerm}". Vui lòng thử tìm kiếm với từ khóa khác.` 
                    : 'Hiện tại chưa có khóa học nào trong danh mục này. Hãy thử danh mục khác!'}
                </p>
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Xóa tìm kiếm
                  </button>
                ) : (
                  <button
                    onClick={() => setCourseCategory(courseCategory === 'it' ? 'regular' : 'it')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Xem khóa học {courseCategory === 'it' ? 'Thường' : 'IT'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Courses; 