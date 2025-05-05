import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useVNPayHandler from '../../hooks/useVNPayHandler';
import { parseVNPayResponse, getVNPayResponseMessage } from '../../utils/paymentUtils';
import { 
  initializeVNPayElements, 
  patchVNPayJQuery,
  cleanupVNPayResources 
} from '../../utils/vnpayUtils';
import paymentService from '../../services/paymentService';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [verificationError, setVerificationError] = useState(null);
  
  // Use the VNPay handler hook to prevent script errors
  useVNPayHandler();
  
  // Initialize VNPay elements and patch jQuery when component mounts
  useEffect(() => {
    // Initialize hidden timer elements that VNPay might look for
    initializeVNPayElements();
    
    // Patch jQuery for VNPay compatibility
    patchVNPayJQuery();
    
    // Cleanup resources when component unmounts
    return () => {
      cleanupVNPayResources();
    };
  }, []);
  
  useEffect(() => {
    const verifyAndProcessPayment = async () => {
      try {
        // First, parse the VNPay response
        const vnpResponse = parseVNPayResponse(searchParams);
        setPaymentDetails(vnpResponse);
        
        // Get courseId from URL
        const courseId = searchParams.get('courseId');
        
        // For direct VNPay redirects that don't go through our backend
        if (vnpResponse.isSuccess) {
          setStatus('success');
          toast.success(getVNPayResponseMessage('00'));
          
          try {
            // Verify payment with backend (if available)
            await paymentService.verifyPayment(Object.fromEntries(searchParams.entries()));
          } catch (verifyError) {
            console.warn('Payment verification error (will continue):', verifyError);
            // Non-critical error, we'll still show success to user
            setVerificationError(verifyError.message || 'Could not verify payment with server');
          }
          
          // Redirect to course page after a delay
          setTimeout(() => {
            navigate(courseId ? `/courses/${courseId}/learn` : '/user/enrollments');
          }, 3000);
        } else {
          setStatus('failed');
          toast.error(getVNPayResponseMessage(vnpResponse.responseCode) || 'Thanh toán thất bại!');
          
          // Redirect to course page after a delay
          setTimeout(() => {
            navigate(courseId ? `/courses/${courseId}` : '/courses');
          }, 3000);
        }
      } catch (error) {
        console.error('Error processing payment callback:', error);
        setStatus('failed');
        toast.error('Đã xảy ra lỗi khi xử lý thanh toán');
        
        // Redirect to courses page after a delay
        setTimeout(() => {
          navigate('/courses');
        }, 3000);
      }
    };
    
    verifyAndProcessPayment();
  }, [searchParams, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      {/* Hidden timer elements that VNPay scripts might look for */}
      <div id="vnpay-timer-container" style={{ display: 'none' }}>
        <span id="minutes">15</span>:<span id="seconds">00</span>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Đang xử lý thanh toán</h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h2>
            <p className="text-gray-600 mb-6">Cảm ơn bạn đã đăng ký khóa học.</p>
            {paymentDetails && (
              <div className="bg-gray-50 p-4 rounded-lg text-left mb-6">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Số tiền:</span> {paymentDetails.amount.toLocaleString('vi-VN')} VND
                </p>
                {paymentDetails.transactionNo && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Mã giao dịch:</span> {paymentDetails.transactionNo}
                  </p>
                )}
                {verificationError && (
                  <p className="text-xs text-amber-600 mt-2">
                    Lưu ý: {verificationError}
                  </p>
                )}
              </div>
            )}
            <p className="text-sm text-gray-500">Bạn sẽ được chuyển hướng tự động...</p>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h2>
            <p className="text-gray-600 mb-6">
              {paymentDetails && getVNPayResponseMessage(paymentDetails.responseCode)}
            </p>
            <button 
              onClick={() => window.history.back()} 
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
            >
              Quay lại
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback; 