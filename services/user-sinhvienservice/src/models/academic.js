/*-----------------------------------------------------------------
* File: academic.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { sqlConnection } = require('../config/database');

// Academic model with database queries
const AcademicModel = {
  // Get student's academic program details
  async getProgram(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT ap.*, sp.*, u.FullName as AdvisorName
          FROM StudentPrograms sp
          JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
          LEFT JOIN Users u ON sp.AdvisorID = u.UserID
          WHERE sp.UserID = @userId
          ORDER BY sp.IsPrimary DESC
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getProgram:', error);
      throw error;
    }
  },

  // Get student's courses in program
  async getCourses(programId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('programId', sqlConnection.sql.BigInt, programId)
        .query(`
          SELECT s.*, ps.Semester, ps.IsRequired, ps.SubjectType
          FROM ProgramSubjects ps
          JOIN Subjects s ON ps.SubjectID = s.SubjectID
          WHERE ps.ProgramID = @programId
          ORDER BY ps.Semester, s.SubjectName
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getCourses:', error);
      throw error;
    }
  },

  // Get student's academic results (grades)
  async getGrades(userId, semesterId = null) {
    try {
      let query = `
        SELECT ar.*, cc.ClassCode, s.SubjectCode, s.SubjectName, s.Credits,
               sem.SemesterName, sem.AcademicYear
        FROM AcademicResults ar
        JOIN CourseClasses cc ON ar.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
        WHERE ar.UserID = @userId
      `;
      
      if (semesterId) {
        query += ' AND cc.SemesterID = @semesterId';
      }
      
      query += ' ORDER BY sem.StartDate DESC, s.SubjectName';
      
      const poolConnection = await sqlConnection.connect();
      const request = poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId);
        
      if (semesterId) {
        request.input('semesterId', sqlConnection.sql.BigInt, semesterId);
      }
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error in getGrades:', error);
      throw error;
    }
  },

  // Get student's conduct scores
  async getConductScores(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT cs.*, sem.SemesterName, sem.AcademicYear
          FROM ConductScores cs
          JOIN Semesters sem ON cs.SemesterID = sem.SemesterID
          WHERE cs.UserID = @userId
          ORDER BY sem.StartDate DESC
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getConductScores:', error);
      throw error;
    }
  },

  // Get student's academic warnings
  async getWarnings(userId) {
    try {      
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT aw.*, sem.SemesterName, sem.AcademicYear, u.FullName as CreatedByName
          FROM AcademicWarnings aw
          JOIN Semesters sem ON aw.SemesterID = sem.SemesterID
          JOIN Users u ON aw.CreatedBy = u.UserID
          WHERE aw.UserID = @userId
          ORDER BY aw.WarningDate DESC
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getWarnings:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  // Get student's academic metrics
  async getMetrics(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Query academic metrics
      const query = `
        SELECT 
          am.MetricID, am.UserID, am.SemesterID, 
          am.TotalCredits, am.EarnedCredits,
          am.SemesterGPA, am.CumulativeGPA, 
          am.AcademicStanding, am.RankInClass,
          s.SemesterName, s.AcademicYear
        FROM AcademicMetrics am
        JOIN Semesters s ON am.SemesterID = s.SemesterID
        WHERE am.UserID = @userId
        ORDER BY s.StartDate DESC
      `;
      
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(query);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getMetrics:', error);
      // Return empty array instead of throwing
      return [];
    }
  },

  // Get student's registered courses
  async getRegisteredCourses(userId, semesterId = null) {
    try {
      let query = `
        SELECT cr.*, cc.ClassCode, s.SubjectCode, s.SubjectName, s.Credits,
               sem.SemesterName, sem.AcademicYear
        FROM CourseRegistrations cr
        JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
        WHERE cr.UserID = @userId
      `;
      
      if (semesterId) {
        query += ` AND cc.SemesterID = @semesterId`;
      }
      
      query += ` ORDER BY cr.RegistrationTime DESC`;
      
      const poolConnection = await sqlConnection.connect();
      const request = poolConnection.request().input('userId', sqlConnection.sql.BigInt, userId);
      
      if (semesterId) {
        request.input('semesterId', sqlConnection.sql.BigInt, semesterId);
      }
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error in getRegisteredCourses:', error);
      throw error;
    }
  },

  // Get available courses for registration
  async getAvailableCourses(semesterId = null, searchQuery = '') {
    try {
      // Prepare query to get available classes for registration
      let query = `
        SELECT 
          cc.ClassID, cc.ClassCode, cc.MaxStudents, cc.CurrentStudents, 
          (cc.MaxStudents - cc.CurrentStudents) as AvailableSlots,
          cc.Schedule, cc.Location, cc.Type as ClassType,
          s.SubjectCode, s.SubjectName, s.Credits, 
          u.FullName as TeacherName,
          sem.SemesterName, sem.AcademicYear
        FROM CourseClasses cc
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
        LEFT JOIN Users u ON cc.TeacherID = u.UserID
        WHERE cc.Status = 'Registration'  -- Only classes in registration phase
      `;
      
      // Add semester filter if provided
      if (semesterId) {
        query += ` AND cc.SemesterID = @semesterId`;
      } else {
        // If no semester specified, default to current semester
        query += ` AND sem.IsCurrent = 1`;
      }
      
      // Add search filter if provided
      if (searchQuery) {
        query += ` AND (
          s.SubjectCode LIKE '%' + @searchQuery + '%' 
          OR s.SubjectName LIKE '%' + @searchQuery + '%'
          OR u.FullName LIKE '%' + @searchQuery + '%'
          OR cc.ClassCode LIKE '%' + @searchQuery + '%'
        )`;
      }
      
      // Order by subject name
      query += ` ORDER BY s.SubjectName`;
      
      const poolConnection = await sqlConnection.connect();
      const request = poolConnection.request();
      
      if (semesterId) {
        request.input('semesterId', sqlConnection.sql.BigInt, semesterId);
      }
      
      if (searchQuery) {
        request.input('searchQuery', sqlConnection.sql.NVarChar, searchQuery);
      }
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error in getAvailableCourses:', error);
      throw error;
    }
  },

  // Check if registration is open for a class
  async isRegistrationOpen(classId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('classId', sqlConnection.sql.BigInt, classId)
        .query(`
          SELECT 
            cc.Status as ClassStatus, 
            sem.RegistrationStartDate, 
            sem.RegistrationEndDate,
            sem.Status as SemesterStatus
          FROM CourseClasses cc
          JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
          WHERE cc.ClassID = @classId
        `);
      
      if (result.recordset.length === 0) {
        return false;
      }
      
      const classInfo = result.recordset[0];
      const now = new Date();
      
      // Check if class is in registration phase
      if (classInfo.ClassStatus !== 'Registration') {
        return false;
      }
      
      // Check if semester is active for registration
      if (classInfo.SemesterStatus !== 'Upcoming' && classInfo.SemesterStatus !== 'Ongoing') {
        return false;
      }
      
      // Check if within registration period
      const startDate = new Date(classInfo.RegistrationStartDate);
      const endDate = new Date(classInfo.RegistrationEndDate);
      
      return now >= startDate && now <= endDate;
    } catch (error) {
      console.error('Error in isRegistrationOpen:', error);
      throw error;
    }
  },

  // Get class details
  async getClassDetails(classId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('classId', sqlConnection.sql.BigInt, classId)
        .query(`
          SELECT 
            cc.ClassID, cc.ClassCode, cc.MaxStudents, cc.CurrentStudents,
            cc.Status, cc.Type, cc.Schedule, cc.Location,
            s.SubjectID, s.SubjectCode, s.SubjectName, s.Credits,
            sem.SemesterID, sem.SemesterName, sem.AcademicYear,
            u.UserID as TeacherID, u.FullName as TeacherName
          FROM CourseClasses cc
          JOIN Subjects s ON cc.SubjectID = s.SubjectID
          JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
          LEFT JOIN Users u ON cc.TeacherID = u.UserID
          WHERE cc.ClassID = @classId
        `);
      
      if (result.recordset.length === 0) {
        throw new Error('Class not found');
      }
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error in getClassDetails:', error);
      throw error;
    }
  },

  // Check if student already registered for a class
  async isAlreadyRegistered(userId, classId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .input('classId', sqlConnection.sql.BigInt, classId)
        .query(`
          SELECT COUNT(*) as count
          FROM CourseRegistrations
          WHERE UserID = @userId AND ClassID = @classId
          AND Status IN ('Pending', 'Approved')
        `);
      
      return result.recordset[0].count > 0;
    } catch (error) {
      console.error('Error in isAlreadyRegistered:', error);
      throw error;
    }
  },

  // Register for a course
  async registerCourse(userId, classId, registrationType = 'Regular') {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Begin transaction
      const transaction = new sqlConnection.sql.Transaction(poolConnection);
      await transaction.begin();
      
      try {
        // First, insert the registration
        const registrationResult = await new sqlConnection.sql.Request(transaction)
          .input('userId', sqlConnection.sql.BigInt, userId)
          .input('classId', sqlConnection.sql.BigInt, classId)
          .input('registrationType', sqlConnection.sql.VarChar, registrationType || 'Regular')
          .query(`
            INSERT INTO CourseRegistrations (
              UserID, ClassID, RegistrationType, Status
            )
            OUTPUT INSERTED.RegistrationID
            VALUES (
              @userId, @classId, @registrationType, 'Pending'
            )
          `);
        
        const registrationId = registrationResult.recordset[0].RegistrationID;
        
        // Then, update the class current students count
        await new sqlConnection.sql.Request(transaction)
          .input('classId', sqlConnection.sql.BigInt, classId)
          .query(`
            UPDATE CourseClasses
            SET CurrentStudents = CurrentStudents + 1
            WHERE ClassID = @classId
          `);
        
        // Commit the transaction
        await transaction.commit();
        
        // Get the complete registration details
        const detailsResult = await this.getRegistrationDetails(registrationId);
        
        return detailsResult;
      } catch (error) {
        // If error occurs, roll back the transaction
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in registerCourse:', error);
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
            cr.*, cc.ClassCode, s.SubjectCode, s.SubjectName, s.Credits,
            sem.SemesterName, sem.AcademicYear
          FROM CourseRegistrations cr
          JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
          JOIN Subjects s ON cc.SubjectID = s.SubjectID
          JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
          WHERE cr.RegistrationID = @registrationId
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error in getRegistrationDetails:', error);
      throw error;
    }
  },

  // Cancel a course registration
  async cancelRegistration(registrationId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Get the class ID for this registration
      const regDetails = await this.getRegistrationDetails(registrationId);
      if (!regDetails) {
        throw new Error('Registration not found');
      }
      
      const classId = regDetails.ClassID;
      
      // Begin transaction
      const transaction = new sqlConnection.sql.Transaction(poolConnection);
      await transaction.begin();
      
      try {
        // First, update the registration status
        await new sqlConnection.sql.Request(transaction)
          .input('registrationId', sqlConnection.sql.BigInt, registrationId)
          .query(`
            UPDATE CourseRegistrations
            SET Status = 'Cancelled', CancelledAt = GETDATE()
            WHERE RegistrationID = @registrationId
          `);
        
        // Then, update the class current students count
        await new sqlConnection.sql.Request(transaction)
          .input('classId', sqlConnection.sql.BigInt, classId)
          .query(`
            UPDATE CourseClasses
            SET CurrentStudents = CASE 
              WHEN CurrentStudents > 0 THEN CurrentStudents - 1
              ELSE 0
            END
            WHERE ClassID = @classId
          `);
        
        // Commit the transaction
        await transaction.commit();
        
        return true;
      } catch (error) {
        // If error occurs, roll back the transaction
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in cancelRegistration:', error);
      throw error;
    }
  },

  // Get all semesters
  async getSemesters() {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .query(`
          SELECT 
            SemesterID, SemesterCode, SemesterName, AcademicYear,
            StartDate, EndDate, 
            RegistrationStartDate, RegistrationEndDate,
            Status, IsCurrent
          FROM Semesters
          ORDER BY StartDate DESC
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getSemesters:', error);
      throw error;
    }
  },

  // Get current registration period
  async getRegistrationPeriod() {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .query(`
          SELECT TOP 1
            SemesterID, SemesterName, AcademicYear,
            RegistrationStartDate, RegistrationEndDate
          FROM Semesters
          WHERE IsCurrent = 1
        `);
      
      if (result.recordset.length === 0) {
        // No current semester found, return default
        return {
          isActive: false,
          currentSemester: 'Không có học kỳ hiện tại',
          startDate: null,
          endDate: null
        };
      }
      
      const semesterInfo = result.recordset[0];
      const now = new Date();
      const startDate = new Date(semesterInfo.RegistrationStartDate);
      const endDate = new Date(semesterInfo.RegistrationEndDate);
      
      return {
        isActive: now >= startDate && now <= endDate,
        currentSemester: `${semesterInfo.SemesterName}, ${semesterInfo.AcademicYear}`,
        startDate: semesterInfo.RegistrationStartDate,
        endDate: semesterInfo.RegistrationEndDate
      };
    } catch (error) {
      console.error('Error in getRegistrationPeriod:', error);
      throw error;
    }
  },

  // Get courses that can be retaken (based on low grades)
  async getRetakeableCourses(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT 
            ar.ResultID, 
            s.SubjectID,
            s.SubjectCode as courseCode,
            s.SubjectName as courseName,
            s.Credits as credits,
            ar.LetterGrade as previousGrade,
            ar.TotalScore as previousScore,
            sem.SemesterName,
            sem.AcademicYear,
            CONCAT(sem.SemesterName, ' - ', sem.AcademicYear) as semester,
            cc.ClassID
          FROM AcademicResults ar
          JOIN CourseClasses cc ON ar.ClassID = cc.ClassID
          JOIN Subjects s ON cc.SubjectID = s.SubjectID
          JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
          WHERE ar.UserID = @userId
          -- Filter for eligible retakes (grades below C or equivalent)
          AND (
            (ar.LetterGrade IN ('F', 'D', 'D+', 'C-'))
            OR (ar.TotalScore IS NOT NULL AND ar.TotalScore < 5.5)
          )
          -- Not currently registered for retake
          AND NOT EXISTS (
            SELECT 1 
            FROM CourseRegistrations cr
            JOIN CourseClasses cc2 ON cr.ClassID = cc2.ClassID
            WHERE cr.UserID = @userId
            AND cc2.SubjectID = s.SubjectID
            AND cr.RegistrationType IN ('Retake', 'Improvement')
            AND cr.Status IN ('Pending', 'Approved')
          )
          ORDER BY s.SubjectName
        `);
      
      // Add status to each course (whether it's available for retake now)
      const retakeableCourses = await Promise.all(result.recordset.map(async (course) => {
        // Check if any classes for this course are open for registration
        const availableClasses = await poolConnection.request()
          .input('subjectId', sqlConnection.sql.BigInt, course.SubjectID)
          .input('userId', sqlConnection.sql.BigInt, userId)
          .query(`
            SELECT cc.ClassID, cc.ClassCode 
            FROM CourseClasses cc
            JOIN Semesters s ON cc.SemesterID = s.SemesterID
            WHERE cc.SubjectID = @subjectId
            AND cc.Status = 'Registration'
            AND (cc.Type = 'Retake' OR cc.Type = 'Regular')
            AND cc.CurrentStudents < cc.MaxStudents
            AND s.IsCurrent = 1
          `);
        
        return {
          ...course,
          classOptions: availableClasses.recordset,
          status: availableClasses.recordset.length > 0 ? 'Available' : 'Not Available',
          id: course.ResultID // Use ResultID as unique identifier
        };
      }));
      
      return retakeableCourses;
    } catch (error) {
      console.error('Error in getRetakeableCourses:', error);
      throw error;
    }
  }
};

module.exports = AcademicModel; 
