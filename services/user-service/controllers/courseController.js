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
const sequelize = require('../config/database');
const jwt = require('jsonwebtoken');
const paypalClient = require('../utils/paypalClient');
const { formatDateForSqlServer, createSqlServerDate } = require('../utils/dateHelpers');
const LessonProgress = require('../models/LessonProgress');
const { VNPay, ignoreLogger } = require('vnpay');
const { Op } = require('sequelize');

// Initialize VNPAY client
const vnpayHost = new URL(process.env.VNP_URL).origin;
const vnpayClient = new VNPay({
  tmnCode: process.env.VNP_TMN_CODE,
  secureSecret: process.env.VNP_HASH_SECRET,
  vnpayHost: vnpayHost,
  queryDrAndRefundHost: vnpayHost,
  testMode: process.env.NODE_ENV !== 'production',
  hashAlgorithm: 'SHA512',
  enableLog: process.env.NODE_ENV !== 'production',
  loggerFn: ignoreLogger,
  endpoints: {
    paymentEndpoint: new URL(process.env.VNP_URL).pathname.slice(1),
    queryDrRefundEndpoint: 'merchant_webapi/api/transaction',
    getBankListEndpoint: 'qrpayauth/api/merchant/get_bank_list'
  }
});

// Get all courses (public)
exports.getAllCourses = async (req, res) => {
  try {
    console.log('Fetching all courses');
    
    // Count published courses
    const courseCount = await Course.count({
      where: {
        IsPublished: true,
        Status: 'published',
        DeletedAt: null
      }
    });
    
    console.log(`Found ${courseCount} published courses in database`);
    
    // Return sample data for development/testing
    if (courseCount === 0) {
      const sampleCourses = [
        {
          CourseID: 1,
          Title: 'Lập trình Python cho người mới bắt đầu',
          Slug: 'lap-trinh-python-co-ban',
          ShortDescription: 'Khóa học Python từ cơ bản đến nâng cao dành cho người mới',
          Level: 'beginner',
          Category: 'Programming',
          Duration: 2400,
          EnrolledCount: 245,
          Rating: 4.8,
          RatingCount: 120,
          Price: 499000,
          DiscountPrice: 399000,
          ImageUrl: 'https://placehold.co/600x400?text=Python'
        },
        {
          CourseID: 2,
          Title: 'Lập trình Java chuyên sâu',
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
          ImageUrl: 'https://placehold.co/600x400?text=Java'
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
        'Rating', 'Price', 'DiscountPrice', 'ImageUrl', 'InstructorID'
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
      console.error('Missing VNPay configuration:', {
        tmnCode: process.env.VNP_TMN_CODE ? '[SET]' : '[NOT SET]',
        secretKey: process.env.VNP_HASH_SECRET ? '[SET]' : '[NOT SET]',
        vnpUrl: process.env.VNP_URL ? '[SET]' : '[NOT SET]'
      });
      
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

    // Create VNPay payment URL using vnpay library
    try {
      const originUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      // Ensure IPv4 for VNPay (avoid "::1" IPv6 localhost)
      let clientIp = req.headers['x-forwarded-for'];
      if (clientIp) {
        clientIp = clientIp.split(',')[0].trim();
      } else {
        clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      }
      if (clientIp === '::1') clientIp = '127.0.0.1';
      console.log('Using originUrl for VNPay return:', originUrl);
      // Determine bank code: use request body override only (do NOT send unsupported params)
      // Validate bank code robustly to avoid VNPay error "Ngân hàng thanh toán không được hỗ trợ" (code 76)
      let bankCode = null;
      if (req.body && typeof req.body.bankCode === 'string') {
        const trimmedBankCode = req.body.bankCode.trim();
        // Exclude empty string, undefined/null literals or placeholder text
        if (
          trimmedBankCode &&
          trimmedBankCode.toLowerCase() !== 'undefined' &&
          trimmedBankCode.toLowerCase() !== 'null'
        ) {
          bankCode = trimmedBankCode;
        }
      }
      // If bankCode is still null, use universal QR code method to avoid 76
      if (!bankCode) {
        bankCode = 'VNBANK';
      }
      console.log('Using bankCode for VNPay:', bankCode);
      
      // Validate against supported bank codes list
      if (bankCode) {
        try {
          const bankList = await vnpayClient.getBankList();
          const supportedCodes = (bankList || []).map(b =>
            (b && (b.shortName || b.code || b.bankCode || b.BankCode))?.toString().trim().toUpperCase()
          );
          if (!supportedCodes.includes(bankCode.toUpperCase())) {
            console.warn(`Bank code ${bankCode} is not supported by VNPay. Removing bank code param.`);
            bankCode = null;
          }
        } catch (bankListErr) {
          console.error('Could not validate bank code with VNPay bank list:', bankListErr.message || bankListErr);
          // Proceed without bank code if validation fails to avoid payment errors
          bankCode = null;
        }
      }
      
      // Determine return URL
      let returnUrl = process.env.VNP_RETURN_URL;
      if (!returnUrl) {
        if (process.env.CLIENT_URL) {
          returnUrl = `${process.env.CLIENT_URL}/payment/vnpay/callback`;
        } else {
          returnUrl = `${originUrl}/payment/vnpay/callback`;
        }
      }
      console.log('Computed VNPay returnUrl:', returnUrl);

      const paymentParams = {
        // Provide raw amount (VND); vnpay library will multiply by 100 when building URL
        vnp_Amount: Math.round(Number(transaction.Amount)),
        vnp_CurrCode: 'VND',
        vnp_IpAddr: clientIp,
        vnp_TxnRef: transaction.TransactionCode,
        vnp_OrderInfo: `Thanh toán khóa học: ${transaction.CourseID}`,
        vnp_OrderType: 'billpayment',
        vnp_ReturnUrl: returnUrl,
        vnp_Locale: 'vn'
      };
      // Chỉ thêm bankCode nếu được cung cấp rõ ràng – tránh lỗi "Ngân hàng không hỗ trợ" (code 76)
      if (bankCode) {
        paymentParams.vnp_BankCode = bankCode;
      }
      // Normalize IP: any IPv6 localhost or mapped IPv6 → 127.0.0.1
      if (paymentParams.vnp_IpAddr.includes(':')) {
        paymentParams.vnp_IpAddr = '127.0.0.1';
      }

      console.log('VNPay paymentParams:', paymentParams);

      const paymentUrl = vnpayClient.buildPaymentUrl(paymentParams);

      console.log(`Generated VNPay URL for transaction ${transaction.TransactionID}`, paymentUrl);
      return res.status(200).json({
        success: true,
        paymentUrl,
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

// Handle VNPay payment callback using vnpay library
exports.paymentCallback = async (req, res) => {
  try {
    // Verify return URL data
    const data = vnpayClient.verifyReturnUrl(req.query);
    console.log('VNPay callback data:', data);
    if (!data.isVerified) {
      console.error('VNPay signature verification failed', data);
      return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=error&message=Invalid_signature`);
    }
    // Find transaction by TransactionCode
    const transaction = await PaymentTransaction.findOne({ where: { TransactionCode: data.vnp_TxnRef } });
    if (!transaction) {
      console.error('Transaction not found:', data.vnp_TxnRef);
      return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=error&message=Transaction_not_found`);
    }
    // Update based on payment outcome
    if (data.isSuccess) {
      // Success
      await PaymentTransaction.update(
        {
          PaymentStatus: 'completed',
          PaymentDate: new Date().toISOString(),
          UpdatedAt: new Date().toISOString()
        },
        { where: { TransactionCode: data.vnp_TxnRef } }
      );
      await PaymentHistory.update(
        { Status: 'completed', Notes: 'Payment completed successfully', UpdatedAt: new Date() },
        { where: { TransactionID: transaction.TransactionID } }
      );
      // Enroll user if not already
      const existingEnrollment = await CourseEnrollment.findOne({ where: { UserID: transaction.UserID, CourseID: transaction.CourseID } });
      if (!existingEnrollment) {
        await CourseEnrollment.create({ UserID: transaction.UserID, CourseID: transaction.CourseID, Status: 'active', Progress: 0, CreatedAt: new Date(), UpdatedAt: new Date() });
        await Course.increment('EnrolledCount', { by: 1, where: { CourseID: transaction.CourseID } });
      }
      return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=success&courseId=${transaction.CourseID}&transactionId=${transaction.TransactionID}`);
    } else {
      // Failure
      await PaymentTransaction.update(
        { PaymentStatus: 'failed', UpdatedAt: new Date() },
        { where: { TransactionCode: data.vnp_TxnRef } }
      );
      await PaymentHistory.update(
        { Status: 'failed', Notes: `Payment failed with code: ${data.vnp_ResponseCode}`, UpdatedAt: new Date() },
        { where: { TransactionID: transaction.TransactionID } }
      );
      return res.redirect(`${process.env.CLIENT_URL}/payment-result?status=error&message=Payment_failed&code=${data.vnp_ResponseCode}`);
    }
  } catch (error) {
    console.error('Error processing VNPay callback:', error);
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
    // Auto-cancel expired pending transactions older than 30 minutes
    await sequelize.query(
      `UPDATE PaymentTransactions
       SET PaymentStatus='cancelled',
           UpdatedAt=GETDATE(),
           Notes='Expired after 30 minutes'
       WHERE PaymentStatus='pending'
         AND DATEDIFF(MINUTE, CreatedAt, GETDATE()) > 30`
    );

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

// Get course payment history for a specific course
exports.getCoursePaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.courseId;
    
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }
    
    const payments = await PaymentTransaction.findAll({
      where: {
        UserID: userId,
        CourseID: courseId
      },
      order: [['CreatedAt', 'DESC']],
      limit: 10 // Limit the results to the 10 most recent transactions
    });
    
    return res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching course payment history:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark a lesson as completed and update progress
exports.saveLessonProgress = async (req, res) => {
  try {
    // Ensure lessonId is numeric to avoid SQL conversion errors
    const lessonIdRaw = req.params.lessonId;
    const lessonId = parseInt(lessonIdRaw, 10);
    if (isNaN(lessonId)) {
      return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
    }
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
    
    const courseId = parseInt(lesson[0].CourseID, 10);

    if (isNaN(courseId)) {
      return res.status(500).json({ success: false, message: 'Invalid course ID retrieved from lesson' });
    }
    
    // Find the user's enrollment
    const enrollment = await CourseEnrollment.findOne({
      where: {
        UserID: userId,
        CourseID: courseId,
        Status: { [Op.in]: ['active', 'completed'] }
      }
    });
    
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'User is not enrolled in this course',
      });
    }
    
    // Upsert lesson progress without using implicit transactions (avoid MSSQL COMMIT error)
    let lessonProgress = await LessonProgress.findOne({
      where: {
        EnrollmentID: enrollment.EnrollmentID,
        LessonID: lessonId
      }
    });

    if (!lessonProgress) {
      // Create new progress row
      lessonProgress = await LessonProgress.create({
        EnrollmentID: enrollment.EnrollmentID,
        LessonID: lessonId,
        Status: 'completed',
        CompletedAt: sequelize.literal('GETDATE()'),
        TimeSpent: req.body.timeSpent || 0,
        LastPosition: req.body.lastPosition || 0
      });
    } else {
      // Update existing row
      lessonProgress.Status = 'completed';
      lessonProgress.CompletedAt = sequelize.literal('GETDATE()');
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
      enrollment.CompletedAt = sequelize.literal('GETDATE()');
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
      PaymentMethod: 'paypal',
      TransactionCode: `PPL${Date.now()}`,
      PaymentStatus: 'pending',
      CreatedAt: createSqlServerDate(),
      UpdatedAt: createSqlServerDate(),
      // Include status and courseId in Return/Cancel URLs so frontend can handle redirects properly
      ReturnURL: `${process.env.PAYPAL_RETURN_URL || `${req.protocol}://${req.get('host')}/payment/paypal/success`}?status=success&courseId=${courseId}`,
      CancelURL: `${process.env.PAYPAL_CANCEL_URL || `${req.protocol}://${req.get('host')}/payment/paypal/cancel`}?status=cancel&courseId=${courseId}`
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

    // Create PayPal order with retry logic
    let order;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const returnUrl = `${process.env.PAYPAL_RETURN_URL || req.headers.origin + '/payment/paypal/success'}?status=success&transactionId=${transaction.TransactionID}&courseId=${courseId}`;
        const cancelUrl = `${process.env.PAYPAL_CANCEL_URL || req.headers.origin + '/payment/paypal/cancel'}?status=cancel&transactionId=${transaction.TransactionID}&courseId=${courseId}`;
        
        order = await paypalClient.createOrder(transaction, returnUrl, cancelUrl);
        break; // If successful, exit the retry loop
      } catch (paypalError) {
        retryCount++;
        console.error(`PayPal order creation failed (attempt ${retryCount}):`, paypalError);
        
        if (retryCount === maxRetries) {
          // Update transaction as failed after max retries
          await PaymentTransaction.update(
            { 
              PaymentStatus: 'failed',
              PaymentDetails: JSON.stringify({ 
                error: 'Failed to create PayPal order after multiple attempts',
                details: paypalError.message 
              }),
              UpdatedAt: createSqlServerDate()
            },
            { where: { TransactionID: transaction.TransactionID } }
          );
          
          // Update payment history
          await PaymentHistory.create({
            TransactionID: transaction.TransactionID,
            Status: 'failed',
            Message: 'Failed to create PayPal order',
            IPAddress: req.ip,
            Notes: paypalError.message,
            CreatedAt: createSqlServerDate()
          });
          
          return res.status(500).json({ 
            success: false, 
            message: 'Payment service error. Please try again later.' 
          });
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // Extract the approval URL for redirecting the user
    const approveLink = order.links.find(link => link.rel === 'approve')?.href;
    
    if (!approveLink) {
      // Update transaction as failed if no approval link
      await PaymentTransaction.update(
        { 
          PaymentStatus: 'failed',
          PaymentDetails: JSON.stringify({ 
            error: 'No approval URL found in PayPal response',
            order: order
          }),
          UpdatedAt: createSqlServerDate()
        },
        { where: { TransactionID: transaction.TransactionID } }
      );
      
      return res.status(500).json({ 
        success: false, 
        message: 'Invalid PayPal response. Missing approval URL.' 
      });
    }
    
    // Update transaction with PayPal order ID
    await PaymentTransaction.update(
      { 
        PaymentDetails: JSON.stringify({ 
          paypalOrderId: order.id,
          approvalUrl: approveLink
        }),
        UpdatedAt: createSqlServerDate()
      },
      { where: { TransactionID: transaction.TransactionID } }
    );

    // Return the PayPal order details to the client
    return res.status(200).json({
      success: true,
      orderId: order.id,
      approveUrl: approveLink,
      transactionId: transaction.TransactionID
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Process PayPal payment success
exports.processPayPalSuccess = async (req, res) => {
  const { transactionId, PayerID, paymentId } = req.body;
  
  if (!transactionId) {
    return res.status(400).json({
      success: false,
      message: 'Missing transaction ID'
    });
  }

  try {
    // Find transaction in database
    const transaction = await PaymentTransaction.findOne({
      where: { TransactionID: transactionId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Check if payment is already completed to prevent double-processing
    if (transaction.PaymentStatus === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Payment was already processed successfully',
        data: {
          courseId: transaction.CourseID,
          transactionId: transaction.TransactionID
        }
      });
    }
    
    // Verify the payment with PayPal if PayerID is provided
    if (PayerID) {
      try {
        // Get PayPal order ID from transaction details
        let paypalOrderId = null;
        if (transaction.PaymentDetails) {
          const details = JSON.parse(transaction.PaymentDetails);
          paypalOrderId = details.paypalOrderId;
        }
        
        if (!paypalOrderId && paymentId) {
          paypalOrderId = paymentId;
        }
        
        if (paypalOrderId) {
          // Verify and capture the payment
          const captureResult = await paypalClient.validateAndCapturePayment(paypalOrderId);
          
          if (captureResult.status !== 'COMPLETED') {
            throw new Error('PayPal capture did not complete');
          }
        }
      } catch (verifyError) {
        console.error('Error verifying PayPal payment:', verifyError);
        
        await PaymentHistory.create({
          TransactionID: transactionId,
          Status: 'verification_failed',
          Message: 'Failed to verify PayPal payment',
          Notes: verifyError.message,
          CreatedAt: createSqlServerDate()
        });
        
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
          error: process.env.NODE_ENV === 'development' ? verifyError.message : undefined
        });
      }
    }

    const userId = transaction.UserID;
    const courseId = transaction.CourseID;

    // Check if user is already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      where: {
        UserID: userId,
        CourseID: courseId,
        Status: 'active'
      }
    });

    // If already enrolled, just update the payment status
    if (!existingEnrollment) {
      // Create a new enrollment
      await CourseEnrollment.create({
        UserID: userId,
        CourseID: courseId,
        Status: 'active',
        Progress: 0,
        LastAccessedAt: new Date(),
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      });

      // Update course enrollment count
      await Course.increment('EnrolledCount', {
        by: 1,
        where: { CourseID: courseId }
      });
    }

    // Update transaction status
    await PaymentTransaction.update(
      {
        PaymentStatus: 'completed',
        PaymentDate: createSqlServerDate(),
        UpdatedAt: createSqlServerDate(),
        Notes: PayerID ? `Verified with PayerID: ${PayerID}` : 'Marked as completed via success endpoint'
      },
      {
        where: { TransactionID: transactionId }
      }
    );

    // Update payment history
    await PaymentHistory.create({
      TransactionID: transactionId,
      Status: 'completed',
      Message: 'PayPal payment completed successfully',
      Notes: PayerID ? `Verified with PayerID: ${PayerID}` : 'Marked as completed via success endpoint',
      CreatedAt: createSqlServerDate()
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
    
    // Record error in payment history
    try {
      await PaymentHistory.create({
        TransactionID: transactionId,
        Status: 'error',
        Message: 'Error during payment processing',
        Notes: error.message,
        CreatedAt: createSqlServerDate()
      });
    } catch (historyError) {
      console.error('Failed to record payment history:', historyError);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to process PayPal payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    // Find transaction in database
    const transaction = await PaymentTransaction.findOne({
      where: { TransactionID: transactionId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Only update if not already completed
    if (transaction.PaymentStatus === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Payment was already completed and cannot be cancelled'
      });
    }

    // Update transaction status
    await PaymentTransaction.update(
      { 
        PaymentStatus: 'cancelled', 
        UpdatedAt: createSqlServerDate(),
        Notes: 'Payment cancelled by user'
      },
      { where: { TransactionID: transactionId } }
    );

    // Update payment history
    await PaymentHistory.create({
      TransactionID: transactionId,
      Status: 'cancelled',
      Message: 'PayPal payment cancelled by user',
      CreatedAt: createSqlServerDate()
    });

    return res.status(200).json({
      success: true,
      message: 'PayPal payment cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling PayPal payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel PayPal payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// Get PayPal approval URL for continuing a pending payment
exports.getPaypalApprovalUrl = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction ID is required' 
      });
    }
    
    // Check if the user owns this transaction
    const transaction = await PaymentTransaction.findOne({ 
      where: { 
        TransactionID: transactionId,
        UserID: req.user.id,
        PaymentMethod: 'paypal',
        PaymentStatus: 'pending'
      } 
    });
    
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pending PayPal transaction not found' 
      });
    }
    
    // Check if we already have the approval URL stored
    let approvalUrl = null;
    if (transaction.PaymentDetails) {
      try {
        const details = JSON.parse(transaction.PaymentDetails);
        approvalUrl = details.approvalUrl;
      } catch (parseError) {
        console.error('Error parsing payment details:', parseError);
      }
    }
    
    // If we have a stored URL, return it
    if (approvalUrl) {
      return res.status(200).json({
        success: true,
        approveUrl: approvalUrl,
        transactionId: transaction.TransactionID
      });
    }
    
    // If no URL stored, create a new PayPal order
    const returnUrl = `${process.env.PAYPAL_RETURN_URL || req.headers.origin + '/payment/paypal/success'}?status=success&transactionId=${transaction.TransactionID}&courseId=${transaction.CourseID}`;
    const cancelUrl = `${process.env.PAYPAL_CANCEL_URL || req.headers.origin + '/payment/paypal/cancel'}?status=cancel&transactionId=${transaction.TransactionID}&courseId=${transaction.CourseID}`;
    
    const order = await paypalClient.createOrder(transaction, returnUrl, cancelUrl);
    const newApproveUrl = order.links.find(link => link.rel === 'approve')?.href;
    
    if (!newApproveUrl) {
      return res.status(500).json({ 
        success: false, 
        message: 'Could not generate PayPal approval URL' 
      });
    }
    
    // Store the new PayPal order details in the transaction
    await PaymentTransaction.update(
      { 
        PaymentDetails: JSON.stringify({ 
          paypalOrderId: order.id,
          approvalUrl: newApproveUrl
        }),
        UpdatedAt: createSqlServerDate()
      },
      { where: { TransactionID: transaction.TransactionID } }
    );
    
    return res.status(200).json({
      success: true,
      approveUrl: newApproveUrl,
      transactionId: transaction.TransactionID
    });
  } catch (error) {
    console.error('Error getting PayPal approval URL:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get PayPal approval URL',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get list of banks from VNPay (sandbox or production) using vnpay library
exports.getVNPayBankList = async (req, res) => {
  try {
    const banks = await vnpayClient.getBankList();
    return res.json({ success: true, data: banks });
  } catch (error) {
    console.error('Error fetching VNPay bank list via library:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch bank list' });
  }
};

// Test PayPal sandbox integration (only available in development/sandbox mode)
exports.testPayPalSandbox = async (req, res) => {
  try {
    // Only allow in development or when explicitly enabled
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_PAYPAL_TEST !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'PayPal test endpoint is not available in production'
      });
    }
    
    // Check if PayPal client is in sandbox mode
    if (paypalClient.mode !== 'sandbox') {
      return res.status(400).json({
        success: false,
        message: 'PayPal client is not in sandbox mode'
      });
    }
    
    // Create a test order
    const testOrder = await paypalClient.createSandboxTestOrder();
    
    // Get the approval URL
    const approvalUrl = testOrder.links.find(link => link.rel === 'approve')?.href;
    
    return res.status(200).json({
      success: true,
      message: 'PayPal sandbox test order created successfully',
      data: {
        orderId: testOrder.id,
        status: testOrder.status,
        approvalUrl: approvalUrl
      },
      links: testOrder.links
    });
  } catch (error) {
    console.error('Error testing PayPal sandbox:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to test PayPal sandbox',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -----------------------------------------------------------------------------
// NEW: Get overall progress and completed lessons for a user in a course
// -----------------------------------------------------------------------------
exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    // Auth middleware may store user info in various ways
    const user = req.user || {};
    const userId = user.id || user.userId || user.UserID;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
    }

    // For demo courses (ID 1 & 2) return mock data so that frontend can test easily
    if (courseId === '1') {
      return res.status(200).json({
        success: true,
        data: {
          overallProgress: 30,
          completedLessons: []
        }
      });
    }
    if (courseId === '2') {
      return res.status(200).json({
        success: true,
        data: {
          overallProgress: 0,
          completedLessons: []
        }
      });
    }

    // --------------------------------------------
    // Query enrollment progress from database
    // --------------------------------------------
    const enrollmentResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT EnrollmentID, Progress
        FROM CourseEnrollments
        WHERE UserID = @userId AND CourseID = @courseId AND Status = 'active'
      `);

    if (enrollmentResult.recordset.length === 0) {
      // No enrollment found – return 404 so that frontend falls back gracefully
      return res.status(404).json({ success: false, message: 'No progress data found' });
    }

    const { EnrollmentID, Progress } = enrollmentResult.recordset[0];

    // --------------------------------------------
    // Query completed lessons for this enrollment
    // --------------------------------------------
    const completedResult = await pool.request()
      .input('enrollmentId', sql.BigInt, EnrollmentID)
      .query(`
        SELECT LessonID
        FROM LessonProgress
        WHERE EnrollmentID = @enrollmentId AND Status = 'completed'
      `);

    const completedLessons = completedResult.recordset.map(row => row.LessonID);

    return res.status(200).json({
      success: true,
      data: {
        overallProgress: Progress || 0,
        completedLessons
      }
    });
  } catch (error) {
    console.error('Error fetching course progress:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}; 