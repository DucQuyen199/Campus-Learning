const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/database');

// TODO: Import controller khi đã tạo
// const courseController = require('../controllers/courseController');

// Get all courses created by the teacher
router.get('/', async (req, res) => {
  try {
    const { search, status, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const pool = await poolPromise;
    const request = pool.request()
      .input('teacherId', sql.BigInt, req.user.UserID)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    
    let query = `
      SELECT 
        c.CourseID, c.Title, c.Description, c.Category,
        c.Status, c.CreatedAt, c.UpdatedAt, c.ImageUrl,
        (SELECT COUNT(*) FROM CourseEnrollments WHERE CourseID = c.CourseID) as EnrollmentsCount,
        (SELECT COUNT(*) FROM CourseModules WHERE CourseID = c.CourseID) as ModulesCount
      FROM Courses c
      WHERE c.InstructorID = @teacherId AND c.DeletedAt IS NULL
    `;
    
    const countQuery = `
      SELECT COUNT(*) as TotalCount
      FROM Courses c
      WHERE c.InstructorID = @teacherId AND c.DeletedAt IS NULL
    `;
    
    // Add filters if provided
    if (search) {
      request.input('search', sql.NVarChar(100), `%${search}%`);
      query += ` AND (c.Title LIKE @search OR c.Description LIKE @search)`;
      countQuery += ` AND (c.Title LIKE @search OR c.Description LIKE @search)`;
    }
    
    if (status) {
      request.input('status', sql.VarChar(20), status);
      query += ` AND c.Status = @status`;
      countQuery += ` AND c.Status = @status`;
    }
    
    if (category) {
      request.input('category', sql.VarChar(50), category);
      query += ` AND c.Category = @category`;
      countQuery += ` AND c.Category = @category`;
    }
    
    // Finalize query with pagination
    query += `
      ORDER BY c.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    // Get courses with pagination
    const result = await request.query(query);
    
    // Get total count for pagination
    const countResult = await pool.request()
      .input('teacherId', sql.BigInt, req.user.UserID)
      .input('search', sql.NVarChar(100), search ? `%${search}%` : null)
      .input('status', sql.VarChar(20), status || null)
      .input('category', sql.VarChar(50), category || null)
      .query(countQuery);
    
    const totalCount = countResult.recordset[0].TotalCount;
    const totalPages = Math.ceil(totalCount / limit);
    
    return res.status(200).json({
      courses: result.recordset,
      pagination: {
        totalCount,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get Courses Error:', error);
    return res.status(500).json({ message: 'Server error while fetching courses', error: error.message });
  }
});

// Get course details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Verify teacher has access to this course
    const accessCheck = await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT COUNT(*) as HasAccess
        FROM Courses
        WHERE CourseID = @courseId 
        AND InstructorID = @teacherId 
        AND DeletedAt IS NULL
      `);
    
    if (accessCheck.recordset[0].HasAccess === 0) {
      return res.status(403).json({ message: 'You do not have access to this course' });
    }
    
    // Get course details
    const courseResult = await pool.request()
      .input('courseId', sql.BigInt, id)
      .query(`
        SELECT 
          c.CourseID, c.Title, c.Description, c.Category,
          c.Status, c.CreatedAt, c.UpdatedAt, c.ImageUrl,
          c.Requirements, c.Objectives, c.Level, c.Duration,
          u.FullName as CreatorName, u.Email as CreatorEmail,
          (SELECT COUNT(*) FROM CourseEnrollments WHERE CourseID = c.CourseID) as EnrollmentsCount,
          (SELECT COUNT(*) FROM CourseModules WHERE CourseID = c.CourseID) as ModulesCount,
          (SELECT COUNT(*) FROM CodingExercises ce JOIN CourseLessons cl ON ce.LessonID = cl.LessonID JOIN CourseModules m ON cl.ModuleID = m.ModuleID WHERE m.CourseID = c.CourseID) as ExercisesCount
        FROM Courses c
        LEFT JOIN Users u ON c.InstructorID = u.UserID
        WHERE c.CourseID = @courseId AND c.DeletedAt IS NULL
      `);
    
    if (courseResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const course = courseResult.recordset[0];
    
    // Get modules
    const modulesResult = await pool.request()
      .input('courseId', sql.BigInt, id)
      .query(`
        SELECT 
          m.ModuleID, m.Title, m.Description, m.OrderIndex, m.CreatedAt,
          (SELECT COUNT(*) FROM CourseLessons WHERE ModuleID = m.ModuleID) as LessonsCount,
          (SELECT COUNT(*) FROM CodingExercises ce JOIN CourseLessons cl ON ce.LessonID = cl.LessonID WHERE cl.ModuleID = m.ModuleID) as ExercisesCount
        FROM CourseModules m
        WHERE m.CourseID = @courseId
        ORDER BY m.OrderIndex
      `);
    
    // Get recent enrollments
    const enrollmentsResult = await pool.request()
      .input('courseId', sql.BigInt, id)
      .query(`
        SELECT TOP 10
          ce.EnrollmentID, ce.UserID, ce.EnrolledAt as EnrollmentDate, ce.Progress,
          u.FullName, u.Email
        FROM CourseEnrollments ce
        JOIN Users u ON ce.UserID = u.UserID
        WHERE ce.CourseID = @courseId
        ORDER BY ce.EnrolledAt DESC
      `);
    
    // Get recent announcements - Can't query if this table doesn't exist
    let announcements = [];
    try {
      const announcementsResult = await pool.request()
        .input('courseId', sql.BigInt, id)
        .query(`
          SELECT TOP 5
            a.AnnouncementID, a.Title, a.Content, a.CreatedAt,
            u.FullName as CreatorName
          FROM Announcements a
          JOIN Users u ON a.CreatedBy = u.UserID
          WHERE a.CourseID = @courseId
          ORDER BY a.CreatedAt DESC
        `);
      announcements = announcementsResult.recordset;
    } catch (e) {
      // Table might not exist, ignore
      console.log('Announcements table might not exist:', e.message);
    }
    
    return res.status(200).json({
      course,
      modules: modulesResult.recordset,
      recentEnrollments: enrollmentsResult.recordset,
      announcements
    });
  } catch (error) {
    console.error('Get Course Details Error:', error);
    return res.status(500).json({ message: 'Server error while fetching course details', error: error.message });
  }
});

// Create a module
router.post('/:id/modules', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Module title is required' });
    }
    
    const pool = await poolPromise;
    
    // Verify teacher has access to this course
    const accessCheck = await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT COUNT(*) as HasAccess
        FROM Courses
        WHERE CourseID = @courseId 
        AND InstructorID = @teacherId 
        AND DeletedAt IS NULL
      `);
    
    if (accessCheck.recordset[0].HasAccess === 0) {
      return res.status(403).json({ message: 'You do not have access to this course' });
    }
    
    // Get the next order index
    const orderIndexResult = await pool.request()
      .input('courseId', sql.BigInt, id)
      .query(`
        SELECT ISNULL(MAX(OrderIndex), 0) + 1 as NextOrderIndex
        FROM CourseModules
        WHERE CourseID = @courseId
      `);
    
    const orderIndex = orderIndexResult.recordset[0].NextOrderIndex;
    
    // Create module
    const result = await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('title', sql.NVarChar(100), title)
      .input('description', sql.NVarChar(500), description || null)
      .input('orderIndex', sql.Int, orderIndex)
      .input('createdAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO CourseModules (CourseID, Title, Description, OrderIndex, CreatedAt)
        OUTPUT INSERTED.ModuleID
        VALUES (@courseId, @title, @description, @orderIndex, @createdAt)
      `);
    
    const moduleId = result.recordset[0].ModuleID;
    
    // Update course last update time
    await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Courses
        SET UpdatedAt = @updatedAt
        WHERE CourseID = @courseId
      `);
    
    return res.status(201).json({
      message: 'Module created successfully',
      moduleId
    });
  } catch (error) {
    console.error('Create Module Error:', error);
    return res.status(500).json({ message: 'Server error while creating module', error: error.message });
  }
});

// Update a module
router.put('/modules/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, description, orderIndex } = req.body;
    
    if (!title && !description && orderIndex === undefined) {
      return res.status(400).json({ message: 'At least one field to update is required' });
    }
    
    const pool = await poolPromise;
    
    // Verify teacher has access to this module
    const accessCheck = await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT m.ModuleID, c.CourseID
        FROM CourseModules m
        JOIN Courses c ON m.CourseID = c.CourseID
        WHERE m.ModuleID = @moduleId 
        AND (c.InstructorID = @teacherId) 
        AND c.DeletedAt IS NULL
      `);
    
    if (accessCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'You do not have access to update this module' });
    }
    
    const courseId = accessCheck.recordset[0].CourseID;
    
    // Build update query
    let updateQuery = 'UPDATE CourseModules SET ';
    const updateValues = [];
    
    if (title) {
      updateValues.push('Title = @title');
    }
    
    if (description !== undefined) {
      updateValues.push('Description = @description');
    }
    
    if (orderIndex !== undefined) {
      updateValues.push('OrderIndex = @orderIndex');
    }
    
    updateQuery += updateValues.join(', ');
    updateQuery += ' WHERE ModuleID = @moduleId';
    
    // Update module
    await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .input('title', sql.NVarChar(100), title)
      .input('description', sql.NVarChar(500), description)
      .input('orderIndex', sql.Int, orderIndex)
      .query(updateQuery);
    
    // Update course last update time
    await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Courses
        SET UpdatedAt = @updatedAt
        WHERE CourseID = @courseId
      `);
    
    return res.status(200).json({
      message: 'Module updated successfully'
    });
  } catch (error) {
    console.error('Update Module Error:', error);
    return res.status(500).json({ message: 'Server error while updating module' });
  }
});

// Create a lesson
router.post('/modules/:moduleId/lessons', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, content, type = 'text', duration, orderIndex } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Lesson title and content are required' });
    }
    
    const pool = await poolPromise;
    
    // Verify teacher has access to this module
    const accessCheck = await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT m.ModuleID, c.CourseID
        FROM CourseModules m
        JOIN Courses c ON m.CourseID = c.CourseID
        WHERE m.ModuleID = @moduleId 
        AND (c.InstructorID = @teacherId) 
        AND c.DeletedAt IS NULL
      `);
    
    if (accessCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'You do not have access to this module' });
    }
    
    const courseId = accessCheck.recordset[0].CourseID;
    
    // Get the next order index if not provided
    let lessonOrderIndex = orderIndex;
    
    if (lessonOrderIndex === undefined) {
      const orderIndexResult = await pool.request()
        .input('moduleId', sql.BigInt, moduleId)
        .query(`
          SELECT ISNULL(MAX(OrderIndex), 0) + 1 as NextOrderIndex
          FROM CourseLessons
          WHERE ModuleID = @moduleId
        `);
      
      lessonOrderIndex = orderIndexResult.recordset[0].NextOrderIndex;
    }
    
    // Create lesson
    const result = await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .input('title', sql.NVarChar(100), title)
      .input('content', sql.NVarChar('max'), content)
      .input('type', sql.VarChar(20), type)
      .input('duration', sql.Int, duration || 30)
      .input('orderIndex', sql.Int, lessonOrderIndex)
      .input('createdAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO CourseLessons (ModuleID, Title, Content, Type, Duration, OrderIndex, CreatedAt)
        OUTPUT INSERTED.LessonID
        VALUES (@moduleId, @title, @content, @type, @duration, @orderIndex, @createdAt)
      `);
    
    const lessonId = result.recordset[0].LessonID;
    
    // Update course last update time
    await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Courses
        SET UpdatedAt = @updatedAt
        WHERE CourseID = @courseId
      `);
    
    return res.status(201).json({
      message: 'Lesson created successfully',
      lessonId
    });
  } catch (error) {
    console.error('Create Lesson Error:', error);
    return res.status(500).json({ message: 'Server error while creating lesson' });
  }
});

