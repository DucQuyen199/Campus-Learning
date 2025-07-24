/*-----------------------------------------------------------------
* File: schedule.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { sqlConnection } = require('../config/database');

// Schedule model with database queries
const ScheduleModel = {
  // Get class schedule
  async getClassSchedule(userId, semesterId = null) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      let query = `
        SELECT cc.*, s.SubjectCode, s.SubjectName, s.Credits,
               sem.SemesterName, sem.AcademicYear, u.FullName as TeacherName,
               cr.RegistrationID, cr.RegistrationType, cr.Status as RegistrationStatus
        FROM CourseRegistrations cr
        JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
        LEFT JOIN Users u ON cc.TeacherID = u.UserID
        WHERE cr.UserID = @userId
      `;
      
      if (semesterId) {
        query += ` AND cc.SemesterID = @semesterId`;
      }
      
      query += ` ORDER BY cc.StartDate, sem.StartDate DESC`;
      
      const request = poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId);
        
      if (semesterId) {
        request.input('semesterId', sqlConnection.sql.BigInt, semesterId);
      }
      
      const result = await request.query(query);
      
      // Process the result to add day-specific schedule
      const schedule = result.recordset.map(classItem => {
        // Parse schedule JSON if exists
        let scheduleDetails = [];
        try {
          if (classItem.Schedule) {
            scheduleDetails = JSON.parse(classItem.Schedule);
          } else {
            // Create default empty schedule
            scheduleDetails = [];
          }
        } catch (e) {
          console.warn('Failed to parse schedule JSON:', e);
        }
        
        return {
          ...classItem,
          scheduleDetails
        };
      });
      
      return schedule;
    } catch (error) {
      console.error('Error in getClassSchedule model:', error);
      throw new Error('Unable to retrieve class schedule from database');
    }
  },

  // Get exam schedule
  async getExamSchedule(userId, semesterId = null) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Updated query to match the database schema
      let query = `
        SELECT e.ExamID, e.ExamName, e.ExamType, e.ExamDate, e.StartTime, e.EndTime, e.Location,
               e.Status as ExamStatus, e.ClassID,
               cc.ClassCode, s.SubjectCode, s.SubjectName, s.Credits,
               sem.SemesterName, sem.AcademicYear,
               er.ExamRegistrationID, er.Status as RegistrationStatus
        FROM CourseRegistrations cr
        JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
        JOIN Exams e ON cc.ClassID = e.ClassID
        LEFT JOIN ExamRegistrations er ON e.ExamID = er.ExamID AND er.UserID = cr.UserID
        WHERE cr.UserID = @userId
      `;
      
      if (semesterId) {
        query += ` AND cc.SemesterID = @semesterId`;
      }
      
      query += ` ORDER BY e.ExamDate, e.StartTime`;
      
      const request = poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId);
        
      if (semesterId) {
        request.input('semesterId', sqlConnection.sql.BigInt, semesterId);
      }
      
      const result = await request.query(query);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getExamSchedule model:', error);
      throw new Error('Unable to retrieve exam schedule from database');
    }
  },
  
  // Get day schedule (for a specific date)
  async getDaySchedule(userId, date) {
    try {
      // Format date for SQL query (YYYY-MM-DD)
      const formattedDate = date.toISOString().split('T')[0];
      
      // Get both class and exam schedules
      const classSchedule = await this.getClassSchedule(userId);
      const examSchedule = await this.getExamSchedule(userId);
      
      // Filter classes for the selected day of the week
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dayClasses = (classSchedule || []).filter(cls => {
        if (!cls.scheduleDetails) return false;
        
        return cls.scheduleDetails.some(schedule => 
          schedule.day === dayOfWeek || 
          schedule.day.toLowerCase() === dayOfWeek.toLowerCase()
        );
      });
      
      // Filter exams for the specific date
      const dayExams = (examSchedule || []).filter(exam => {
        if (!exam.ExamDate) return false;
        
        const examDate = new Date(exam.ExamDate);
        return examDate.toDateString() === date.toDateString();
      });
      
      // Combine results
      return {
        classes: dayClasses,
        exams: dayExams,
        date: formattedDate
      };
    } catch (error) {
      console.error('Error in getDaySchedule model:', error);
      throw new Error('Unable to retrieve day schedule from database');
    }
  }
};

module.exports = ScheduleModel; 
