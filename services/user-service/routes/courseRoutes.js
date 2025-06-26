const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');

// =============================================
// 1. PUBLIC ROUTES - NO AUTHENTICATION REQUIRED
// =============================================

// Get all published courses (public)
router.get('/courses', courseController.getAllCourses);

// Payment callback from VNPAY (public)
router.get('/payment/vnpay/callback', courseController.paymentCallback);

// Fetch VNPay supported bank list (public)
router.get('/vnpay/banks', courseController.getVNPayBankList);

// =============================================
// 2. SPECIFIC ROUTES (MUST COME BEFORE DYNAMIC ROUTES)
// =============================================

// User enrolled courses (protected)
router.get('/courses/enrolled', authMiddleware, courseController.getUserEnrollments);

// User daily schedule (protected)
router.get('/courses/schedule/daily', authMiddleware, courseController.getDailySchedule);

// =============================================
// 3. PUBLIC DYNAMIC ROUTES
// =============================================

// Get single course details by ID or slug (public)
router.get('/courses/:courseIdentifier', (req, res, next) => {
  // Skip this route handler if the courseIdentifier is 'enrolled'
  if (req.params.courseIdentifier === 'enrolled') {
    console.log('Request for /courses/enrolled - should be handled by specific route');
    return next('route');
  }
  
  // Set bypass flag for auth middleware
  req.bypassAuth = true;
  
  // Continue to controller
  courseController.getCourseDetails(req, res, next);
});

// =============================================
// 4. OTHER PROTECTED ROUTES
// =============================================

router.get('/user/enrollments', authMiddleware, courseController.getUserEnrollments);

// Course enrollment check (protected)
router.get('/courses/:courseId/check-enrollment', authMiddleware, courseController.checkEnrollment);

// Course content requires authentication to access user-specific data
router.get('/courses/:courseId/content', authMiddleware, courseController.getCourseContent);

// NEW: Get course progress for the authenticated user
router.get('/courses/:courseId/progress', authMiddleware, courseController.getCourseProgress);

// Enroll in free course (protected)
router.post('/courses/:courseId/enroll/free', authMiddleware, courseController.enrollFreeCourse);

// Mark lesson as completed and update progress (protected)
router.post('/lessons/:lessonId/progress', authMiddleware, courseController.saveLessonProgress);

// Create payment URL (protected)
router.post('/courses/:courseId/create-payment', authMiddleware, courseController.createPaymentUrl);
router.post('/courses/:courseId/create-vietqr', authMiddleware, courseController.createVietQRPayment);
router.post('/payments/verify-vietqr', authMiddleware, courseController.verifyVietQRPayment);

// Payment history (protected)
router.get('/user/payment-history', authMiddleware, courseController.getPaymentHistory);

// Get payment history for a specific course
router.get('/courses/:courseId/payment-history', authMiddleware, courseController.getCoursePaymentHistory);

// Create PayPal payment order (protected)
router.post('/courses/:courseId/create-paypal-order', authMiddleware, courseController.createPayPalOrder);

// PayPal payment success callback
router.post('/payment/paypal/success', courseController.processPayPalSuccess);

// PayPal payment cancel callback
router.post('/payment/paypal/cancel', courseController.processPayPalCancel);

// Get VNPay transaction details
router.get('/payment/vnpay/transaction/:transactionId', courseController.getVNPayTransaction);

// Get PayPal approval URL for continuing a pending payment
router.get('/payment/paypal/approval/:transactionId', authMiddleware, courseController.getPaypalApprovalUrl);

// Test PayPal sandbox integration (only in development)
router.get('/payment/paypal/test', authMiddleware, courseController.testPayPalSandbox);

module.exports = router; 