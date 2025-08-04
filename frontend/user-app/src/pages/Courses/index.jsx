/*-----------------------------------------------------------------
* File: index.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { enrollFreeCourse, fetchEnrolledCourses, addEnrolledCourse, loadCachedAllCourses, preloadAllCourses } from '@/store/slices/courseSlice';
import courseApi from '@/api/courseApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import Loading from '@/components/common/Loading';
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

const CourseCard = ({ course, enrollmentFilter, courseCategory, navigate, enrolledCourses, onNavigate }) => {
  const courseId = course.CourseID || course.id;
  const isFreeCourse = formatPrice(course.Price) === 0;
  const enrolled = course.enrolled === true || isEnrolledCourse(course, enrolledCourses);
  const courseType = isITCourse(course) ? 'it' : 'regular';
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const handleCourseClick = () => {
    onNavigate();
    navigate(`/courses/${courseId}`);
  };

  const handleEnrollFreeCourse = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để đăng ký khóa học');
      navigate('/login');
      return;
    }

    if (isFreeCourse) {
      try {
        toast.info('Đang xử lý đăng ký khóa học...', { autoClose: 2000 });
        const result = await dispatch(enrollFreeCourse(courseId)).unwrap();
        if (result.success || result.alreadyEnrolled) {
          toast.success('Đăng ký khóa học thành công!');
          dispatch(fetchEnrolledCourses());
          setTimeout(() => navigate(`/courses/${courseId}/learn`), 1000);
        } else {
          toast.error(result.message || 'Không thể đăng ký khóa học');
        }
      } catch (error) {
        console.error('Error enrolling in course:', error);
        toast.error(error.message || 'Đã xảy ra lỗi khi đăng ký khóa học');
      }
    } else {
      navigate(`/payment/${courseId}`, { state: { initialPaymentMethod: 'paypal' } });
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
      onClick={handleCourseClick}
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
          CampusLearning
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
  const { isAuthenticated, currentUser } = useAuth();
  const { enrolledCourses, allCourses, loading: enrolledLoading, dataLoaded } = useSelector((state) => state.course);
  const [courseCategory, setCourseCategory] = useState('all');
  const [enrollmentFilter, setEnrollmentFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [navigatingToCourse, setNavigatingToCourse] = useState(false);
  const carouselRef = useRef(null);

  // Define course categories
  const courseCategories = [
    { id: 'all', name: 'Tất cả', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'programming', name: 'Lập trình', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
    { id: 'security', name: 'Bảo mật', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'data', name: 'Dữ liệu', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'web', name: 'Web', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
    { id: 'mobile', name: 'Mobile', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'ai', name: 'AI & ML', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'life', name: 'Đời sống', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  // Course showcase images for the banner
  const courseImages = [
    {
      url: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
      title: "Lập trình Web"
    },
    {
      url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
      title: "Phát triển ứng dụng"
    },
    {
      url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
      title: "Khoa học dữ liệu"
    },
    {
      url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=872&q=80",
      title: "Thiết kế UX/UI"
    },
    {
      url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
      title: "Machine Learning"
    }
  ];
  
  // Function to handle manual navigation
  const navigateCarousel = (direction) => {
    if (direction === "prev") {
      setCurrentImageIndex((prevIndex) => {
        const newIndex = prevIndex === 0 ? courseImages.length - 1 : prevIndex - 1;
        return newIndex;
      });
    } else {
      setCurrentImageIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % courseImages.length;
        return newIndex;
      });
    }
  };

  // Handle image carousel rotation with automatic adjustment for infinite scroll
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % courseImages.length;
        return newIndex;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [courseImages.length]);

  // Reset navigation loading state after timeout to prevent getting stuck
  useEffect(() => {
    if (navigatingToCourse) {
      const timeout = setTimeout(() => {
        setNavigatingToCourse(false);
      }, 5000); // Reset after 5 seconds if still loading
      
      return () => clearTimeout(timeout);
    }
  }, [navigatingToCourse]);

  // Reset navigation loading when location changes (user has successfully navigated)
  useEffect(() => {
    setNavigatingToCourse(false);
  }, [location.pathname]);
  
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
    if (location.state?.activeTab && isAuthenticated && currentUser?.id) {
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
  }, [location.state, isAuthenticated, currentUser?.id, dispatch]);

  // Reset to 'all' tab if not authenticated and tried to view enrolled courses
  useEffect(() => {
    if (!isAuthenticated && enrollmentFilter === 'enrolled') {
      setEnrollmentFilter('all');
    }
  }, [isAuthenticated, currentUser?.id, enrollmentFilter]);

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
    // Only fetch enrolled courses if user is authenticated and has valid user ID
    if (isAuthenticated && currentUser?.id && !enrolledCourses.length) {
      console.log('Fetching enrolled courses for user:', currentUser.id);
      dispatch(fetchEnrolledCourses());
    }
  }, [dispatch, isAuthenticated, currentUser?.id, enrolledCourses.length]);

  // Separate effect for handling payment success
  useEffect(() => {
    if (isAuthenticated && currentUser?.id && location.state?.paymentSuccess) {
      const processPaymentCallback = async () => {
        try {
          console.log('Processing payment callback from location state');
          
          // Get course ID and transaction ID from location state
          const { courseId, transactionId } = location.state;
          
          if (courseId) {
            console.log(`Payment successful for course ${courseId}`);
            
            // Force refresh enrolled courses to show the newly purchased course
            await dispatch(fetchEnrolledCourses({ forceRefresh: true }));
            
            // Show success message
            toast.success('Thanh toán thành công! Khóa học đã được thêm vào danh sách của bạn.');
      
            // Clear the payment success state to prevent re-processing
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
        } catch (error) {
          console.error('Error processing payment callback:', error);
          toast.error('Có lỗi xảy ra khi xử lý thanh toán. Vui lòng kiểm tra lại.');
        }
      };
      
      processPaymentCallback();
    }
  }, [isAuthenticated, currentUser?.id, location.state?.paymentSuccess, dispatch]);

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
  const getCourseCategory = (course) => {
    const title = (course.Title || course.title || '').toLowerCase();
    const description = (course.Description || course.description || '').toLowerCase();
    const category = (course.Category || course.category || '').toLowerCase();

    if (category.includes('security') || title.includes('bảo mật') || description.includes('bảo mật')) {
      return 'security';
    }
    if (category.includes('data') || title.includes('dữ liệu') || description.includes('dữ liệu')) {
      return 'data';
    }
    if (category.includes('web') || title.includes('web') || description.includes('web')) {
      return 'web';
    }
    if (category.includes('mobile') || title.includes('mobile') || title.includes('android') || title.includes('ios')) {
      return 'mobile';
    }
    if (category.includes('ai') || title.includes('ai') || title.includes('machine learning') || description.includes('trí tuệ nhân tạo')) {
      return 'ai';
    }
    if (title.includes('lập trình') || category.includes('programming') || 
        title.includes('code') || title.includes('python') || title.includes('java')) {
      return 'programming';
    }
    if (title.includes('đời sống') || category.includes('life') || 
        title.includes('kỹ năng') || title.includes('soft skill')) {
      return 'life';
    }
    return 'programming'; // Default category
  };

  const filteredCourses = useMemo(() => {
    const addedCourseIds = new Set();
    const result = [];
    
    const coursesToProcess = enrollmentFilter === 'enrolled' && isAuthenticated
      ? enrolledCourses
      : allCourses;

    coursesToProcess?.forEach(course => {
      const courseId = course.CourseID || course.id;
      if (!courseId || addedCourseIds.has(courseId)) return;

      const isEnrolled = enrolledCourses.some(ec => (ec.CourseID || ec.id) === courseId);
      if (enrollmentFilter === 'enrolled' && !isEnrolled) return;
      
      const courseCat = getCourseCategory(course);
      const matchesCategory = courseCategory === 'all' || courseCat === courseCategory;
      
      const matchesSearch = !searchTerm || 
        (course.Title || course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.Description || course.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (matchesCategory && matchesSearch && (enrollmentFilter === 'all' || isEnrolled)) {
        addedCourseIds.add(courseId);
        result.push({...course, enrolled: isEnrolled, category: courseCat});
      }
    });
    
    return result;
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
    <>
      {navigatingToCourse && (
        <Loading 
          message="Đang tải thông tin khóa học..." 
          variant="default"
          size="default"
          fullscreen={true}
        />
      )}
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
        
        /* Image Carousel Styles */
        .carousel-container {
          position: relative;
          width: 100%;
          overflow: visible;
        }
        
        .carousel-track {
          display: flex;
          transition: transform 0.5s ease;
          position: relative;
          justify-content: center;
        }
        
        .carousel-item {
          flex: 0 0 50%;
          position: relative;
          transition: all 0.5s ease;
          transform-origin: center center;
          margin: 0 -10%;
        }
        
        .carousel-item.active {
          transform: scale(1.1);
          opacity: 1;
          z-index: 10;
          filter: brightness(1.1);
        }
        
        .carousel-item.side {
          transform: scale(0.8);
          opacity: 0.7;
          filter: blur(2px) brightness(0.8);
          z-index: 1;
        }

        /* Navigation button positioning */
        .carousel-nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 30;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          transition: all 0.2s;
        }

        .carousel-nav-button:hover {
          background: rgba(0, 0, 0, 0.5);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .carousel-nav-button.prev {
          left: 0;
        }

        .carousel-nav-button.next {
          right: 0;
        }
      `}</style>
      
      {/* Modern Banner - Positioned at the very top */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-700">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <svg className="absolute left-0 h-full w-48 text-white/5" viewBox="0 0 100 100" preserveAspectRatio="none" fill="currentColor">
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-700/30 mix-blend-multiply" />
          <div className="absolute right-0 top-0 -mt-20 -mr-32 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"></div>
          <div className="absolute left-0 bottom-0 -mb-20 -ml-32 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between py-6 md:py-12 relative z-10">
            <div className="mb-6 md:mb-0 md:w-1/2 lg:w-2/5 md:mr-4">
              <div className="flex items-center mb-3">
                <div className="bg-blue-400/30 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-white inline-flex items-center">
                  <span className="animate-pulse mr-1.5 h-2 w-2 rounded-full bg-blue-200"></span>
                  Đang diễn ra
                </div>
                <div className="h-0.5 w-6 bg-blue-300/30 mx-3"></div>
                <div className="text-blue-100 text-xs font-medium">Cập nhật mới 2025</div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                Khám phá thế giới kiến thức <br className="hidden sm:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200">
                  với CampusLearing
                </span>
              </h2>
              <p className="text-blue-100 mb-6 text-base md:text-lg opacity-80 max-w-xl">
                Truy cập hơn 100+ khóa học chất lượng cao, được thiết kế bởi những chuyên gia hàng đầu trong lĩnh vực.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="px-6 py-3 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-md flex items-center group">
                  <span>Khám phá khóa học</span>
                  <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </button>
                <button className="px-6 py-3 bg-blue-700/30 backdrop-blur-sm border border-blue-300/20 text-white rounded-lg font-medium hover:bg-blue-600/30 transition-colors">
                  Tìm hiểu thêm
                </button>
              </div>
            </div>
            
            {/* Image Carousel - Completely redesigned */}
            <div className="w-full md:w-1/2 lg:w-3/5 md:pl-6 lg:pl-10 flex justify-center overflow-visible">
              <div className="relative w-full max-w-[600px] h-[280px] md:h-[320px]">
                {/* Carousel Container */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full h-full px-8">
                    {/* Main center image */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center">
                      <div className="relative w-[60%] h-[75%] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/40 transform transition-all duration-700 ease-out hover:scale-105">
                        <img 
                          src={courseImages[currentImageIndex].url}
                          alt={courseImages[currentImageIndex].title}
                          className="w-full h-full object-cover transition-all duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
                            <h3 className="text-white font-semibold text-sm">{courseImages[currentImageIndex].title}</h3>
                            <p className="text-white/80 text-xs mt-1">Khóa học chất lượng cao</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Left side image */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-[45%] h-[55%] transition-all duration-700 ease-out">
                      <div className="relative w-full h-full rounded-xl overflow-hidden shadow-xl opacity-60 transform scale-80 blur-[1.5px] hover:opacity-80 hover:scale-85 transition-all duration-500">
                        <img 
                          src={courseImages[(currentImageIndex - 1 + courseImages.length) % courseImages.length].url}
                          alt={courseImages[(currentImageIndex - 1 + courseImages.length) % courseImages.length].title}
                          className="w-full h-full object-cover transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30"></div>
                      </div>
                    </div>
                    
                    {/* Right side image */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-[45%] h-[55%] transition-all duration-700 ease-out">
                      <div className="relative w-full h-full rounded-xl overflow-hidden shadow-xl opacity-60 transform scale-80 blur-[1.5px] hover:opacity-80 hover:scale-85 transition-all duration-500">
                        <img 
                          src={courseImages[(currentImageIndex + 1) % courseImages.length].url}
                          alt={courseImages[(currentImageIndex + 1) % courseImages.length].title}
                          className="w-full h-full object-cover transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/30"></div>
                      </div>
                    </div>
                    
                    {/* Additional side images for extended view */}
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-5 w-[30%] h-[40%] transition-all duration-700 ease-out">
                      <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg opacity-30 transform scale-60 blur-[2px]">
                        <img 
                          src={courseImages[(currentImageIndex - 2 + courseImages.length) % courseImages.length].url}
                          alt={courseImages[(currentImageIndex - 2 + courseImages.length) % courseImages.length].title}
                          className="w-full h-full object-cover transition-all duration-700"
                        />
                      </div>
                    </div>
                    
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-5 w-[30%] h-[40%] transition-all duration-700 ease-out">
                      <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg opacity-30 transform scale-60 blur-[2px]">
                        <img 
                          src={courseImages[(currentImageIndex + 2) % courseImages.length].url}
                          alt={courseImages[(currentImageIndex + 2) % courseImages.length].title}
                          className="w-full h-full object-cover transition-all duration-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Navigation buttons */}
                <button 
                  onClick={() => navigateCarousel('prev')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-all duration-300 border border-white/30 hover:border-white/50 hover:scale-110 group"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6 transform group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button 
                  onClick={() => navigateCarousel('next')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-all duration-300 border border-white/30 hover:border-white/50 hover:scale-110 group"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6 transform group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Enhanced Carousel indicators */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-30">
                  {courseImages.map((_, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`rounded-full transition-all duration-300 hover:scale-110 ${
                        idx === currentImageIndex 
                          ? 'bg-white w-8 h-2.5 shadow-lg' 
                          : 'bg-white/50 w-2.5 h-2.5 hover:bg-white/70'
                      }`} 
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                
                {/* My Courses button for authenticated users */}
                {isAuthenticated && (
                  <button
                    onClick={() => setEnrollmentFilter(enrollmentFilter === 'enrolled' ? 'all' : 'enrolled')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      enrollmentFilter === 'enrolled'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">Khóa học của tôi</span>
                    <span className="bg-white bg-opacity-20 px-1.5 py-0.5 rounded-full text-xs">
                      {enrolledCourses.length}
                    </span>
                  </button>
                )}
                
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
            
            {/* Mobile search box */}
            <div className="relative mb-4 sm:hidden">
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
              
            {/* Centered Categories and Filters Bar */}
            <div className="flex justify-center w-full">
              {/* Categories horizontal scroll container */}
              <div 
                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth py-3 px-6 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl bg-gradient-to-r from-blue-50/30 via-white/40 to-blue-50/30"
                style={{ 
                  scrollBehavior: 'smooth',
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none'
                }}
              >
                {courseCategories.map((category, index) => (
                  <button
                    key={category.id}
                    onClick={() => setCourseCategory(category.id)}
                    className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all duration-500 whitespace-nowrap min-w-fit backdrop-blur-sm ${
                      courseCategory === category.id
                        ? 'bg-gradient-to-r from-blue-600/90 to-blue-700/90 text-white shadow-lg transform scale-110 border border-blue-400/30'
                        : 'bg-white/60 text-gray-700 hover:bg-white/80 hover:text-blue-700 shadow-md border border-white/40 hover:shadow-lg hover:scale-105 hover:border-blue-200/50'
                    }`}
                  >
                    {/* Glass effect for active state */}
                    {courseCategory === category.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 rounded-2xl"></div>
                    )}
                    
                    <svg 
                      className={`relative z-10 w-4 h-4 ${courseCategory === category.id ? 'text-white' : 'text-gray-500'}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={category.icon}></path>
                    </svg>
                    <span className="relative z-10">{category.name}</span>
                    {courseCategory === category.id && (
                      <div className="relative z-10 w-2 h-2 bg-blue-200/80 rounded-full animate-pulse"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced styles for glass morphism and scrollbar */}
            <style jsx>{`
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              
              /* Additional glass morphism effects */
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              
              .glass-effect {
                position: relative;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
              }
              
              .glass-effect::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                animation: shimmer 3s infinite;
              }
            `}</style>
          </div>
        </div>
      </div>

      {/* Promotional Banner - Removing the old banner */}

      <div className="container mx-auto px-4 py-5 md:py-8">
        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {isLoading ? (
            renderSkeletons()
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <CourseCard
                key={`course-${course.CourseID || course.id}`}
                course={course}
                enrollmentFilter={enrollmentFilter}
                courseCategory={courseCategory}
                navigate={navigate}
                enrolledCourses={enrolledCourses}
                onNavigate={() => setNavigatingToCourse(true)}
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
    </>
  );
};

export default Courses; 
