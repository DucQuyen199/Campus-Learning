const { poolPromise, sql } = require('../config/database');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

const reportController = {
  // Lấy danh sách tất cả báo cáo với phân trang và lọc
  getAllReports: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        category,
        sortBy = 'createdAt', 
        sortOrder = 'DESC',
        search 
      } = req.query;
  
      const offset = (page - 1) * limit;
      
      // Build the query
      let countQuery = `SELECT COUNT(*) AS total FROM Reports WHERE DeletedAt IS NULL`;
      let query = `
        SELECT 
          Reports.ReportID as id,
          Reports.Title as title,
          Reports.Content as content,
          Reports.Category as category,
          Reports.ReporterID as reporterId,
          Users.Username as reporterName,
          Reports.TargetID as targetId,
          Reports.TargetType as targetType,
          Reports.Status as status,
          Reports.Notes as notes,
          Reports.CreatedAt as createdAt,
          Reports.UpdatedAt as updatedAt,
          Reports.ResolvedAt as resolvedAt,
          Reports.ActionTaken as actionTaken
        FROM Reports 
        LEFT JOIN Users ON Reports.ReporterID = Users.UserID
        WHERE Reports.DeletedAt IS NULL
      `;
      
      // Add filters
      const whereConditions = [];
      const params = [];
      
      if (status) {
        whereConditions.push(`Reports.Status = @status`);
        params.push({ name: 'status', value: status });
      }
      
      if (category) {
        whereConditions.push(`Reports.Category = @category`);
        params.push({ name: 'category', value: category });
      }
      
      if (search) {
        whereConditions.push(`(Reports.Title LIKE @search OR Reports.Content LIKE @search)`);
        params.push({ name: 'search', value: `%${search}%` });
      }
      
      // Apply filters to both queries
      if (whereConditions.length > 0) {
        const whereClause = whereConditions.join(' AND ');
        countQuery = countQuery.replace('WHERE DeletedAt IS NULL', `WHERE DeletedAt IS NULL AND ${whereClause}`);
        query = query.replace('WHERE Reports.DeletedAt IS NULL', `WHERE Reports.DeletedAt IS NULL AND ${whereClause}`);
      }
      
      // Add sorting
      const validSortColumns = ['CreatedAt', 'Status', 'Category', 'Title'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'CreatedAt';
      const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      query += ` ORDER BY Reports.${sortColumn} ${order}`;
      
      // Add pagination
      query += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
      
      // Execute count query
      const pool = await poolPromise;
      const countResult = await pool.request();
      
      // Add parameters to count query
      params.forEach(param => {
        countResult.input(param.name, param.value);
      });
      
      const totalResult = await countResult.query(countQuery);
      const total = totalResult.recordset[0].total;
      
      // Execute main query
      const request = pool.request();
      
      // Add parameters to main query
      params.forEach(param => {
        request.input(param.name, param.value);
      });
      
      const result = await request.query(query);
      
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;
      
      res.json({
        data: result.recordset,
        pagination: {
          total,
          totalPages,
          currentPage: parseInt(page),
          hasNext,
          hasPrev
        }
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Lấy chi tiết báo cáo theo ID
  getReportById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', id)
        .query(`
          SELECT 
            r.ReportID as id,
            r.Title as title,
            r.Content as content,
            r.Category as category,
            r.ReporterID as reporterId,
            u.Username as reporterName,
            r.TargetID as targetId,
            r.TargetType as targetType,
            r.Status as status,
            r.Notes as notes,
            r.CreatedAt as createdAt,
            r.UpdatedAt as updatedAt,
            r.ResolvedAt as resolvedAt,
            r.ActionTaken as actionTaken
          FROM Reports r
          LEFT JOIN Users u ON r.ReporterID = u.UserID
          WHERE r.ReportID = @id AND r.DeletedAt IS NULL
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      res.json(result.recordset[0]);
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Cập nhật trạng thái báo cáo
  updateReportStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!['PENDING', 'RESOLVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be one of: PENDING, RESOLVED, REJECTED' });
      }
      
      const pool = await poolPromise;
      
      // Check if report exists
      const checkResult = await pool.request()
        .input('id', id)
        .query(`SELECT ReportID FROM Reports WHERE ReportID = @id AND DeletedAt IS NULL`);
      
      if (checkResult.recordset.length === 0) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      // Update the report status
      const updateRequest = pool.request()
        .input('id', id)
        .input('status', status)
        .input('notes', notes || null);
      
      let updateQuery = `
        UPDATE Reports SET 
          Status = @status, 
          UpdatedAt = GETDATE(),
          Notes = @notes
      `;
      
      // If status is RESOLVED or REJECTED, set ResolvedAt
      if (status === 'RESOLVED' || status === 'REJECTED') {
        updateQuery += `, ResolvedAt = GETDATE()`;
      }
      
      updateQuery += ` WHERE ReportID = @id`;
      
      await updateRequest.query(updateQuery);
      
      // Get updated report
      const result = await pool.request()
        .input('id', id)
        .query(`
          SELECT 
            r.ReportID as id,
            r.Title as title,
            r.Content as content,
            r.Category as category,
            r.ReporterID as reporterId,
            u.Username as reporterName,
            r.TargetID as targetId,
            r.TargetType as targetType,
            r.Status as status,
            r.Notes as notes,
            r.CreatedAt as createdAt,
            r.UpdatedAt as updatedAt,
            r.ResolvedAt as resolvedAt,
            r.ActionTaken as actionTaken
          FROM Reports r
          LEFT JOIN Users u ON r.ReporterID = u.UserID
          WHERE r.ReportID = @id
        `);
      
      res.json({
        message: 'Report status updated successfully',
        report: result.recordset[0]
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Xóa báo cáo (soft delete)
  deleteReport: async (req, res) => {
    try {
      const { id } = req.params;
      
      const pool = await poolPromise;
      
      // Check if report exists
      const checkResult = await pool.request()
        .input('id', id)
        .query(`SELECT ReportID FROM Reports WHERE ReportID = @id AND DeletedAt IS NULL`);
      
      if (checkResult.recordset.length === 0) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      // Soft delete the report
      await pool.request()
        .input('id', id)
        .query(`UPDATE Reports SET DeletedAt = GETDATE() WHERE ReportID = @id`);
      
      res.json({ message: 'Report deleted successfully' });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Lấy thống kê báo cáo
  getReportStats: async (req, res) => {
    try {
      const pool = await poolPromise;
      
      // Get total reports
      const totalResult = await pool.request().query(`
        SELECT COUNT(*) as total FROM Reports WHERE DeletedAt IS NULL
      `);
      
      // Get reports by status
      const byStatusResult = await pool.request().query(`
        SELECT Status, COUNT(*) as count 
        FROM Reports 
        WHERE DeletedAt IS NULL 
        GROUP BY Status
      `);
      
      // Format the data
      const byStatus = {
        PENDING: 0,
        RESOLVED: 0,
        REJECTED: 0
      };
      
      byStatusResult.recordset.forEach(item => {
        byStatus[item.Status] = item.count;
      });
      
      res.json({
        total: totalResult.recordset[0].total,
        pending: byStatus.PENDING || 0,
        resolved: byStatus.RESOLVED || 0,
        rejected: byStatus.REJECTED || 0,
        change: 0, // Có thể tính toán thay đổi so với tuần trước nếu cần
        changeType: 'increase' // hoặc 'decrease'
      });
    } catch (error) {
      console.error('Error fetching report statistics:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Xử lý báo cáo: xóa nội dung vi phạm
  deleteReportedContent: async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      const pool = await poolPromise;
      
      // Bắt đầu transaction
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      
      try {
        // Lấy thông tin báo cáo
        const getReportQuery = `
          SELECT * FROM Reports WHERE ReportID = @id AND DeletedAt IS NULL
        `;

        const reportResult = await transaction.request()
          .input('id', id)
          .query(getReportQuery);

        if (reportResult.recordset.length === 0) {
          await transaction.rollback();
          return res.status(404).json({ message: 'Report not found' });
        }

        const report = reportResult.recordset[0];

        if (report.TargetType !== 'CONTENT') {
          await transaction.rollback();
          return res.status(400).json({ message: 'This report is not related to content' });
        }

        const targetId = report.TargetID;

        // Xóa bài viết (soft delete)
        const deleteContentQuery = `
          UPDATE Posts
          SET DeletedAt = GETDATE(), 
              IsDeleted = 1
          WHERE PostID = @targetId
        `;

        await transaction.request()
          .input('targetId', sql.BigInt, targetId)
          .query(deleteContentQuery);

        // Cập nhật trạng thái báo cáo
        const updateReportQuery = `
          UPDATE Reports
          SET Status = 'RESOLVED',
              Notes = @notes,
              ResolvedAt = GETDATE(),
              UpdatedAt = GETDATE(),
              ActionTaken = 'DELETE'
          WHERE ReportID = @id
        `;

        await transaction.request()
          .input('id', id)
          .input('notes', sql.NVarChar, notes || 'Đã xóa nội dung vi phạm')
          .query(updateReportQuery);

        // Commit transaction
        await transaction.commit();

        res.json({
          message: 'Content has been deleted and report has been updated',
          reportId: id
        });
      } catch (error) {
        // Rollback nếu có lỗi
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting reported content:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Xử lý báo cáo: gắn cờ nội dung vi phạm
  flagReportedContent: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, notes } = req.body;
      
      const pool = await poolPromise;
      
      // Bắt đầu transaction
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      
      try {
        // Lấy thông tin báo cáo
        const getReportQuery = `
          SELECT * FROM Reports WHERE ReportID = @id AND DeletedAt IS NULL
        `;

        const reportResult = await transaction.request()
          .input('id', id)
          .query(getReportQuery);

        if (reportResult.recordset.length === 0) {
          await transaction.rollback();
          return res.status(404).json({ message: 'Report not found' });
        }

        const report = reportResult.recordset[0];

        if (report.TargetType !== 'CONTENT') {
          await transaction.rollback();
          return res.status(400).json({ message: 'This report is not related to content' });
        }

        const targetId = report.TargetID;

        // Gắn cờ vi phạm cho bài viết
        const flagContentQuery = `
          UPDATE Posts
          SET IsFlagged = 1,
              FlaggedReason = @reason,
              FlaggedAt = GETDATE()
          WHERE PostID = @targetId
        `;

        await transaction.request()
          .input('targetId', sql.BigInt, targetId)
          .input('reason', sql.NVarChar, reason || `Báo cáo: ${report.Title}`)
          .query(flagContentQuery);

        // Cập nhật trạng thái báo cáo
        const updateReportQuery = `
          UPDATE Reports
          SET Status = 'RESOLVED',
              Notes = @notes,
              ResolvedAt = GETDATE(),
              UpdatedAt = GETDATE(),
              ActionTaken = 'FLAG'
          WHERE ReportID = @id
        `;

        await transaction.request()
          .input('id', id)
          .input('notes', sql.NVarChar, notes || `Đã gắn cờ vi phạm: ${reason || 'Vi phạm tiêu chuẩn cộng đồng'}`)
          .query(updateReportQuery);

        // Commit transaction
        await transaction.commit();

        res.json({
          message: 'Content has been flagged and report has been updated',
          reportId: id
        });
      } catch (error) {
        // Rollback nếu có lỗi
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error flagging reported content:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Xuất báo cáo dưới dạng CSV
  exportReportsAsCsv: async (req, res) => {
    try {
      const { status, category, startDate, endDate } = req.query;
      
      // Build the query
      let query = `
        SELECT 
          r.ReportID,
          r.Title,
          r.Content,
          r.Category,
          r.ReporterID,
          u.Username as ReporterName,
          r.TargetID,
          r.TargetType,
          r.Status,
          r.Notes,
          r.ActionTaken,
          r.CreatedAt,
          r.UpdatedAt,
          r.ResolvedAt
        FROM Reports r
        LEFT JOIN Users u ON r.ReporterID = u.UserID
        WHERE r.DeletedAt IS NULL
      `;
      
      // Add filters
      const whereConditions = [];
      const params = [];
      
      if (status) {
        whereConditions.push(`r.Status = @status`);
        params.push({ name: 'status', value: status });
      }
      
      if (category) {
        whereConditions.push(`r.Category = @category`);
        params.push({ name: 'category', value: category });
      }
      
      if (startDate) {
        whereConditions.push(`r.CreatedAt >= @startDate`);
        params.push({ name: 'startDate', value: new Date(startDate) });
      }
      
      if (endDate) {
        whereConditions.push(`r.CreatedAt <= @endDate`);
        // Add one day to include the entire end date
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        params.push({ name: 'endDate', value: endDateTime });
      }
      
      // Apply filters
      if (whereConditions.length > 0) {
        const whereClause = whereConditions.join(' AND ');
        query += ` AND ${whereClause}`;
      }
      
      // Add sorting
      query += ` ORDER BY r.CreatedAt DESC`;
      
      // Execute query
      const pool = await poolPromise;
      const request = pool.request();
      
      // Add parameters
      params.forEach(param => {
        request.input(param.name, param.value);
      });
      
      const result = await request.query(query);
      
      // Create CSV
      const csvStringifier = createCsvStringifier({
        header: [
          { id: 'ReportID', title: 'Report ID' },
          { id: 'Title', title: 'Title' },
          { id: 'Content', title: 'Content' },
          { id: 'Category', title: 'Category' },
          { id: 'ReporterName', title: 'Reporter' },
          { id: 'TargetID', title: 'Target ID' },
          { id: 'TargetType', title: 'Target Type' },
          { id: 'Status', title: 'Status' },
          { id: 'Notes', title: 'Notes' },
          { id: 'ActionTaken', title: 'Action Taken' },
          { id: 'CreatedAt', title: 'Created At' },
          { id: 'ResolvedAt', title: 'Resolved At' }
        ]
      });
      
      const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(result.recordset);
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=reports.csv');
      
      // Send CSV data
      res.send(csvData);
    } catch (error) {
      console.error('Error exporting reports:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Get reports by category
  getReportsByCategory: async (req, res) => {
    try {
      const pool = await poolPromise;
      
      // Get reports grouped by category
      const result = await pool.request().query(`
        SELECT Category, COUNT(*) as count 
        FROM Reports 
        WHERE DeletedAt IS NULL 
        GROUP BY Category
      `);
      
      res.json(result.recordset);
    } catch (error) {
      console.error('Error fetching reports by category:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = reportController; 