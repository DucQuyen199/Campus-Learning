const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const PaymentTransaction = require('../models/PaymentTransaction');
const PaymentHistory = require('../models/PaymentHistory');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const axios = require('axios');
const querystring = require('querystring');
const { pool, sql } = require('../config/db');
const { sequelize } = require('../config/db');
const jwt = require('jsonwebtoken');
const paypalClient = require('../utils/paypalClient');
const { formatDateForSqlServer, createSqlServerDate } = require('../utils/dateHelpers');
const LessonProgress = require('../models/LessonProgress');

// Get all published courses
exports.getAllCourses = async (req, res) => {
  try {
    console.log('Fetching all courses');
    
    // Log data from database first
    const courseCount = await Course.count({
      where: {
        IsPublished: true,
        Status: 'published',
        DeletedAt: null
      }
    });
    
    console.log(`Found ${courseCount} published courses in database`);
    
    // Nếu không có khóa học nào, trả về khóa học mẫu
    if (courseCount === 0) {
      console.log('No courses found, returning sample courses');
      const sampleCourses = [
        {
          CourseID: 1,
          Title: 'Khóa học Web cơ bản',
          Slug: 'khoa-hoc-web-co-ban',
          ShortDescription: 'Học lập trình web từ cơ bản đến nâng cao',
          Level: 'beginner',
          Category: 'Web Development',
          Duration: 1200,
          EnrolledCount: 25,
          Rating: 4.5,
          RatingCount: 10,
          Price: 0,
          DiscountPrice: null,
          ImageUrl: 'https://placehold.co/600x400?text=Web+Development',
          Instructor: {
            UserID: 1,
            FullName: 'Giảng viên mẫu',
            Image: 'https://placehold.co/100x100?text=Avatar'
          }
        },
        {
          CourseID: 2,
          Title: 'Khóa học Java',
          Slug: 'khoa-hoc-java',
          ShortDescription: 'Lập trình Java chuyên sâu',
          Level: 'intermediate',
          Category: 'Programming',
          Duration: 1800,
          EnrolledCount: 15,
          Rating: 4.2,
          RatingCount: 8,
          Price: 299000,
          DiscountPrice: 199000,
          ImageUrl: 'https://placehold.co/600x400?text=Java',
          Instructor: {
            UserID: 2,
            FullName: 'Giảng viên mẫu 2',
            Image: 'https://placehold.co/100x100?text=Avatar'
          }
        }
      ];
      
      return res.status(200).json({ success: true, data: sampleCourses });
    }
    
    const courses = await Course.findAll({
      where: {
        IsPublished: true,
        Status: 'published',
        DeletedAt: null
      },
      attributes: [
        'CourseID', 'Title', 'Slug', 'ShortDescription', 
        'Level', 'Category', 'Duration', 'EnrolledCount',
        'Rating', 'Price', 'DiscountPrice', 'ImageUrl'
      ],
      include: [
        {
          model: User,
          as: 'Instructor',
          attributes: ['UserID', 'FullName', 'Image']
        }
      ]
    });

    console.log(`Retrieved ${courses.length} courses to return to client`);
    if (courses.length > 0) {
      console.log('Sample course data:', JSON.stringify(courses[0], null, 2));
    }

    return res.status(200).json({ success: true, data: courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get course details by ID or slug
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseIdentifier } = req.params;
    
    console.log(`=== COURSE DETAILS DEBUG ===`);
    console.log(`Full URL: ${req.originalUrl}`);
    console.log(`Headers:`, JSON.stringify(req.headers));
    
    if (!courseIdentifier) {
      return res.status(400).json({ 
        success: false, 
        message: 'Định danh khóa học không hợp lệ' 
      });
    }
    
    // Truy vấn database thực sự thay vì trả về dữ liệu mẫu
    let query;
    
    // Kiểm tra nếu identifier là số
    const isNumeric = /^\d+$/.test(courseIdentifier);
    
    if (isNumeric) {
      query = `
        SELECT c.*, u.FullName as InstructorName, u.FullName as InstructorTitle, u.Bio as InstructorBio, u.Image as InstructorAvatar
        FROM Courses c
        LEFT JOIN Users u ON c.InstructorID = u.UserID
        WHERE c.CourseID = @courseId AND c.IsPublished = 1 AND c.DeletedAt IS NULL
      `;
    } else {
      query = `
        SELECT c.*, u.FullName as InstructorName, u.FullName as InstructorTitle, u.Bio as InstructorBio, u.Image as InstructorAvatar
        FROM Courses c
        LEFT JOIN Users u ON c.InstructorID = u.UserID
        WHERE c.Slug = @courseSlug AND c.IsPublished = 1 AND c.DeletedAt IS NULL
      `;
    }
    
    console.log(`Executing SQL Query: ${query}`);
    console.log(`Parameters: courseId=${isNumeric ? courseIdentifier : null}, courseSlug=${isNumeric ? null : courseIdentifier}`);
    
    const result = await pool.request()
      .input('courseId', sql.BigInt, isNumeric ? courseIdentifier : null)
      .input('courseSlug', sql.NVarChar, isNumeric ? null : courseIdentifier)
      .query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy khóa học' 
      });
    }
    
    const course = result.recordset[0];
    
    // Lấy thêm thông tin modules và lessons
    const modulesResult = await pool.request()
      .input('courseId', sql.BigInt, course.CourseID)
      .query(`
        SELECT ModuleID, CourseID, Title, Description, 
               OrderIndex, Duration, IsPublished,
               CreatedAt, UpdatedAt, VideoUrl, 
               ImageUrl, PracticalGuide, Objectives,
               Requirements, Materials, DraftData,
               LastDraftSavedAt, IsDraft
        FROM CourseModules
        WHERE CourseID = @courseId
        ORDER BY OrderIndex
      `);
    
    const lessonsResult = await pool.request()
      .input('courseId', sql.BigInt, course.CourseID)
      .query(`
        SELECT l.LessonID, l.ModuleID, l.Title, l.Description, 
               l.Type, l.Content, l.VideoUrl, 
               l.Duration, l.OrderIndex, l.IsPreview,
               l.IsPublished, l.CreatedAt, l.UpdatedAt
        FROM CourseLessons l
        JOIN CourseModules m ON l.ModuleID = m.ModuleID
        WHERE m.CourseID = @courseId
        ORDER BY m.OrderIndex, l.OrderIndex
      `);
    
    // Tạo cấu trúc dữ liệu đúng
    const modules = modulesResult.recordset.map(module => {
      const moduleLessons = lessonsResult.recordset
        .filter(lesson => lesson.ModuleID === module.ModuleID)
        .map(lesson => ({
          ...lesson,
          // Chỉ hiển thị URL video cho các bài học preview
          VideoUrl: lesson.IsPreview ? lesson.VideoUrl : null
        }));
      
      return {
        ...module,
        Lessons: moduleLessons
      };
    });
    
    // Format instructor data
    const instructor = {
      Name: course.InstructorName || '',
      Title: course.InstructorTitle || '',
      Bio: course.InstructorBio || '',
      AvatarUrl: course.InstructorAvatar || null
    };
    
    // Định dạng kết quả trả về
    const formattedCourse = {
      ...course,
      Modules: modules,
      Instructor: instructor
    };
    
    // Xóa các trường không cần thiết
    delete formattedCourse.InstructorName;
    delete formattedCourse.InstructorTitle;
    delete formattedCourse.InstructorBio;
    delete formattedCourse.InstructorAvatar;
    
    return res.status(200).json({
      success: true,
      data: formattedCourse
    });
    
  } catch (error) {
    console.error('Error fetching course details:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin khóa học',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check if user is enrolled in a course
exports.checkEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    console.log(`Checking enrollment for courseId: ${courseId}, userId: ${userId}`);

    // Đối với khóa học mẫu, luôn cho phép kiểm tra enrollment
    if (courseId === '1' || courseId === '2') {
      console.log('Demo course: Returning enrollment status');
      
      // Giả lập trạng thái đã đăng ký cho khóa học 1, chưa đăng ký cho khóa học 2
      const isEnrolled = courseId === '1';
      
      // Tạo dữ liệu enrollment mẫu nếu đã đăng ký
      const enrollmentData = isEnrolled ? {
        EnrollmentID: 1,
        CourseID: parseInt(courseId),
        UserID: userId,
        Progress: 30,
        Status: 'active',
        EnrolledAt: new Date().toISOString()
      } : null;
      
      return res.status(200).json({ 
        success: true, 
        isEnrolled,
        enrollmentData
      });
    }

    const enrollment = await CourseEnrollment.findOne({
      where: {
        CourseID: courseId,
        UserID: userId
      }
    });

    console.log(`Enrollment found: ${!!enrollment}`);
    return res.status(200).json({ 
      success: true, 
      isEnrolled: !!enrollment,
      enrollmentData: enrollment || null
    });
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Enroll in a free course
exports.enrollFreeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    console.log(`Enrolling user ${userId} in course ${courseId}`);

    // Xử lý khóa học mẫu
    if (courseId === '1' || courseId === '2') {
      console.log('Enrolling in demo course');
      
      // Loại bỏ kiểm tra khóa học có phí - cho phép đăng ký khóa học ID 2
      // Tạo dữ liệu enrollment mẫu
      const enrollment = await CourseEnrollment.create({
        CourseID: parseInt(courseId),
        UserID: userId,
        Status: 'active',
        Progress: 0,
        CertificateIssued: false
      });
      
      // Tạo dữ liệu payment mẫu
      const payment = await PaymentTransaction.create({
        UserID: userId,
        CourseID: parseInt(courseId),
        Amount: 0,
        PaymentMethod: 'free',
        TransactionCode: `FREE-${uuidv4()}`,
        PaymentStatus: 'completed',
        PaymentDetails: JSON.stringify({ 
          method: 'free',
          note: 'Automatic enrollment for free course'
        })
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Successfully enrolled in demo course', 
        data: { enrollment, payment } 
      });
    }

    // Check if course exists and is free
    const course = await Course.findOne({
      where: {
        CourseID: courseId,
        IsPublished: true,
        Status: 'published',
        Price: 0
      }
    });

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found or is not free' 
      });
    }

    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      where: {
        CourseID: courseId,
        UserID: userId
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already enrolled in this course' 
      });
    }

    // Create enrollment record
    const enrollment = await CourseEnrollment.create({
      CourseID: courseId,
      UserID: userId,
      Status: 'active',
      Progress: 0,
      CertificateIssued: false
    });

    // Create payment record for free course
    const payment = await PaymentTransaction.create({
      UserID: userId,
      CourseID: courseId,
      Amount: 0,
      PaymentMethod: 'free',
      TransactionCode: `FREE-${uuidv4()}`,
      PaymentStatus: 'completed',
      PaymentDetails: JSON.stringify({ 
        method: 'free',
        note: 'Automatic enrollment for free course'
      })
    });

    // Update course enrollment count
    await Course.update(
      { EnrolledCount: course.EnrolledCount + 1 },
      { where: { CourseID: courseId }}
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Successfully enrolled in course', 
      data: { enrollment, payment } 
    });
  } catch (error) {
    console.error('Error enrolling in free course:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create VNPAY payment URL
exports.createPaymentUrl = async (req, res) => {
  try {
    console.log('Creating VNPay payment URL, params:', req.params);
    const { courseId } = req.params;
    const userId = req.user.id;
    
    // Validate input
    if (!courseId) {
      console.error('Missing courseId in request params');
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }
    
    if (!userId) {
      console.error('User ID not found in request');
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }
    
    // Get course details
    const course = await Course.findOne({
      where: {
        CourseID: courseId,
        IsPublished: true,
        Status: 'published'
      }
    });

    if (!course) {
      console.error(`Course not found with ID: ${courseId}`);
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      where: {
        CourseID: courseId,
        UserID: userId
      }
    });

    if (existingEnrollment) {
      console.log(`User ${userId} already enrolled in course ${courseId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'You are already enrolled in this course' 
      });
    }

    // Determine payment amount (use discount price if available)
    let amount = course.DiscountPrice || course.Price;
    
    if (amount <= 0) {
      console.log(`Course ${courseId} is free, should use free enrollment endpoint`);
      return res.status(400).json({ 
        success: false, 
        message: 'Free courses should use the free enrollment endpoint' 
      });
    }

    // Đảm bảo amount là số, lấy từ dữ liệu khóa học
    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid course price' 
      });
    }
    
    console.log('Course price:', amount);

    // Format dates as ISO strings for database compatibility
    const currentTime = new Date();
    const createdAtStr = currentTime.toISOString();
    const updatedAtStr = createdAtStr;

    // Create a pending transaction
    const transaction = await PaymentTransaction.create({
      UserID: userId,
      CourseID: courseId,
      Amount: amount,
      PaymentMethod: 'vnpay',
      TransactionCode: `VNP${Date.now()}`,
      PaymentStatus: 'pending',
      CreatedAt: createdAtStr,
      UpdatedAt: updatedAtStr
    });

    console.log(`Created transaction: ${transaction.TransactionID} for course ${courseId}`);

    // Record in payment history
    await PaymentHistory.create({
      TransactionID: transaction.TransactionID,
      Status: 'initiated',
      Message: 'Payment initiated',
      IPAddress: req.ip,
      UserAgent: req.headers['user-agent'],
      CreatedAt: createdAtStr
    });

    // Validate VNPay configuration
    if (!process.env.VNP_TMN_CODE || !process.env.VNP_HASH_SECRET || !process.env.VNP_URL) {
      console.error('Missing VNPay configuration');
      console.log('VNP_TMN_CODE:', process.env.VNP_TMN_CODE);
      console.log('VNP_HASH_SECRET:', process.env.VNP_HASH_SECRET ? '[Set]' : '[Not set]');
      console.log('VNP_URL:', process.env.VNP_URL);
      
      // Update transaction to failed
      await PaymentTransaction.update({
        PaymentStatus: 'failed',
        PaymentDetails: JSON.stringify({ error: 'Missing VNPay configuration' }),
        UpdatedAt: new Date().toISOString()
      }, {
        where: { TransactionID: transaction.TransactionID }
      });
      
      return res.status(500).json({ 
        success: false, 
        message: 'Payment service configuration error' 
      });
    }

    // Create VNPAY payment URL
    try {
      const vnpUrl = createVnpayUrl(transaction, req.headers.origin, req.ip);
      console.log(`Generated VNPay URL for transaction ${transaction.TransactionID}`);
      
      return res.status(200).json({
        success: true,
        paymentUrl: vnpUrl,
        transactionId: transaction.TransactionID
      });
    } catch (vnpError) {
      console.error('Error creating VNPay URL:', vnpError);
      
      // Update transaction to failed
      await PaymentTransaction.update({
        PaymentStatus: 'failed',
        PaymentDetails: JSON.stringify({ error: vnpError.message }),
        UpdatedAt: new Date().toISOString()
      }, {
        where: { TransactionID: transaction.TransactionID }
      });
      
      return res.status(500).json({ 
        success: false, 
        message: 'Error creating payment URL',
        error: process.env.NODE_ENV === 'development' ? vnpError.message : undefined 
      });
    }
  } catch (error) {
    console.error('Error creating payment URL:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create VNPAY payment URL helper function
function createVnpayUrl(transaction, originUrl, ipAddr) {
  // Đảm bảo định dạng ngày tháng đúng theo quy định của VNPay
  // Format: yyyyMMddHHmmss
  const date = new Date();
  const createDate = date.getFullYear().toString() +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    ('0' + date.getDate()).slice(-2) +
    ('0' + date.getHours()).slice(-2) +
    ('0' + date.getMinutes()).slice(-2) +
    ('0' + date.getSeconds()).slice(-2);
  
  console.log('Formatted date for VNPay:', createDate);
  
  // Read from environment variables
  const vnpTmnCode = process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET;
  const vnpUrl = process.env.VNP_URL;
  
  // Make sure we have the required config
  if (!vnpTmnCode || !secretKey || !vnpUrl) {
    throw new Error('Missing VNPay configuration');
  }
  
  // Kiểm tra Terminal ID (vnp_TmnCode)
  if (vnpTmnCode.length < 4 || vnpTmnCode.length > 16) {
    throw new Error('Terminal ID (vnp_TmnCode) is invalid. Must be 4-16 characters');
  }
  
  // Xác định URL trả về
  let returnUrl = process.env.VNP_RETURN_URL;
  if (!returnUrl) {
    if (!originUrl) {
      throw new Error('Missing origin URL and VNP_RETURN_URL'); 
    }
    returnUrl = `${originUrl}/payment/vnpay/callback`;
  }
  
  // Đảm bảo URL trả về hợp lệ
  if (!returnUrl.startsWith('http://') && !returnUrl.startsWith('https://')) {
    console.warn('Warning: Return URL should start with http:// or https://');
  }
  
  // Tạo thông tin mô tả đơn hàng
  const orderInfo = `Thanh toán khóa học: ${transaction.CourseID}`;
  
  // Đảm bảo amount là số nguyên và được chuyển đổi đúng cách
  let amount = 0;
  
  if (typeof transaction.Amount === 'string') {
    // Nếu là chuỗi, chuyển đổi sang số
    amount = Math.round(parseFloat(transaction.Amount) * 100);
  } else if (typeof transaction.Amount === 'number') {
    // Nếu là số, chỉ cần nhân với 100 và làm tròn
    amount = Math.round(transaction.Amount * 100);
  } else {
    console.error('Invalid amount format:', transaction.Amount, 'type:', typeof transaction.Amount);
    amount = 0; // Giá trị mặc định nếu không hợp lệ
  }
  
  // Đảm bảo amount là số nguyên dương
  if (isNaN(amount) || amount <= 0) {
    throw new Error(`Invalid amount: ${transaction.Amount}`);
  }
  
  console.log('Processing amount:', transaction.Amount, 'Converted to:', amount);
  
  // Mã ngân hàng (để trống cho phép người dùng chọn ngân hàng trên trang VNPay)
  const bankCode = ''; 
  
  // Ngôn ngữ hiển thị trên trang thanh toán VNPay
  const locale = 'vn';
  
  // Mã đơn hàng
  const txnRef = transaction.TransactionCode;
  if (!txnRef || txnRef.length < 1 || txnRef.length > 100) {
    throw new Error('TransactionCode is invalid. Must be 1-100 characters');
  }
  
  // Create VNPay payment request parameters
  const vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnpTmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'billpayment',
    vnp_Amount: amount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate
  };
  
  // Thêm mã ngân hàng nếu được chỉ định
  if (bankCode !== '') {
    vnpParams.vnp_BankCode = bankCode;
  }
  
  // Sắp xếp các tham số theo thứ tự ABC để tính toán chữ ký
  const sortedParams = sortObject(vnpParams);
  
  // Ký request với HMAC SHA512
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
  // Thêm chữ ký vào tham số
  sortedParams.vnp_SecureHash = signed;
  
  // Log thông tin lần cuối trước khi gửi
  console.log('VNPay payment parameters:', JSON.stringify(sortedParams));
  
  // Tạo URL đầy đủ với tham số
  const paymentUrl = `${vnpUrl}?${querystring.stringify(sortedParams, { encode: false })}`;
  console.log('Final VNPay URL:', paymentUrl);
  
  return paymentUrl;
}

// Helper function to sort object by key
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  
  return sorted;
}

// Handle VNPAY payment callback
exports.paymentCallback = async (req, res) => {
  try {
    const vnpParams = req.query;
    const secureHash = vnpParams.vnp_SecureHash;
    
    console.log('VNPay callback received:', vnpParams);
    
    // Remove hash from params for verification
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;
    
    // Sort params
    const sortedParams = sortObject(vnpParams);
    
    // Check signature
    const secretKey = process.env.VNP_HASH_SECRET;
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    // Check if signature is valid
    if (secureHash === signed) {
      const transactionId = vnpParams.vnp_TxnRef;
      const transactionStatus = vnpParams.vnp_TransactionStatus;
      const amount = vnpParams.vnp_Amount / 100; // VNPay trả về số tiền * 100
      
      // Tìm transaction trong database
      const transaction = await PaymentTransaction.findOne({
        where: { TransactionID: transactionId }
      });

      if (!transaction) {
        console.error('Transaction not found:', transactionId);
        // Redirect về trang lỗi
        return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=error&message=Transaction_not_found`);
      }

      // Cập nhật trạng thái transaction
      if (transactionStatus === '00') {
        // Thanh toán thành công
        await PaymentTransaction.update(
          {
            PaymentStatus: 'completed',
            UpdatedAt: new Date()
          },
          {
            where: { TransactionID: transactionId }
          }
        );

        // Cập nhật lịch sử thanh toán
        await PaymentHistory.update(
          {
            Status: 'completed',
            Notes: 'Payment completed successfully',
            UpdatedAt: new Date()
          },
          {
            where: { TransactionID: transactionId }
          }
        );

        // Kiểm tra xem người dùng đã đăng ký khóa học này chưa
        const existingEnrollment = await CourseEnrollment.findOne({
          where: {
            UserID: transaction.UserID,
            CourseID: transaction.CourseID
          }
        });

        // Nếu chưa đăng ký, tạo mới enrollment
        if (!existingEnrollment) {
          await CourseEnrollment.create({
            UserID: transaction.UserID,
            CourseID: transaction.CourseID,
            Status: 'active',
            Progress: 0,
            LastAccessedAt: new Date(),
            CreatedAt: new Date(),
            UpdatedAt: new Date()
          });

          // Cập nhật số lượng học viên đã đăng ký cho khóa học
          await Course.increment('EnrolledCount', {
            by: 1,
            where: { CourseID: transaction.CourseID }
          });
        } else if (existingEnrollment.Status !== 'active') {
          // Nếu đã có enrollment nhưng không active, cập nhật thành active
          existingEnrollment.Status = 'active';
          existingEnrollment.UpdatedAt = new Date();
          await existingEnrollment.save();
        }

        // Redirect về trang thông báo thành công
        return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=success&courseId=${transaction.CourseID}&transactionId=${transactionId}`);
      } else {
        // Thanh toán thất bại
        await PaymentTransaction.update(
          {
            PaymentStatus: 'failed',
            UpdatedAt: new Date()
          },
          {
            where: { TransactionID: transactionId }
          }
        );

        // Cập nhật lịch sử thanh toán
        await PaymentHistory.update(
          {
            Status: 'failed',
            Notes: `Payment failed with status: ${transactionStatus}`,
            UpdatedAt: new Date()
          },
          {
            where: { TransactionID: transactionId }
          }
        );

        // Redirect về trang thông báo thất bại
        return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=error&message=Payment_failed&code=${transactionStatus}`);
      }
    } else {
      // Mã xác thực không hợp lệ
      console.error('Invalid secure hash');
      return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=error&message=Invalid_signature`);
    }
  } catch (error) {
    console.error('Error in payment callback:', error);
    return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=error&message=Server_error`);
  }
};

