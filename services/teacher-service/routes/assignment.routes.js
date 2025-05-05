const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/database');

// TODO: Import controller khi đã tạo
// const assignmentController = require('../controllers/assignmentController');

// Get all assignments created by the teacher
router.get('/', async (req, res) => {
  try {
    const { search, courseId, moduleId, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const pool = await poolPromise;
    const request = pool.request()
      .input('teacherId', sql.BigInt, req.user.UserID)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    
    // Modified query to use CodingExercises as assignments
    let query = `
      SELECT 
        ce.ExerciseID as AssignmentID, 
        ce.Title, 
        ce.Description, 
        DATEADD(day, 14, ce.CreatedAt) as DueDate, 
        ce.Points as TotalPoints, 
        ce.CreatedAt, 
        ce.UpdatedAt,
        cl.LessonID,
        cl.Title as LessonTitle,
        cm.ModuleID, 
        cm.Title as ModuleTitle,
        c.CourseID, 
        c.Title as CourseTitle,
        (SELECT COUNT(*) FROM CodingSubmissions WHERE ExerciseID = ce.ExerciseID) as SubmissionsCount
      FROM CodingExercises ce
      JOIN CourseLessons cl ON ce.LessonID = cl.LessonID
      JOIN CourseModules cm ON cl.ModuleID = cm.ModuleID
      JOIN Courses c ON cm.CourseID = c.CourseID
      WHERE (c.InstructorID = @teacherId)
    `;
    
    const countQuery = `
      SELECT COUNT(*) as TotalCount
      FROM CodingExercises ce
      JOIN CourseLessons cl ON ce.LessonID = cl.LessonID
      JOIN CourseModules cm ON cl.ModuleID = cm.ModuleID
      JOIN Courses c ON cm.CourseID = c.CourseID
      WHERE (c.InstructorID = @teacherId)
    `;
    
    // Add filters if provided
    if (search) {
      request.input('search', sql.NVarChar(100), `%${search}%`);
      query += ` AND (ce.Title LIKE @search OR ce.Description LIKE @search)`;
      countQuery += ` AND (ce.Title LIKE @search OR ce.Description LIKE @search)`;
    }
    
    if (courseId) {
      request.input('courseId', sql.BigInt, courseId);
      query += ` AND c.CourseID = @courseId`;
      countQuery += ` AND c.CourseID = @courseId`;
    }
    
    if (moduleId) {
      request.input('moduleId', sql.BigInt, moduleId);
      query += ` AND cm.ModuleID = @moduleId`;
      countQuery += ` AND cm.ModuleID = @moduleId`;
    }
    
    if (status === 'active') {
      const now = new Date();
      console.log('Using ACTIVE status filter with date:', now);
      request.input('activeNow', sql.DateTime, now);
      query += ` AND DATEADD(day, 14, ce.CreatedAt) > @activeNow`;  // Setting an arbitrary due date 14 days after creation
      countQuery += ` AND DATEADD(day, 14, ce.CreatedAt) > @activeNow`;
    } else if (status === 'past') {
      const now = new Date();
      console.log('Using PAST status filter with date:', now);
      request.input('pastNow', sql.DateTime, now);
      query += ` AND DATEADD(day, 14, ce.CreatedAt) <= @pastNow`;  // Setting an arbitrary due date 14 days after creation 
      countQuery += ` AND DATEADD(day, 14, ce.CreatedAt) <= @pastNow`;
    }
    
    // Include ModulePractices as additional assignments using UNION
    if (!moduleId && !search) { // Only add module practices if not filtering by specific module or search term
      query = `(${query})
      UNION
      SELECT 
        mp.PracticeID as AssignmentID, 
        mp.Title, 
        mp.Description, 
        DATEADD(day, 14, mp.CreatedAt) as DueDate, 
        0 as TotalPoints, 
        mp.CreatedAt, 
        mp.UpdatedAt,
        NULL as LessonID,
        NULL as LessonTitle,
        mp.ModuleID, 
        cm.Title as ModuleTitle,
        c.CourseID, 
        c.Title as CourseTitle,
        0 as SubmissionsCount
      FROM ModulePractices mp
      JOIN CourseModules cm ON mp.ModuleID = cm.ModuleID
      JOIN Courses c ON cm.CourseID = c.CourseID
      WHERE (c.InstructorID = @teacherId)`;
      
      // Add status condition separately
      if (status === 'active') {
        query += ` AND DATEADD(day, 14, mp.CreatedAt) > @activeNow`;
      } else if (status === 'past') {
        query += ` AND DATEADD(day, 14, mp.CreatedAt) <= @pastNow`;
      }
    }
    
    // Finalize query with pagination
    query += `
      ORDER BY DueDate DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    // Get assignments with pagination
    const result = await request.query(query);
    
    // Get total count for pagination - simplified to approximate count
    const totalCount = result.recordset.length; // Simplified approach
    const totalPages = Math.ceil(totalCount / limit);
    
    return res.status(200).json({
      assignments: result.recordset,
      pagination: {
        totalCount,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get Assignments Error:', error);
    return res.status(500).json({ message: 'Server error while fetching assignments', error: error.message });
  }
});

// Get assignment details with submissions
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Verify teacher has access to this assignment (coding exercise)
    const accessCheck = await pool.request()
      .input('exerciseId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT COUNT(*) as HasAccess
        FROM CodingExercises ce
        JOIN CourseLessons cl ON ce.LessonID = cl.LessonID
        JOIN CourseModules cm ON cl.ModuleID = cm.ModuleID
        JOIN Courses c ON cm.CourseID = c.CourseID
        WHERE ce.ExerciseID = @exerciseId 
        AND (c.InstructorID = @teacherId)
      `);
    
    if (accessCheck.recordset[0].HasAccess === 0) {
      // If not found in CodingExercises, check if it's a ModulePractice
      const practiceCheck = await pool.request()
        .input('practiceId', sql.BigInt, id)
        .input('teacherId', sql.BigInt, req.user.UserID)
        .query(`
          SELECT COUNT(*) as HasAccess
          FROM ModulePractices mp
          JOIN CourseModules cm ON mp.ModuleID = cm.ModuleID
          JOIN Courses c ON cm.CourseID = c.CourseID
          WHERE mp.PracticeID = @practiceId 
          AND (c.InstructorID = @teacherId)
        `);
      
      if (practiceCheck.recordset[0].HasAccess === 0) {
        return res.status(403).json({ message: 'You do not have access to this assignment' });
      }
      
      // It's a module practice
      const practiceResult = await pool.request()
        .input('practiceId', sql.BigInt, id)
        .query(`
          SELECT 
            mp.PracticeID as AssignmentID, 
            mp.Title, 
            mp.Description, 
            DATEADD(day, 14, mp.CreatedAt) as DueDate,
            mp.Difficulty,
            0 as TotalPoints, 
            mp.CreatedAt, 
            mp.UpdatedAt,
            cm.ModuleID, 
            cm.Title as ModuleTitle,
            c.CourseID, 
            c.Title as CourseTitle,
            0 as TotalSubmissions,
            0 as GradedSubmissions
          FROM ModulePractices mp
          JOIN CourseModules cm ON mp.ModuleID = cm.ModuleID
          JOIN Courses c ON cm.CourseID = c.CourseID
          WHERE mp.PracticeID = @practiceId
        `);
      
      if (practiceResult.recordset.length === 0) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      const assignment = practiceResult.recordset[0];
      
      // For module practices, we'll return test cases instead of submissions
      const testCasesResult = await pool.request()
        .input('practiceId', sql.BigInt, id)
        .query(`
          SELECT 
            TestCaseID, 
            Input, 
            ExpectedOutput, 
            IsHidden, 
            OrderIndex
          FROM PracticeTestCases
          WHERE PracticeID = @practiceId
          ORDER BY OrderIndex ASC
        `);
      
      return res.status(200).json({
        assignment,
        testCases: testCasesResult.recordset,
        submissions: [],
        pendingSubmissions: []
      });
    }
    
    // It's a coding exercise
    const assignmentResult = await pool.request()
      .input('exerciseId', sql.BigInt, id)
      .query(`
        SELECT 
          ce.ExerciseID as AssignmentID, 
          ce.Title, 
          ce.Description, 
          DATEADD(day, 14, ce.CreatedAt) as DueDate,
          ce.Points as TotalPoints, 
          ce.CreatedAt, 
          ce.UpdatedAt,
          ce.Difficulty,
          cl.LessonID,
          cl.Title as LessonTitle,
          cm.ModuleID, 
          cm.Title as ModuleTitle,
          c.CourseID, 
          c.Title as CourseTitle,
          (SELECT COUNT(*) FROM CodingSubmissions WHERE ExerciseID = ce.ExerciseID) as TotalSubmissions,
          (SELECT COUNT(*) FROM CodingSubmissions WHERE ExerciseID = ce.ExerciseID AND Status = 'accepted') as GradedSubmissions
        FROM CodingExercises ce
        JOIN CourseLessons cl ON ce.LessonID = cl.LessonID
        JOIN CourseModules cm ON cl.ModuleID = cm.ModuleID
        JOIN Courses c ON cm.CourseID = c.CourseID
        WHERE ce.ExerciseID = @exerciseId
      `);
    
    if (assignmentResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    const assignment = assignmentResult.recordset[0];
    
    // Get submissions
    const submissionsResult = await pool.request()
      .input('exerciseId', sql.BigInt, id)
      .query(`
        SELECT 
          s.SubmissionID, s.UserID, s.SubmittedAt as SubmissionDate, 
          s.Code as Content, s.Score, s.Status, '' as Feedback,
          u.FullName, u.Email
        FROM CodingSubmissions s
        JOIN Users u ON s.UserID = u.UserID
        WHERE s.ExerciseID = @exerciseId
        ORDER BY s.SubmittedAt DESC
      `);
    
    // Get enrolled students who haven't submitted
    const pendingSubmissionsResult = await pool.request()
      .input('exerciseId', sql.BigInt, id)
      .input('courseId', sql.BigInt, assignment.CourseID)
      .query(`
        SELECT 
          u.UserID, u.FullName, u.Email
        FROM Users u
        JOIN CourseEnrollments ce ON u.UserID = ce.UserID
        WHERE ce.CourseID = @courseId
        AND u.Role = 'STUDENT'
        AND u.DeletedAt IS NULL
        AND u.UserID NOT IN (
          SELECT UserID FROM CodingSubmissions 
          WHERE ExerciseID = @exerciseId
        )
      `);
    
    return res.status(200).json({
      assignment,
      submissions: submissionsResult.recordset,
      pendingSubmissions: pendingSubmissionsResult.recordset
    });
  } catch (error) {
    console.error('Get Assignment Details Error:', error);
    return res.status(500).json({ message: 'Server error while fetching assignment details', error: error.message });
  }
});

// Create a new assignment (as a coding exercise)
router.post('/', async (req, res) => {
  try {
    const { 
      moduleId, 
      lessonId,
      title, 
      description, 
      programmingLanguage = 'javascript',
      initialCode = '',
      points = 100,
      difficulty = 'medium'
    } = req.body;
    
    if (!moduleId || !title) {
      return res.status(400).json({ message: 'Module ID and title are required' });
    }
    
    const pool = await poolPromise;
    
    // If no lessonId provided, get the first lesson in the module or create one
    let targetLessonId = lessonId;
    if (!targetLessonId) {
      // Get the first lesson of the module if it exists
      const lessonCheck = await pool.request()
        .input('moduleId', sql.BigInt, moduleId)
        .query(`
          SELECT TOP 1 LessonID 
          FROM CourseLessons 
          WHERE ModuleID = @moduleId 
          ORDER BY OrderIndex ASC
        `);
      
      if (lessonCheck.recordset.length > 0) {
        targetLessonId = lessonCheck.recordset[0].LessonID;
      } else {
        // Create a new lesson if none exists
        const lessonResult = await pool.request()
          .input('moduleId', sql.BigInt, moduleId)
          .input('title', sql.NVarChar(255), 'Exercises')
          .input('description', sql.NVarChar(500), 'Collection of exercises')
          .input('type', sql.VarChar(50), 'coding')
          .input('orderIndex', sql.Int, 1)
          .query(`
            INSERT INTO CourseLessons (ModuleID, Title, Description, Type, OrderIndex, IsPublished)
            VALUES (@moduleId, @title, @description, @type, @orderIndex, 1);
            SELECT SCOPE_IDENTITY() AS LessonID;
          `);
        
        targetLessonId = lessonResult.recordset[0].LessonID;
      }
    }
    
    // Verify teacher has access to this module/lesson
    const moduleCheck = await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT 
          m.ModuleID, c.CourseID, c.Title as CourseTitle 
        FROM CourseModules m
        JOIN Courses c ON m.CourseID = c.CourseID
        WHERE m.ModuleID = @moduleId 
        AND (c.InstructorID = @teacherId)
      `);
    
    if (moduleCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this module' });
    }
    
    // Create assignment as a coding exercise
    const result = await pool.request()
      .input('lessonId', sql.BigInt, targetLessonId)
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description || null)
      .input('programmingLanguage', sql.VarChar(50), programmingLanguage)
      .input('initialCode', sql.NVarChar(sql.MAX), initialCode)
      .input('solutionCode', sql.NVarChar(sql.MAX), '')
      .input('testCases', sql.NVarChar(sql.MAX), '[]')
      .input('difficulty', sql.VarChar(20), difficulty)
      .input('points', sql.Int, points)
      .query(`
        INSERT INTO CodingExercises (
          LessonID, Title, Description, ProgrammingLanguage, 
          InitialCode, SolutionCode, TestCases, Difficulty, Points
        )
        VALUES (
          @lessonId, @title, @description, @programmingLanguage,
          @initialCode, @solutionCode, @testCases, @difficulty, @points
        );
        
        SELECT SCOPE_IDENTITY() AS ExerciseID;
      `);
    
    const exerciseId = result.recordset[0].ExerciseID;
    
    // Get the created exercise with full details
    const exerciseResult = await pool.request()
      .input('exerciseId', sql.BigInt, exerciseId)
      .query(`
        SELECT 
          ce.ExerciseID as AssignmentID, 
          ce.Title, 
          ce.Description, 
          DATEADD(day, 14, ce.CreatedAt) as DueDate,
          ce.Points as TotalPoints, 
          ce.CreatedAt, 
          ce.UpdatedAt,
          ce.Difficulty,
          cl.LessonID,
          cl.Title as LessonTitle,
          cm.ModuleID, 
          cm.Title as ModuleTitle,
          c.CourseID, 
          c.Title as CourseTitle
        FROM CodingExercises ce
        JOIN CourseLessons cl ON ce.LessonID = cl.LessonID
        JOIN CourseModules cm ON cl.ModuleID = cm.ModuleID
        JOIN Courses c ON cm.CourseID = c.CourseID
        WHERE ce.ExerciseID = @exerciseId
      `);
    
    if (exerciseResult.recordset.length === 0) {
      return res.status(500).json({ message: 'Failed to retrieve created assignment' });
    }
    
    return res.status(201).json({
      message: 'Assignment created successfully',
      assignment: exerciseResult.recordset[0]
    });
  } catch (error) {
    console.error('Create Assignment Error:', error);
    return res.status(500).json({ message: 'Server error while creating assignment', error: error.message });
  }
});

// Update an assignment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      programmingLanguage,
      initialCode,
      points,
      difficulty
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const pool = await poolPromise;
    
    // Verify teacher has access to this assignment (coding exercise)
    const accessCheck = await pool.request()
      .input('exerciseId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT COUNT(*) as HasAccess
        FROM CodingExercises ce
        JOIN CourseLessons cl ON ce.LessonID = cl.LessonID
        JOIN CourseModules cm ON cl.ModuleID = cm.ModuleID
        JOIN Courses c ON cm.CourseID = c.CourseID
        WHERE ce.ExerciseID = @exerciseId 
        AND (c.InstructorID = @teacherId)
      `);
    
    if (accessCheck.recordset[0].HasAccess === 0) {
      // Check if it's a ModulePractice
      const practiceCheck = await pool.request()
        .input('practiceId', sql.BigInt, id)
        .input('teacherId', sql.BigInt, req.user.UserID)
        .query(`
          SELECT COUNT(*) as HasAccess
          FROM ModulePractices mp
          JOIN CourseModules cm ON mp.ModuleID = cm.ModuleID
          JOIN Courses c ON cm.CourseID = c.CourseID
          WHERE mp.PracticeID = @practiceId 
          AND (c.InstructorID = @teacherId)
        `);
      
      if (practiceCheck.recordset[0].HasAccess === 0) {
        return res.status(403).json({ message: 'You do not have access to this assignment' });
      }
      
      // Update module practice
      const updateResult = await pool.request()
        .input('practiceId', sql.BigInt, id)
        .input('title', sql.NVarChar(255), title)
        .input('description', sql.NVarChar(sql.MAX), description || null)
        .input('programmingLanguage', sql.VarChar(50), programmingLanguage)
        .input('initialCode', sql.NVarChar(sql.MAX), initialCode)
        .input('difficulty', sql.VarChar(20), difficulty)
        .query(`
          UPDATE ModulePractices
          SET 
            Title = @title,
            Description = @description,
            ${programmingLanguage ? 'ProgrammingLanguage = @programmingLanguage,' : ''}
            ${initialCode ? 'InitialCode = @initialCode,' : ''}
            ${difficulty ? 'Difficulty = @difficulty,' : ''}
            UpdatedAt = GETDATE()
          WHERE PracticeID = @practiceId
        `);
      
      // Get updated practice details
      const practiceResult = await pool.request()
        .input('practiceId', sql.BigInt, id)
        .query(`
          SELECT 
            mp.PracticeID as AssignmentID, 
            mp.Title, 
            mp.Description, 
            DATEADD(day, 14, mp.CreatedAt) as DueDate,
            mp.Difficulty,
            0 as TotalPoints, 
            mp.CreatedAt, 
            mp.UpdatedAt,
            cm.ModuleID, 
            cm.Title as ModuleTitle,
            c.CourseID, 
            c.Title as CourseTitle
          FROM ModulePractices mp
          JOIN CourseModules cm ON mp.ModuleID = cm.ModuleID
          JOIN Courses c ON cm.CourseID = c.CourseID
          WHERE mp.PracticeID = @practiceId
        `);
      
      return res.status(200).json({
        message: 'Assignment updated successfully',
        assignment: practiceResult.recordset[0]
      });
    }
    
    // Update coding exercise
    const updateResult = await pool.request()
      .input('exerciseId', sql.BigInt, id)
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description || null)
      .input('programmingLanguage', sql.VarChar(50), programmingLanguage)
      .input('initialCode', sql.NVarChar(sql.MAX), initialCode)
      .input('points', sql.Int, points)
      .input('difficulty', sql.VarChar(20), difficulty)
      .query(`
        UPDATE CodingExercises
        SET 
          Title = @title,
          Description = @description,
          ${programmingLanguage ? 'ProgrammingLanguage = @programmingLanguage,' : ''}
          ${initialCode ? 'InitialCode = @initialCode,' : ''}
          ${points ? 'Points = @points,' : ''}
          ${difficulty ? 'Difficulty = @difficulty,' : ''}
          UpdatedAt = GETDATE()
        WHERE ExerciseID = @exerciseId
      `);
    
    // Get updated exercise details
    const exerciseResult = await pool.request()
      .input('exerciseId', sql.BigInt, id)
      .query(`
        SELECT 
          ce.ExerciseID as AssignmentID, 
          ce.Title, 
          ce.Description, 
          DATEADD(day, 14, ce.CreatedAt) as DueDate,
          ce.Points as TotalPoints, 
          ce.CreatedAt, 
          ce.UpdatedAt,
          ce.Difficulty,
          cl.LessonID,
          cl.Title as LessonTitle,
          cm.ModuleID, 
          cm.Title as ModuleTitle,
          c.CourseID, 
          c.Title as CourseTitle
        FROM CodingExercises ce
        JOIN CourseLessons cl ON ce.LessonID = cl.LessonID
        JOIN CourseModules cm ON cl.ModuleID = cm.ModuleID
        JOIN Courses c ON cm.CourseID = c.CourseID
        WHERE ce.ExerciseID = @exerciseId
      `);
    
    return res.status(200).json({
      message: 'Assignment updated successfully',
      assignment: exerciseResult.recordset[0]
    });
  } catch (error) {
    console.error('Update Assignment Error:', error);
    return res.status(500).json({ message: 'Server error while updating assignment', error: error.message });
  }
});

