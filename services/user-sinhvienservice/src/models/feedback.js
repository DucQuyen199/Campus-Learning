/*-----------------------------------------------------------------
* File: feedback.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const sql = require('mssql');
const dbConfig = require('../config/database');

const Feedback = {
  // Create a new feedback
  async create(feedbackData) {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('UserID', sql.BigInt, feedbackData.userId)
        .input('Title', sql.NVarChar(200), feedbackData.title)
        .input('Content', sql.NVarChar(sql.MAX), feedbackData.content)
        .input('Type', sql.VarChar(50), feedbackData.type)
        .input('Department', sql.NVarChar(100), feedbackData.department)
        .input('IsAnonymous', sql.Bit, feedbackData.isAnonymous || 0)
        .query(`
          INSERT INTO StudentFeedback 
            (UserID, Title, Content, Type, Department, IsAnonymous, Status, CreatedAt, UpdatedAt)
          VALUES 
            (@UserID, @Title, @Content, @Type, @Department, @IsAnonymous, 'Submitted', GETDATE(), GETDATE());
          SELECT SCOPE_IDENTITY() AS FeedbackID;
        `);
      
      return { success: true, feedbackId: result.recordset[0].FeedbackID };
    } catch (error) {
      console.error('Error creating feedback:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user feedback history
  async getUserFeedback(userId) {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('UserID', sql.BigInt, userId)
        .query(`
          SELECT 
            FeedbackID as id,
            Title as title,
            Type as category,
            Content as content,
            FORMAT(CreatedAt, 'dd/MM/yyyy') as date,
            Status as status,
            Response as response,
            Department as department
          FROM StudentFeedback
          WHERE UserID = @UserID
          ORDER BY CreatedAt DESC
        `);
      
      return { success: true, feedbackHistory: result.recordset };
    } catch (error) {
      console.error('Error fetching user feedback:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all departments for dropdown
  async getDepartments() {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .query(`
          SELECT DISTINCT Department as name
          FROM StudentFeedback
          WHERE Department IS NOT NULL
          UNION
          SELECT 'Phòng Đào tạo' as name
          UNION
          SELECT 'Phòng Công tác sinh viên' as name
          UNION
          SELECT 'Phòng Tài chính - Kế toán' as name
          UNION
          SELECT 'Phòng Khảo thí và Đảm bảo chất lượng' as name
          UNION
          SELECT 'Phòng Cơ sở vật chất' as name
          UNION
          SELECT 'Khác' as name
        `);
      
      return { success: true, departments: result.recordset };
    } catch (error) {
      console.error('Error fetching departments:', error);
      return { success: false, error: error.message };
    }
  },

  // Get feedback types for dropdown
  async getFeedbackTypes() {
    try {
      return { 
        success: true, 
        types: [
          { id: 'Suggestion', name: 'Góp ý' },
          { id: 'Complaint', name: 'Khiếu nại' },
          { id: 'Question', name: 'Câu hỏi' },
          { id: 'Request', name: 'Đề xuất' },
          { id: 'Other', name: 'Khác' }
        ]
      };
    } catch (error) {
      console.error('Error fetching feedback types:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = Feedback; 
