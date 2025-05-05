const { pool, sql } = require('../config/db');

const reportController = {
  // Tạo báo cáo mới
  createReport: async (req, res) => {
    const { targetId, targetType, title, content, category } = req.body;
    const reporterId = req.user.UserID;

    // Kiểm tra dữ liệu đầu vào
    if (!targetId || !targetType || !title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc. Vui lòng cung cấp đầy đủ targetId, targetType, title, content và category.'
      });
    }

    // Xác thực category
    const validCategories = ['USER', 'CONTENT', 'COURSE', 'EVENT', 'COMMENT'];
    if (!validCategories.includes(category.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Category không hợp lệ. Giá trị hợp lệ: USER, CONTENT, COURSE, EVENT, COMMENT'
      });
    }

    try {
      // Tạo request mới cho mỗi query
      const request = pool.request();

      const query = `
        INSERT INTO Reports (Title, Content, Category, ReporterID, TargetID, TargetType, Status)
        OUTPUT INSERTED.ReportID
        VALUES (@title, @content, @category, @reporterId, @targetId, @targetType, 'PENDING')
      `;

      const result = await request
        .input('title', sql.NVarChar, title)
        .input('content', sql.NVarChar, content)
        .input('category', sql.VarChar, category.toUpperCase())
        .input('reporterId', sql.BigInt, reporterId)
        .input('targetId', sql.BigInt, targetId)
        .input('targetType', sql.VarChar, targetType)
        .query(query);

      res.status(201).json({
        success: true,
        message: 'Báo cáo đã được gửi thành công',
        reportId: result.recordset[0].ReportID
      });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo báo cáo',
        error: error.message
      });
    }
  },

  // Lấy danh sách báo cáo (cho admin)
  getReports: async (req, res) => {
    try {
      // Double-check that the user is an admin before proceeding
      if (req.user.Role !== 'ADMIN') {
        console.error(`[getReports] Non-admin user ${req.user.UserID} attempted to access admin reports`);
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập danh sách báo cáo. Vui lòng sử dụng /api/reports/me để xem báo cáo của bạn.',
          redirectTo: '/api/reports/me'
        });
      }

      // Tạo request mới cho mỗi query
      const request = pool.request();

      const query = `
        SELECT r.*, 
               u1.FullName as ReporterName,
               u2.FullName as TargetName
        FROM Reports r
        LEFT JOIN Users u1 ON r.ReporterID = u1.UserID
        LEFT JOIN Users u2 ON r.TargetID = u2.UserID AND r.TargetType = 'USER'
        WHERE r.DeletedAt IS NULL
        ORDER BY r.CreatedAt DESC
      `;

      const result = await request.query(query);
      res.json({
        success: true,
        reports: result.recordset
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách báo cáo',
        error: error.message
      });
    }
  },

  // Cập nhật trạng thái báo cáo (cho admin)
  updateReportStatus: async (req, res) => {
    const { reportId } = req.params;
    const { status, notes, action } = req.body;

    try {
      // Bắt đầu transaction
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // Lấy thông tin báo cáo
        const getReportQuery = `
          SELECT r.*, p.UserID as PostOwnerID 
          FROM Reports r
          LEFT JOIN Posts p ON r.TargetID = p.PostID AND r.TargetType = 'CONTENT'
          WHERE r.ReportID = @reportId
        `;

        const reportResult = await transaction.request()
          .input('reportId', sql.BigInt, reportId)
          .query(getReportQuery);

        if (reportResult.recordset.length === 0) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: 'Báo cáo không tồn tại'
          });
        }

        const report = reportResult.recordset[0];

        // Cập nhật trạng thái báo cáo
        const updateReportQuery = `
          UPDATE Reports
          SET Status = @status,
              Notes = @notes,
              ResolvedAt = CASE WHEN @status IN ('RESOLVED', 'REJECTED') THEN GETDATE() ELSE ResolvedAt END,
              UpdatedAt = GETDATE(),
              ActionTaken = @action
          WHERE ReportID = @reportId
        `;

        await transaction.request()
          .input('reportId', sql.BigInt, reportId)
          .input('status', sql.VarChar, status)
          .input('notes', sql.NVarChar, notes)
          .input('action', sql.VarChar, action || null)
          .query(updateReportQuery);

        // Nếu có action và report là về bài viết
        if (action && report.TargetType === 'CONTENT') {
          const targetId = report.TargetID;

          if (action === 'DELETE') {
            // Xóa bài viết (soft delete)
            const deletePostQuery = `
              UPDATE Posts
              SET DeletedAt = GETDATE(), 
                  IsDeleted = 1
              WHERE PostID = @targetId
            `;

            await transaction.request()
              .input('targetId', sql.BigInt, targetId)
              .query(deletePostQuery);
          } 
          else if (action === 'FLAG') {
            // Gắn cờ vi phạm cho bài viết
            const flagPostQuery = `
              UPDATE Posts
              SET IsFlagged = 1,
                  FlaggedReason = @reason,
                  FlaggedAt = GETDATE()
              WHERE PostID = @targetId
            `;

            await transaction.request()
              .input('targetId', sql.BigInt, targetId)
              .input('reason', sql.NVarChar, `Bị báo cáo: ${report.Title}`)
              .query(flagPostQuery);
          }
        }

        // Commit transaction
        await transaction.commit();

        res.json({
          success: true,
          message: 'Cập nhật trạng thái báo cáo thành công'
        });
      } catch (error) {
        // Rollback nếu có lỗi
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái báo cáo',
        error: error.message
      });
    }
  },

  // Xử lý báo cáo: xóa bài viết
  deleteReportedContent: async (req, res) => {
    const { reportId } = req.params;

    try {
      // Bắt đầu transaction
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // Lấy thông tin báo cáo
        const getReportQuery = `
          SELECT * FROM Reports WHERE ReportID = @reportId
        `;

        const reportResult = await transaction.request()
          .input('reportId', sql.BigInt, reportId)
          .query(getReportQuery);

        if (reportResult.recordset.length === 0) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: 'Báo cáo không tồn tại'
          });
        }

        const report = reportResult.recordset[0];

        if (report.TargetType !== 'CONTENT') {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Báo cáo này không liên quan đến bài viết'
          });
        }

        const targetId = report.TargetID;

        // Xóa bài viết (soft delete)
        const deletePostQuery = `
          UPDATE Posts
          SET DeletedAt = GETDATE(), 
              IsDeleted = 1
          WHERE PostID = @targetId
        `;

        await transaction.request()
          .input('targetId', sql.BigInt, targetId)
          .query(deletePostQuery);

        // Cập nhật trạng thái báo cáo
        const updateReportQuery = `
          UPDATE Reports
          SET Status = 'RESOLVED',
              Notes = @notes,
              ResolvedAt = GETDATE(),
              UpdatedAt = GETDATE(),
              ActionTaken = 'DELETE'
          WHERE ReportID = @reportId
        `;

        await transaction.request()
          .input('reportId', sql.BigInt, reportId)
          .input('notes', sql.NVarChar, 'Đã xóa bài viết vi phạm')
          .query(updateReportQuery);

        // Commit transaction
        await transaction.commit();

        res.json({
          success: true,
          message: 'Đã xóa bài viết và cập nhật báo cáo'
        });
      } catch (error) {
        // Rollback nếu có lỗi
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting reported content:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa bài viết',
        error: error.message
      });
    }
  },

  // Xử lý báo cáo: gắn cờ vi phạm cho bài viết
  flagReportedContent: async (req, res) => {
    const { reportId } = req.params;
    const { reason } = req.body;

    try {
      // Bắt đầu transaction
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // Lấy thông tin báo cáo
        const getReportQuery = `
          SELECT * FROM Reports WHERE ReportID = @reportId
        `;

        const reportResult = await transaction.request()
          .input('reportId', sql.BigInt, reportId)
          .query(getReportQuery);

        if (reportResult.recordset.length === 0) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: 'Báo cáo không tồn tại'
          });
        }

        const report = reportResult.recordset[0];

        if (report.TargetType !== 'CONTENT') {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Báo cáo này không liên quan đến bài viết'
          });
        }

        const targetId = report.TargetID;

        // Gắn cờ vi phạm cho bài viết
        const flagPostQuery = `
          UPDATE Posts
          SET IsFlagged = 1,
              FlaggedReason = @reason,
              FlaggedAt = GETDATE()
          WHERE PostID = @targetId
        `;

        await transaction.request()
          .input('targetId', sql.BigInt, targetId)
          .input('reason', sql.NVarChar, reason || `Bị báo cáo: ${report.Title}`)
          .query(flagPostQuery);

        // Cập nhật trạng thái báo cáo
        const updateReportQuery = `
          UPDATE Reports
          SET Status = 'RESOLVED',
              Notes = @notes,
              ResolvedAt = GETDATE(),
              UpdatedAt = GETDATE(),
              ActionTaken = 'FLAG'
          WHERE ReportID = @reportId
        `;

        await transaction.request()
          .input('reportId', sql.BigInt, reportId)
          .input('notes', sql.NVarChar, `Đã gắn cờ vi phạm cho bài viết: ${reason || 'Vi phạm tiêu chuẩn cộng đồng'}`)
          .query(updateReportQuery);

        // Commit transaction
        await transaction.commit();

        res.json({
          success: true,
          message: 'Đã gắn cờ vi phạm cho bài viết và cập nhật báo cáo'
        });
      } catch (error) {
        // Rollback nếu có lỗi
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error flagging reported content:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gắn cờ vi phạm cho bài viết',
        error: error.message
      });
    }
  },

  // Xóa báo cáo (soft delete)
  deleteReport: async (req, res) => {
    const { reportId } = req.params;

    try {
      // Tạo request mới cho mỗi query
      const request = pool.request();

      const query = `
        UPDATE Reports
        SET DeletedAt = GETDATE(),
            UpdatedAt = GETDATE()
        WHERE ReportID = @reportId
      `;

      await request
        .input('reportId', sql.BigInt, reportId)
        .query(query);

      res.json({
        success: true,
        message: 'Xóa báo cáo thành công'
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa báo cáo',
        error: error.message
      });
    }
  },

  // Lấy danh sách báo cáo của người dùng hiện tại
  getMyReports: async (req, res) => {
    // Kiểm tra xem user đã được xác thực chưa
    if (!req.user || !req.user.UserID) {
      console.error('[getMyReports] No authenticated user found in request');
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem báo cáo'
      });
    }
    
    const userId = req.user.UserID;
    const { status } = req.query;
    
    console.log(`[getMyReports] UserID: ${userId}, Status: ${status || 'all'}`);
    
    try {
      // Tạo request mới cho mỗi query
      const request = pool.request();
      
      let query = `
        SELECT r.*, 
               u.FullName as TargetName
        FROM Reports r
        LEFT JOIN Users u ON r.TargetID = u.UserID AND r.TargetType = 'USER'
        WHERE r.ReporterID = @userId AND r.DeletedAt IS NULL
      `;
      
      if (status && ['PENDING', 'RESOLVED', 'REJECTED'].includes(status.toUpperCase())) {
        query += ` AND r.Status = @status`;
        request.input('status', sql.VarChar, status.toUpperCase());
      }
      
      query += ` ORDER BY r.CreatedAt DESC`;
      
      request.input('userId', sql.BigInt, userId);
      
      console.log(`[getMyReports] Executing query for user ${userId}`);
      const result = await request.query(query);
      console.log(`[getMyReports] Query results: ${result.recordset.length} reports found`);
      
      res.json({
        success: true,
        reports: result.recordset
      });
    } catch (error) {
      console.error('Error fetching user reports:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách báo cáo của bạn',
        error: error.message
      });
    }
  },
  
  // Lấy chi tiết báo cáo của người dùng hiện tại
  getMyReportDetail: async (req, res) => {
    const userId = req.user.UserID;
    const { reportId } = req.params;
    
    try {
      // Tạo request mới cho mỗi query
      const request = pool.request();
      
      // Query để lấy chi tiết báo cáo của người dùng hiện tại
      const query = `
        SELECT r.*,
               u.FullName as TargetName,
               CASE 
                 WHEN r.TargetType = 'USER' THEN u.Avatar
                 WHEN r.TargetType = 'CONTENT' THEN p.ImageURL
                 WHEN r.TargetType = 'COURSE' THEN c.ThumbnailURL
                 ELSE NULL
               END as TargetImage
        FROM Reports r
        LEFT JOIN Users u ON r.TargetID = u.UserID AND r.TargetType = 'USER'
        LEFT JOIN Posts p ON r.TargetID = p.PostID AND r.TargetType = 'CONTENT'
        LEFT JOIN Courses c ON r.TargetID = c.CourseID AND r.TargetType = 'COURSE'
        WHERE r.ReportID = @reportId
          AND r.ReporterID = @userId
          AND r.DeletedAt IS NULL
      `;
      
      const result = await request
        .input('reportId', sql.BigInt, reportId)
        .input('userId', sql.BigInt, userId)
        .query(query);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy báo cáo hoặc bạn không có quyền truy cập báo cáo này'
        });
      }
      
      res.json({
        success: true,
        report: result.recordset[0]
      });
    } catch (error) {
      console.error('Error fetching report details:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết báo cáo',
        error: error.message
      });
    }
  },
  
  // Hủy báo cáo (chỉ cho báo cáo đang PENDING)
  cancelReport: async (req, res) => {
    const userId = req.user.UserID;
    const { reportId } = req.params;
    
    try {
      // Tạo request mới cho mỗi query
      const request = pool.request();
      
      // Kiểm tra báo cáo có tồn tại và thuộc về người dùng hiện tại không
      const checkQuery = `
        SELECT * FROM Reports 
        WHERE ReportID = @reportId 
          AND ReporterID = @userId 
          AND Status = 'PENDING'
          AND DeletedAt IS NULL
      `;
      
      const checkResult = await request
        .input('reportId', sql.BigInt, reportId)
        .input('userId', sql.BigInt, userId)
        .query(checkQuery);
      
      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy báo cáo hoặc báo cáo không thể hủy'
        });
      }
      
      // Cập nhật trạng thái báo cáo thành CANCELLED (soft-delete)
      const updateQuery = `
        UPDATE Reports
        SET Status = 'REJECTED',
            Notes = 'Báo cáo đã bị hủy bởi người báo cáo',
            UpdatedAt = GETDATE(),
            ResolvedAt = GETDATE()
        WHERE ReportID = @reportId
      `;
      
      await request
        .input('reportId', sql.BigInt, reportId)
        .query(updateQuery);
      
      res.json({
        success: true,
        message: 'Hủy báo cáo thành công'
      });
    } catch (error) {
      console.error('Error cancelling report:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi hủy báo cáo',
        error: error.message
      });
    }
  },

  // Lấy các danh mục báo cáo
  getCategories: async (req, res) => {
    try {
      // Return predefined categories
      res.json({
        success: true,
        categories: [
          { value: 'USER', label: 'Người dùng vi phạm' },
          { value: 'CONTENT', label: 'Nội dung vi phạm' },
          { value: 'COURSE', label: 'Khóa học có vấn đề' },
          { value: 'EVENT', label: 'Sự kiện vi phạm' },
          { value: 'COMMENT', label: 'Bình luận xúc phạm' }
        ]
      });
    } catch (error) {
      console.error('Error fetching report categories:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh mục báo cáo',
        error: error.message
      });
    }
  }
};

module.exports = reportController; 