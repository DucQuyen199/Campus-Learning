const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/database');

// TODO: Import controller khi đã tạo
// const studentController = require('../controllers/studentController');

// Get all students in teacher's courses
router.get('/', async (req, res) => {
  try {
    const { search, courseId, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const pool = await poolPromise;
    const request = pool.request()
      .input('teacherId', sql.BigInt, req.user.UserID)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    
    let query = `
      SELECT 
        u.UserID, u.FullName, u.Email, u.Status,
        c.CourseID, c.Title as CourseTitle,
        ce.Progress
      FROM Users u
      JOIN CourseEnrollments ce ON u.UserID = ce.UserID
      JOIN Courses c ON ce.CourseID = c.CourseID
      WHERE (c.InstructorID = @teacherId) 
      AND u.Role = 'STUDENT' AND u.DeletedAt IS NULL
    `;
    
    const countQuery = `
      SELECT COUNT(DISTINCT u.UserID) as TotalCount
      FROM Users u
      JOIN CourseEnrollments ce ON u.UserID = ce.UserID
      JOIN Courses c ON ce.CourseID = c.CourseID
      WHERE (c.InstructorID = @teacherId) 
      AND u.Role = 'STUDENT' AND u.DeletedAt IS NULL
    `;
    
    let whereAdded = false;
    
    // Add filters if provided
    if (search) {
      request.input('search', sql.NVarChar(100), `%${search}%`);
      query += ` AND (u.FullName LIKE @search OR u.Email LIKE @search)`;
      countQuery += ` AND (u.FullName LIKE @search OR u.Email LIKE @search)`;
      whereAdded = true;
    }
    
    if (courseId) {
      request.input('courseId', sql.BigInt, courseId);
      query += ` AND c.CourseID = @courseId`;
      countQuery += ` AND c.CourseID = @courseId`;
      whereAdded = true;
    }
    
    if (status) {
      request.input('status', sql.VarChar(20), status);
      query += ` AND u.Status = @status`;
      countQuery += ` AND u.Status = @status`;
      whereAdded = true;
    }
    
    // Finalize query with pagination
    query += `
      ORDER BY u.FullName
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    // Get students with pagination
    const result = await request.query(query);
    
    // Get total count for pagination
    const countResult = await pool.request()
      .input('teacherId', sql.BigInt, req.user.UserID)
      .input('search', sql.NVarChar(100), search ? `%${search}%` : null)
      .input('courseId', sql.BigInt, courseId || null)
      .input('status', sql.VarChar(20), status || null)
      .query(countQuery);
    
    const totalCount = countResult.recordset[0].TotalCount;
    const totalPages = Math.ceil(totalCount / limit);
    
    return res.status(200).json({
      students: result.recordset,
      pagination: {
        totalCount,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get Students Error:', error);
    return res.status(500).json({ message: 'Server error while fetching students', error: error.message });
  }
});

// Get student details with enrollment information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Verify teacher has access to this student
    const accessCheck = await pool.request()
      .input('studentId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT COUNT(*) as HasAccess
        FROM CourseEnrollments ce
        JOIN Courses c ON ce.CourseID = c.CourseID
        WHERE ce.UserID = @studentId 
        AND (c.InstructorID = @teacherId)
      `);
    
    if (accessCheck.recordset[0].HasAccess === 0) {
      return res.status(403).json({ message: 'You do not have access to this student' });
    }
    
    // Get student details
    const studentResult = await pool.request()
      .input('studentId', sql.BigInt, id)
      .query(`
        SELECT 
          UserID, Username, Email, FullName, Role, 
          Status, PhoneNumber, Bio, 
          Country, City, Address, CreatedAt
        FROM Users
        WHERE UserID = @studentId AND Role = 'STUDENT' AND DeletedAt IS NULL
      `);
    
    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const student = studentResult.recordset[0];
    
    // Get course enrollments
    const enrollmentsResult = await pool.request()
      .input('studentId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT 
          ce.EnrollmentID, ce.CourseID, c.Title as CourseTitle, 
          ce.Progress
        FROM CourseEnrollments ce
        JOIN Courses c ON ce.CourseID = c.CourseID
        WHERE ce.UserID = @studentId 
        AND (c.InstructorID = @teacherId)
      `);
    
    // Get assignment submissions
    const submissionsResult = await pool.request()
      .input('studentId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT 
          as.SubmissionID, as.AssignmentID, 
          a.Title as AssignmentTitle, 
          as.SubmissionDate, as.Content, 
          as.Score, as.Status, as.Feedback,
          a.DueDate, a.TotalPoints,
          c.CourseID, c.Title as CourseTitle
        FROM AssignmentSubmissions as
        JOIN Assignments a ON as.AssignmentID = a.AssignmentID
        JOIN CourseModules m ON a.ModuleID = m.ModuleID
        JOIN Courses c ON m.CourseID = c.CourseID
        WHERE as.UserID = @studentId 
        AND (c.InstructorID = @teacherId)
        ORDER BY as.SubmissionDate DESC
      `);
    
    // Get warnings issued to the student
    const warningsResult = await pool.request()
      .input('studentId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT 
          w.WarningID, w.Reason, w.Details, 
          w.CreatedAt, w.Status,
          c.CourseID, c.Title as CourseTitle
        FROM Warnings w
        JOIN Courses c ON w.CourseID = c.CourseID
        WHERE w.UserID = @studentId 
        AND (c.InstructorID = @teacherId 
             OR w.IssuedBy = @teacherId)
        ORDER BY w.CreatedAt DESC
      `);
    
    // Get exam participations
    const examsResult = await pool.request()
      .input('studentId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT 
          ep.ParticipantID, ep.ExamID, 
          e.Title as ExamTitle, 
          ep.StartTime, ep.EndTime, 
          ep.Score, ep.Status, ep.Feedback,
          e.TotalPoints, e.PassingScore,
          c.CourseID, c.Title as CourseTitle
        FROM ExamParticipants ep
        JOIN Exams e ON ep.ExamID = e.ExamID
        JOIN Courses c ON e.CourseID = c.CourseID
        WHERE ep.UserID = @studentId 
        AND (c.InstructorID = @teacherId)
        ORDER BY ep.StartTime DESC
      `);
    
    return res.status(200).json({
      student,
      enrollments: enrollmentsResult.recordset,
      assignments: submissionsResult.recordset,
      warnings: warningsResult.recordset,
      exams: examsResult.recordset
    });
  } catch (error) {
    console.error('Get Student Details Error:', error);
    return res.status(500).json({ message: 'Server error while fetching student details', error: error.message });
  }
});

