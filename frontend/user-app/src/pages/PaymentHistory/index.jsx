import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import courseApi from '@/api/courseApi';
import { toast } from 'react-toastify';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('CreatedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending', 'failed'

  useEffect(() => {
    if (!isAuthenticated) {
      toast.info('Bạn cần đăng nhập để xem lịch sử thanh toán');
      navigate('/login', { state: { from: '/payment-history' } });
      return;
    }

    const fetchPaymentHistory = async () => {
      try {
        setLoading(true);
        const response = await courseApi.getPaymentHistory();
        if (response.data && response.data.success) {
          setPaymentHistory(response.data.data || []);
        } else {
          setError('Không thể tải lịch sử thanh toán');
        }
      } catch (error) {
        console.error('Error fetching payment history:', error);
        setError('Đã xảy ra lỗi khi tải lịch sử thanh toán');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [isAuthenticated, navigate]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get payment status badge color
  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower === 'completed' || statusLower === 'success') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Thành công
        </span>
      );
    } else if (statusLower === 'pending' || statusLower === 'processing') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Đang xử lý
        </span>
      );
    } else if (statusLower === 'failed' || statusLower === 'error') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          Thất bại
        </span>
      );
    } else if (statusLower === 'cancelled') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          Đã hủy
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        {status || 'Không xác định'}
      </span>
    );
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Filter and sort payments
  const filteredPayments = paymentHistory
    .filter(payment => {
      if (filter === 'all') return true;
      
      const paymentStatus = (payment.PaymentStatus || payment.Status || '').toLowerCase();
      
      if (filter === 'completed') {
        return paymentStatus === 'completed' || paymentStatus === 'success';
      } else if (filter === 'pending') {
        return paymentStatus === 'pending' || paymentStatus === 'processing';
      } else if (filter === 'failed') {
        return paymentStatus === 'failed' || paymentStatus === 'error' || paymentStatus === 'cancelled';
      }
      
      return true;
    })
    .sort((a, b) => {
      let fieldA = a[sortField];
      let fieldB = b[sortField];
      
      if (sortField === 'CreatedAt' || sortField === 'UpdatedAt') {
        fieldA = new Date(fieldA || 0).getTime();
        fieldB = new Date(fieldB || 0).getTime();
      } else if (sortField === 'Amount') {
        fieldA = parseFloat(fieldA || 0);
        fieldB = parseFloat(fieldB || 0);
      } else {
        fieldA = fieldA?.toString() || '';
        fieldB = fieldB?.toString() || '';
      }
      
      if (sortDirection === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {Array(5).fill(0).map((_, index) => (
        <div key={`skeleton-${index}`} className="bg-white p-4 rounded-lg shadow-sm">
          <div className="h-6 bg-gray-200 rounded-md w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded-md w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded-md w-3/4 mb-2"></div>
          <div className="flex justify-between mt-4">
            <div className="h-6 bg-gray-200 rounded-md w-20"></div>
            <div className="h-6 bg-gray-200 rounded-md w-28"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lịch sử thanh toán</h1>
              <p className="text-gray-600 mt-1">Xem lịch sử thanh toán và đăng ký khóa học của bạn</p>
            </div>
            <button
              onClick={() => navigate('/courses')}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại khóa học
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'completed' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Thành công
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'pending' 
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Đang xử lý
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'failed' 
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Thất bại
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          renderSkeleton()
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="bg-red-100 p-4 rounded-full inline-flex mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{error}</h3>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="bg-blue-100 p-4 rounded-full inline-flex mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy lịch sử thanh toán</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Bạn chưa có giao dịch nào. Hãy đăng ký khóa học để bắt đầu học tập.'
                : 'Không tìm thấy giao dịch nào phù hợp với bộ lọc đã chọn.'}
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Khám phá khóa học
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('Course.Title')}
                    >
                      <div className="flex items-center gap-1">
                        Khóa học
                        {getSortIcon('Course.Title')}
                      </div>
                    </th>
                    <th 
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('Amount')}
                    >
                      <div className="flex items-center gap-1">
                        Số tiền
                        {getSortIcon('Amount')}
                      </div>
                    </th>
                    <th 
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('PaymentMethod')}
                    >
                      <div className="flex items-center gap-1">
                        Phương thức
                        {getSortIcon('PaymentMethod')}
                      </div>
                    </th>
                    <th 
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('PaymentStatus')}
                    >
                      <div className="flex items-center gap-1">
                        Trạng thái
                        {getSortIcon('PaymentStatus')}
                      </div>
                    </th>
                    <th 
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('CreatedAt')}
                    >
                      <div className="flex items-center gap-1">
                        Ngày
                        {getSortIcon('CreatedAt')}
                      </div>
                    </th>
                    <th 
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.TransactionID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.Course?.Title || 'Không có thông tin khóa học'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Mã GD: {payment.TransactionCode || payment.TransactionID}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(payment.Amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.PaymentMethod === 'vnpay' && 'VNPay'}
                          {payment.PaymentMethod === 'credit_card' && 'Thẻ tín dụng'}
                          {payment.PaymentMethod === 'paypal' && 'PayPal'}
                          {payment.PaymentMethod === 'free' && 'Miễn phí'}
                          {payment.PaymentMethod === 'vietqr' && 'VietQR'}
                          {!payment.PaymentMethod && 'Không xác định'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.PaymentStatus || payment.Status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.CreatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {payment.Course && (
                          <button
                            onClick={() => navigate(`/courses/${payment.CourseID}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Xem khóa học
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory; 