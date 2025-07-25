/*-----------------------------------------------------------------
* File: courseRegistration.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const sql = require('mssql');
const dbConfig = require('../config/database');

const CourseRegistration = {
  // Get registered courses for a student in a semester
  async getRegisteredCourses(userId, semesterId) {
    try {
      const pool = await sql.connect(dbConfig);
      
      // Query to get courses with additional details
      const query = `
        SELECT 
          cr.RegistrationID as id,
          s.SubjectCode as courseCode,
          s.SubjectName as courseName,
          cc.ClassCode as section,
          s.Credits as credits,
          cc.Schedule as scheduleJson,
          cc.Location as classroom,
          u.FullName as instructor,
          cr.Status as status,
          cr.RegistrationType as registrationType,
          CASE 
            WHEN cc.Status = 'Planned' OR cc.Status = 'Registration' THEN 1
            ELSE 0
          END as canCancel
        FROM CourseRegistrations cr
        JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN Users u ON cc.TeacherID = u.UserID
        WHERE cr.UserID = @UserID
        AND cc.SemesterID = @SemesterID
        ORDER BY s.SubjectCode
      `;
      
      const result = await pool.request()
        .input('UserID', sql.BigInt, userId)
        .input('SemesterID', sql.BigInt, semesterId)
        .query(query);
      
      // Process the results to format schedule information
      const registeredCourses = result.recordset.map(course => {
        // Parse schedule JSON (assuming it's stored as a JSON string)
        let schedule = { days: [], timeSlots: [] };
        try {
          if (course.scheduleJson) {
            const scheduleObj = JSON.parse(course.scheduleJson);
            if (scheduleObj.days && scheduleObj.timeSlots) {
              schedule = scheduleObj;
            }
          }
        } catch (e) {
          console.error('Error parsing schedule JSON:', e);
        }
        
        // Format days of week
        let daysOfWeek = '';
        if (schedule.days && schedule.days.length > 0) {
          const dayMapping = {
            'Monday': 'Thứ 2',
            'Tuesday': 'Thứ 3',
            'Wednesday': 'Thứ 4',
            'Thursday': 'Thứ 5',
            'Friday': 'Thứ 6',
            'Saturday': 'Thứ 7',
            'Sunday': 'Chủ nhật'
          };
          daysOfWeek = schedule.days.map(day => dayMapping[day] || day).join(', ');
        }
        
        // Format time slots
        let timeSlot = '';
        if (schedule.timeSlots && schedule.timeSlots.length > 0) {
          // Assume timeSlots is an array of objects with start and end properties
          // or just concatenate them if they're strings
          timeSlot = Array.isArray(schedule.timeSlots) 
            ? schedule.timeSlots.map(slot => 
                typeof slot === 'object' 
                  ? `${slot.start} - ${slot.end}` 
                  : slot
              ).join(', ')
            : schedule.timeSlots;
        }
        
        // Map registration status
        const statusMapping = {
          'Pending': 'Chờ duyệt',
          'Approved': 'Đã xác nhận',
          'Rejected': 'Bị từ chối',
          'Cancelled': 'Đã hủy'
        };
        
        return {
          ...course,
          dayOfWeek: daysOfWeek || 'Chưa có lịch',
          timeSlot: timeSlot || 'Chưa có lịch',
          status: statusMapping[course.status] || course.status,
          rawStatus: course.status
        };
      });
      
      return { success: true, registeredCourses };
    } catch (error) {
      console.error('Error fetching registered courses:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get all available semesters
  async getSemesters() {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .query(`
          SELECT 
            SemesterID as id,
            SemesterCode as code,
            SemesterName as name,
            AcademicYear as academicYear,
            IsCurrent as isCurrent
          FROM Semesters
          ORDER BY StartDate DESC
        `);
      
      return { success: true, semesters: result.recordset };
    } catch (error) {
      console.error('Error fetching semesters:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get current semester
  async getCurrentSemester() {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .query(`
          SELECT TOP 1
            SemesterID as id,
            SemesterCode as code,
            SemesterName as name,
            AcademicYear as academicYear
          FROM Semesters
          WHERE IsCurrent = 1
          ORDER BY StartDate DESC
        `);
      
      if (result.recordset.length > 0) {
        return { success: true, semester: result.recordset[0] };
      } else {
        // Fallback to most recent semester if no current one is set
        const fallbackResult = await pool.request()
          .query(`
            SELECT TOP 1
              SemesterID as id,
              SemesterCode as code,
              SemesterName as name,
              AcademicYear as academicYear
            FROM Semesters
            ORDER BY StartDate DESC
          `);
        
        if (fallbackResult.recordset.length > 0) {
          return { success: true, semester: fallbackResult.recordset[0] };
        } else {
          return { success: false, error: 'No semesters found' };
        }
      }
    } catch (error) {
      console.error('Error fetching current semester:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Cancel course registration
  async cancelRegistration(userId, registrationId) {
    try {
      const pool = await sql.connect(dbConfig);
      
      // First check if the registration exists and belongs to the user
      const checkResult = await pool.request()
        .input('UserID', sql.BigInt, userId)
        .input('RegistrationID', sql.BigInt, registrationId)
        .query(`
          SELECT cr.Status, cc.Status as ClassStatus
          FROM CourseRegistrations cr
          JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
          WHERE cr.RegistrationID = @RegistrationID AND cr.UserID = @UserID
        `);
      
      if (checkResult.recordset.length === 0) {
        return { success: false, error: 'Registration not found or does not belong to user' };
      }
      
      // Check if the class is in a state that allows cancellation
      const registration = checkResult.recordset[0];
      if (registration.ClassStatus !== 'Planned' && registration.ClassStatus !== 'Registration') {
        return { success: false, error: 'Cannot cancel registration for this class due to its current status' };
      }
      
      // Update the registration status to Cancelled
      const updateResult = await pool.request()
        .input('UserID', sql.BigInt, userId)
        .input('RegistrationID', sql.BigInt, registrationId)
        .input('CancelledAt', sql.DateTime, new Date())
        .query(`
          UPDATE CourseRegistrations
          SET Status = 'Cancelled', CancelledAt = @CancelledAt, UpdatedAt = GETDATE()
          WHERE RegistrationID = @RegistrationID AND UserID = @UserID;
          
          -- Decrement current student count in the class
          UPDATE cc
          SET cc.CurrentStudents = cc.CurrentStudents - 1
          FROM CourseClasses cc
          JOIN CourseRegistrations cr ON cc.ClassID = cr.ClassID
          WHERE cr.RegistrationID = @RegistrationID;
        `);
      
      return { success: true, message: 'Registration cancelled successfully' };
    } catch (error) {
      console.error('Error cancelling registration:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = CourseRegistration; 
