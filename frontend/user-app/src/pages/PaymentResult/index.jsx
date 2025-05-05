import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { fetchEnrolledCourses, addEnrolledCourse } from '@/store/slices/courseSlice';
import { MdCheckCircle, MdError, MdArrowForward } from 'react-icons/md';
import { useAuth } from '@/contexts/AuthContext';
import courseApi from '@/api/courseApi';
import { toast } from 'react-toastify';

const PaymentResult = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [courseId, setCourseId] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [transactionId, setTransactionId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    const queryParams = new URLSearchParams(location.search);
    const statusParam = queryParams.get('status');
    const messageParam = queryParams.get('message');
    const courseIdParam = queryParams.get('courseId');
    const transactionIdParam = queryParams.get('transactionId');
    
    setStatus(statusParam);
    setMessage(messageParam || '');
    setCourseId(courseIdParam);
    setTransactionId(transactionIdParam);
    
    const processPayment = async () => {
      try {
        setLoading(true);

        // Nếu thanh toán thành công
        if (statusParam === 'success' && courseIdParam) {
          // Làm mới danh sách khóa học đã đăng ký
          try {
            await dispatch(fetchEnrolledCourses()).unwrap();
            console.log('Successfully fetched enrolled courses after payment');
          } catch (fetchError) {
            console.error('Error fetching enrolled courses:', fetchError);
          }
          
          // Lấy thông tin chi tiết khóa học
          try {
            const courseResponse = await courseApi.getCourseDetails(courseIdParam);
            if (courseResponse && courseResponse.success) {
              setCourseTitle(courseResponse.data.Title || 'Khóa học');
              
              // Manually add the course to enrolled courses in Redux store
              dispatch(addEnrolledCourse(courseResponse.data));
              
              // Log confirmation
              console.log(`Course ${courseIdParam} added to enrolled courses list`);
            }
          } catch (courseError) {
            console.error('Error fetching course details:', courseError);
          }
          
          // Làm mới cache danh sách khóa học
          queryClient.invalidateQueries(['enrolledCourses']);
          
          // Hiển thị thông báo thành công
          toast.success('Đăng ký khóa học thành công!');
          
          // Add a second fetch after a delay to ensure server has processed enrollment
          setTimeout(() => {
            dispatch(fetchEnrolledCourses());
          }, 2000);
        }
      } catch (error) {
        console.error('Error processing payment result:', error);
        setMessage(error.message || 'Đã xảy ra lỗi khi xử lý kết quả thanh toán');
        if (statusParam === 'success') {
          setStatus('error');
        }
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [isAuthenticated, location.search, navigate, dispatch, queryClient]);

  const goToCourses = () => {
    navigate('/courses', { 
      state: { 
        activeTab: 'enrolled', 
        paymentSuccess: true,
        timestamp: Date.now() // Add timestamp to ensure state is always unique
      },
      replace: true // Replace current history entry to prevent back button issues
    });
  };

  const goToCourse = () => {
    if (courseId) {
      navigate(`/courses/${courseId}/learn`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin mx-auto h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-600">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-10">
      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-lg">
        {status === 'success' ? (
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
              <MdCheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-800">Thanh toán thành công</h2>
            <p className="mt-2 text-gray-600">
              Cảm ơn bạn đã đăng ký khóa học "{courseTitle || 'Khóa học'}"
            </p>
            {transactionId && (
              <p className="mt-1 text-sm text-gray-500">
                Mã giao dịch: {transactionId}
              </p>
            )}
            <div className="mt-6 space-y-3">
              <button
                onClick={goToCourse}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Học ngay
                <MdArrowForward className="ml-2" />
              </button>
              <button
                onClick={goToCourses}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Xem danh sách khóa học đã đăng ký
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
              <MdError className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-800">Thanh toán không thành công</h2>
            <p className="mt-2 text-gray-600">
              {message 
                ? `Lỗi: ${message.replace(/_/g, ' ')}` 
                : 'Đã xảy ra lỗi trong quá trình thanh toán'}
            </p>
            <div className="mt-6">
              <button
                onClick={goToCourses}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Quay lại danh sách khóa học
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResult; 