/*-----------------------------------------------------------------
* File: student.routes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the teacher backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/database');

// TODO: Import controller khi đã tạo
// const studentController = require('../controllers/studentController');

// Get all students enrolled in the teacher's courses
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input('teacherId', sql.BigInt, req.user.UserID);
    
    const query = `
      SELECT DISTINCT
        u.UserID, u.FullName, u.Email, u.Avatar as ImageUrl, u.Status,
        (SELECT COUNT(*) FROM CourseEnrollments ce 
         JOIN Courses c ON ce.CourseID = c.CourseID 
         WHERE ce.UserID = u.UserID AND c.InstructorID = @teacherId) as EnrolledCoursesCount,
        (SELECT MAX(ce.EnrolledAt) FROM CourseEnrollments ce 
         JOIN Courses c ON ce.CourseID = c.CourseID 
         WHERE ce.UserID = u.UserID AND c.InstructorID = @teacherId) as LastEnrolledAt
      FROM Users u
      JOIN CourseEnrollments ce ON u.UserID = ce.UserID
      JOIN Courses c ON ce.CourseID = c.CourseID
      WHERE c.InstructorID = @teacherId AND c.DeletedAt IS NULL
      ORDER BY LastEnrolledAt DESC
    `;
    
    const result = await request.query(query);
    
    return res.status(200).json({
      students: result.recordset
    });
  } catch (error) {
    console.error('Get Students Error:', error);
    return res.status(500).json({ message: 'Server error while fetching students', error: error.message });
  }
});

// Get student details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const request = pool.request()
      .input('studentId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID);
    
    // Check if the student is in any of the teacher's courses
    const accessCheck = await request.query(`
      SELECT COUNT(*) as HasAccess
      FROM CourseEnrollments ce
      JOIN Courses c ON ce.CourseID = c.CourseID
      WHERE ce.UserID = @studentId AND c.InstructorID = @teacherId
    `);
    
    if (accessCheck.recordset[0].HasAccess === 0) {
      return res.status(403).json({ message: 'You do not have access to this student\'s information' });
    }
    
    // Get student profile
    const profileResult = await request.query(`
      SELECT 
        u.UserID, u.FullName, u.Email, u.PhoneNumber, u.DateOfBirth, 
        u.Address, u.City, u.Country, u.School, u.Avatar as ImageUrl, 
        u.Status, u.CreatedAt, u.LastLoginAt
      FROM Users u
      WHERE u.UserID = @studentId
    `);
    
    if (profileResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const student = profileResult.recordset[0];
    
    // Get course enrollments for this student with this teacher
    const enrollmentsResult = await request.query(`
      SELECT 
        ce.EnrollmentID, ce.CourseID, c.Title as CourseTitle, 
        ce.EnrolledAt, ce.CompletedAt, ce.Progress,
        c.ImageUrl as CourseImageUrl
      FROM CourseEnrollments ce
      JOIN Courses c ON ce.CourseID = c.CourseID
      WHERE ce.UserID = @studentId AND c.InstructorID = @teacherId
      ORDER BY ce.EnrolledAt DESC
    `);
    
    // Get progress details
    const progressResult = await request.query(`
      SELECT 
        lp.LessonID, lp.Status as LessonStatus, lp.CompletedAt as LessonCompletedAt,
        lp.TimeSpent, cl.Title as LessonTitle, cl.Type as LessonType,
        cm.Title as ModuleTitle, cm.ModuleID, c.CourseID, c.Title as CourseTitle
      FROM LessonProgress lp
      JOIN CourseEnrollments ce ON lp.EnrollmentID = ce.EnrollmentID
      JOIN CourseLessons cl ON lp.LessonID = cl.LessonID
      JOIN CourseModules cm ON cl.ModuleID = cm.ModuleID
      JOIN Courses c ON cm.CourseID = c.CourseID
      WHERE ce.UserID = @studentId AND c.InstructorID = @teacherId
      ORDER BY lp.CompletedAt DESC
    `);
    
    return res.status(200).json({
      student,
      enrollments: enrollmentsResult.recordset,
      progress: progressResult.recordset
    });
  } catch (error) {
    console.error('Get Student Details Error:', error);
    return res.status(500).json({ message: 'Server error while fetching student details', error: error.message });
  }
});

// Search students
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const pool = await poolPromise;
    const request = pool.request()
      .input('teacherId', sql.BigInt, req.user.UserID)
      .input('searchQuery', sql.NVarChar(100), `%${query}%`);
    
    const result = await request.query(`
      SELECT DISTINCT
        u.UserID, u.FullName, u.Email, u.Avatar as ImageUrl, u.Status,
        (SELECT COUNT(*) FROM CourseEnrollments ce 
         JOIN Courses c ON ce.CourseID = c.CourseID 
         WHERE ce.UserID = u.UserID AND c.InstructorID = @teacherId) as EnrolledCoursesCount,
        (SELECT MAX(ce.EnrolledAt) FROM CourseEnrollments ce 
         JOIN Courses c ON ce.CourseID = c.CourseID 
         WHERE ce.UserID = u.UserID AND c.InstructorID = @teacherId) as LastEnrolledAt
      FROM Users u
      JOIN CourseEnrollments ce ON u.UserID = ce.UserID
      JOIN Courses c ON ce.CourseID = c.CourseID
      WHERE c.InstructorID = @teacherId 
        AND c.DeletedAt IS NULL
        AND (u.FullName LIKE @searchQuery OR u.Email LIKE @searchQuery)
      ORDER BY LastEnrolledAt DESC
    `);
    
    return res.status(200).json({
      students: result.recordset
    });
  } catch (error) {
    console.error('Search Students Error:', error);
    return res.status(500).json({ message: 'Server error while searching students', error: error.message });
  }
});

// Send notification to students
router.post('/notify', async (req, res) => {
  try {
    const { studentIds, title, content, courseId } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'No students selected' });
    }
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const pool = await poolPromise;
    
    // Verify teacher has access to these students
    const teacherId = req.user.UserID;
    
    if (courseId) {
      // If courseId is provided, verify teacher owns this course
      const courseCheck = await pool.request()
        .input('courseId', sql.BigInt, courseId)
        .input('teacherId', sql.BigInt, teacherId)
        .query(`
          SELECT COUNT(*) as IsOwner
          FROM Courses
          WHERE CourseID = @courseId AND InstructorID = @teacherId
        `);
      
      if (courseCheck.recordset[0].IsOwner === 0) {
        return res.status(403).json({ message: 'You do not have access to this course' });
      }
      
      // Verify all students are enrolled in this course
      for (const studentId of studentIds) {
        const enrollmentCheck = await pool.request()
          .input('studentId', sql.BigInt, studentId)
          .input('courseId', sql.BigInt, courseId)
          .query(`
            SELECT COUNT(*) as IsEnrolled
            FROM CourseEnrollments
            WHERE UserID = @studentId AND CourseID = @courseId
          `);
        
        if (enrollmentCheck.recordset[0].IsEnrolled === 0) {
          return res.status(400).json({ 
            message: `Student with ID ${studentId} is not enrolled in this course` 
          });
        }
      }
    } else {
      // If no courseId, verify all students are in at least one of teacher's courses
      for (const studentId of studentIds) {
        const enrollmentCheck = await pool.request()
          .input('studentId', sql.BigInt, studentId)
          .input('teacherId', sql.BigInt, teacherId)
          .query(`
            SELECT COUNT(*) as IsEnrolled
            FROM CourseEnrollments ce
            JOIN Courses c ON ce.CourseID = c.CourseID
            WHERE ce.UserID = @studentId AND c.InstructorID = @teacherId
          `);
        
        if (enrollmentCheck.recordset[0].IsEnrolled === 0) {
          return res.status(400).json({ 
            message: `Student with ID ${studentId} is not enrolled in any of your courses` 
          });
        }
      }
    }
    
    // Create notifications for each student
    const now = new Date();
    let notificationCount = 0;
    
    for (const studentId of studentIds) {
      const request = pool.request()
        .input('userId', sql.BigInt, studentId)
        .input('type', sql.VarChar(50), 'teacher_message')
        .input('title', sql.NVarChar(255), title)
        .input('content', sql.NVarChar('max'), content)
        .input('relatedId', sql.BigInt, courseId || null)
        .input('relatedType', sql.VarChar(50), courseId ? 'course' : null)
        .input('createdAt', sql.DateTime, now)
        .input('priority', sql.VarChar(20), 'normal');
      
      const result = await request.query(`
        INSERT INTO Notifications (
          UserID, Type, Title, Content, 
          RelatedID, RelatedType, CreatedAt, Priority
        )
        VALUES (
          @userId, @type, @title, @content, 
          @relatedId, @relatedType, @createdAt, @priority
        )
      `);
      
      notificationCount += result.rowsAffected[0];
    }
    
    return res.status(200).json({
      message: `Successfully sent notifications to ${notificationCount} students`
    });
  } catch (error) {
    console.error('Send Notification Error:', error);
    return res.status(500).json({ message: 'Server error while sending notifications', error: error.message });
  }
});

module.exports = router; 
