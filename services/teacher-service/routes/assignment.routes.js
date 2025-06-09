const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/assignments');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all assignments for the teacher
router.get('/', async (req, res) => {
  try {
    const { search, courseId } = req.query;
    const pool = await poolPromise;
    const request = pool.request()
      .input('teacherId', sql.BigInt, req.user.UserID);
    
    let query = `
      SELECT 
        a.AssignmentID, a.Title, a.Description, a.CourseID, a.TotalPoints, a.DueDate, 
        a.CreatedAt, a.UpdatedAt,
        c.Title as CourseName,
        (SELECT COUNT(*) FROM AssignmentSubmissions WHERE AssignmentID = a.AssignmentID) as SubmissionsCount,
        (SELECT COUNT(*) FROM CourseEnrollments WHERE CourseID = a.CourseID AND Status = 'active') as StudentsCount
      FROM Assignments a
      JOIN Courses c ON a.CourseID = c.CourseID
      WHERE c.InstructorID = @teacherId
    `;
    
    if (search) {
      request.input('search', sql.NVarChar, `%${search}%`);
      query += ` AND (a.Title LIKE @search OR a.Description LIKE @search)`;
    }
    
    if (courseId) {
      request.input('courseId', sql.BigInt, courseId);
      query += ` AND a.CourseID = @courseId`;
    }
    
    query += ` ORDER BY a.CreatedAt DESC`;
    
    const result = await request.query(query);
    
    res.json({
      assignments: result.recordset,
      totalCount: result.recordset.length
    });
  } catch (error) {
    console.error('Error getting assignments:', error);
    res.status(500).json({ message: 'Error retrieving assignments', error: error.message });
  }
});

// Get a specific assignment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Verify teacher has access to this assignment
    const accessCheck = await pool.request()
      .input('assignmentId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT a.AssignmentID
        FROM Assignments a
        JOIN Courses c ON a.CourseID = c.CourseID
        WHERE a.AssignmentID = @assignmentId 
        AND c.InstructorID = @teacherId
        `);
      
    if (accessCheck.recordset.length === 0) {
        return res.status(403).json({ message: 'You do not have access to this assignment' });
      }
      
    // Get assignment details
    const assignmentResult = await pool.request()
      .input('assignmentId', sql.BigInt, id)
      .query(`
        SELECT 
          a.*, 
          c.Title as CourseName,
          (SELECT COUNT(*) FROM AssignmentSubmissions WHERE AssignmentID = a.AssignmentID) as SubmissionsCount,
          (SELECT COUNT(*) FROM CourseEnrollments WHERE CourseID = a.CourseID AND Status = 'active') as StudentsCount
        FROM Assignments a
        JOIN Courses c ON a.CourseID = c.CourseID
        WHERE a.AssignmentID = @assignmentId
      `);
    
    if (assignmentResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Get assignment files
    const filesResult = await pool.request()
      .input('assignmentId', sql.BigInt, id)
      .query(`
        SELECT * FROM AssignmentFiles
        WHERE AssignmentID = @assignmentId
      `);
    
    const assignment = assignmentResult.recordset[0];
    assignment.files = filesResult.recordset;
    
    res.json(assignment);
  } catch (error) {
    console.error('Error getting assignment:', error);
    res.status(500).json({ message: 'Error retrieving assignment', error: error.message });
  }
});

// Create a new assignment
router.post('/', upload.array('files', 5), async (req, res) => {
  try {
    const { title, description, courseId, dueDate, totalPoints } = req.body;
    const files = req.files || [];
    
    if (!title || !courseId) {
      return res.status(400).json({ message: 'Title and courseId are required' });
    }
    
    const pool = await poolPromise;
    
    // Verify teacher has access to this course
    const courseCheck = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT CourseID
        FROM Courses
        WHERE CourseID = @courseId 
        AND InstructorID = @teacherId
      `);
    
    if (courseCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this course' });
    }
    
    // Begin transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Insert assignment
      const assignmentRequest = new sql.Request(transaction);
      assignmentRequest
        .input('title', sql.NVarChar, title)
        .input('description', sql.NVarChar, description || '')
        .input('courseId', sql.BigInt, courseId)
        .input('dueDate', sql.DateTime, dueDate ? new Date(dueDate) : null)
        .input('totalPoints', sql.Int, totalPoints || 100)
        .input('createdBy', sql.BigInt, req.user.UserID);
      
      const insertResult = await assignmentRequest.query(`
        INSERT INTO Assignments (Title, Description, CourseID, DueDate, TotalPoints, CreatedBy, CreatedAt, UpdatedAt)
        VALUES (@title, @description, @courseId, @dueDate, @totalPoints, @createdBy, GETDATE(), GETDATE());
        
        SELECT SCOPE_IDENTITY() AS AssignmentID;
      `);
    
      const assignmentId = insertResult.recordset[0].AssignmentID;
    
      // Insert files if any
      if (files.length > 0) {
        for (const file of files) {
          const fileRequest = new sql.Request(transaction);
          await fileRequest
            .input('assignmentId', sql.BigInt, assignmentId)
            .input('fileName', sql.NVarChar, file.originalname)
            .input('filePath', sql.NVarChar, file.path)
            .input('fileSize', sql.Int, file.size)
            .input('fileType', sql.NVarChar, file.mimetype)
      .query(`
              INSERT INTO AssignmentFiles (AssignmentID, FileName, FilePath, FileSize, FileType, UploadedAt)
              VALUES (@assignmentId, @fileName, @filePath, @fileSize, @fileType, GETDATE());
            `);
        }
      }
      
      await transaction.commit();
      
      res.status(201).json({
        message: 'Assignment created successfully',
        assignmentId: assignmentId
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error creating assignment:', error);
    
    // Delete uploaded files if any
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
    }
    
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
});

