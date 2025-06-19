const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Routes cho quản lý báo cáo (yêu cầu quyền admin)

// Lấy danh sách tất cả báo cáo với phân trang và lọc
router.get('/', authenticateToken, isAdmin, reportController.getAllReports);

// Lấy thống kê báo cáo
router.get('/stats', authenticateToken, isAdmin, reportController.getReportStats);

// Lấy chi tiết báo cáo theo ID
router.get('/:id', authenticateToken, isAdmin, reportController.getReportById);

// Thêm route để xem nội dung bài viết được báo cáo
router.get('/:id/content', authenticateToken, isAdmin, reportController.getReportedContent);

// Cập nhật trạng thái báo cáo
router.put('/:id/status', authenticateToken, isAdmin, reportController.updateReportStatus);

// Xóa báo cáo (xóa mềm)
router.delete('/:id', authenticateToken, isAdmin, reportController.deleteReport);

// Xử lý báo cáo: xóa nội dung vi phạm
router.post('/:id/delete-content', authenticateToken, isAdmin, reportController.deleteReportedContent);

// Xử lý báo cáo: gắn cờ nội dung vi phạm
router.post('/:id/flag-content', authenticateToken, isAdmin, reportController.flagReportedContent);

// Xuất báo cáo dưới dạng CSV
router.get('/export/csv', authenticateToken, isAdmin, reportController.exportReportsAsCsv);

module.exports = router;