// Update a lesson
router.put('/lessons/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, content, type, duration, orderIndex } = req.body;
    
    if (!title && !content && !type && !duration && orderIndex === undefined) {
      return res.status(400).json({ message: 'At least one field to update is required' });
    }
    
    const pool = await poolPromise;
    
    // Verify teacher has access to this lesson
    const accessCheck = await pool.request()
      .input('lessonId', sql.BigInt, lessonId)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT l.LessonID, m.ModuleID, c.CourseID
        FROM CourseLessons l
        JOIN CourseModules m ON l.ModuleID = m.ModuleID
        JOIN Courses c ON m.CourseID = c.CourseID
        WHERE l.LessonID = @lessonId 
        AND (c.InstructorID = @teacherId) 
        AND c.DeletedAt IS NULL
      `);
    
    if (accessCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'You do not have access to update this lesson' });
    }
    
    const courseId = accessCheck.recordset[0].CourseID;
    
    // Build update query
    let updateQuery = 'UPDATE CourseLessons SET ';
    const updateValues = [];
    
    if (title) {
      updateValues.push('Title = @title');
    }
    
    if (content) {
      updateValues.push('Content = @content');
    }
    
    if (type) {
      updateValues.push('Type = @type');
    }
    
    if (duration) {
      updateValues.push('Duration = @duration');
    }
    
    if (orderIndex !== undefined) {
      updateValues.push('OrderIndex = @orderIndex');
    }
    
    updateValues.push('UpdatedAt = @updatedAt');
    
    updateQuery += updateValues.join(', ');
    updateQuery += ' WHERE LessonID = @lessonId';
    
    // Update lesson
    await pool.request()
      .input('lessonId', sql.BigInt, lessonId)
      .input('title', sql.NVarChar(100), title)
      .input('content', sql.NVarChar('max'), content)
      .input('type', sql.VarChar(20), type)
      .input('duration', sql.Int, duration)
      .input('orderIndex', sql.Int, orderIndex)
      .input('updatedAt', sql.DateTime, new Date())
      .query(updateQuery);
    
    // Update course last update time
    await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Courses
        SET UpdatedAt = @updatedAt
        WHERE CourseID = @courseId
      `);
    
    return res.status(200).json({
      message: 'Lesson updated successfully'
    });
  } catch (error) {
    console.error('Update Lesson Error:', error);
    return res.status(500).json({ message: 'Server error while updating lesson' });
  }
});

