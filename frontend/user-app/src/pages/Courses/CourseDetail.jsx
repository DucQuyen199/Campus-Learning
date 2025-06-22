import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { enrollFreeCourse, fetchEnrolledCourses } from '../../store/slices/courseSlice';
import courseApi from '../../api/courseApi';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);

  // Function to format price values
  const formatPrice = (price) => {
    if (price === null || price === undefined) return 0;
    const numericPrice = parseFloat(price);
    return isNaN(numericPrice) ? 0 : numericPrice;
  };

  // Format date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Hàm để định dạng dữ liệu khóa học theo cấu trúc SQL
  const formatCourseData = (courseData) => {
    if (!courseData) return null;
    
    // Xử lý dữ liệu từ API đảm bảo đúng định dạng hiển thị
    let formattedData = { ...courseData };
    
    if (typeof formattedData.Requirements === 'string') {
      // Nếu yêu cầu là một chuỗi đơn giản, chuyển thành mảng
      if (formattedData.Requirements.startsWith('[')) {
        try {
          formattedData.Requirements = JSON.parse(formattedData.Requirements);
        } catch (e) {
          formattedData.Requirements = formattedData.Requirements ? [formattedData.Requirements] : [];
        }
      } else {
        formattedData.Requirements = formattedData.Requirements ? [formattedData.Requirements] : [];
      }
    }
    
    if (typeof formattedData.Objectives === 'string') {
      // Nếu mục tiêu là một chuỗi đơn giản, chuyển thành mảng
      if (formattedData.Objectives.startsWith('[')) {
        try {
          formattedData.Objectives = JSON.parse(formattedData.Objectives);
        } catch (e) {
          formattedData.Objectives = formattedData.Objectives ? [formattedData.Objectives] : [];
        }
      } else {
        formattedData.Objectives = formattedData.Objectives ? [formattedData.Objectives] : [];
      }
    }
    
    // Đảm bảo Modules là mảng
    if (!Array.isArray(formattedData.Modules)) {
      formattedData.Modules = [];
    }
    
    // Đảm bảo Instructor là object
    if (!formattedData.Instructor) {
      formattedData.Instructor = {
        Name: "Giảng viên",
        Title: "Chuyên gia",
        Bio: "Thông tin chưa được cập nhật."
      };
    }
    
    return formattedData;
  };

  // Fetch payment history for this course
  const fetchPaymentHistory = async () => {
    if (!isAuthenticated || !courseId) return;
    
    setPaymentHistoryLoading(true);
    try {
      const response = await courseApi.getCoursePaymentHistory(courseId);
      if (response && response.data && Array.isArray(response.data)) {
        setPaymentHistory(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setPaymentHistoryLoading(false);
    }
  };

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        
        if (!courseId) {
          setError('ID khóa học không hợp lệ');
          setLoading(false);
          return;
        }
        
        // Fetch course details from API
        const response = await courseApi.getCourseDetails(courseId);
        
        if (!response) {
          setError('Không nhận được phản hồi từ máy chủ');
          setLoading(false);
          return;
        }
        
        // Kiểm tra trường success của response 
        if (response.success) {
          // Lấy dữ liệu khóa học từ response (không cần ID cứng)
          const courseData = formatCourseData(response.data);
          
          if (!courseData) {
            setError('Không tìm thấy dữ liệu khóa học');
            setLoading(false);
            return;
          }
          
          // Lưu dữ liệu vào state mà không thay đổi
          setCourse(courseData);
          document.title = `${courseData.Title} | Campust`;
          
          // Check if user is enrolled in this course - only if authenticated
          if (isAuthenticated) {
            try {
              if (typeof courseApi.checkEnrollment === 'function') {
                const enrollResponse = await courseApi.checkEnrollment(courseId);
                
                if (enrollResponse.success && enrollResponse.isEnrolled) {
                  setIsEnrolled(true);
                  setEnrollmentData(enrollResponse.enrollmentData);
                }
              }
            } catch (enrollErr) {
              // Just log the error, don't show to user
              console.error('Error checking enrollment:', enrollErr);
            }
          }
        } else {
          setError(response.message || 'Không thể tải thông tin khóa học');
        }
      } catch (err) {
        setError('Có lỗi xảy ra khi tải thông tin khóa học. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId, isAuthenticated, navigate]);

  // Re-check enrollment if redirected after payment
  useEffect(() => {
    if (location.state?.paymentSuccess) {
      if (isAuthenticated) {
        // Force refresh enrollment status
        courseApi.checkEnrollment(courseId)
          .then(res => {
            if (res.success && res.isEnrolled) {
              setIsEnrolled(true);
              setEnrollmentData(res.enrollmentData);
              // Refresh the enrolled courses list in Redux store
              dispatch(fetchEnrolledCourses({ forceRefresh: true }));
              // Show success toast again to confirm
              toast.success('Đã đăng ký khóa học thành công!');
            }
          })
          .catch(err => console.error('Error re-checking enrollment:', err));
        
        // Also fetch payment history after successful payment
        fetchPaymentHistory();
      }
    }
  }, [location.state?.paymentSuccess, courseId, isAuthenticated, dispatch]);

  // Fetch payment history when tab is switched to 'payment-history'
  useEffect(() => {
    if (activeTab === 'payment-history' && isAuthenticated) {
      fetchPaymentHistory();
    }
  }, [activeTab, isAuthenticated, courseId]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      // Redirect to login page with return URL
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }
    
    // Check if already enrolled - prevent re-purchase explicitly
    if (isEnrolled) {
      // If already enrolled, redirect to learning page instead of payment
      navigate(`/courses/${courseId}/learn`);
      return;
    }
    
    try {
      const price = formatPrice(course.Price);
      const discountPrice = formatPrice(course.DiscountPrice);
      const effectivePrice = discountPrice > 0 ? discountPrice : price;
      const isFreeCourse = effectivePrice === 0;
      
      // Hiển thị thông báo đang xử lý đăng ký
      toast.info('Đang xử lý đăng ký khóa học...', { autoClose: 2000 });
      
      if (isFreeCourse) {
        const result = await dispatch(enrollFreeCourse(courseId)).unwrap();
        if (result && result.success) {
          setIsEnrolled(true);
          setEnrollmentData(result.enrollmentData);
          toast.success('Đăng ký khóa học thành công!');
          // Update UI to reflect enrolled status
          dispatch(fetchEnrolledCourses());
          // Redirect to learning page after successful enrollment
          setTimeout(() => navigate(`/courses/${courseId}/learn`), 1000);
        } else {
          toast.error(result?.message || 'Đăng ký khóa học thất bại');
        }
      } else {
        // Redirect to payment page, defaulting to PayPal flow
        navigate(`/payment/${courseId}`, { state: { initialPaymentMethod: 'paypal' } });
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      // Hiển thị lỗi chi tiết hơn
      const errorMessage = error.message || 'Có lỗi xảy ra khi đăng ký khóa học';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error || 'Không tìm thấy khóa học'}</p>
        <button 
          onClick={() => navigate('/courses')} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại danh sách khóa học
        </button>
      </div>
    );
  }

  // Format price for display
  const price = formatPrice(course.Price);
  const discountPrice = formatPrice(course.DiscountPrice);
  const isFreeCourse = price === 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
      {course.isLimitedView && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded shadow">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Bạn đang xem phiên bản giới hạn của khóa học này.
              </p>
              <p className="mt-1 text-sm">
                {course.isFallbackData ? 
                  'Dữ liệu hiển thị là dữ liệu dự phòng do không thể kết nối tới máy chủ.' : 
                  <Link to="/login" className="text-yellow-800 font-medium underline">Đăng nhập</Link>}
                {course.isFallbackData ? '' : ' để xem đầy đủ thông tin khóa học.'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center text-sm text-gray-500">
        <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to="/courses" className="hover:text-blue-600">Khóa học</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{course.Title}</span>
      </div>
      
      {/* Course Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-2xl shadow-lg mb-8 overflow-hidden">
        <div className="container mx-auto p-6 md:p-8 flex flex-col md:flex-row">
          <div className="md:w-3/5 mb-6 md:mb-0 md:pr-6">
            <div className="flex items-center mb-2">
              <span className="bg-blue-500 text-xs font-bold uppercase px-3 py-1 rounded-full mr-2">
                {course.Level || 'All Levels'}
              </span>
              <span className="bg-blue-500 text-xs font-bold uppercase px-3 py-1 rounded-full">
                {course.Category || 'Lập trình'}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.Title}</h1>
            
            <p className="text-blue-100 mb-6 text-lg">
              {course.ShortDescription || (typeof course.Description === 'string' ? course.Description.substring(0, 150) : 'Không có mô tả')}
            </p>
            
            <div className="flex items-center mb-6">
              {course.Instructor && (
                <div className="flex items-center mr-8">
                  <Avatar 
                    src={course.Instructor.AvatarUrl}
                    name={course.Instructor.Name}
                    alt={course.Instructor.Name} 
                    className="mr-2"
                    size="small"
                  />
                  <div>
                    <p className="font-medium text-sm">{course.Instructor.Name}</p>
                    <p className="text-blue-200 text-xs">{course.Instructor.Title || 'Giảng viên'}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{course.Rating || '0'} ({course.RatingCount || 0} đánh giá)</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-300 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span>{course.EnrolledCount || 0} học viên</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-300 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>{course.Duration || 0} phút</span>
                </div>
              </div>
            </div>
            
            {isEnrolled ? (
              <Link 
                to={`/courses/${courseId}/learn`}
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-2xl transition duration-200"
              >
                Tiếp tục học
              </Link>
            ) : (
              <button
                onClick={handleEnroll}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-2xl transition duration-200"
              >
                {isFreeCourse ? 'Đăng ký miễn phí' : 'Mua ngay'}
              </button>
            )}
          </div>
          
          <div className="md:w-2/5">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              {course.ImageUrl ? (
                <img 
                  src={course.ImageUrl} 
                  alt={course.Title} 
                  className="w-full h-48 md:h-64 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x400?text=Course+Image';
                  }}
                />
              ) : (
                <div className="w-full h-48 md:h-64 bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">Không có hình ảnh</p>
                </div>
              )}
              
              <div className="p-6">
                <div className="mb-4">
                  {isFreeCourse ? (
                    <p className="text-2xl font-bold text-green-600">Miễn phí</p>
                  ) : (
                    <div>
                      {discountPrice > 0 ? (
                        <div className="flex items-center">
                          <p className="text-2xl font-bold text-blue-600">{discountPrice.toLocaleString()} VND</p>
                          <p className="ml-2 text-gray-500 line-through">{price.toLocaleString()} VND</p>
                          {price > 0 && (
                            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              {Math.round((1 - discountPrice / price) * 100)}% giảm
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-blue-600">{price.toLocaleString()} VND</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-900 font-medium">Truy cập trọn đời</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-900 font-medium">Bài giảng chi tiết</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-900 font-medium">Hỗ trợ 24/7</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-900 font-medium">Giấy chứng nhận hoàn thành</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Course Content Tabs */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
        <div className="border-b">
          <div className="flex flex-wrap">
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Tổng quan
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'curriculum' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('curriculum')}
            >
              Nội dung khóa học
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'instructor' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('instructor')}
            >
              Giảng viên
            </button>
            {isAuthenticated && (
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'payment-history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('payment-history')}
              >
                Lịch sử thanh toán
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Mô tả khóa học</h2>
              {course.Description ? (
                <div className="prose max-w-none" 
                  dangerouslySetInnerHTML={{ __html: course.Description }} 
                />
              ) : (
                <p className="text-gray-500">Chưa có mô tả chi tiết cho khóa học này.</p>
              )}
              
              {course.Requirements && (Array.isArray(course.Requirements) ? course.Requirements.length > 0 : false) && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-3">Yêu cầu</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {course.Requirements.map((req, index) => (
                      <li key={index} className="text-gray-700">{req}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {course.Objectives && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-3">Bạn sẽ học được gì</h3>
                  {typeof course.Objectives === 'string' ? (
                    // If Objectives is a string (HTML content), render it directly
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: course.Objectives }} />
                  ) : Array.isArray(course.Objectives) && course.Objectives.length > 0 ? (
                    // If Objectives is an array, map over it
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {course.Objectives.map((obj, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">Chưa có thông tin về mục tiêu khóa học.</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'curriculum' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Nội dung khóa học</h2>
              
              {course.Modules && course.Modules.length > 0 ? (
                <div className="space-y-4">
                  {course.Modules.map((module, moduleIndex) => (
                    <div key={module.ModuleID || moduleIndex} className="border rounded-2xl overflow-hidden">
                      <div className="bg-gray-50 p-4 flex justify-between items-center">
                        <h3 className="font-medium">{module.Title}</h3>
                        <div className="text-sm text-gray-500">
                          {module.Lessons?.length || 0} bài học
                        </div>
                      </div>
                      
                      {module.Lessons && module.Lessons.length > 0 && (
                        <div className="divide-y">
                          {module.Lessons.map((lesson, lessonIndex) => (
                            <div 
                              key={lesson.LessonID || lessonIndex} 
                              className="p-4 pl-6 flex items-center hover:bg-gray-50 cursor-pointer"
                              onClick={() => {
                                if (isEnrolled) {
                                  // If user is enrolled, navigate to the specific lesson
                                  navigate(`/courses/${courseId}/learn?lessonId=${lesson.LessonID}`);
                                } else if (lesson.IsPreview) {
                                  // If lesson is preview, allow access
                                  navigate(`/courses/${courseId}/learn?lessonId=${lesson.LessonID}`);
                                } else {
                                  // If not enrolled and not preview, prompt to enroll
                                  toast.info('Bạn cần đăng ký khóa học để xem bài học này');
                                  // Scroll to enrollment section
                                  const enrollSection = document.querySelector('.bg-blue-50');
                                  if (enrollSection) {
                                    enrollSection.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }
                              }}
                            >
                              <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <p className="font-medium">{lesson.Title}</p>
                                <p className="text-sm text-gray-500">{lesson.Duration || 0} phút</p>
                              </div>
                              
                              {!isEnrolled && (
                                <div className="ml-auto flex items-center">
                                  {lesson.IsPreview ? (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Xem trước</span>
                                  ) : (
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Chưa có thông tin về nội dung khóa học.</p>
              )}
            </div>
          )}
          
          {activeTab === 'instructor' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Thông tin giảng viên</h2>
              
              {course.Instructor ? (
                <div className="flex flex-col md:flex-row bg-gray-50 rounded-2xl p-6 shadow-sm">
                  <div className="md:w-1/4 mb-4 md:mb-0 flex justify-center md:justify-start">
                    <Avatar 
                      src={course.Instructor.Image || course.Instructor.AvatarUrl}
                      name={course.Instructor.FullName || course.Instructor.Name}
                      alt={course.Instructor.FullName || course.Instructor.Name} 
                      className="border-4 border-white shadow-md"
                      size="xxl"
                    />
                  </div>
                  <div className="md:w-3/4 md:pl-6">
                    <h3 className="text-xl font-bold mb-2 text-blue-700">{course.Instructor.FullName || course.Instructor.Name}</h3>
                    <p className="text-gray-600 mb-3 font-medium">{course.Instructor.Title || 'Giảng viên'}</p>
                    
                    <div className="mb-4 flex items-center text-gray-500">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                      </svg>
                      <span>Giảng viên khóa học</span>
                    </div>
                    
                    {course.Instructor.Bio || course.Instructor.Biography ? (
                      <div className="prose max-w-none border-t border-gray-200 pt-4" 
                        dangerouslySetInnerHTML={{ __html: course.Instructor.Bio || course.Instructor.Biography }} 
                      />
                    ) : (
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-gray-500">Chưa có thông tin chi tiết về giảng viên.</p>
                        <p className="mt-2">Giảng viên là người có chuyên môn trong lĩnh vực và sẽ hỗ trợ bạn trong suốt quá trình học.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-6">
                  <p className="text-gray-500">Chưa có thông tin về giảng viên.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payment-history' && isAuthenticated && (
            <div>
              <h2 className="text-xl font-bold mb-6">Lịch sử thanh toán</h2>
              
              {paymentHistoryLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : paymentHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã giao dịch</th>
                        <th className="py-3 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phương thức</th>
                        <th className="py-3 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                        <th className="py-3 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="py-3 px-4 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày thanh toán</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paymentHistory.map((payment) => (
                        <tr key={payment.TransactionID} className="hover:bg-gray-50">
                          <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.TransactionCode || 'N/A'}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                            {payment.PaymentMethod === 'vnpay' ? 'VNPay' : 
                             payment.PaymentMethod === 'paypal' ? 'PayPal' : 
                             payment.PaymentMethod === 'free' ? 'Miễn phí' : payment.PaymentMethod}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                            {payment.Amount?.toLocaleString()} {payment.Currency || 'VND'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.PaymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 
                              payment.PaymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              payment.PaymentStatus === 'failed' ? 'bg-red-100 text-red-800' : 
                              payment.PaymentStatus === 'refunded' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {payment.PaymentStatus === 'completed' ? 'Thành công' : 
                               payment.PaymentStatus === 'pending' ? 'Đang xử lý' : 
                               payment.PaymentStatus === 'failed' ? 'Thất bại' : 
                               payment.PaymentStatus === 'refunded' ? 'Hoàn tiền' : 
                               payment.PaymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(payment.PaymentDate || payment.CreatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Chưa có giao dịch</h3>
                  <p className="mt-1 text-sm text-gray-500">Bạn chưa có giao dịch nào cho khóa học này.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* CTA Section */}
      {!isEnrolled && (
        <div className="bg-blue-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Sẵn sàng để nâng cao kỹ năng của bạn?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Học ngay hôm nay và nhận đầy đủ quyền truy cập vào tất cả các tài liệu khóa học, bài tập thực hành và hỗ trợ từ giảng viên.
          </p>
          <button
            onClick={handleEnroll}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-2xl transition duration-200"
          >
            {isFreeCourse ? 'Đăng ký miễn phí ngay' : 'Mua ngay'}
          </button>
        </div>
      )}
    </div>
    </div>
  );
};

export default CourseDetail; 