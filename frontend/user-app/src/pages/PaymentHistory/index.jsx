import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import courseApi from '@/api/courseApi';
import { toast } from 'react-toastify';

// Add deletePayment method to courseApi if it doesn't exist
if (!courseApi.deletePayment) {
  courseApi.deletePayment = async (paymentId) => {
    try {
      return await courseApi.axiosInstance.delete(`/payments/${paymentId}`);
    } catch (error) {
      throw error;
    }
  };
}

// Components
const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-white rounded-xl shadow-md transition-transform hover:scale-[1.02]">
    <div className="p-6 flex items-center">
      <div className={`p-3 rounded-full ${icon.bg} mr-4`}>
        {icon.svg}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const statusLower = status?.toLowerCase() || '';
  
  if (statusLower === 'completed' || statusLower === 'success') {
    return (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        Thành công
      </span>
    );
  } else if (statusLower === 'pending' || statusLower === 'processing') {
    return (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
        Đang xử lý
      </span>
    );
  } else if (statusLower === 'failed' || statusLower === 'error') {
    return (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-fit">
        <span className="w-2 h-2 rounded-full bg-red-500"></span>
        Thất bại
      </span>
    );
  } else if (statusLower === 'cancelled') {
    return (
      <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 flex items-center gap-1 w-fit">
        <span className="w-2 h-2 rounded-full bg-gray-500"></span>
        Đã hủy
      </span>
    );
  }
  
  return (
    <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 flex items-center gap-1 w-fit">
      <span className="w-2 h-2 rounded-full bg-gray-500"></span>
      {status || 'Không xác định'}
    </span>
  );
};

