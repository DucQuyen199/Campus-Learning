/*-----------------------------------------------------------------
* File: index.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Loading } from '@/components';
import courseApi from '@/api/courseApi';
import { useAuth } from '@/contexts/AuthContext';

const Payment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialMethod = location.state?.initialPaymentMethod || searchParams.get('method') || 'vnpay';
  const [paymentMethod, setPaymentMethod] = useState(initialMethod);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Store server-side PayPal transaction ID
  const paypalServerTransactionIdRef = useRef(null);

  // Selected bank code for VNPay
  const [selectedBank, setSelectedBank] = useState('');

  // For VietQR
  const [vietQRData, setVietQRData] = useState(null);
  const [vietQRTransactionCode, setVietQRTransactionCode] = useState(null);
  const [verifyingVietQR, setVerifyingVietQR] = useState(false);
  const [verificationInterval, setVerificationInterval] = useState(null);

  // Fetch VNPay bank list for sandbox
  const [bankList, setBankList] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);

  // Format price function
  const formatPrice = (price) => {
    if (price === null || price === undefined) return 0;
    const numericPrice = parseFloat(price);
    return isNaN(numericPrice) ? 0 : numericPrice;
  };

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        
        if (!courseId) {
          setError('Không thể xác định khóa học');
          setLoading(false);
          return;
        }
        
        if (!isAuthenticated) {
          navigate('/login', { state: { from: `/payment/${courseId}` } });
          return;
        }
        
        const response = await courseApi.getCourseDetails(courseId);
        
        if (response.success && response.data) {
          setCourse(response.data);
        } else {
          setError(response.message || 'Không thể tải thông tin khóa học');
        }
      } catch (error) {
        setError('Lỗi khi tải thông tin khóa học');
        console.error('Course fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, isAuthenticated, navigate]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch('/api/vnpay/banks');
        const result = await res.json();
        if (result.success) {
          setBankList(result.data);
          // Initialize selected bank to first available
          if (result.data && result.data.length > 0) {
            setSelectedBank(result.data[0].code);
          }
        } else {
          console.error('Failed to fetch VNPay banks:', result.message);
        }
      } catch (error) {
        console.error('Error fetching VNPay bank list:', error);
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

  const handlePayment = async () => {
    try {
      setProcessingPayment(true);
      
      if (paymentMethod === 'vnpay') {
        const response = await courseApi.createPayment(courseId, selectedBank);
        if (response.data && response.data.success && response.data.paymentUrl) {
          // Lưu thông tin thanh toán vào localStorage để kiểm tra khi quay lại
          localStorage.setItem('pendingPayment', JSON.stringify({
            courseId,
            method: 'vnpay',
            timestamp: new Date().getTime()
          }));
          // Redirect to payment gateway
          window.location.href = response.data.paymentUrl;
        } else {
          toast.error('Không thể tạo liên kết thanh toán');
        }
      } else if (paymentMethod === 'vietqr') {
        const response = await courseApi.createVietQRPayment(courseId);
        if (
          response &&
          response.data &&
          response.data.success &&
          response.data.data &&
          response.data.data.vietQRData
        ) {
          const { vietQRData: qrData, transactionCode } = response.data.data;
          navigate(`/payment/vietqr/${transactionCode}`, {
            state: {
              vietQRData: qrData,
              courseId,
              transactionCode
            }
          });
        } else {
          toast.error('Không thể tạo thông tin thanh toán VietQR');
        }
      } else if (paymentMethod !== 'paypal') {
        // For other methods that aren't implemented yet
        toast.info('Phương thức thanh toán này sẽ được hỗ trợ trong thời gian tới');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Lỗi xử lý thanh toán');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePayPalRedirect = async () => {
    setProcessingPayment(true);
    try {
      const resp = await courseApi.createPayPalOrder(courseId);
      const approveUrl = resp.data.approveUrl;
      if (approveUrl) {
        window.location.href = approveUrl;
      } else {
        toast.error('Không nhận được đường dẫn xác nhận PayPal');
      }
    } catch (error) {
      console.error('PayPal redirect error:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo đơn hàng PayPal');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Clear verification interval on component unmount
  useEffect(() => {
    return () => {
      if (verificationInterval) {
        clearInterval(verificationInterval);
      }
    };
  }, [verificationInterval]);

  // Manual verification function for VietQR
  const verifyVietQRPayment = async () => {
    if (!vietQRTransactionCode) {
      toast.error('Không có mã giao dịch để xác minh');
      return;
    }
    
    try {
      setVerifyingVietQR(true);
      const response = await courseApi.verifyVietQRPayment(vietQRTransactionCode);
      if (response.data && response.data.success && response.data.data && response.data.data.status === 'completed') {
        toast.success('Thanh toán thành công!');
        navigate(`/courses/${courseId}`);
      } else {
        toast.info('Chưa nhận được thanh toán. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error verifying VietQR payment:', error);
      toast.error('Lỗi xác nhận thanh toán. Vui lòng thử lại.');
    } finally {
      setVerifyingVietQR(false);
    }
  };

  if (loading) {
    return <Loading />;
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

  // Calculate prices for display
  const price = formatPrice(course.Price);
  const discountPrice = formatPrice(course.DiscountPrice);
  const finalPrice = discountPrice > 0 ? discountPrice : price;
  const discount = price > 0 && discountPrice > 0 ? price - discountPrice : 0;
  const discountPercentage = price > 0 ? Math.round((discount / price) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center text-sm text-gray-500">
        <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to="/courses" className="hover:text-blue-600">Khóa học</Link>
        <span className="mx-2">/</span>
        <Link to={`/courses/${courseId}`} className="hover:text-blue-600">{course.Title}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Thanh toán</span>
      </div>

      {/* Display available banks (for debugging) */}
      {loadingBanks ? (
        <p>Loading bank list...</p>
      ) : (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">VNPay Banks:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {bankList.map(bank => (
              <li key={bank.code} className="mb-1">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="bankCode"
                    value={bank.code}
                    checked={selectedBank === bank.code}
                    onChange={() => setSelectedBank(bank.code)}
                    className="mr-2"
                  />
                  {bank.code}: {bank.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Order Summary */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Thông tin đơn hàng</h2>
            
            <div className="flex items-start border-b pb-4 mb-4">
              {course.ImageUrl ? (
                <img 
                  src={course.ImageUrl} 
                  alt={course.Title} 
                  className="w-24 h-24 object-cover rounded-md mr-4"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x400?text=Course+Image';
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-md mr-4 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Không có hình ảnh</span>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{course.Title}</h3>
                <p className="text-gray-600 text-sm mb-2">
                  {course.ShortDescription || course.Description?.substring(0, 100) || 'Không có mô tả'}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-2">
                    {course.Level || 'All Levels'}
                  </span>
                  <span>{course.Duration || 0} phút</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Giá gốc:</span>
                <span>{price.toLocaleString()} VND</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({discountPercentage}%):</span>
                  <span>- {discount.toLocaleString()} VND</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Tổng thanh toán:</span>
                <span>{finalPrice.toLocaleString()} VND</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Phương thức thanh toán</h2>
            
            {/* Payment method selection - only logos in horizontal layout */}
            <div className="flex justify-center gap-6 mb-6">
              {/* VNPAY payment option */}
              <div 
                className={`relative cursor-pointer p-3 rounded-lg transition-all flex items-center justify-center w-20 h-20 ${
                  paymentMethod === 'vnpay' 
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
                    : 'bg-white border hover:bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('vnpay')}
              >
                <img 
                  src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR.png" 
                  alt="VNPAY" 
                  className="max-h-12 max-w-12 object-contain"
                />
                <input
                  type="radio"
                  name="payment-method"
                  value="vnpay"
                  checked={paymentMethod === 'vnpay'}
                  onChange={() => setPaymentMethod('vnpay')}
                  className="sr-only"
                />
                {paymentMethod === 'vnpay' && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              {/* VietQR payment option */}
              <div 
                className={`relative cursor-pointer p-3 rounded-lg transition-all flex items-center justify-center w-20 h-20 ${
                  paymentMethod === 'vietqr' 
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
                    : 'bg-white border hover:bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('vietqr')}
              >
                <img 
                  src="https://play-lh.googleusercontent.com/22cJzF0otG-EmmQgILMRTWFPnx0wTCSDY9aFaAmOhHs30oNHxi63KcGwUwmbR76Msko" 
                  alt="VietQR" 
                  className="max-h-12 max-w-12 object-contain"
                />
                <input
                  type="radio"
                  name="payment-method"
                  value="vietqr"
                  checked={paymentMethod === 'vietqr'}
                  onChange={() => setPaymentMethod('vietqr')}
                  className="sr-only"
                />
                {paymentMethod === 'vietqr' && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              {/* PayPal payment option */}
              <div 
                className={`relative cursor-pointer p-3 rounded-lg transition-all flex items-center justify-center w-20 h-20 ${
                  paymentMethod === 'paypal' 
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
                    : 'bg-white border hover:bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('paypal')}
              >
                <img 
                  src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" 
                  alt="PayPal" 
                  className="max-h-12 max-w-12 object-contain"
                />
                <input
                  type="radio"
                  name="payment-method"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={() => setPaymentMethod('paypal')}
                  className="sr-only"
                />
                {paymentMethod === 'paypal' && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Credit/Debit Card payment option - Visa only */}
              <div 
                className={`relative cursor-pointer p-3 rounded-lg transition-all flex items-center justify-center w-20 h-20 ${
                  paymentMethod === 'card' 
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
                    : 'bg-white border hover:bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                <img 
                  src="https://usa.visa.com/dam/VCOM/regional/ve/romania/blogs/hero-image/visa-logo-800x450.jpg" 
                  alt="Visa" 
                  className="max-h-12 max-w-12 object-contain" 
                />
                <input
                  type="radio"
                  name="payment-method"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="sr-only"
                />
                {paymentMethod === 'card' && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Momo payment option */}
              <div 
                className={`relative cursor-pointer p-3 rounded-lg transition-all flex items-center justify-center w-20 h-20 ${
                  paymentMethod === 'momo' 
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
                    : 'bg-white border hover:bg-gray-50'
                }`}
                onClick={() => setPaymentMethod('momo')}
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" 
                  alt="MoMo" 
                  className="max-h-12 max-w-12 object-contain"
                />
                <input
                  type="radio"
                  name="payment-method"
                  value="momo"
                  checked={paymentMethod === 'momo'}
                  onChange={() => setPaymentMethod('momo')}
                  className="sr-only"
                />
                {paymentMethod === 'momo' && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            {/* Payment method description based on selection */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              {paymentMethod === 'vnpay' && (
                <div className="text-sm text-gray-600">
                  <p>Thanh toán bằng VNPAY QR hoặc thẻ ATM/Visa/Mastercard thông qua cổng VNPAY</p>
                </div>
              )}
              
              {paymentMethod === 'vietqr' && (
                <div className="text-sm text-gray-600">
                  <p>Thanh toán chuyển khoản ngân hàng bằng mã QR của VietQR</p>
                </div>
              )}
              
              {paymentMethod === 'paypal' && (
                <div className="text-sm text-gray-600">
                  <p>Thanh toán an toàn với PayPal hoặc thẻ tín dụng quốc tế thông qua PayPal</p>
                </div>
              )}
              
              {paymentMethod === 'card' && (
                <div className="text-sm text-gray-600">
                  <p>Thanh toán bằng thẻ Visa, Mastercard hoặc JCB</p>
                </div>
              )}
              
              {paymentMethod === 'momo' && (
                <div className="text-sm text-gray-600">
                  <p>Thanh toán qua ví điện tử MoMo</p>
                </div>
              )}
            </div>
            
            {/* VietQR Payment Section */}
            {paymentMethod === 'vietqr' && vietQRData ? (
              <div className="flex flex-col items-center">
                <div className="mb-4 text-center">
                  <h3 className="font-semibold mb-2">Quét mã QR để thanh toán</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Sử dụng ứng dụng ngân hàng để quét mã QR và thanh toán
                  </p>
                  <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <img 
                      src={vietQRData.qrImageUrl} 
                      alt="VietQR Payment" 
                      className="max-w-full h-auto"
                    />
                  </div>
                </div>
                
                <div className="w-full bg-gray-100 p-4 rounded-md mb-4">
                  <h4 className="font-medium mb-2">Thông tin chuyển khoản</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngân hàng:</span>
                      <span className="font-medium">{vietQRData.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tài khoản:</span>
                      <span className="font-medium">{vietQRData.bankAccount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên tài khoản:</span>
                      <span className="font-medium">{vietQRData.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-medium">{vietQRData.amount?.toLocaleString()} VND</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nội dung chuyển khoản:</span>
                      <span className="font-medium">{vietQRData.description}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={verifyVietQRPayment}
                  disabled={verifyingVietQR}
                  className={`w-full py-3 text-white rounded-lg ${
                    verifyingVietQR ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {verifyingVietQR ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xác minh thanh toán...
                    </span>
                  ) : (
                    'Tôi đã thanh toán'
                  )}
                </button>
              </div>
            ) : paymentMethod === 'paypal' ? (
              <button
                onClick={handlePayPalRedirect}
                disabled={processingPayment}
                className={`w-full py-3 text-white rounded-lg ${
                  processingPayment ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {processingPayment ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang chuyển hướng...
                  </span>
                ) : (
                  'Thanh toán với PayPal'
                )}
              </button>
            ) : paymentMethod === 'vietqr' && !vietQRData ? (
              <button
                onClick={handlePayment}
                disabled={processingPayment}
                className={`w-full py-3 text-white rounded-lg ${
                  processingPayment ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {processingPayment ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo mã thanh toán...
                  </span>
                ) : (
                  'Tạo mã QR để thanh toán'
                )}
              </button>
            ) : (
              <button
                onClick={handlePayment}
                disabled={processingPayment}
                className={`w-full py-3 text-white rounded-lg ${
                  processingPayment ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {processingPayment ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  `Thanh toán qua ${
                    paymentMethod === 'vnpay' ? 'VNPAY' : 
                    paymentMethod === 'card' ? 'Thẻ tín dụng' : 
                    paymentMethod === 'momo' ? 'MoMo' : 'Khác'
                  }`
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-bold mb-4">Thông tin khóa học</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Bạn sẽ nhận được:</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Truy cập trọn đời vào khóa học</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Học theo tốc độ của riêng bạn</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Giấy chứng nhận hoàn thành</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Hỗ trợ kỹ thuật từ giảng viên</span>
                </li>
              </ul>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-700 mb-2">Chính sách hoàn tiền:</h3>
              <p className="text-sm text-gray-600">
                Chúng tôi cam kết hoàn tiền 100% trong vòng 30 ngày nếu bạn không hài lòng với khóa học.
              </p>
            </div>
            
            <div className="border-t mt-4 pt-4">
              <h3 className="font-medium text-gray-700 mb-2">Cần hỗ trợ?</h3>
              <p className="text-sm text-gray-600">
                Liên hệ với chúng tôi qua email <a href="mailto:support@CampusLearning.edu.vn" className="text-blue-600">support@CampusLearning.edu.vn</a> hoặc hotline <span className="text-blue-600">1800-6868</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment; 