// Update an assignment
router.put('/:id', upload.array('files', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, courseId, dueDate, totalPoints } = req.body;
    const files = req.files || [];
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const pool = await poolPromise;
    
    // Verify teacher has access to this assignment
    const accessCheck = await pool.request()
      .input('assignmentId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT a.AssignmentID
        FROM Assignments a
        JOIN Courses c ON a.CourseID = c.CourseID
        WHERE a.AssignmentID = @assignmentId 
        AND c.InstructorID = @teacherId
      `);
    
    if (accessCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this assignment' });
    }
    
    // Verify teacher has access to the target course if changing
    if (courseId) {
      const courseCheck = await pool.request()
        .input('courseId', sql.BigInt, courseId)
        .input('teacherId', sql.BigInt, req.user.UserID)
        .query(`
          SELECT CourseID
          FROM Courses
          WHERE CourseID = @courseId 
          AND InstructorID = @teacherId
        `);
      
      if (courseCheck.recordset.length === 0) {
        return res.status(403).json({ message: 'You do not have access to this course' });
      }
      }
      
    // Begin transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Update assignment
      const updateRequest = new sql.Request(transaction);
      updateRequest
        .input('assignmentId', sql.BigInt, id)
        .input('title', sql.NVarChar, title)
        .input('description', sql.NVarChar, description || '')
        .input('courseId', sql.BigInt, courseId)
        .input('dueDate', sql.DateTime, dueDate ? new Date(dueDate) : null)
        .input('totalPoints', sql.Int, totalPoints || 100);
      
      await updateRequest.query(`
        UPDATE Assignments
        SET Title = @title,
            Description = @description,
            CourseID = @courseId,
            DueDate = @dueDate,
            TotalPoints = @totalPoints,
            UpdatedAt = GETDATE()
        WHERE AssignmentID = @assignmentId;
        `);
      
      // Add new files if any
      if (files.length > 0) {
        for (const file of files) {
          const fileRequest = new sql.Request(transaction);
          await fileRequest
            .input('assignmentId', sql.BigInt, id)
            .input('fileName', sql.NVarChar, file.originalname)
            .input('filePath', sql.NVarChar, file.path)
            .input('fileSize', sql.Int, file.size)
            .input('fileType', sql.NVarChar, file.mimetype)
        .query(`
              INSERT INTO AssignmentFiles (AssignmentID, FileName, FilePath, FileSize, FileType, UploadedAt)
              VALUES (@assignmentId, @fileName, @filePath, @fileSize, @fileType, GETDATE());
            `);
        }
      }
      
      await transaction.commit();
      
      res.json({
        message: 'Assignment updated successfully',
        assignmentId: id
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error updating assignment:', error);
    
    // Delete uploaded files if any
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
    }
    
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
});

// Delete an assignment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Verify teacher has access to this assignment
    const accessCheck = await pool.request()
      .input('assignmentId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT a.AssignmentID
        FROM Assignments a
        JOIN Courses c ON a.CourseID = c.CourseID
        WHERE a.AssignmentID = @assignmentId 
        AND c.InstructorID = @teacherId
      `);
    
    if (accessCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this assignment' });
    }
    
    // Begin transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Get file paths to delete after transaction
      const filesRequest = new sql.Request(transaction);
      filesRequest.input('assignmentId', sql.BigInt, id);
      const filesResult = await filesRequest.query(`
        SELECT FilePath FROM AssignmentFiles
        WHERE AssignmentID = @assignmentId
      `);
      
      const filePaths = filesResult.recordset.map(file => file.FilePath);
      
      // Delete files from database
      const deleteFilesRequest = new sql.Request(transaction);
      deleteFilesRequest.input('assignmentId', sql.BigInt, id);
      await deleteFilesRequest.query(`
        DELETE FROM AssignmentFiles
        WHERE AssignmentID = @assignmentId
      `);
      
      // Delete submissions (and related grades/feedback)
      const deleteSubmissionsRequest = new sql.Request(transaction);
      deleteSubmissionsRequest.input('assignmentId', sql.BigInt, id);
      await deleteSubmissionsRequest.query(`
        DELETE FROM AssignmentSubmissions
        WHERE AssignmentID = @assignmentId
      `);
      
      // Delete assignment
      const deleteAssignmentRequest = new sql.Request(transaction);
      deleteAssignmentRequest.input('assignmentId', sql.BigInt, id);
      await deleteAssignmentRequest.query(`
        DELETE FROM Assignments
        WHERE AssignmentID = @assignmentId
      `);
      
      await transaction.commit();
      
      // Delete physical files
      filePaths.forEach(filePath => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
      
      res.json({ message: 'Assignment deleted successfully' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Error deleting assignment', error: error.message });
  }
});

// Get all submissions for an assignment
router.get('/:id/submissions', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Verify teacher has access to this assignment
    const accessCheck = await pool.request()
      .input('assignmentId', sql.BigInt, id)
        .input('teacherId', sql.BigInt, req.user.UserID)
        .query(`
        SELECT a.AssignmentID
        FROM Assignments a
        JOIN Courses c ON a.CourseID = c.CourseID
        WHERE a.AssignmentID = @assignmentId 
        AND c.InstructorID = @teacherId
        `);
      
    if (accessCheck.recordset.length === 0) {
        return res.status(403).json({ message: 'You do not have access to this assignment' });
      }
      
    // Get submissions
    const result = await pool.request()
      .input('assignmentId', sql.BigInt, id)
      .query(`
        SELECT 
          s.SubmissionID, s.AssignmentID, s.UserID, s.SubmittedAt, s.Score, s.Feedback,
          s.Status, s.GradedAt, s.GradedBy,
          u.FullName, u.Email, u.Avatar
        FROM AssignmentSubmissions s
        JOIN Users u ON s.UserID = u.UserID
        WHERE s.AssignmentID = @assignmentId
        ORDER BY s.SubmittedAt DESC
      `);
    
    res.json({
      submissions: result.recordset,
      totalCount: result.recordset.length
    });
  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(500).json({ message: 'Error retrieving submissions', error: error.message });
  }
});