// Issue a warning to a student
router.post('/:id/warnings', async (req, res) => {
  try {
    const { id } = req.params;
    const { courseId, reason, details } = req.body;
    
    if (!courseId || !reason) {
      return res.status(400).json({ message: 'Course ID and reason are required' });
    }
    
    const pool = await poolPromise;
    
    // Verify student exists and is enrolled in teacher's course
    const studentCheck = await pool.request()
      .input('studentId', sql.BigInt, id)
      .input('courseId', sql.BigInt, courseId)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT COUNT(*) as IsValid
        FROM CourseEnrollments ce
        JOIN Courses c ON ce.CourseID = c.CourseID
        JOIN Users u ON ce.UserID = u.UserID
        WHERE ce.UserID = @studentId AND ce.CourseID = @courseId 
        AND c.InstructorID = @teacherId AND u.Role = 'STUDENT' AND u.DeletedAt IS NULL
      `);
    
    if (studentCheck.recordset[0].IsValid === 0) {
      return res.status(404).json({ message: 'Student not found or not enrolled in this course' });
    }
    
    // Insert warning
    const result = await pool.request()
      .input('userId', sql.BigInt, id)
      .input('courseId', sql.BigInt, courseId)
      .input('issuedBy', sql.BigInt, req.user.UserID)
      .input('reason', sql.NVarChar(100), reason)
      .input('details', sql.NVarChar(500), details || null)
      .input('createdAt', sql.DateTime, new Date())
      .input('status', sql.VarChar(20), 'active')
      .query(`
        INSERT INTO Warnings (UserID, CourseID, IssuedBy, Reason, Details, CreatedAt, Status)
        OUTPUT INSERTED.WarningID
        VALUES (@userId, @courseId, @issuedBy, @reason, @details, @createdAt, @status)
      `);
    
    const warningId = result.recordset[0].WarningID;
    
    // Also create notification for the student
    await pool.request()
      .input('userId', sql.BigInt, id)
      .input('type', sql.VarChar(50), 'warning')
      .input('title', sql.NVarChar(100), 'Warning Received')
      .input('message', sql.NVarChar(500), `You received a warning: ${reason}`)
      .input('link', sql.VarChar(255), `/warnings/${warningId}`)
      .input('createdAt', sql.DateTime, new Date())
      .input('isRead', sql.Bit, 0)
      .query(`
        INSERT INTO Notifications (UserID, Type, Title, Message, Link, CreatedAt, IsRead)
        VALUES (@userId, @type, @title, @message, @link, @createdAt, @isRead)
      `);
    
    return res.status(201).json({
      message: 'Warning issued successfully',
      warningId
    });
  } catch (error) {
    console.error('Issue Warning Error:', error);
    return res.status(500).json({ message: 'Server error while issuing warning' });
  }
});

// Update warning status (resolve or dismiss)
router.put('/warnings/:warningId', async (req, res) => {
  try {
    const { warningId } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (active, resolved, or dismissed) is required' });
    }
    
    const pool = await poolPromise;
    
    // Verify teacher has access to this warning
    const accessCheck = await pool.request()
      .input('warningId', sql.BigInt, warningId)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT COUNT(*) as HasAccess
        FROM Warnings
        WHERE WarningID = @warningId AND IssuedBy = @teacherId
      `);
    
    if (accessCheck.recordset[0].HasAccess === 0) {
      return res.status(403).json({ message: 'You do not have access to update this warning' });
    }
    
    // Update warning status
    await pool.request()
      .input('warningId', sql.BigInt, warningId)
      .input('status', sql.VarChar(20), status)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Warnings
        SET Status = @status, UpdatedAt = @updatedAt
        WHERE WarningID = @warningId
      `);
    
    return res.status(200).json({
      message: 'Warning status updated successfully'
    });
  } catch (error) {
    console.error('Update Warning Error:', error);
    return res.status(500).json({ message: 'Server error while updating warning' });
  }
});

module.exports = router; 