// Get user's enrolled courses
exports.getUserEnrollments = async (req, res) => {
  try {
    // Handle different ways user ID might be stored based on authentication middleware
    const userId = req.user.id || req.user.userId || req.user.UserID;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID not found in request' 
      });
    }
    
    console.log(`Fetching enrollments for user ID: ${userId}`);
    
    // Use a simpler query without complex associations to avoid SQL errors
    const enrollments = await CourseEnrollment.findAll({
      where: {
        UserID: userId,
        Status: 'active'
      },
      attributes: ['EnrollmentID', 'CourseID', 'UserID', 'Status', 'Progress', 'EnrolledAt', 'CompletedAt', 'LastAccessedLessonID']
    });
    
    // Get course IDs from enrollments
    let courseIds = enrollments.map(enrollment => enrollment.CourseID);
    
    // Get successful payment transactions even if enrollment doesn't exist yet
    const completedTransactions = await PaymentTransaction.findAll({
      where: {
        UserID: userId,
        PaymentStatus: 'completed'
      }
    });
    
    // Extract course IDs from completed payments
    completedTransactions.forEach(transaction => {
      if (transaction.CourseID && !courseIds.includes(transaction.CourseID)) {
        courseIds.push(transaction.CourseID);
        
        // Create enrollment if it doesn't exist yet
        CourseEnrollment.findOrCreate({
          where: {
            UserID: userId,
            CourseID: transaction.CourseID
          },
          defaults: {
            Status: 'active',
            Progress: 0,
            EnrolledAt: new Date().toISOString(),
            CreatedAt: new Date(),
            UpdatedAt: new Date()
          }
        }).then(([enrollment, created]) => {
          if (created) {
            console.log(`Created missing enrollment for user ${userId}, course ${transaction.CourseID}`);
          } else if (enrollment.Status !== 'active') {
            enrollment.Status = 'active';
            enrollment.UpdatedAt = new Date();
            enrollment.save();
          }
        }).catch(err => {
          console.error(`Error creating enrollment for paid course: ${err.message}`);
        });
      }
    });
    
    // Fetch courses in a separate query
    const courses = courseIds.length > 0 ? await Course.findAll({
      where: {
        CourseID: courseIds,
        IsPublished: true
      }
    }) : [];
    
    // Create a map of courses by ID for easy lookup
    const courseMap = {};
    courses.forEach(course => {
      courseMap[course.CourseID] = course;
    });
    
    // Get payment transactions for these courses
    const transactions = await PaymentTransaction.findAll({
      where: {
        UserID: userId,
        CourseID: courseIds,
        PaymentStatus: 'completed'
      }
    });
    
    // Create map of payment info by course ID
    const paymentMap = {};
    transactions.forEach(transaction => {
      paymentMap[transaction.CourseID] = {
        method: transaction.PaymentMethod,
        amount: transaction.Amount,
        date: transaction.CreatedAt ? transaction.CreatedAt.toISOString() : new Date().toISOString(),
        transactionId: transaction.TransactionID
      };
    });
    
    // Transform the data for frontend, including courses with payments but no enrollment yet
    const transformedData = [];
    
    // First add data from enrollments
    enrollments.forEach(enrollment => {
      const course = courseMap[enrollment.CourseID] || {};
      const payment = paymentMap[enrollment.CourseID] || {
        method: 'free',
        amount: 0,
        date: enrollment.EnrolledAt
      };
      
      transformedData.push({
        id: course.CourseID,
        title: course.Title,
        description: course.ShortDescription,
        slug: course.Slug,
        thumbnail: course.ImageUrl,
        level: course.Level,
        duration: course.Duration,
        price: course.Price,
        discountPrice: course.DiscountPrice,
        enrolled: true,
        enrollmentId: enrollment.EnrollmentID,
        enrolledAt: enrollment.EnrolledAt,
        progress: enrollment.Progress || 0,
        lastAccessedAt: enrollment.LastAccessedLessonID,
        paymentInfo: payment
      });
    });
    
    // Add courses with payments but no enrollments yet
    completedTransactions.forEach(transaction => {
      const courseId = transaction.CourseID;
      // Only add if not already included via enrollment
      if (!transformedData.some(item => item.id === courseId)) {
        const course = courseMap[courseId] || {};
        
        transformedData.push({
          id: course.CourseID,
          title: course.Title,
          description: course.ShortDescription,
          slug: course.Slug,
          thumbnail: course.ImageUrl,
          level: course.Level,
          duration: course.Duration,
          price: course.Price,
          discountPrice: course.DiscountPrice,
          enrolled: true,
          enrollmentId: null,
          enrolledAt: transaction.CreatedAt ? transaction.CreatedAt.toISOString() : new Date().toISOString(),
          progress: 0,
          lastAccessedAt: null,
          paymentInfo: {
            method: transaction.PaymentMethod,
            amount: transaction.Amount,
            date: transaction.CreatedAt ? transaction.CreatedAt.toISOString() : new Date().toISOString(),
            transactionId: transaction.TransactionID
          }
        });
      }
    });
    
    return res.status(200).json({
      success: true,
      count: transformedData.length,
      data: transformedData
    });
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};