// Assign an assignment to students in a course
router.post('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { dueDate } = req.body;
    const pool = await poolPromise;
    
    // Verify teacher has access to this assignment
    const accessCheck = await pool.request()
      .input('assignmentId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
        .query(`
        SELECT a.AssignmentID, a.CourseID
        FROM Assignments a
        JOIN Courses c ON a.CourseID = c.CourseID
        WHERE a.AssignmentID = @assignmentId 
        AND c.InstructorID = @teacherId
      `);
    
    if (accessCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this assignment' });
    }
    
    const courseId = accessCheck.recordset[0].CourseID;
    
    // Update assignment due date if provided
    if (dueDate) {
      await pool.request()
        .input('assignmentId', sql.BigInt, id)
        .input('dueDate', sql.DateTime, new Date(dueDate))
        .query(`
          UPDATE Assignments
          SET DueDate = @dueDate,
              UpdatedAt = GETDATE()
          WHERE AssignmentID = @assignmentId
        `);
    }
    
    // Get all active students in the course
    const studentsResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT UserID
        FROM CourseEnrollments
        WHERE CourseID = @courseId
        AND Status = 'active'
      `);
    
    const students = studentsResult.recordset;
    
    if (students.length === 0) {
      return res.status(400).json({ message: 'No active students found in this course' });
    }
    
    // Send notifications to all students
    for (const student of students) {
      // Create notification
    await pool.request()
        .input('userId', sql.BigInt, student.UserID)
        .input('type', sql.VarChar, 'assignment')
        .input('title', sql.NVarChar, 'New Assignment')
        .input('content', sql.NVarChar, `You have a new assignment to complete.`)
        .input('relatedId', sql.BigInt, id)
        .input('relatedType', sql.VarChar, 'assignment')
      .query(`
          INSERT INTO Notifications (UserID, Type, Title, Content, RelatedID, RelatedType, IsRead, CreatedAt)
          VALUES (@userId, @type, @title, @content, @relatedId, @relatedType, 0, GETDATE())
      `);
    }
    
    res.json({
      message: 'Assignment assigned to students successfully',
      studentsCount: students.length
    });
  } catch (error) {
    console.error('Error assigning to students:', error);
    res.status(500).json({ message: 'Error assigning to students', error: error.message });
  }
});

// Grade a submission
router.post('/submissions/:submissionId/grade', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;
    
    if (score === undefined) {
      return res.status(400).json({ message: 'Score is required' });
    }
    
    const pool = await poolPromise;
    
    // Verify teacher has access to this submission
    const accessCheck = await pool.request()
      .input('submissionId', sql.BigInt, submissionId)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT s.SubmissionID, s.AssignmentID
        FROM AssignmentSubmissions s
        JOIN Assignments a ON s.AssignmentID = a.AssignmentID
        JOIN Courses c ON a.CourseID = c.CourseID
        WHERE s.SubmissionID = @submissionId 
        AND c.InstructorID = @teacherId
      `);
    
    if (accessCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this submission' });
    }
    
    // Update submission with grade
    await pool.request()
      .input('submissionId', sql.BigInt, submissionId)
      .input('score', sql.Int, score)
      .input('feedback', sql.NVarChar, feedback || '')
      .input('gradedBy', sql.BigInt, req.user.UserID)
      .query(`
        UPDATE AssignmentSubmissions
        SET Score = @score,
            Feedback = @feedback,
            GradedAt = GETDATE(),
            GradedBy = @gradedBy,
            Status = 'graded'
        WHERE SubmissionID = @submissionId
      `);
    
    // Get student ID for notification
    const studentResult = await pool.request()
      .input('submissionId', sql.BigInt, submissionId)
      .query(`
        SELECT UserID, AssignmentID
        FROM AssignmentSubmissions
        WHERE SubmissionID = @submissionId
      `);
    
    if (studentResult.recordset.length > 0) {
      const studentId = studentResult.recordset[0].UserID;
      const assignmentId = studentResult.recordset[0].AssignmentID;
      
      // Create notification for student
      await pool.request()
        .input('userId', sql.BigInt, studentId)
        .input('type', sql.VarChar, 'grade')
        .input('title', sql.NVarChar, 'Assignment Graded')
        .input('content', sql.NVarChar, `Your assignment has been graded. Score: ${score}`)
        .input('relatedId', sql.BigInt, assignmentId)
        .input('relatedType', sql.VarChar, 'assignment')
        .query(`
          INSERT INTO Notifications (UserID, Type, Title, Content, RelatedID, RelatedType, IsRead, CreatedAt)
          VALUES (@userId, @type, @title, @content, @relatedId, @relatedType, 0, GETDATE())
        `);
    }
    
    res.json({
      message: 'Submission graded successfully',
      submissionId: submissionId
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ message: 'Error grading submission', error: error.message });
  }
});

// Delete a file from an assignment
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const pool = await poolPromise;
    
    // Verify teacher has access to this file
    const accessCheck = await pool.request()
      .input('fileId', sql.BigInt, fileId)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT f.FileID, f.FilePath
        FROM AssignmentFiles f
        JOIN Assignments a ON f.AssignmentID = a.AssignmentID
        JOIN Courses c ON a.CourseID = c.CourseID
        WHERE f.FileID = @fileId 
        AND c.InstructorID = @teacherId
        `);
      
    if (accessCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this file' });
    }
    
    const filePath = accessCheck.recordset[0].FilePath;
        
    // Delete file from database
        await pool.request()
      .input('fileId', sql.BigInt, fileId)
          .query(`
        DELETE FROM AssignmentFiles
        WHERE FileID = @fileId
      `);
    
    // Delete physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
});

module.exports = router; 