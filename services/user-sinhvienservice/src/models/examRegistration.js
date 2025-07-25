/*-----------------------------------------------------------------
* File: examRegistration.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { sqlConnection } = require('../config/database');

// Exam Registration model with database queries
const ExamRegistrationModel = {
  /**
   * Get available exams for improvement for a specific student
   */
  async getAvailableExams(userId, semesterId = null) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      let query = `
        SELECT 
          e.ExamID, 
          e.ExamName, 
          s.SubjectID,
          s.SubjectCode,
          s.SubjectName,
          s.Credits,
          cc.ClassID,
          ar.LetterGrade AS CurrentGrade,
          e.ExamDate,
          e.StartTime,
          e.EndTime,
          e.Location AS ExamRoom,
          e.Status,
          200000 AS Fee, -- Default fee for improvement exams
          CASE
            WHEN (ar.LetterGrade IN ('A', 'B+', 'B', 'C+', 'C') AND e.Status = 'Scheduled' AND er.ExamRegistrationID IS NULL) THEN 'Available'
            WHEN er.ExamRegistrationID IS NOT NULL THEN 'Already Registered'
            WHEN e.Status != 'Scheduled' THEN 'Not Available'
            ELSE 'Not Eligible'
          END AS RegistrationStatus
        FROM Exams e
        JOIN CourseClasses cc ON e.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN CourseRegistrations cr ON cc.ClassID = cr.ClassID
        JOIN AcademicResults ar ON cr.RegistrationID = ar.ResultID
        LEFT JOIN ExamRegistrations er ON e.ExamID = er.ExamID AND er.UserID = @userId AND er.Status IN ('Pending', 'Approved')
        WHERE 
          ar.UserID = @userId
          AND ar.LetterGrade IN ('A', 'B+', 'B', 'C+', 'C') -- Can improve if grade is C or higher
          AND e.ExamType = 'Improvement'
      `;
      
      if (semesterId) {
        query += ` AND cc.SemesterID = @semesterId`;
      } else {
        // If no semester specified, get exams from current or upcoming semesters
        query += ` AND e.ExamDate >= GETDATE()`;
      }
      
      query += ` ORDER BY e.ExamDate, e.StartTime`;
      
      const request = poolConnection.request();
      request.input('userId', sqlConnection.sql.BigInt, userId);
      
      if (semesterId) {
        request.input('semesterId', sqlConnection.sql.BigInt, semesterId);
      }
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error in getAvailableExams model:', error);
      throw error;
    }
  },

  /**
   * Get a student's exam registration history
   */
  async getRegistrationHistory(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      const query = `
        SELECT 
          er.ExamRegistrationID,
          er.ExamID,
          er.RegistrationTime,
          er.Status,
          e.ExamName,
          e.ExamDate,
          e.StartTime,
          e.EndTime,
          e.Location AS ExamRoom,
          s.SubjectCode,
          s.SubjectName,
          s.Credits,
          sem.SemesterName,
          sem.AcademicYear,
          200000 AS Fee, -- Default fee for improvement exams
          er.AdminApproval,
          er.ApprovedAt,
          u.FullName AS ApprovedBy,
          er.CancellationReason
        FROM ExamRegistrations er
        JOIN Exams e ON er.ExamID = e.ExamID
        JOIN CourseClasses cc ON e.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
        LEFT JOIN Users u ON er.ApprovedBy = u.UserID
        WHERE er.UserID = @userId
        ORDER BY er.RegistrationTime DESC
      `;
      
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(query);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getRegistrationHistory model:', error);
      throw error;
    }
  },

  /**
   * Get active semesters for exam registration
   */
  async getActiveSemesters() {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Simplified query that will work with most SQL Server schemas
      const query = `
        SELECT
          SemesterID,
          SemesterCode,
          SemesterName,
          AcademicYear,
          StartDate,
          EndDate,
          RegistrationStartDate,
          RegistrationEndDate,
          Status
        FROM Semesters
        WHERE Status IN ('Upcoming', 'Ongoing')
        ORDER BY StartDate DESC
      `;
      
      const result = await poolConnection.request().query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error in getActiveSemesters model:', error);
      throw error;
    }
  },

  /**
   * Register for improvement exams
   */
  async registerForExams(userId, examIds, semesterId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Start a transaction
      const transaction = new sqlConnection.sql.Transaction(poolConnection);
      await transaction.begin();
      
      try {
        // Check if exams are valid and available
        for (const examId of examIds) {
          const checkResult = await poolConnection.request()
            .input('userId', sqlConnection.sql.BigInt, userId)
            .input('examId', sqlConnection.sql.BigInt, examId)
            .query(`
              SELECT 
                e.ExamID,
                e.Status,
                ar.LetterGrade,
                er.ExamRegistrationID
              FROM Exams e
              JOIN CourseClasses cc ON e.ClassID = cc.ClassID
              JOIN CourseRegistrations cr ON cc.ClassID = cr.ClassID
              JOIN AcademicResults ar ON cr.RegistrationID = ar.ResultID
              LEFT JOIN ExamRegistrations er ON e.ExamID = er.ExamID AND er.UserID = @userId AND er.Status IN ('Pending', 'Approved')
              WHERE 
                ar.UserID = @userId
                AND e.ExamID = @examId
            `);
          
          if (checkResult.recordset.length === 0) {
            throw new Error(`Invalid exam ID: ${examId}`);
          }
          
          const exam = checkResult.recordset[0];
          
          if (exam.ExamRegistrationID) {
            throw new Error(`Already registered for exam ID: ${examId}`);
          }
          
          if (exam.Status !== 'Scheduled') {
            throw new Error(`Exam ID ${examId} is not available for registration`);
          }
          
          if (!['A', 'B+', 'B', 'C+', 'C'].includes(exam.LetterGrade)) {
            throw new Error(`Not eligible for improvement for exam ID: ${examId}`);
          }
        }
        
        // Insert registrations
        const registrations = [];
        
        for (const examId of examIds) {
          const registrationResult = await poolConnection.request()
            .input('userId', sqlConnection.sql.BigInt, userId)
            .input('examId', sqlConnection.sql.BigInt, examId)
            .input('registrationTime', sqlConnection.sql.DateTime, new Date())
            .input('status', sqlConnection.sql.VarChar(20), 'Pending')
            .query(`
              INSERT INTO ExamRegistrations (
                UserID, ExamID, RegistrationTime, Status, CreatedAt, UpdatedAt
              )
              VALUES (
                @userId, @examId, @registrationTime, @status, @registrationTime, @registrationTime
              );
              
              SELECT SCOPE_IDENTITY() AS ExamRegistrationID;
            `);
          
          const registrationId = registrationResult.recordset[0].ExamRegistrationID;
          registrations.push({ examId, registrationId });
        }
        
        // Commit the transaction
        await transaction.commit();
        
        return { registrations };
      } catch (error) {
        // If there's an error, roll back the transaction
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in registerForExams model:', error);
      throw error;
    }
  },

  /**
   * Get exam registration fee information
   */
  async getExamFeeInfo() {
    try {
      // In a real application, this might come from a configuration table
      // For now, returning hardcoded values
      return {
        feePerExam: 200000,
        currency: 'VND',
        paymentDeadline: 3, // days after registration
        refundPolicy: 'Full refund if cancelled at least 7 days before exam',
        notes: [
          'Điểm thi cải thiện sẽ thay thế điểm hiện tại nếu cao hơn',
          'Lịch thi cải thiện sẽ được sắp xếp sau khi kết thúc đợt đăng ký',
          'Sinh viên sẽ nhận được email xác nhận sau khi đăng ký thành công'
        ]
      };
    } catch (error) {
      console.error('Error in getExamFeeInfo model:', error);
      throw error;
    }
  },

  /**
   * Cancel exam registration
   */
  async cancelRegistration(userId, registrationId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Check if registration exists and belongs to user
      const checkResult = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .input('registrationId', sqlConnection.sql.BigInt, registrationId)
        .query(`
          SELECT * FROM ExamRegistrations
          WHERE ExamRegistrationID = @registrationId AND UserID = @userId
        `);
      
      if (checkResult.recordset.length === 0) {
        throw new Error('Registration not found or does not belong to user');
      }
      
      const registration = checkResult.recordset[0];
      
      if (registration.Status === 'Cancelled') {
        throw new Error('Registration is already cancelled');
      }
      
      // Update registration status
      await poolConnection.request()
        .input('registrationId', sqlConnection.sql.BigInt, registrationId)
        .input('cancelledAt', sqlConnection.sql.DateTime, new Date())
        .input('reason', sqlConnection.sql.NVarChar(255), 'Cancelled by student')
        .query(`
          UPDATE ExamRegistrations
          SET 
            Status = 'Cancelled',
            CancelledAt = @cancelledAt,
            CancellationReason = @reason,
            UpdatedAt = @cancelledAt
          WHERE ExamRegistrationID = @registrationId
        `);
      
      return { message: 'Registration cancelled successfully' };
    } catch (error) {
      console.error('Error in cancelRegistration model:', error);
      throw error;
    }
  }
};

module.exports = ExamRegistrationModel; 
