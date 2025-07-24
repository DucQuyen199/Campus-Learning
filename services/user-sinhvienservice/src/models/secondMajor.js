/*-----------------------------------------------------------------
* File: secondMajor.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { sqlConnection } = require('../config/database');

const SecondMajorModel = {
  // Get all available academic programs for second major
  async getAvailablePrograms() {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .query(`
          SELECT 
            ProgramID, 
            ProgramCode, 
            ProgramName, 
            Department, 
            Faculty, 
            Description, 
            TotalCredits, 
            ProgramDuration, 
            DegreeName, 
            ProgramType
          FROM AcademicPrograms
          WHERE IsActive = 1
          ORDER BY ProgramName
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getAvailablePrograms:', error);
      throw error;
    }
  },

  // Get a student's academic metrics (for checking eligibility)
  async getStudentMetrics(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT 
            UserID, 
            CumulativeGPA,
            TotalCredits
          FROM AcademicMetrics
          WHERE UserID = @userId
          AND SemesterID = (SELECT MAX(SemesterID) FROM AcademicMetrics WHERE UserID = @userId)
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error in getStudentMetrics:', error);
      throw error;
    }
  },

  // Check if a student is already registered for a second major
  async checkExistingRegistration(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT 
            smr.RegistrationID,
            smr.Status,
            ap.ProgramName,
            ap.ProgramCode
          FROM SecondMajorRegistrations smr
          JOIN AcademicPrograms ap ON smr.ProgramID = ap.ProgramID
          WHERE smr.UserID = @userId
          AND smr.Status IN ('Pending', 'Approved')
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error in checkExistingRegistration:', error);
      throw error;
    }
  },

  // Register for a second major
  async registerSecondMajor(userId, programId, currentGPA, completedCredits, reason, startSemesterId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .input('programId', sqlConnection.sql.BigInt, programId)
        .input('currentGPA', sqlConnection.sql.Decimal(5, 2), currentGPA)
        .input('completedCredits', sqlConnection.sql.Int, completedCredits)
        .input('reason', sqlConnection.sql.NVarChar(sqlConnection.sql.MAX), reason)
        .input('startSemesterId', sqlConnection.sql.BigInt, startSemesterId)
        .query(`
          INSERT INTO SecondMajorRegistrations (
            UserID, 
            ProgramID, 
            RegistrationDate, 
            CurrentGPA, 
            CompletedCredits, 
            Reason, 
            Status, 
            StartSemesterId,
            CreatedAt,
            UpdatedAt
          )
          VALUES (
            @userId, 
            @programId, 
            GETDATE(), 
            @currentGPA, 
            @completedCredits, 
            @reason, 
            'Pending', 
            @startSemesterId,
            GETDATE(),
            GETDATE()
          );
          
          SELECT SCOPE_IDENTITY() AS RegistrationID;
        `);
      
      return result.recordset[0].RegistrationID;
    } catch (error) {
      console.error('Error in registerSecondMajor:', error);
      throw error;
    }
  },

  // Get registration details
  async getRegistrationDetails(registrationId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('registrationId', sqlConnection.sql.BigInt, registrationId)
        .query(`
          SELECT 
            smr.*,
            ap.ProgramName,
            ap.ProgramCode,
            ap.Faculty,
            ap.Department,
            u.FullName as ReviewedByName,
            sem.SemesterName,
            sem.AcademicYear
          FROM SecondMajorRegistrations smr
          JOIN AcademicPrograms ap ON smr.ProgramID = ap.ProgramID
          LEFT JOIN Users u ON smr.ReviewedBy = u.UserID
          LEFT JOIN Semesters sem ON smr.StartSemesterID = sem.SemesterID
          WHERE smr.RegistrationID = @registrationId
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error in getRegistrationDetails:', error);
      throw error;
    }
  },

  // Get student's second major registrations
  async getStudentRegistrations(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT 
            smr.*,
            ap.ProgramName,
            ap.ProgramCode,
            ap.Faculty,
            ap.Department,
            u.FullName as ReviewedByName,
            sem.SemesterName,
            sem.AcademicYear
          FROM SecondMajorRegistrations smr
          JOIN AcademicPrograms ap ON smr.ProgramID = ap.ProgramID
          LEFT JOIN Users u ON smr.ReviewedBy = u.UserID
          LEFT JOIN Semesters sem ON smr.StartSemesterID = sem.SemesterID
          WHERE smr.UserID = @userId
          ORDER BY smr.RegistrationDate DESC
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getStudentRegistrations:', error);
      throw error;
    }
  },

  // Cancel a registration (only if it's pending)
  async cancelRegistration(registrationId, userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('registrationId', sqlConnection.sql.BigInt, registrationId)
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          UPDATE SecondMajorRegistrations
          SET Status = 'Cancelled', UpdatedAt = GETDATE()
          WHERE RegistrationID = @registrationId
          AND UserID = @userId
          AND Status = 'Pending';
          
          SELECT @@ROWCOUNT as AffectedRows;
        `);
      
      return result.recordset[0].AffectedRows > 0;
    } catch (error) {
      console.error('Error in cancelRegistration:', error);
      throw error;
    }
  },

  // Get current/upcoming semester for registration
  async getCurrentSemester() {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .query(`
          SELECT TOP 1 SemesterID, SemesterName, AcademicYear, StartDate, EndDate
          FROM Semesters
          WHERE Status IN ('Upcoming', 'Ongoing')
          ORDER BY StartDate ASC
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error in getCurrentSemester:', error);
      throw error;
    }
  }
};

module.exports = SecondMajorModel; 
