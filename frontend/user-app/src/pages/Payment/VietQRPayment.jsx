/*-----------------------------------------------------------------
* File: VietQRPayment.jsx
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import courseApi from '@/api/courseApi';
import { Loading } from '@/components';

const VietQRPayment = () => {
  const { transactionCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const { vietQRData: initialQRData, courseId } = state;

  const [vietQRData, setVietQRData] = useState(initialQRData);
  const [verifying, setVerifying] = useState(false);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Nếu người dùng refresh trang và mất state, chuyển về trang thanh toán
  useEffect(() => {
    if (!vietQRData) {
      toast.error('Không tìm thấy dữ liệu giao dịch. Vui lòng tạo QR lại.');
      navigate(-1);
    }
  }, [vietQRData, navigate]);

  // Fetch thông tin khóa học
  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await courseApi.getCourseDetails(courseId);
        if (response.success && response.data) {
          setCourse(response.data);
        }
      } catch (error) {
        console.error('Error fetching course details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  // Xác minh thanh toán thủ công
  const verifyPayment = async () => {
    if (!transactionCode) return;
    try {
      setVerifying(true);
      const res = await courseApi.verifyVietQRPayment(transactionCode);
      if (res.data && res.data.success && res.data.data && res.data.data.status === 'completed') {
        toast.success('Thanh toán thành công!');
        if (courseId) navigate(`/courses/${courseId}`);
        else navigate('/courses');
      } else {
        toast.info('Chưa nhận được thanh toán. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi xác minh thanh toán');
    } finally {
      setVerifying(false);
    }
  };

  if (!vietQRData) return null;
  
  // Sử dụng tài khoản MBBANK
  const bankAccount = '9999991909';
  const bankName = 'MBBANK';
  const bankCode = 'MB';
  const accountName = 'NGUYEN DUC QUYEN';
  
  // Tạo QR URL mới với tài khoản MBBANK
  const qrImageUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact.png?amount=${vietQRData.amount}&addInfo=${vietQRData.description}`;

  // Format giá
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '0';
    const numericPrice = parseFloat(price);
    return isNaN(numericPrice) ? '0' : numericPrice.toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center text-sm text-gray-500">
        <Link to="/" className="hover:text-blue-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to="/courses" className="hover:text-blue-600">Khóa học</Link>
        {course && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/courses/${courseId}`} className="hover:text-blue-600">{course.Title}</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-gray-700">Thanh toán VietQR</span>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          {/* VietQR Payment Section */}
          <div className="md:w-1/2 lg:w-3/5">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-xl font-bold mb-4">Thanh toán VietQR</h1>
              
              <div className="flex flex-col items-center">
                <div className="mb-4 w-full max-w-xs mx-auto">
                  <img 
                    src={qrImageUrl} 
                    alt="VietQR" 
                    className="w-64 h-64 object-contain rounded-lg shadow-sm mx-auto"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = vietQRData.qrImageUrl; // Fallback to original QR
                    }}
                  />
                </div>
                
                <div className="w-full bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                  <h3 className="font-semibold mb-3 text-gray-800">Thông tin chuyển khoản</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngân hàng:</span>
                      <span className="font-medium">{bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tài khoản:</span>
                      <span className="font-medium">{bankAccount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên tài khoản:</span>
                      <span className="font-medium">{accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-medium">{formatPrice(vietQRData.amount)} VND</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nội dung:</span>
                      <span className="font-medium">{vietQRData.description}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Course Information Section */}
          <div className="md:w-1/2 lg:w-2/5 mt-6 md:mt-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-lg font-bold mb-4">Thông tin khóa học</h2>
              
              {course ? (
                <div>
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
                      <span>{formatPrice(course.Price)} VND</span>
                    </div>
                    
                    {course.DiscountPrice && course.DiscountPrice < course.Price && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá:</span>
                        <span>- {formatPrice(course.Price - course.DiscountPrice)} VND</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Tổng thanh toán:</span>
                      <span>{formatPrice(course.DiscountPrice || course.Price)} VND</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">
                  Không tìm thấy thông tin khóa học
                </div>
              )}
              
              <div className="border-t pt-4 mt-4">
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
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VietQRPayment; 