// Get course enrollments
router.get('/:id/enrollments', async (req, res) => {
  try {
    const { id } = req.params;
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const pool = await poolPromise;
    
    // Verify teacher has access to this course
    const accessCheck = await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT COUNT(*) as HasAccess
        FROM Courses
        WHERE CourseID = @courseId 
        AND (InstructorID = @teacherId) 
        AND DeletedAt IS NULL
      `);
    
    if (accessCheck.recordset[0].HasAccess === 0) {
      return res.status(403).json({ message: 'You do not have access to this course' });
    }
    
    const request = pool.request()
      .input('courseId', sql.BigInt, id)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, parseInt(limit));
    
    let query = `
      SELECT 
        ce.EnrollmentID, ce.UserID, ce.EnrolledAt as EnrollmentDate, 
        ce.CompletedAt as CompletionDate, ce.Progress, ce.LastAccessedLessonID as LastAccessedAt,
        u.FullName, u.Email, u.ImageUrl, u.Status as UserStatus
      FROM CourseEnrollments ce
      JOIN Users u ON ce.UserID = u.UserID
      WHERE ce.CourseID = @courseId
    `;
    
    const countQuery = `
      SELECT COUNT(*) as TotalCount
      FROM CourseEnrollments ce
      JOIN Users u ON ce.UserID = u.UserID
      WHERE ce.CourseID = @courseId
    `;
    
    // Add filters if provided
    if (search) {
      request.input('search', sql.NVarChar(100), `%${search}%`);
      query += ` AND (u.FullName LIKE @search OR u.Email LIKE @search)`;
      countQuery += ` AND (u.FullName LIKE @search OR u.Email LIKE @search)`;
    }
    
    if (status === 'completed') {
      query += ` AND ce.CompletedAt IS NOT NULL`;
      countQuery += ` AND ce.CompletedAt IS NOT NULL`;
    } else if (status === 'in_progress') {
      query += ` AND ce.CompletedAt IS NULL AND ce.Progress > 0`;
      countQuery += ` AND ce.CompletedAt IS NULL AND ce.Progress > 0`;
    } else if (status === 'not_started') {
      query += ` AND ce.Progress = 0`;
      countQuery += ` AND ce.Progress = 0`;
    }
    
    // Finalize query with pagination
    query += `
      ORDER BY ce.EnrolledAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    // Get enrollments with pagination
    const result = await request.query(query);
    
    // Get total count for pagination
    const countResult = await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('search', sql.NVarChar(100), search ? `%${search}%` : null)
      .query(countQuery);
    
    const totalCount = countResult.recordset[0].TotalCount;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get enrollment statistics
    const statsResult = await pool.request()
      .input('courseId', sql.BigInt, id)
      .query(`
        SELECT 
          COUNT(*) as TotalEnrollments,
          SUM(CASE WHEN CompletedAt IS NOT NULL THEN 1 ELSE 0 END) as CompletedCount,
          SUM(CASE WHEN CompletedAt IS NULL AND Progress > 0 THEN 1 ELSE 0 END) as InProgressCount,
          SUM(CASE WHEN Progress = 0 THEN 1 ELSE 0 END) as NotStartedCount,
          AVG(Progress) as AverageProgress
        FROM CourseEnrollments
        WHERE CourseID = @courseId
      `);
    
    return res.status(200).json({
      enrollments: result.recordset,
      statistics: statsResult.recordset[0],
      pagination: {
        totalCount,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get Course Enrollments Error:', error);
    return res.status(500).json({ message: 'Server error while fetching course enrollments' });
  }
});

// Update course details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, shortDescription, level, 
      category, subCategory, requirements, objectives, 
      price, discountPrice, imageUrl, videoUrl, duration
    } = req.body;
    
    if (!title && !description) {
      return res.status(400).json({ message: 'At least title or description is required' });
    }
    
    const pool = await poolPromise;
    
    // Verify teacher has access to this course
    const accessCheck = await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .query(`
        SELECT COUNT(*) as HasAccess
        FROM Courses
        WHERE CourseID = @courseId 
        AND InstructorID = @teacherId 
        AND DeletedAt IS NULL
      `);
    
    if (accessCheck.recordset[0].HasAccess === 0) {
      return res.status(403).json({ message: 'You do not have access to update this course' });
    }
    
    // Build update query
    let updateQuery = 'UPDATE Courses SET UpdatedAt = @updatedAt';
    
    if (title) updateQuery += ', Title = @title';
    if (description) updateQuery += ', Description = @description';
    if (shortDescription) updateQuery += ', ShortDescription = @shortDescription';
    if (level) updateQuery += ', Level = @level';
    if (category) updateQuery += ', Category = @category';
    if (subCategory) updateQuery += ', SubCategory = @subCategory';
    if (requirements) updateQuery += ', Requirements = @requirements';
    if (objectives) updateQuery += ', Objectives = @objectives';
    if (price !== undefined) updateQuery += ', Price = @price';
    if (discountPrice !== undefined) updateQuery += ', DiscountPrice = @discountPrice';
    if (imageUrl) updateQuery += ', ImageUrl = @imageUrl';
    if (videoUrl) updateQuery += ', VideoUrl = @videoUrl';
    if (duration) updateQuery += ', Duration = @duration';
    
    updateQuery += ' WHERE CourseID = @courseId AND InstructorID = @teacherId';
    
    // Update course
    const request = pool.request()
      .input('courseId', sql.BigInt, id)
      .input('teacherId', sql.BigInt, req.user.UserID)
      .input('updatedAt', sql.DateTime, new Date())
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar('max'), description)
      .input('shortDescription', sql.NVarChar(500), shortDescription)
      .input('level', sql.VarChar(20), level)
      .input('category', sql.VarChar(50), category)
      .input('subCategory', sql.VarChar(50), subCategory)
      .input('requirements', sql.NVarChar('max'), requirements)
      .input('objectives', sql.NVarChar('max'), objectives)
      .input('price', sql.Decimal(10, 2), price)
      .input('discountPrice', sql.Decimal(10, 2), discountPrice)
      .input('imageUrl', sql.VarChar(255), imageUrl)
      .input('videoUrl', sql.VarChar(255), videoUrl)
      .input('duration', sql.Int, duration);
    
    const result = await request.query(updateQuery);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Course not found or you do not have permission to update it' });
    }
    
    return res.status(200).json({ 
      message: 'Course updated successfully',
      courseId: id
    });
  } catch (error) {
    console.error('Update Course Error:', error);
    return res.status(500).json({ message: 'Server error while updating course', error: error.message });
  }
});

module.exports = router; 