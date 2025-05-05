const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// Debug middleware for report routes - must be before all routes
const debugReportRoutes = (req, res, next) => {
  console.log(`[REPORT DEBUG] ${req.method} ${req.path}`);
  console.log(`[REPORT DEBUG] Headers: ${JSON.stringify({
    authorization: req.headers.authorization ? 'Present' : 'Not present',
    'content-type': req.headers['content-type'],
  })}`);
  next();
};

router.use(debugReportRoutes);

// Redirect middleware - redirect non-admin root GET requests to /me
router.get('/', authenticateToken, (req, res, next) => {
  // If user is not admin, redirect to /me endpoint
  if (req.user.Role !== 'ADMIN') {
    console.log(`[REPORT REDIRECT] Redirecting non-admin user ${req.user.UserID} to /me endpoint`);
    req.url = '/me';
    return router.handle(req, res, next);
  }
  // Otherwise continue to admin endpoint
  next();
});

// Public routes
// Lấy danh mục báo cáo (public)
router.get('/categories', reportController.getCategories);

// User routes (authenticated)
// Lấy danh sách báo cáo của người dùng hiện tại
router.get('/me', authenticateToken, reportController.getMyReports);

// Lấy chi tiết báo cáo của người dùng hiện tại
router.get('/me/:reportId', authenticateToken, reportController.getMyReportDetail);

// Tạo báo cáo mới
router.post('/', authenticateToken, reportController.createReport);

// Hủy báo cáo (chỉ cho báo cáo đang PENDING)
router.post('/:reportId/cancel', authenticateToken, reportController.cancelReport);

// Admin routes
// Lấy danh sách tất cả báo cáo (chỉ admin)
router.get('/', authenticateToken, isAdmin, reportController.getReports);

// Cập nhật trạng thái báo cáo (chỉ admin)
router.patch('/:reportId/status', authenticateToken, isAdmin, reportController.updateReportStatus);

// Xóa bài viết được báo cáo (chỉ admin)
router.post('/:reportId/delete-content', authenticateToken, isAdmin, reportController.deleteReportedContent);

// Gắn cờ vi phạm cho bài viết được báo cáo (chỉ admin)
router.post('/:reportId/flag-content', authenticateToken, isAdmin, reportController.flagReportedContent);

// Xóa báo cáo (chỉ admin)
router.delete('/:reportId', authenticateToken, isAdmin, reportController.deleteReport);

module.exports = router; 