const FilterButton = ({ active, onClick, children, activeColor }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active 
      ? `${activeColor} shadow-sm`
      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
    }`}
  >
    {children}
  </button>
);

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth(); // Lấy thông tin người dùng từ AuthContext
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false); // Thay đổi từ true sang false
  const [processingPaymentId, setProcessingPaymentId] = useState(null); // Track which payment is being deleted
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('CreatedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filter, setFilter] = useState('all'); 
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalTransactions: 0,
    successfulTransactions: 0
  });

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
          const payments = response.data.data || [];
          setPaymentHistory(payments);
          
          // Calculate payment statistics
          const stats = {
            totalPaid: 0,
            totalPending: 0,
            totalTransactions: payments.length,
            successfulTransactions: 0
          };
          
          payments.forEach(payment => {
            const status = (payment.PaymentStatus || payment.Status || '').toLowerCase();
            const amount = parseFloat(payment.Amount) || 0;
            
            if (status === 'completed' || status === 'success') {
              stats.totalPaid += amount;
              stats.successfulTransactions++;
            } else if (status === 'pending' || status === 'processing') {
              stats.totalPending += amount;
            }
          });
          
          setPaymentStats(stats);
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

    // Fetch enrolled courses
    const fetchEnrolledCourses = async () => {
      try {
        const response = await courseApi.getEnrolledCourses();
        if (response.data && response.data.success) {
          setEnrolledCourses(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
      }
    };

    fetchPaymentHistory();
    fetchEnrolledCourses();
  }, [isAuthenticated, navigate]);

  // Delete payment transaction
  const deletePayment = async (paymentId) => {
    try {
      const confirmation = window.confirm('Bạn có chắc chắn muốn xóa giao dịch này không?');
      if (!confirmation) return;

      setProcessingPaymentId(paymentId);
      
      // Assuming the API endpoint exists
      const response = await courseApi.deletePayment(paymentId);
      
      if (response.data && response.data.success) {
        // Cập nhật UI ngay lập tức bằng cách xóa giao dịch khỏi state
        setPaymentHistory(prevPayments => 
          prevPayments.filter(payment => payment.TransactionID !== paymentId)
        );
        
        // Hiển thị thông báo thành công
        toast.success('Giao dịch đã được xóa thành công', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
        
        // Cập nhật lại thống kê và danh sách sau khi xóa
        await fetchPaymentHistory();
      } else {
        toast.error(response.data?.message || 'Không thể xóa giao dịch', {
          position: "top-right",
          autoClose: 5000
        });
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi khi xóa giao dịch';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setProcessingPaymentId(null);
    }
  };

  // Toggle select payment
  const toggleSelectPayment = (paymentId) => {
    setSelectedPayments(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  // Select all cancelled payments
  const selectAllCancelledPayments = () => {
    const cancelledPaymentIds = paymentHistory
      .filter(payment => (payment.PaymentStatus || payment.Status || '').toLowerCase() === 'cancelled')
      .map(payment => payment.TransactionID);
    
    if (cancelledPaymentIds.length === 0) {
      toast.info('Không có giao dịch đã hủy nào để chọn', {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }
    
    setSelectedPayments(cancelledPaymentIds);
    
    toast.info(`Đã chọn ${cancelledPaymentIds.length} giao dịch đã hủy`, {
      position: "top-right",
      autoClose: 2000
    });
  };

  // Deselect all payments
  const deselectAllPayments = () => {
    setSelectedPayments([]);
  };

  // Delete multiple payments
  const deleteSelectedPayments = async () => {
    if (selectedPayments.length === 0) {
      toast.info('Chưa có giao dịch nào được chọn', {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    const confirmation = window.confirm(`Bạn có chắc chắn muốn xóa ${selectedPayments.length} giao dịch đã chọn không?`);
    if (!confirmation) return;

    try {
      setLoading(true);
      const response = await courseApi.deleteManyPayments(selectedPayments);
      
      if (response.data && response.data.success) {
        // Cập nhật UI ngay lập tức
        setPaymentHistory(prevPayments => 
          prevPayments.filter(payment => !selectedPayments.includes(payment.TransactionID))
        );
        
        toast.success(`Đã xóa thành công ${response.data.deletedCount} giao dịch`, {
          position: "top-right",
          autoClose: 3000
        });
        
        setSelectedPayments([]);
        
        // Cập nhật lại thống kê và dữ liệu
        await fetchPaymentHistory();
      } else {
        toast.error(response.data?.message || 'Không thể xóa các giao dịch đã chọn', {
          position: "top-right",
          autoClose: 5000
        });
      }
    } catch (error) {
      console.error('Error deleting payments:', error);
      const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi khi xóa các giao dịch';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Print only successful payments
  const handlePrint = () => {
    const successfulPayments = paymentHistory.filter(payment => {
      const status = (payment.PaymentStatus || payment.Status || '').toLowerCase();
      return status === 'completed' || status === 'success';
    });
    
    if (successfulPayments.length === 0) {
      toast.info('Không có giao dịch thành công để in');
      return;
    }

    // Lấy thông tin người dùng từ context
    const userName = currentUser?.FullName || currentUser?.fullName || currentUser?.name || 'Người dùng CampusLearning Learning';
    const userEmail = currentUser?.Email || currentUser?.email || '';
    const userId = currentUser?.UserID || currentUser?.userId || currentUser?.id || '';

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Generate HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Lịch sử thanh toán thành công - CampusLearning Learning</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Roboto', Arial, sans-serif;
            margin: 40px;
            color: #333;
            line-height: 1.6;
            position: relative;
            background-color: #fff;
          }
          
          /* Watermark base styles */
          .watermark {
            pointer-events: none;
          }
          
          /* Diagonal striped watermark on every page */
          @page {
            size: A4;
            margin: 0;
          }
          
          @media print {
            body::before, body::after {
              display: none; /* Remove the body pseudo-elements for print */
            }
            
            .page {
              page-break-after: always;
              position: relative;
              height: 100vh;
            }
            
            /* Apply the watermark to every page */
            .page::before {
              content: "";
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: repeating-linear-gradient(
                45deg,
                rgba(200, 200, 200, 0.05),
                rgba(200, 200, 200, 0.05) 10px,
                rgba(200, 200, 200, 0.08) 10px,
                rgba(200, 200, 200, 0.08) 20px
              );
              z-index: -2;
            }
            
            /* Text watermark on every page */
            .page::after {
              content: "CampusLearning Learning";
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 80px;
              font-weight: 700;
              color: rgba(37, 99, 235, 0.07);  /* Màu xanh mờ */
              white-space: nowrap;
              z-index: -1;
            }
          }
          
          .container {
            max-width: 850px;
            margin: 0 auto;
            padding: 30px;
            background-color: #fff;
            box-shadow: 0 1px 15px rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            position: relative;
            z-index: 1;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
          }
          
          .logo {
            font-size: 28px;
            font-weight: 700;
            color: #2563eb;
            margin-bottom: 5px;
          }
          
          h1 {
            font-size: 24px;
            color: #111827;
            margin-bottom: 10px;
            font-weight: 600;
          }
          
          .print-date {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 20px;
          }
          
          .user-info {
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
          }
          
          .info-group {
            margin-bottom: 10px;
          }
          
          .info-label {
            font-weight: 600;
            color: #4b5563;
            font-size: 14px;
          }
          
          .info-value {
            font-weight: 400;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border-radius: 5px;
            overflow: hidden;
          }
          
          th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          
          th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #4b5563;
            font-size: 14px;
          }
          
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          
          tr:hover {
            background-color: #f3f4f6;
          }
          
          .amount {
            font-weight: 600;
            text-align: right;
          }
          
          .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            background-color: #d1fae5;
            color: #065f46;
          }
          
          .footer {
            margin-top: 40px;
            text-align: right;
            border-top: 2px solid #f0f0f0;
            padding-top: 20px;
            font-size: 14px;
          }
          
          .total-section {
            margin-top: 20px;
            text-align: right;
            font-weight: 600;
          }
          
          .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 5px;
            font-size: 15px;
          }
          
          .total-label {
            margin-right: 20px;
            color: #6b7280;
          }
          
          .total-amount {
            min-width: 120px;
            text-align: right;
            color: #111827;
          }
          
          .grand-total {
            font-size: 18px;
            font-weight: 700;
            color: #2563eb;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
          }
          
          .notes {
            margin-top: 40px;
            padding: 15px;
            background-color: #f3f4f6;
            border-radius: 5px;
            font-size: 14px;
            color: #4b5563;
          }
          
          .notes h3 {
            margin-top: 0;
            font-size: 16px;
            color: #111827;
          }
          
          .stamp {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
          }
          
          .stamp-content {
            border: 2px solid #2563eb;
            color: #2563eb;
            border-radius: 5px;
            padding: 10px 20px;
            font-weight: 600;
            font-size: 16px;
            transform: rotate(-5deg);
            opacity: 0.8;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 20px;
            }
            
            .container {
              box-shadow: none;
              padding: 0;
            }
            
            .no-print {
              display: none;
            }
            
            /* Force page breaks where needed */
            .page-break {
              page-break-after: always;
            }
            
            /* Each page must be a container */
            .page {
              page-break-after: always;
              position: relative;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="container">
            <div class="header">
              <div class="logo">CampusLearning Learning</div>
              <h1>Lịch sử thanh toán thành công</h1>
              <div class="print-date">Ngày in: ${new Date().toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'})} lúc ${new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</div>
            </div>
            
            <div class="user-info">
              <div>
                <div class="info-group">
                  <span class="info-label">Học viên:</span> <span class="info-value">${userName}</span>
                </div>
                <div class="info-group">
                  <span class="info-label">Email:</span> <span class="info-value">${userEmail}</span>
                </div>
              </div>
              <div>
                <div class="info-group">
                  <span class="info-label">Mã học viên:</span> <span class="info-value">${userId}</span>
                </div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Khóa học</th>
                  <th>Mã giao dịch</th>
                  <th>Phương thức</th>
                  <th>Ngày thanh toán</th>
                  <th class="amount">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                ${successfulPayments.map((payment, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${payment.Course?.Title || 'Không có thông tin khóa học'}</td>
                    <td>${payment.TransactionCode || payment.TransactionID}</td>
                    <td>${getPaymentMethodText(payment.PaymentMethod)}</td>
                    <td>${formatDate(payment.CreatedAt)}</td>
                    <td class="amount">${formatCurrency(payment.Amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-row">
                <div class="total-label">Số lượng giao dịch:</div>
                <div class="total-amount">${successfulPayments.length} giao dịch</div>
              </div>
              <div class="total-row grand-total">
                <div class="total-label">Tổng thanh toán:</div>
                <div class="total-amount">${formatCurrency(
                  successfulPayments.reduce((total, payment) => total + parseFloat(payment.Amount || 0), 0)
                )}</div>
              </div>
            </div>
            
            <div class="notes">
              <h3>Ghi chú:</h3>
              <p>Tài liệu này chỉ có giá trị thông tin và không có giá trị pháp lý. Vui lòng liên hệ với bộ phận hỗ trợ khách hàng của CampusLearning Learning nếu cần thêm thông tin hoặc xác nhận thanh toán.</p>
            </div>
            
            <div class="stamp">
              <div class="stamp-content">Đã xác nhận</div>
            </div>
            
            <div class="footer">
              <p>CampusLearning Learning - Nền tảng học trực tuyến hàng đầu</p>
              <p>Mọi thắc mắc xin liên hệ: support@CampusLearning.com | Hotline: 0123456789</p>
            </div>
          </div>
        </div>
        
        <script>
          // Ensure watermarks appear on every page by adding page class to each page
          document.addEventListener('DOMContentLoaded', function() {
            // Add watermark elements to ensure they appear on every printed page
            const addWatermarks = () => {
              const watermarkText = document.createElement('div');
              watermarkText.className = 'watermark-text';
              watermarkText.style.cssText = 
                'position: fixed;' +
                'top: 50%;' +
                'left: 50%;' +
                'transform: translate(-50%, -50%) rotate(-30deg);' +
                'font-size: 80px;' +
                'font-weight: 700;' +
                'color: rgba(37, 99, 235, 0.07);' +  /* Màu xanh mờ */
                'white-space: nowrap;' +
                'z-index: -1;' +
                'pointer-events: none;';
              watermarkText.innerText = 'CampusLearning Learning';
              document.body.appendChild(watermarkText);
              
              const watermarkStripes = document.createElement('div');
              watermarkStripes.className = 'watermark-stripes';
              watermarkStripes.style.cssText = 
                'position: fixed;' +
                'top: 0;' +
                'left: 0;' +
                'width: 100%;' +
                'height: 100%;' +
                'background: repeating-linear-gradient(' +
                  '45deg,' +
                  'rgba(200, 200, 200, 0.05),' +
                  'rgba(200, 200, 200, 0.05) 10px,' +
                  'rgba(200, 200, 200, 0.08) 10px,' +
                  'rgba(200, 200, 200, 0.08) 20px' +
                ');' +
                'z-index: -2;' +
                'pointer-events: none;';
              document.body.appendChild(watermarkStripes);

              // Add additional blue text watermark at bottom of each page
              const blueWatermark = document.createElement('div');
              blueWatermark.className = 'blue-watermark';
              blueWatermark.style.cssText = 
                'position: fixed;' +
                'bottom: 10px;' +
                'left: 50%;' +
                'transform: translateX(-50%);' +
                'font-size: 14px;' +
                'font-weight: 500;' +
                'color: rgba(37, 99, 235, 0.5);' +  /* Màu xanh đậm hơn */
                'white-space: nowrap;' +
                'z-index: 1;' +
                'pointer-events: none;';
              blueWatermark.innerText = 'Tài liệu của CampusLearning Learning - www.CampusLearning.com';
              document.body.appendChild(blueWatermark);
            };
            
            // Add watermarks when document loads
            addWatermarks();
            
            // If there are multiple pages, ensure each gets the page class
            if (document.querySelectorAll('.page').length === 0) {
              const content = document.querySelector('.container');
              if (content) {
                const page = document.createElement('div');
                page.className = 'page';
                content.parentNode.insertBefore(page, content);
                page.appendChild(content);
              }
            }
          });
        </script>
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">In ngay</button>
          <button onclick="window.close()" style="padding: 10px 20px; background-color: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer;">Đóng</button>
        </div>
      </body>
      </html>
    `;
    
    // Write content to the new window
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Print course details
  const handlePrintCourse = (course) => {
    // Add validation for known problematic course IDs
    if (course.id === 7) {
      toast.error('Khóa học này đã bị xóa hoặc không tồn tại', {
        position: "top-right",
        autoClose: 5000
      });
      return;
    }
    
    // Additional validation to ensure required data is available
    if (!course.id || !course.title) {
      toast.error('Dữ liệu khóa học không hợp lệ', {
        position: "top-right",
        autoClose: 5000
      });
      return;
    }
    
    navigate('/payment-history/print-course', { state: { courseData: course } });
  };

  // Get payment method text
  const getPaymentMethodText = (method) => {
    switch(method) {
      case 'vnpay': return 'VNPay';
      case 'credit_card': return 'Thẻ tín dụng';
      case 'paypal': return 'PayPal';
      case 'free': return 'Miễn phí';
      case 'vietqr': return 'VietQR';
      default: return 'Không xác định';
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array(4).fill(0).map((_, index) => (
          <div key={`stat-skeleton-${index}`} className="bg-white p-4 rounded-xl shadow-md">
            <div className="h-5 bg-gray-200 rounded-md w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded-md w-3/4"></div>
          </div>
        ))}
      </div>
      {Array(5).fill(0).map((_, index) => (
        <div key={`skeleton-${index}`} className="bg-white p-4 rounded-xl shadow-md mb-4">
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

  // Render statistics cards
  const renderStatistics = () => {
    const stats = [
      {
        title: "Tổng thanh toán",
        value: formatCurrency(paymentStats.totalPaid),
        icon: {
          bg: "bg-blue-100",
          svg: (
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      },
      {
        title: "Đang xử lý",
        value: formatCurrency(paymentStats.totalPending),
        icon: {
          bg: "bg-yellow-100",
          svg: (
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      },
      {
        title: "Giao dịch thành công",
        value: paymentStats.successfulTransactions,
        icon: {
          bg: "bg-green-100",
          svg: (
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      },
      {
        title: "Tổng giao dịch",
        value: paymentStats.totalTransactions,
        icon: {
          bg: "bg-purple-100",
          svg: (
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )
        }
      }
    ];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <div className="bg-white rounded-xl shadow-md p-8 text-center">
      <div className="mb-6">
        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">Không tìm thấy lịch sử thanh toán</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {filter === 'all' 
          ? 'Bạn chưa có giao dịch nào. Hãy đăng ký khóa học để bắt đầu học tập.'
          : 'Không tìm thấy giao dịch nào phù hợp với bộ lọc đã chọn.'}
      </p>
      <button
        onClick={() => navigate('/courses')}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg focus:ring-4 focus:ring-blue-200 flex items-center gap-2 mx-auto"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Khám phá khóa học
      </button>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="bg-white rounded-xl shadow-md p-8 text-center">
      <div className="mb-6">
        <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{error}</h3>
      <button
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg focus:ring-4 focus:ring-blue-200 flex items-center gap-2 mx-auto"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Thử lại
      </button>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-900">Lịch sử thanh toán</h1>
              <p className="text-gray-600 mt-1">Xem lịch sử thanh toán và đăng ký khóa học của bạn</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                In thanh toán
              </button>
              <button
                onClick={() => navigate('/courses')}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay lại khóa học
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-3 justify-between">
            <div className="flex flex-wrap gap-3">
              <FilterButton 
                active={filter === 'all'} 
                onClick={() => setFilter('all')}
                activeColor="bg-blue-50 text-blue-700 border border-blue-200"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Tất cả
                </div>
              </FilterButton>
              <FilterButton 
                active={filter === 'completed'} 
                onClick={() => setFilter('completed')}
                activeColor="bg-green-50 text-green-700 border border-green-200"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Thành công
                </div>
              </FilterButton>
              <FilterButton 
                active={filter === 'pending'} 
                onClick={() => setFilter('pending')}
                activeColor="bg-yellow-50 text-yellow-700 border border-yellow-200"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Đang xử lý
                </div>
              </FilterButton>
              <FilterButton 
                active={filter === 'failed'} 
                onClick={() => setFilter('failed')}
                activeColor="bg-red-50 text-red-700 border border-red-200"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Thất bại
                </div>
              </FilterButton>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={selectAllCancelledPayments}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Chọn tất cả đã hủy
              </button>
              {selectedPayments.length > 0 && (
                <>
                  <button 
                    onClick={deselectAllPayments}
                    disabled={loading}
                    className={`px-4 py-2 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors flex items-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Bỏ chọn tất cả
                  </button>
                  <button 
                    onClick={deleteSelectedPayments}
                    disabled={loading}
                    className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    Xóa ({selectedPayments.length})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {loading ? (
          renderSkeleton()
        ) : error ? (
          renderError()
        ) : filteredPayments.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Statistics Cards */}
            {renderStatistics()}
            
            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          Chọn
                        </div>
                      </th>
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
                  <tbody>
                    {filteredPayments.map((payment, index) => {
                      const isCancelled = (payment.PaymentStatus || payment.Status || '').toLowerCase() === 'cancelled';
                      return (
                        <tr 
                          key={payment.TransactionID} 
                          className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <td className="px-3 py-4">
                            <div className="flex items-center justify-center">
                              {isCancelled && (
                                <input
                                  type="checkbox"
                                  checked={selectedPayments.includes(payment.TransactionID)}
                                  onChange={() => toggleSelectPayment(payment.TransactionID)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-500 mr-3">
                                {payment.Course?.ImageUrl ? (
                                  <img 
                                    src={payment.Course.ImageUrl} 
                                    alt={payment.Course?.Title || 'Course image'}
                                    className="h-10 w-10 object-cover rounded-md"
                                  />
                                ) : (
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                )}
                              </div>
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
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(payment.Amount)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 flex items-center">
                              {payment.PaymentMethod === 'vnpay' && (
                                <>
                                  <span className="w-6 h-6 rounded bg-green-100 flex items-center justify-center mr-2">
                                    <span className="text-xs font-bold text-green-700">VN</span>
                                  </span>
                                  VNPay
                                </>
                              )}
                              {payment.PaymentMethod === 'credit_card' && (
                                <>
                                  <span className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center mr-2">
                                    <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                  </span>
                                  Thẻ tín dụng
                                </>
                              )}
                              {payment.PaymentMethod === 'paypal' && (
                                <>
                                  <span className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center mr-2">
                                    <span className="text-xs font-bold text-blue-700">PP</span>
                                  </span>
                                  PayPal
                                </>
                              )}
                              {payment.PaymentMethod === 'free' && (
                                <>
                                  <span className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center mr-2">
                                    <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </span>
                                  Miễn phí
                                </>
                              )}
                              {payment.PaymentMethod === 'vietqr' && (
                                <>
                                  <span className="w-6 h-6 rounded bg-red-100 flex items-center justify-center mr-2">
                                    <span className="text-xs font-bold text-red-700">QR</span>
                                  </span>
                                  VietQR
                                </>
                              )}
                              {!payment.PaymentMethod && (
                                <>
                                  <span className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center mr-2">
                                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </span>
                                  Không xác định
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={payment.PaymentStatus || payment.Status} />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(payment.CreatedAt)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            {payment.Course && (
                              <>
                                <button
                                  onClick={() => navigate(`/courses/${payment.CourseID}`)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors bg-blue-50 hover:bg-blue-100 p-2 rounded-md mr-2"
                                  title="Xem khóa học"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                
                                {/* Print course detail button */}
                                {enrolledCourses.find(course => course.id === payment.CourseID) && (
                                  <button
                                    onClick={() => handlePrintCourse(enrolledCourses.find(course => course.id === payment.CourseID))}
                                    className="text-green-600 hover:text-green-900 transition-colors bg-green-50 hover:bg-green-100 p-2 rounded-md"
                                    title="In chi tiết"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                  </button>
                                )}
                              </>
                            )}
                            {isCancelled && (
                              <button
                                onClick={() => deletePayment(payment.TransactionID)}
                                disabled={loading || processingPaymentId === payment.TransactionID}
                                className={`text-red-600 hover:text-red-900 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md ml-2 flex items-center gap-1 ${(loading || processingPaymentId === payment.TransactionID) ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                {processingPaymentId === payment.TransactionID ? (
                                  <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                                Xóa
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory; 