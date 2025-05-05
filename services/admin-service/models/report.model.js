const { poolPromise, sql } = require('../config/database');

class Report {
  constructor(report) {
    this.reportId = report.ReportID;
    this.reporterId = report.ReporterID;
    this.targetType = report.TargetType;
    this.targetId = report.TargetID;
    this.category = report.Category;
    this.title = report.Title;
    this.description = report.Description;
    this.status = report.Status || 'PENDING';
    this.notes = report.Notes;
    this.resolvedAt = report.ResolvedAt;
    this.resolvedBy = report.ResolvedBy;
    this.createdAt = report.CreatedAt;
    this.updatedAt = report.UpdatedAt;
    this.deletedAt = report.DeletedAt;
  }

  // Create a new report
  static async create(newReport) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('reporterId', sql.BigInt, newReport.reporterId)
        .input('targetType', sql.VarChar(20), newReport.targetType)
        .input('targetId', sql.BigInt, newReport.targetId)
        .input('category', sql.VarChar(50), newReport.category)
        .input('title', sql.NVarChar(200), newReport.title)
        .input('description', sql.NVarChar(sql.MAX), newReport.description)
        .query(`
          INSERT INTO Reports (
            ReporterID, TargetType, TargetID, Category, 
            Title, Description, Status, CreatedAt, UpdatedAt
          )
          VALUES (
            @reporterId, @targetType, @targetId, @category,
            @title, @description, 'PENDING', GETDATE(), GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS ReportID;
        `);

      return result.recordset[0].ReportID;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  // Get all reports
  static async findAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .query(`
          SELECT r.*, u.FullName as ReporterName,
                 CASE 
                   WHEN r.TargetType = 'USER' THEN (SELECT FullName FROM Users WHERE UserID = r.TargetID)
                   WHEN r.TargetType = 'COURSE' THEN (SELECT Title FROM Courses WHERE CourseID = r.TargetID)
                   WHEN r.TargetType = 'EVENT' THEN (SELECT Title FROM Events WHERE EventID = r.TargetID)
                   ELSE NULL
                 END as TargetName
          FROM Reports r
          LEFT JOIN Users u ON r.ReporterID = u.UserID
          WHERE r.DeletedAt IS NULL
          ORDER BY r.CreatedAt DESC
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error finding all reports:', error);
      throw error;
    }
  }

  // Get report by ID
  static async findById(reportId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('reportId', sql.BigInt, reportId)
        .query(`
          SELECT r.*, u.FullName as ReporterName, u.Email as ReporterEmail,
                 CASE 
                   WHEN r.TargetType = 'USER' THEN (SELECT FullName FROM Users WHERE UserID = r.TargetID)
                   WHEN r.TargetType = 'COURSE' THEN (SELECT Title FROM Courses WHERE CourseID = r.TargetID)
                   WHEN r.TargetType = 'EVENT' THEN (SELECT Title FROM Events WHERE EventID = r.TargetID)
                   ELSE NULL
                 END as TargetName
          FROM Reports r
          LEFT JOIN Users u ON r.ReporterID = u.UserID
          WHERE r.ReportID = @reportId AND r.DeletedAt IS NULL
        `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error finding report by id:', error);
      throw error;
    }
  }

  // Update report status
  static async updateStatus(reportId, status, notes, userId) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input('reportId', sql.BigInt, reportId)
        .input('status', sql.VarChar(20), status)
        .input('notes', sql.NVarChar(500), notes || null)
        .input('resolvedAt', sql.DateTime, status === 'PENDING' ? null : new Date())
        .input('resolvedBy', sql.BigInt, status === 'PENDING' ? null : userId)
        .query(`
          UPDATE Reports
          SET Status = @status,
              Notes = @notes,
              ResolvedAt = @resolvedAt,
              ResolvedBy = @resolvedBy,
              UpdatedAt = GETDATE()
          WHERE ReportID = @reportId AND DeletedAt IS NULL
        `);

      return true;
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }

  // Soft delete a report
  static async delete(reportId) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input('reportId', sql.BigInt, reportId)
        .query(`
          UPDATE Reports
          SET DeletedAt = GETDATE()
          WHERE ReportID = @reportId AND DeletedAt IS NULL
        `);

      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // Get report statistics
  static async getStatistics() {
    try {
      const pool = await poolPromise;
      
      // Get overall statistics
      const overviewResult = await pool.request()
        .query(`
          SELECT 
            COUNT(*) as TotalReports,
            SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) as PendingReports,
            SUM(CASE WHEN Status = 'RESOLVED' THEN 1 ELSE 0 END) as ResolvedReports,
            SUM(CASE WHEN Status = 'REJECTED' THEN 1 ELSE 0 END) as RejectedReports
          FROM Reports
          WHERE DeletedAt IS NULL
        `);
      
      // Get reports by month for the last 6 months
      const monthlyResult = await pool.request()
        .query(`
          SELECT 
            FORMAT(CreatedAt, 'yyyy-MM') as Month,
            COUNT(*) as ReportCount,
            SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) as PendingCount,
            SUM(CASE WHEN Status = 'RESOLVED' THEN 1 ELSE 0 END) as ResolvedCount,
            SUM(CASE WHEN Status = 'REJECTED' THEN 1 ELSE 0 END) as RejectedCount
          FROM Reports
          WHERE DeletedAt IS NULL
          AND CreatedAt >= DATEADD(month, -6, GETDATE())
          GROUP BY FORMAT(CreatedAt, 'yyyy-MM')
          ORDER BY Month DESC
        `);

      return {
        overview: overviewResult.recordset[0],
        reportStatus: monthlyResult.recordset
      };
    } catch (error) {
      console.error('Error getting report statistics:', error);
      throw error;
    }
  }

  // Get reports by category
  static async getByCategory() {
    try {
      const pool = await poolPromise;
      
      // Get reports by category
      const categoryResult = await pool.request()
        .query(`
          SELECT 
            Category,
            COUNT(*) as ReportCount,
            SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) as PendingCount,
            SUM(CASE WHEN Status = 'RESOLVED' THEN 1 ELSE 0 END) as ResolvedCount,
            SUM(CASE WHEN Status = 'REJECTED' THEN 1 ELSE 0 END) as RejectedCount
          FROM Reports
          WHERE DeletedAt IS NULL
          GROUP BY Category
          ORDER BY ReportCount DESC
        `);
      
      // Get reports by target type
      const targetTypeResult = await pool.request()
        .query(`
          SELECT 
            TargetType,
            COUNT(*) as ReportCount,
            SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) as PendingCount,
            SUM(CASE WHEN Status = 'RESOLVED' THEN 1 ELSE 0 END) as ResolvedCount,
            SUM(CASE WHEN Status = 'REJECTED' THEN 1 ELSE 0 END) as RejectedCount
          FROM Reports
          WHERE DeletedAt IS NULL
          GROUP BY TargetType
          ORDER BY ReportCount DESC
        `);

      return {
        byCategory: categoryResult.recordset,
        byTargetType: targetTypeResult.recordset
      };
    } catch (error) {
      console.error('Error getting reports by category:', error);
      throw error;
    }
  }
}

module.exports = Report; 