// Delete an assignment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Verify teacher has access to this assignment (coding exercise)
    const accessCheck = await pool.request()
      .input('exerciseId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT COUNT(*) as HasAccess
        FROM CodingExercises ce
        JOIN CourseLessons cl ON ce.LessonID = cl.LessonID
        JOIN CourseModules cm ON cl.ModuleID = cm.ModuleID
        JOIN Courses c ON cm.CourseID = c.CourseID
        WHERE ce.ExerciseID = @exerciseId 
        AND (c.InstructorID = @teacherId)
      `);
    
    if (accessCheck.recordset[0].HasAccess === 0) {
      // Check if it's a ModulePractice
      const practiceCheck = await pool.request()
        .input('practiceId', sql.BigInt, id)
        .input('teacherId', sql.BigInt, req.user.UserID)
        .query(`
          SELECT COUNT(*) as HasAccess
          FROM ModulePractices mp
          JOIN CourseModules cm ON mp.ModuleID = cm.ModuleID
          JOIN Courses c ON cm.CourseID = c.CourseID
          WHERE mp.PracticeID = @practiceId 
          AND (c.InstructorID = @teacherId)
        `);
      
      if (practiceCheck.recordset[0].HasAccess === 0) {
        return res.status(403).json({ message: 'You do not have access to this assignment' });
      }
      
      // Delete practice test cases first
      await pool.request()
        .input('practiceId', sql.BigInt, id)
        .query(`
          DELETE FROM PracticeTestCases
          WHERE PracticeID = @practiceId
        `);
      
      // Delete module practice
      await pool.request()
        .input('practiceId', sql.BigInt, id)
        .query(`
          DELETE FROM ModulePractices
          WHERE PracticeID = @practiceId
        `);
      
      return res.status(200).json({ message: 'Assignment deleted successfully' });
    }
    
    // Delete coding submissions first
    await pool.request()
      .input('exerciseId', sql.BigInt, id)
      .query(`
        DELETE FROM CodingSubmissions
        WHERE ExerciseID = @exerciseId
      `);
    
    // Delete coding exercise
    await pool.request()
      .input('exerciseId', sql.BigInt, id)
      .query(`
        DELETE FROM CodingExercises
        WHERE ExerciseID = @exerciseId
      `);
    
    return res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete Assignment Error:', error);
    return res.status(500).json({ message: 'Server error while deleting assignment', error: error.message });
  }
});

// Grade a submission
router.put('/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { score, feedback, status = 'graded' } = req.body;
    
    if (score === undefined) {
      return res.status(400).json({ message: 'Score is required' });
    }
    
    const pool = await poolPromise;
    
    // Verify teacher has access to this submission
    const accessCheck = await pool.request()
      .input('submissionId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT 
          cs.SubmissionID, 
          cs.ExerciseID,
          ce.Title as ExerciseTitle,
          c.Title as CourseTitle,
          cs.UserID,
          u.FullName as StudentName,
          u.Email as StudentEmail
        FROM CodingSubmissions cs
        JOIN CodingExercises ce ON cs.ExerciseID = ce.ExerciseID
        JOIN CourseLessons cl ON ce.LessonID = cl.LessonID
        JOIN CourseModules cm ON cl.ModuleID = cm.ModuleID
        JOIN Courses c ON cm.CourseID = c.CourseID
        JOIN Users u ON cs.UserID = u.UserID
        WHERE cs.SubmissionID = @submissionId 
        AND c.InstructorID = @teacherId
      `);
    
    if (accessCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'You do not have access to grade this submission' });
    }
    
    const submission = accessCheck.recordset[0];
    
    // Update submission with grade
    await pool.request()
      .input('submissionId', sql.BigInt, id)
      .input('score', sql.Int, score)
      .input('feedback', sql.NVarChar(2000), feedback || '')
      .input('status', sql.VarChar(20), status)
      .query(`
        UPDATE CodingSubmissions
        SET 
          Score = @score,
          Status = @status,
          GradedAt = GETDATE()
        WHERE SubmissionID = @submissionId
      `);
    
    // Update assignment progress - CodingSubmissions doesn't directly link to enrollment
    // so we need to find the enrollment
    try {
      const enrollment = await pool.request()
        .input('userId', sql.BigInt, submission.UserID)
        .input('exerciseId', sql.BigInt, submission.ExerciseID)
        .query(`
          SELECT TOP 1 ce.CourseID
          FROM CodingExercises cex
          JOIN CourseLessons cl ON cex.LessonID = cl.LessonID
          JOIN CourseModules cm ON cl.ModuleID = cm.ModuleID
          JOIN Courses c ON cm.CourseID = c.CourseID
          WHERE cex.ExerciseID = @exerciseId
        `);
      
      if (enrollment.recordset.length > 0) {
        const courseId = enrollment.recordset[0].CourseID;
        
        // Update lesson progress
        await pool.request()
          .input('userId', sql.BigInt, submission.UserID)
          .input('exerciseId', sql.BigInt, submission.ExerciseID)
          .input('lessonId', sql.BigInt, submission.LessonID)
          .input('courseId', sql.BigInt, courseId)
          .query(`
            UPDATE LessonProgress
            SET 
              Status = 'completed',
              CompletedAt = GETDATE()
            FROM LessonProgress lp
            JOIN CourseEnrollments ce ON lp.EnrollmentID = ce.EnrollmentID
            JOIN CourseLessons cl ON lp.LessonID = cl.LessonID
            JOIN CodingExercises cex ON cl.LessonID = cex.LessonID
            WHERE ce.UserID = @userId 
            AND ce.CourseID = @courseId
            AND cex.ExerciseID = @exerciseId
          `);
      }
    } catch (err) {
      console.warn('Failed to update lesson progress:', err);
      // Continue even if this fails
    }
    
    return res.status(200).json({
      message: 'Submission graded successfully'
    });
  } catch (error) {
    console.error('Grade Submission Error:', error);
    return res.status(500).json({ message: 'Server error while grading submission', error: error.message });
  }
});

module.exports = router; 