// Get user's payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const payments = await PaymentTransaction.findAll({
      where: {
        UserID: userId
      },
      include: [
        {
          model: Course,
          attributes: ['CourseID', 'Title', 'Slug']
        }
      ],
      order: [['CreatedAt', 'DESC']]
    });
    
    return res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark a lesson as completed and update progress
exports.saveLessonProgress = async (req, res) => {
  try {
    const lessonId = req.params.lessonId;
    const userId = req.user.id;
    
    if (!lessonId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Lesson ID and User ID are required',
      });
    }
    
    // Get the lesson to find the course module
    const lesson = await sequelize.query(
      `SELECT l.LessonID, l.ModuleID, m.CourseID
       FROM CourseLessons l
       JOIN CourseModules m ON l.ModuleID = m.ModuleID
       WHERE l.LessonID = :lessonId`,
      {
        replacements: { lessonId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!lesson || lesson.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }
    
    const courseId = lesson[0].CourseID;
    
    // Find the user's enrollment
    const enrollment = await CourseEnrollment.findOne({
      where: {
        UserID: userId,
        CourseID: courseId,
        Status: 'active'
      }
    });
    
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'User is not enrolled in this course',
      });
    }
    
    // Check if progress record exists for this lesson
    const [lessonProgress, created] = await LessonProgress.findOrCreate({
      where: {
        EnrollmentID: enrollment.EnrollmentID,
        LessonID: lessonId
      },
      defaults: {
        Status: 'completed',
        CompletedAt: new Date().toISOString(),
        TimeSpent: req.body.timeSpent || 0,
        LastPosition: req.body.lastPosition || 0
      }
    });
    
    // Update if it already exists
    if (!created) {
      lessonProgress.Status = 'completed';
      lessonProgress.CompletedAt = new Date().toISOString();
      if (req.body.timeSpent) lessonProgress.TimeSpent = req.body.timeSpent;
      if (req.body.lastPosition) lessonProgress.LastPosition = req.body.lastPosition;
      await lessonProgress.save();
    }
    
    // Update LastAccessedLessonID in enrollment
    enrollment.LastAccessedLessonID = lessonId;
    await enrollment.save();
    
    // Calculate the new progress percentage
    const totalLessons = await sequelize.query(
      `SELECT COUNT(l.LessonID) as total
       FROM CourseLessons l
       JOIN CourseModules m ON l.ModuleID = m.ModuleID
       WHERE m.CourseID = :courseId`,
      {
        replacements: { courseId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    const completedLessons = await sequelize.query(
      `SELECT COUNT(lp.ProgressID) as completed
       FROM LessonProgress lp
       JOIN CourseEnrollments ce ON lp.EnrollmentID = ce.EnrollmentID
       JOIN CourseLessons l ON lp.LessonID = l.LessonID
       JOIN CourseModules m ON l.ModuleID = m.ModuleID
       WHERE ce.UserID = :userId
       AND m.CourseID = :courseId
       AND lp.Status = 'completed'`,
      {
        replacements: { userId, courseId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    // Calculate progress percentage
    const total = totalLessons[0].total || 0;
    const completed = completedLessons[0].completed || 0;
    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Update the enrollment progress
    enrollment.Progress = progressPercentage;
    await enrollment.save();
    
    // If all lessons are completed, mark the enrollment as completed
    if (progressPercentage === 100 && enrollment.Status !== 'completed') {
      enrollment.Status = 'completed';
      enrollment.CompletedAt = new Date().toISOString();
      await enrollment.save();
    }
    
    // Get all completed lessons for this course
    const completedLessonsList = await sequelize.query(
      `SELECT l.LessonID
       FROM LessonProgress lp
       JOIN CourseEnrollments ce ON lp.EnrollmentID = ce.EnrollmentID
       JOIN CourseLessons l ON lp.LessonID = l.LessonID
       JOIN CourseModules m ON l.ModuleID = m.ModuleID
       WHERE ce.UserID = :userId
       AND m.CourseID = :courseId
       AND lp.Status = 'completed'`,
      {
        replacements: { userId, courseId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Lesson progress saved successfully',
      data: {
        lessonId: lessonId,
        status: 'completed',
        progress: progressPercentage,
        completedLessons: completedLessonsList.map(l => l.LessonID)
      }
    });
  } catch (error) {
    console.error('Error saving lesson progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get course content for learning (modules and lessons)
exports.getCourseContent = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    console.log(`Fetching course content for courseId: ${courseId}`);
    
    // Validate course ID
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
        code: 'COURSE_ID_REQUIRED'
      });
    }
    
    // Extract token without failing if not present
    let token = null;
    let userId = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('Token found in authorization header:', token.substring(0, 15) + '...');
      
      if (token) {
        try {
          // Verify token - handle different key field names
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log('Token decoded successfully:', decoded);
          
          // Extract userId from different possible fields
          userId = decoded.id || decoded.userId || decoded.UserID || decoded.sub;
          
          if (!userId) {
            console.warn('No user ID found in decoded token:', decoded);
            // Try to extract from another property if available
            if (decoded.user && typeof decoded.user === 'object') {
              userId = decoded.user.id || decoded.user.userId || decoded.user.UserID;
              console.log('Extracted user ID from user object:', userId);
            }
          } else {
            console.log(`User ${userId} requested course content for course ${courseId}`);
          }
        } catch (error) {
          // Token is invalid - respond with 401 but don't throw error
          console.warn(`Invalid token provided: ${error.message}`);
          return res.status(401).json({
            success: false,
            message: 'Không tìm thấy token xác thực',
            code: 'TOKEN_INVALID'
          });
        }
      }
    }
    
    // If no token provided or userId not extracted, check if course has preview content
    if (!userId) {
      console.log('No valid token or user ID provided, checking for preview content');
      
      // Get course preview content
      const previewContent = await getPreviewContent(courseId);
      
      if (previewContent) {
        return res.status(200).json({
          success: true,
          data: {
            ...previewContent,
            IsPreview: true
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy token xác thực',
          code: 'TOKEN_MISSING'
        });
      }
    }
    
    // If we have a valid user ID, fetch the full course content
    try {
      // First check if user is enrolled in this course
      let isEnrolled = false;
      try {
        console.log(`Checking enrollment for user ${userId} in course ${courseId}`);
        const enrollmentResult = await pool.request()
          .input('courseId', sql.BigInt, courseId)
          .input('userId', sql.BigInt, userId)
          .query(`
            SELECT EnrollmentID, CourseID, UserID, Progress, LastAccessedLessonID,
                   EnrolledAt, CompletedAt, CertificateIssued,
                   Status
            FROM CourseEnrollments
            WHERE CourseID = @courseId AND UserID = @userId AND Status = 'active'
          `);
        
        console.log(`Enrollment check result: ${enrollmentResult.recordset.length} records found`);
        isEnrolled = enrollmentResult.recordset.length > 0;
      } catch (enrollmentError) {
        console.error('Error checking enrollment:', enrollmentError);
        // Continue with preview mode on enrollment check error
        isEnrolled = false;
      }
      
      if (!isEnrolled) {
        // User is not enrolled, provide preview content
        console.log(`User ${userId} is not enrolled in course ${courseId}, showing preview content`);
        try {
          const previewContent = await getPreviewContent(courseId);
          
          if (previewContent) {
            return res.status(200).json({
              success: true,
              data: {
                ...previewContent,
                IsPreview: true
              }
            });
          } else {
            return res.status(403).json({
              success: false,
              message: 'Bạn chưa đăng ký khóa học này',
              code: 'NOT_ENROLLED'
            });
          }
        } catch (previewError) {
          console.error('Error fetching preview content:', previewError);
          return res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy dữ liệu xem trước khóa học',
            code: 'PREVIEW_ERROR'
          });
        }
      }
      
      // User is enrolled, fetch full course content
      const courseResult = await pool.request()
        .input('courseId', sql.BigInt, courseId)
        .query(`
          SELECT c.CourseID, c.Title, c.Description, c.ShortDescription, 
                 c.ImageUrl, c.VideoUrl, c.Duration, 
                 c.Level, c.Price,
                 u.FullName as InstructorName, u.FullName as InstructorTitle, 
                 u.Bio as InstructorBio, u.Image as InstructorAvatar
          FROM Courses c
          LEFT JOIN Users u ON c.InstructorID = u.UserID
          WHERE c.CourseID = @courseId AND c.IsPublished = 1
        `);
      
      if (courseResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khóa học',
          code: 'COURSE_NOT_FOUND'
        });
      }
      
      const course = courseResult.recordset[0];
      
      // Fetch modules for the course
      const modulesResult = await pool.request()
        .input('courseId', sql.BigInt, courseId)
        .query(`
          SELECT ModuleID, CourseID, Title, Description, 
                 OrderIndex, Duration, IsPublished,
                 CreatedAt, UpdatedAt, VideoUrl, 
                 ImageUrl, PracticalGuide, Objectives,
                 Requirements, Materials, DraftData,
                 LastDraftSavedAt, IsDraft
          FROM CourseModules
          WHERE CourseID = @courseId
          ORDER BY OrderIndex
        `);
      
      // Fetch all lessons for enrolled user
      const lessonsResult = await pool.request()
        .input('courseId', sql.BigInt, courseId)
        .query(`
          SELECT l.LessonID, l.ModuleID, l.Title, l.Description, 
                 l.Type, l.Content, l.VideoUrl, 
                 l.Duration, l.OrderIndex, l.IsPreview,
                 l.IsPublished, l.CreatedAt, l.UpdatedAt
          FROM CourseLessons l
          JOIN CourseModules m ON l.ModuleID = m.ModuleID
          WHERE m.CourseID = @courseId
          ORDER BY m.OrderIndex, l.OrderIndex
        `);
      
      // Get user's progress
      const progressResult = await pool.request()
        .input('userId', sql.BigInt, userId)
        .input('courseId', sql.BigInt, courseId)
        .query(`
          SELECT Progress FROM CourseEnrollments 
          WHERE UserID = @userId AND CourseID = @courseId
        `);
      
      const progress = progressResult.recordset.length > 0 ? progressResult.recordset[0].Progress : 0;
      
      // Organize data
      const modules = modulesResult.recordset.map(module => {
        const moduleLessons = lessonsResult.recordset
          .filter(lesson => lesson.ModuleID === module.ModuleID);
        
        return {
          ...module,
          Lessons: moduleLessons
        };
      });
      
      // Get the user's completed lessons
      let completedLessons = [];
      if (userId) {
        const completedResult = await pool.request()
          .input('userId', sql.BigInt, userId)
          .input('courseId', sql.BigInt, courseId)
          .query(`
            SELECT lp.LessonID
            FROM LessonProgress lp
            JOIN CourseEnrollments ce ON lp.EnrollmentID = ce.EnrollmentID
            JOIN CourseLessons l ON lp.LessonID = l.LessonID
            JOIN CourseModules m ON l.ModuleID = m.ModuleID
            WHERE ce.UserID = @userId
            AND m.CourseID = @courseId
            AND lp.Status = 'completed'
          `);
        
        completedLessons = completedResult.recordset.map(row => row.LessonID);
      }
      
      // Format instructor data
      const instructor = {
        Name: course.InstructorName || '',
        Title: course.InstructorTitle || '',
        Bio: course.InstructorBio || '',
        AvatarUrl: course.InstructorAvatar || ''
      };
      
      return res.status(200).json({
        success: true,
        data: {
          ...course,
          Modules: modules,
          Progress: progress,
          CompletedLessons: completedLessons,
          Instructor: instructor,
          IsPreview: false
        }
      });
      
    } catch (dbError) {
      console.error('Database error fetching full course content:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy dữ liệu khóa học',
        code: 'DATABASE_ERROR'
      });
    }
  } catch (error) {
    console.error('Error fetching course content:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error when fetching course content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to get preview content for a course
async function getPreviewContent(courseId) {
  try {
    console.log(`Fetching preview content for course ${courseId}`);
    
    // Fetch basic course information
    let course = null;
    try {
      const courseResult = await pool.request()
        .input('courseId', sql.BigInt, courseId)
        .query(`
          SELECT c.CourseID, c.Title, c.Description, c.ShortDescription, 
                 c.ImageUrl, c.VideoUrl, c.Duration, c.Level, c.Price,
                 u.FullName as InstructorName, u.FullName as InstructorTitle, 
                 u.Bio as InstructorBio, u.Image as InstructorAvatar
          FROM Courses c
          LEFT JOIN Users u ON c.InstructorID = u.UserID
          WHERE c.CourseID = @courseId AND c.IsPublished = 1
        `);
      
      if (courseResult.recordset.length === 0) {
        console.log(`No course found with ID ${courseId}`);
        return null;
      }
      
      course = courseResult.recordset[0];
      console.log('Preview course data found:', course.CourseID);
    } catch (courseError) {
      console.error('Error fetching course data:', courseError);
      // Create a fallback course object with default values
      course = {
        CourseID: parseInt(courseId),
        Title: "Sample Course",
        Description: "This is a fallback course due to a database error",
        ShortDescription: "Fallback course",
        ImageUrl: "https://via.placeholder.com/800x400?text=Course+Image",
        VideoUrl: null,
        Duration: 0,
        Level: 'beginner',
        Price: 0,
        InstructorName: 'Instructor',
        InstructorTitle: 'Instructor',
        InstructorBio: '',
        InstructorAvatar: null
      };
    }
    
    // Fetch modules for the course
    let modules = [];
    try {
      const modulesResult = await pool.request()
        .input('courseId', sql.BigInt, courseId)
        .query(`
          SELECT ModuleID, CourseID, Title, Description, 
                 OrderIndex, Duration, IsPublished,
                 CreatedAt, UpdatedAt, VideoUrl, 
                 ImageUrl, PracticalGuide, Objectives,
                 Requirements, Materials, DraftData,
                 LastDraftSavedAt, IsDraft
          FROM CourseModules
          WHERE CourseID = @courseId
          ORDER BY OrderIndex
        `);
      
      // Fetch preview lessons (3 lessons per module)
      const lessonsResult = await pool.request()
        .input('courseId', sql.BigInt, courseId)
        .query(`
          SELECT l.LessonID, l.ModuleID, l.Title, l.Description, 
                 l.Type, l.Content, l.VideoUrl, 
                 l.Duration, l.OrderIndex, l.IsPreview,
                 l.IsPublished, l.CreatedAt, l.UpdatedAt
          FROM CourseLessons l
          JOIN CourseModules m ON l.ModuleID = m.ModuleID
          WHERE m.CourseID = @courseId AND (l.IsPreview = 1 OR l.OrderIndex <= 3)
          ORDER BY m.OrderIndex, l.OrderIndex
        `);
      
      // Organize data - ensure field names are correct
      modules = modulesResult.recordset.map(module => {
        const moduleLessons = lessonsResult.recordset
          .filter(lesson => lesson.ModuleID === module.ModuleID)
          .map(lesson => ({
            ...lesson,
            IsPreview: true // Mark all included lessons as preview
          }));
        
        return {
          ...module,
          Lessons: moduleLessons
        };
      });
    } catch (modulesError) {
      console.error('Error fetching modules and lessons:', modulesError);
      // Create fallback module and lesson data
      modules = [{
        ModuleID: 1,
        CourseID: parseInt(courseId),
        Title: "Introduction",
        Description: "Introduction to the course",
        OrderIndex: 1,
        Lessons: [{
          LessonID: 1,
          ModuleID: 1,
          Title: "Welcome to the course",
          Description: "Introduction lesson",
          Type: "text",
          Content: "This is fallback content due to a database error",
          VideoUrl: null,
          Duration: 0,
          OrderIndex: 1,
          IsPreview: true
        }]
      }];
    }
    
    // Format instructor data
    const instructor = {
      Name: course.InstructorName || '',
      Title: course.InstructorTitle || '',
      Bio: course.InstructorBio || '',
      AvatarUrl: course.InstructorAvatar || ''
    };
    
    return {
      course: {
        CourseID: course.CourseID,
        Title: course.Title || '',
        Description: course.Description || '',
        ShortDescription: course.ShortDescription || '',
        ImageUrl: course.ImageUrl || '',
        VideoUrl: course.VideoUrl || '',
        Duration: course.Duration || 0,
        Level: course.Level || 'beginner',
        Price: course.Price || 0
      },
      Modules: modules,
      Instructor: instructor,
      IsPreview: true
    };
  } catch (error) {
    console.error('Error fetching preview content:', error);
    return null;
  }
}

/**
 * Lấy lịch học trong ngày cho người dùng
 * @route GET /api/courses/schedule/daily
 * @param {string} date - Ngày muốn xem lịch học (YYYY-MM-DD)
 * @returns {Object} Lịch học trong ngày được yêu cầu
 */
exports.getDailySchedule = async (req, res) => {
  try {
    const { userId } = req.user; // Lấy từ middleware xác thực
    const { date } = req.query; // Ngày được truyền vào từ query

    // Nếu không có date, lấy ngày hiện tại
    const targetDate = date ? new Date(date) : new Date();
    const formattedDate = targetDate.toISOString().split('T')[0]; // Format YYYY-MM-DD

    await pool.connect();
    const request = pool.request();

    // Query để lấy lịch học trong ngày của người dùng
    const query = `
      SELECT 
        c.CourseName,
        cs.Title as SessionTitle,
        cs.StartTime,
        cs.EndTime,
        u.FullName as TeacherName,
        cs.Location,
        cs.SessionType
      FROM CourseSchedule cs
      INNER JOIN Courses c ON cs.CourseID = c.CourseID
      INNER JOIN CourseEnrollments ce ON ce.CourseID = c.CourseID
      INNER JOIN Users u ON c.InstructorID = u.UserID
      WHERE 
        ce.UserID = @UserID AND
        CONVERT(date, cs.StartTime) = @ScheduleDate AND
        cs.Status = 'active'
      ORDER BY cs.StartTime ASC
    `;

    request
      .input('UserID', sql.BigInt, userId)
      .input('ScheduleDate', sql.Date, formattedDate);

    const result = await request.query(query);

    // Format dữ liệu trước khi trả về
    const schedule = result.recordset.map(item => ({
      courseName: item.CourseName,
      sessionTitle: item.SessionTitle,
      startTime: new Date(item.StartTime).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit'
      }),
      endTime: new Date(item.EndTime).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit'
      }),
      teacherName: item.TeacherName,
      location: item.Location || 'Trực tuyến',
      sessionType: item.SessionType
    }));

    res.json({
      success: true,
      date: formattedDate,
      schedule,
      total: schedule.length
    });

  } catch (error) {
    console.error('Lỗi khi lấy lịch học trong ngày:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy lịch học',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create PayPal order for course payment
exports.createPayPalOrder = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    // Get course details
    const course = await Course.findOne({
      where: {
        CourseID: courseId,
        IsPublished: true,
        Status: 'published'
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      where: {
        CourseID: courseId,
        UserID: userId
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already enrolled in this course' 
      });
    }

    // Determine payment amount (use discount price if available)
    const amount = course.DiscountPrice || course.Price;
    
    if (amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Free courses should use the free enrollment endpoint' 
      });
    }

    // Create a pending transaction
    const transaction = await PaymentTransaction.create({
      UserID: userId,
      CourseID: courseId,
      Amount: amount,
      PaymentMethod: 'credit_card',
      TransactionCode: `PPL${Date.now()}`,
      PaymentStatus: 'pending',
      CreatedAt: createSqlServerDate(),
      UpdatedAt: createSqlServerDate()
    });

    // Record in payment history
    await PaymentHistory.create({
      TransactionID: transaction.TransactionID,
      Status: 'initiated',
      Message: 'PayPal payment initiated',
      IPAddress: req.ip,
      UserAgent: req.headers['user-agent'],
      CreatedAt: createSqlServerDate()
    });

    // Create PayPal order
    const returnUrl = `${process.env.PAYPAL_RETURN_URL}?transactionId=${transaction.TransactionID}`;
    const cancelUrl = `${process.env.PAYPAL_CANCEL_URL}?transactionId=${transaction.TransactionID}`;
    const order = await paypalClient.createOrder(transaction, returnUrl, cancelUrl);

    // Return the order ID to the client
    return res.status(200).json({
      success: true,
      orderId: order.id,
      transactionId: transaction.TransactionID
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Process PayPal payment success
exports.processPayPalSuccess = async (req, res) => {
  const { transactionId, PayerID, courseId } = req.body;
  
  if (!transactionId || !PayerID || !courseId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters'
    });
  }

  try {
    // Tìm transaction trong database
    const transaction = await PaymentTransaction.findOne({
      where: { TransactionID: transactionId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const userId = transaction.UserID;

    // Kiểm tra xem người dùng đã đăng ký khóa học này chưa
    const existingEnrollment = await CourseEnrollment.findOne({
      where: {
        UserID: userId,
        CourseID: courseId,
        Status: 'active'
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Cập nhật trạng thái transaction - FIX: Use PaymentStatus not Status
    await PaymentTransaction.update(
      {
        PaymentStatus: 'completed',
        UpdatedAt: new Date()
      },
      {
        where: { TransactionID: transactionId }
      }
    );

    // Cập nhật lịch sử thanh toán
    await PaymentHistory.update(
      {
        Status: 'completed',
        Notes: 'PayPal payment completed successfully',
        UpdatedAt: new Date()
      },
      {
        where: { TransactionID: transactionId }
      }
    );

    // Tạo mới enrollment
    await CourseEnrollment.create({
      UserID: userId,
      CourseID: courseId,
      Status: 'active',
      Progress: 0,
      LastAccessedAt: new Date(),
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    });

    // Cập nhật số lượng học viên đã đăng ký cho khóa học
    await Course.increment('EnrolledCount', {
      by: 1,
      where: { CourseID: courseId }
    });

    return res.status(200).json({
      success: true,
      message: 'PayPal payment processed successfully',
      data: {
        courseId,
        transactionId
      }
    });
  } catch (error) {
    console.error('Error processing PayPal payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process PayPal payment',
      error: error.message
    });
  }
};

// Process PayPal payment cancel
exports.processPayPalCancel = async (req, res) => {
  const { transactionId } = req.body;
  
  if (!transactionId) {
    return res.status(400).json({
      success: false,
      message: 'Missing transaction ID'
    });
  }

  try {
    // Tìm transaction trong database
    const transaction = await PaymentTransaction.findOne({
      where: { TransactionID: transactionId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Cập nhật trạng thái transaction
    transaction.Status = 'cancelled';
    transaction.UpdatedAt = new Date();
    await transaction.save();

    // Cập nhật lịch sử thanh toán
    await PaymentHistory.update(
      {
        Status: 'cancelled',
        Notes: 'PayPal payment cancelled by user',
        UpdatedAt: new Date()
      },
      {
        where: { TransactionID: transactionId }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'PayPal payment cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling PayPal payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel PayPal payment',
      error: error.message
    });
  }
};

// Get VNPAY transaction details
exports.getVNPayTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction ID is required' 
      });
    }
    
    // Find transaction by ID
    const transaction = await PaymentTransaction.findOne({
      where: { TransactionID: transactionId }
    });
    
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }
    
    // Get course details if transaction is for a course
    let course = null;
    if (transaction.CourseID) {
      course = await Course.findByPk(transaction.CourseID, {
        attributes: ['CourseID', 'Title', 'ShortDescription', 'ImageUrl', 'Price', 'DiscountPrice']
      });
    }
    
    // Get enrollment if exists
    let enrollment = null;
    if (transaction.CourseID && transaction.UserID) {
      enrollment = await CourseEnrollment.findOne({
        where: {
          CourseID: transaction.CourseID,
          UserID: transaction.UserID
        }
      });
    }
    
    // Get payment history
    const paymentHistory = await PaymentHistory.findAll({
      where: { TransactionID: transactionId },
      order: [['CreatedAt', 'DESC']],
      limit: 5
    });
    
    return res.status(200).json({
      success: true,
      data: {
        transaction,
        course,
        enrollment,
        paymentHistory
      }
    });
  } catch (error) {
    console.error('Error fetching VNPay transaction:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}; 