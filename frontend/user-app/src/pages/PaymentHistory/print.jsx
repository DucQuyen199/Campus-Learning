import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import courseApi from '@/api/courseApi';
import { toast } from 'react-toastify';
import html2pdf from 'html2pdf.js';

const CoursePrint = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [printData, setPrintData] = useState(null);
  
  const courseData = location.state?.courseData;

  useEffect(() => {
    if (!courseData || !courseData.id) {
      setError('Không tìm thấy dữ liệu khóa học');
      setLoading(false);
      return;
    }

    const fetchPrintDetails = async () => {
      try {
        setLoading(true);
        console.log(`Fetching print details for course ID: ${courseData.id}`);
        
        const response = await courseApi.getCoursePrintDetails(courseData.id);
        
        if (response.data && response.data.success) {
          setPrintData(response.data.data);
        } else {
          setError('Không thể tải thông tin chi tiết khóa học');
        }
      } catch (error) {
        console.error('Error fetching course print details:', error);
        
        // Enhanced error handling
        if (error.response) {
          // Server responded with an error status
          if (error.response.status === 404) {
            setError(`Khóa học không tồn tại hoặc đã bị xóa`);
          } else if (error.response.status === 403) {
            setError('Bạn chưa đăng ký khóa học này');
          } else {
            setError(`Lỗi máy chủ: ${error.response.data?.message || 'Không xác định'}`);
          }
        } else if (error.request) {
          // Request was made but no response received
          setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối của bạn.');
        } else {
          // Error setting up the request
          setError('Đã xảy ra lỗi khi tải thông tin khóa học');
        }
        
        toast.error('Không thể tải thông tin chi tiết khóa học');
      } finally {
        setLoading(false);
      }
    };

    fetchPrintDetails();
  }, [courseData]);

  // Format date function
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

  // Format price
  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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

  // Get level text
  const getLevelText = (level) => {
    switch(level) {
      case 'beginner': return 'Cơ bản';
      case 'intermediate': return 'Trung cấp';
      case 'advanced': return 'Nâng cao';
      case 'expert': return 'Chuyên sâu';
      default: return 'Không xác định';
    }
  };

  // Handle PDF generation and download
  const handlePrint = () => {
    // Get only the print content to generate PDF
    const element = document.querySelector('.print-content');
    
    if (!element) {
      toast.error('Không thể tạo PDF. Vui lòng thử lại sau.');
      return;
    }
    
    // Show loading toast
    toast.info('Đang tạo PDF. Vui lòng đợi...');
    
    // Configure PDF options
    const options = {
      margin: [15, 15, 15, 15],
      filename: `KhoaHoc_${printData?.courseDetails?.title || 'ChiTiet'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      }
    };

    // Generate and download PDF
    html2pdf()
      .set(options)
      .from(element)
      .save()
      .then(() => {
        toast.success('Tạo PDF thành công!');
      })
      .catch(err => {
        console.error('Error generating PDF:', err);
        toast.error('Có lỗi xảy ra khi tạo PDF.');
      });
  };

  // Handle back
  const handleBack = () => {
    navigate('/payment-history');
  };

  // Render loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải thông tin khóa học...</p>
      </div>
    );
  }

  // Render error state
  if (error || !printData) {
    return (
      <div className="print-error">
        <h1>Không thể tải thông tin khóa học</h1>
        <p>{error || 'Vui lòng quay lại và thử lại.'}</p>
        <button onClick={handleBack} className="back-button">Quay lại</button>
      </div>
    );
  }

  const { courseDetails, enrollmentDetails, courseStats, paymentInfo } = printData;

  return (
    <div className="course-print-container">
      <style dangerouslySetInnerHTML={{ __html: `
        body {
          font-family: 'Roboto', Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          line-height: 1.6;
          background-color: #f5f7fa;
        }
        
        .course-print-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f7fa;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 4px solid #3498db;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .print-error {
          text-align: center;
          padding: 40px;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .back-button, .print-button, .close-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          margin: 10px;
          transition: all 0.3s ease;
        }
        
        .back-button {
          background-color: #6b7280;
          color: white;
        }
        
        .back-button:hover {
          background-color: #4b5563;
        }
        
        .print-button {
          background-color: #2563eb;
          color: white;
        }
        
        .print-button:hover {
          background-color: #1d4ed8;
        }
        
        .close-button {
          background-color: #6b7280;
          color: white;
        }
        
        .close-button:hover {
          background-color: #4b5563;
        }
        
        .print-controls {
          text-align: center;
          margin-top: 30px;
        }
        
        /* New two-column layout styles */
        .print-content {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          position: relative;
        }
        
        .document-header {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          padding: 25px 40px;
          text-align: center;
          position: relative;
        }
        
        .logo {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .document-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        
        .print-date {
          font-size: 14px;
          opacity: 0.8;
        }
        
        .two-column-layout {
          display: grid;
          grid-template-columns: 35% 65%;
          min-height: 800px;
        }
        
        .left-column {
          background-color: #f8fafc;
          padding: 30px;
          border-right: 1px solid #e5e7eb;
        }
        
        .right-column {
          padding: 30px;
          background-color: white;
        }
        
        .course-image-container {
          margin-bottom: 25px;
          text-align: center;
        }
        
        .course-image {
          width: 100%;
          max-height: 220px;
          object-fit: cover;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        .course-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 15px;
          line-height: 1.3;
        }
        
        .meta-section {
          margin-bottom: 25px;
        }
        
        .meta-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .meta-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px dashed #e5e7eb;
        }
        
        .meta-item:last-child {
          border-bottom: none;
        }
        
        .meta-label {
          font-weight: 600;
          color: #4b5563;
        }
        
        .meta-value {
          color: #1e293b;
          text-align: right;
        }
        
        .payment-info {
          background-color: #f0f9ff;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 25px;
        }
        
        .payment-title {
          font-size: 16px;
          font-weight: 700;
          color: #0369a1;
          margin-bottom: 15px;
        }
        
        .payment-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .payment-label {
          font-weight: 600;
          color: #4b5563;
        }
        
        .payment-value {
          color: #1e293b;
          text-align: right;
        }
        
        .amount {
          font-weight: 700;
          color: #0369a1;
        }
        
        .course-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .stat-item {
          background-color: #f8fafc;
          border-radius: 10px;
          padding: 15px;
          text-align: center;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #6b7280;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .section-content {
          margin-bottom: 30px;
        }
        
        .description-text {
          color: #4b5563;
          line-height: 1.7;
        }
        
        .list-section {
          margin-bottom: 30px;
        }
        
        .list-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 15px;
        }
        
        .requirements-list, .objectives-list {
          list-style-type: none;
          padding-left: 0;
          margin-bottom: 20px;
        }
        
        .requirements-list li, .objectives-list li {
          position: relative;
          padding-left: 25px;
          margin-bottom: 10px;
          color: #4b5563;
        }
        
        .requirements-list li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #2563eb;
          font-weight: bold;
          font-size: 18px;
        }
        
        .objectives-list li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
        }
        
        .certificate-section {
          background-color: #f0fdf4;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 25px;
          position: relative;
        }
        
        .certificate-title {
          font-size: 18px;
          font-weight: 600;
          color: #166534;
          margin-bottom: 10px;
        }
        
        .certificate-text {
          color: #4b5563;
        }
        
        .stamp {
          position: absolute;
          top: 15px;
          right: 15px;
          transform: rotate(-15deg);
        }
        
        .stamp-content {
          border: 2px solid #2563eb;
          color: #2563eb;
          border-radius: 5px;
          padding: 8px 15px;
          font-weight: 600;
          font-size: 14px;
          opacity: 0.8;
        }
        
        .document-footer {
          text-align: center;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        
        .footer-text {
          margin-bottom: 5px;
        }
        
        .contact-info {
          font-weight: 500;
        }
        
        /* Watermark */
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 100px;
          font-weight: 700;
          color: rgba(37, 99, 235, 0.04);
          white-space: nowrap;
          z-index: 0;
          pointer-events: none;
          user-select: none;
        }
        
        /* PDF generation styles */
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background-color: white;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .course-print-container {
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 0;
            background-color: white;
          }
          
          .print-content {
            border-radius: 0;
            box-shadow: none;
          }
          
          .no-print,
          .print-controls,
          nav,
          header,
          footer:not(.document-footer) {
            display: none !important;
          }
          
          .two-column-layout {
            min-height: auto;
          }
          
          .left-column,
          .right-column {
            page-break-inside: avoid;
          }
          
          .section-content {
            page-break-inside: avoid;
          }
          
          .document-footer {
            position: fixed;
            bottom: 0;
            width: 100%;
          }
        }
      `}} />
      
      <div className="print-content">
        <div className="document-header">
          <div className="logo">CampusLearning Learning</div>
          <div className="document-title">Chi tiết khóa học đã đăng ký</div>
          <div className="print-date">Ngày in: {formatDate(new Date())}</div>
        </div>
        
        {/* Watermark */}
        <div className="watermark">CampusLearning Learning</div>
        
        <div className="two-column-layout">
          {/* Left Column */}
          <div className="left-column">
            {/* Course Image */}
            {(courseDetails.imageUrl || courseDetails.courseThumbnail) && (
              <div className="course-image-container">
                <img 
                  src={courseDetails.imageUrl || courseDetails.courseThumbnail} 
                  alt={courseDetails.title}
                  className="course-image"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            
            <h2 className="course-title">{courseDetails.title}</h2>
            
            {/* Course Meta Information */}
            <div className="meta-section">
              <div className="meta-title">Thông tin khóa học</div>
              <div className="meta-item">
                <div className="meta-label">Cấp độ:</div>
                <div className="meta-value">{getLevelText(courseDetails.level)}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Danh mục:</div>
                <div className="meta-value">{courseDetails.category}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Thời lượng:</div>
                <div className="meta-value">{Math.floor(courseDetails.duration / 60)} giờ {courseDetails.duration % 60} phút</div>
              </div>
            </div>
            
            {/* Enrollment Information */}
            <div className="meta-section">
              <div className="meta-title">Thông tin đăng ký</div>
              <div className="meta-item">
                <div className="meta-label">Ngày đăng ký:</div>
                <div className="meta-value">{formatDate(enrollmentDetails.enrolledAt)}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Tiến độ học tập:</div>
                <div className="meta-value">{enrollmentDetails.progress || 0}%</div>
              </div>
              {enrollmentDetails.completedAt && (
                <div className="meta-item">
                  <div className="meta-label">Ngày hoàn thành:</div>
                  <div className="meta-value">{formatDate(enrollmentDetails.completedAt)}</div>
                </div>
              )}
            </div>
            
            {/* Payment Information */}
            {paymentInfo && (
              <div className="payment-info">
                <div className="payment-title">Thông tin thanh toán</div>
                <div className="payment-item">
                  <div className="payment-label">Phương thức:</div>
                  <div className="payment-value">{getPaymentMethodText(paymentInfo.method)}</div>
                </div>
                <div className="payment-item">
                  <div className="payment-label">Ngày thanh toán:</div>
                  <div className="payment-value">{formatDate(paymentInfo.date)}</div>
                </div>
                <div className="payment-item">
                  <div className="payment-label">Mã giao dịch:</div>
                  <div className="payment-value">{paymentInfo.transactionCode}</div>
                </div>
                <div className="payment-item">
                  <div className="payment-label">Số tiền:</div>
                  <div className="payment-value amount">{formatCurrency(paymentInfo.amount)}</div>
                </div>
              </div>
            )}
            
            {/* Course Stats */}
            <div className="course-stats">
              <div className="stat-item">
                <div className="stat-value">{courseStats.moduleCount}</div>
                <div className="stat-label">Chương học</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{courseStats.lessonCount}</div>
                <div className="stat-label">Bài học</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{courseStats.completedLessons}</div>
                <div className="stat-label">Bài đã học</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{enrollmentDetails.progress || 0}%</div>
                <div className="stat-label">Tiến độ</div>
              </div>
            </div>
            
            {/* Certificate Section */}
            <div className="certificate-section">
              <div className="certificate-title">Chứng nhận</div>
              <div className="certificate-text">
                Học viên sẽ nhận được chứng nhận hoàn thành khóa học sau khi hoàn thành 100% nội dung.
              </div>
              <div className="stamp">
                <div className="stamp-content">Đã xác nhận</div>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="right-column">
            {/* Course Description */}
            <div className="section-content">
              <h3 className="section-title">Mô tả khóa học</h3>
              <div className="description-text">
                {courseDetails.description}
              </div>
            </div>
            
            {/* Requirements */}
            {courseDetails.requirements && courseDetails.requirements.length > 0 && (
              <div className="list-section">
                <h3 className="list-title">Yêu cầu</h3>
                <ul className="requirements-list">
                  {courseDetails.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Objectives */}
            {courseDetails.objectives && courseDetails.objectives.length > 0 && (
              <div className="list-section">
                <h3 className="list-title">Mục tiêu khóa học</h3>
                <ul className="objectives-list">
                  {courseDetails.objectives.map((obj, index) => (
                    <li key={index}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Additional Information */}
            <div className="section-content">
              <h3 className="section-title">Thông tin bổ sung</h3>
              <div className="description-text">
                <p>Khóa học này được thiết kế để cung cấp cho học viên kiến thức và kỹ năng cần thiết để thành công trong lĩnh vực này. Với nội dung được cập nhật thường xuyên và sự hỗ trợ từ đội ngũ giảng viên giàu kinh nghiệm, chúng tôi cam kết mang đến trải nghiệm học tập hiệu quả nhất cho bạn.</p>
                <p>Học viên sẽ được tham gia vào các hoạt động thực hành, thảo luận nhóm và nhận được phản hồi chi tiết để không ngừng cải thiện kỹ năng của mình.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="document-footer">
          <div className="footer-text">CampusLearning Learning - Nền tảng học trực tuyến hàng đầu</div>
          <div className="contact-info">Mọi thắc mắc xin liên hệ: support@CampusLearning.com | Hotline: 0123456789</div>
        </div>
      </div>
      
      <div className="no-print print-controls">
        <button onClick={handlePrint} className="print-button">In ngay</button>
        <button onClick={handleBack} className="back-button">Quay lại</button>
      </div>
    </div>
  );
};

export default CoursePrint;
