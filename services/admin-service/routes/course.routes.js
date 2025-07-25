/*-----------------------------------------------------------------
* File: course.routes.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/database');
const path = require('path');
const fs = require('fs');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../uploads');
const courseUploadsDir = path.join(uploadDir, 'courses');
const moduleUploadsDir = path.join(uploadDir, 'modules');
const lessonUploadsDir = path.join(uploadDir, 'lessons');

// Đảm bảo các thư mục tồn tại
[uploadDir, courseUploadsDir, moduleUploadsDir, lessonUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Get all courses with creator information and stats
router.get('/', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT c.*, u.FullName as CreatorName,
          (SELECT COUNT(*) FROM CourseEnrollments WHERE CourseID = c.CourseID) as EnrollmentCount,
          (SELECT COUNT(*) FROM CourseModules WHERE CourseID = c.CourseID) as ModuleCount
        FROM Courses c
        LEFT JOIN Users u ON c.CreatedBy = u.UserID
        WHERE c.DeletedAt IS NULL
        ORDER BY c.CreatedAt DESC
      `);
    
    return res.status(200).json({ courses: result.recordset });
  } catch (error) {
    console.error('Get Courses Error:', error);
    return res.status(500).json({ message: 'Server error while getting courses' });
  }
});

// Get course by ID with modules, lessons, and creator info 
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate courseId
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const pool = await poolPromise;
    
    // Get course details
    const courseResult = await pool.request()
      .input('courseId', sql.BigInt, courseId) // Now using validated courseId
      .query(`
        SELECT c.*, u.FullName as CreatorName, u.Email as CreatorEmail
        FROM Courses c
        LEFT JOIN Users u ON c.CreatedBy = u.UserID
        WHERE c.CourseID = @courseId AND c.DeletedAt IS NULL
      `);
    
    if (courseResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get course modules
    const modulesResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT * FROM CourseModules
        WHERE CourseID = @courseId AND DeletedAt IS NULL
        ORDER BY OrderIndex
      `);
    
    // Get all lessons for this course
    const lessonsResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT l.* 
        FROM CourseLessons l
        JOIN CourseModules m ON l.ModuleID = m.ModuleID
        WHERE m.CourseID = @courseId AND l.DeletedAt IS NULL
        ORDER BY m.OrderIndex, l.OrderIndex
      `);
    
    // Get enrollment stats
    const statsResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT 
          COUNT(*) as TotalEnrollments,
          SUM(CASE WHEN CompletedAt IS NOT NULL THEN 1 ELSE 0 END) as CompletedCount,
          AVG(CAST(Rating as FLOAT)) as AverageRating
        FROM CourseEnrollments
        WHERE CourseID = @courseId
      `);

    // Organize lessons by module
    const modules = modulesResult.recordset.map(module => {
      const moduleLessons = lessonsResult.recordset.filter(
        lesson => lesson.ModuleID === module.ModuleID
      );
      
      return {
        ...module,
        lessons: moduleLessons
      };
    });

    // Return combined data
    return res.status(200).json({
      course: courseResult.recordset[0],
      modules: modules,
      stats: statsResult.recordset[0]
    });
  } catch (error) {
    console.error('Get Course Error:', error);
    return res.status(500).json({ message: 'Server error while getting course details' });
  }
});

// Create new course
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      price,
      duration,
      imageUrl,
      isPublished,
      requirements,
      objectives,
      slug
    } = req.body;
    
    const createdBy = req.user.UserID; // Logged in admin
    const pool = await poolPromise;
    
    // Ensure slug is not null and is unique
    let finalSlug = slug || '';
    
    // If no slug is provided, generate one from the title
    if (!finalSlug && title) {
      finalSlug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
    }
    
    // If still empty (unlikely but possible), use a timestamp
    if (!finalSlug || finalSlug.trim() === '') {
      finalSlug = 'course-' + Date.now();
    }
    
    // Check if slug already exists
    let slugExists = true;
    let slugCounter = 1;
    let uniqueSlug = finalSlug;
    
    while (slugExists) {
      const checkSlug = await pool.request()
        .input('slug', sql.VarChar(255), uniqueSlug)
        .query('SELECT COUNT(*) as count FROM Courses WHERE Slug = @slug');
      
      if (checkSlug.recordset[0].count === 0) {
        slugExists = false;
      } else {
        // Append counter to slug to make it unique
        uniqueSlug = `${finalSlug}-${slugCounter}`;
        slugCounter++;
      }
    }
    
    // Create the course with the unique slug
    const result = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('slug', sql.VarChar(255), uniqueSlug)
      .input('description', sql.NVarChar(sql.MAX), description || null)
      .input('category', sql.VarChar(50), category || null)
      .input('level', sql.VarChar(20), level || null)
      .input('price', sql.Decimal(10, 2), price || 0)
      .input('duration', sql.Int, duration || null)
      .input('imageUrl', sql.VarChar(255), imageUrl || null)
      .input('isPublished', sql.Bit, isPublished || false)
      .input('createdBy', sql.BigInt, createdBy || 1)
      .input('requirements', sql.NVarChar(sql.MAX), requirements || null)
      .input('objectives', sql.NVarChar(sql.MAX), objectives || null)
      .query(`
        INSERT INTO Courses (
          Title, Slug, Description, Category, Level, Price,
          Duration, ImageURL, IsPublished, CreatedBy, CreatedAt,
          Requirements, Objectives
        )
        OUTPUT INSERTED.CourseID
        VALUES (
          @title, @slug, @description, @category, @level, @price,
          @duration, @imageUrl, @isPublished, @createdBy, GETDATE(),
          @requirements, @objectives
        )
      `);
    
    const courseId = result.recordset[0].CourseID;
    
    // We don't need separate inserts for requirements and objectives anymore
    // since we're handling them directly in the main insert
    
    return res.status(201).json({
      message: 'Course created successfully',
      courseId: courseId
    });
  } catch (error) {
    console.error('Create Course Error:', error);
    return res.status(500).json({ 
      message: 'Server error while creating course',
      error: error.message 
    });
  }
});

// Update existing course
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      level,
      price,
      duration,
      imageUrl,
      isPublished,
      requirements,
      objectives
    } = req.body;
    
    const pool = await poolPromise;
    
    // Check if course exists
    const checkResult = await pool.request()
      .input('courseId', sql.BigInt, id)
      .query('SELECT * FROM Courses WHERE CourseID = @courseId AND DeletedAt IS NULL');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Update the course
    await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('category', sql.VarChar(100), category)
      .input('level', sql.VarChar(50), level)
      .input('price', sql.Decimal(10, 2), price)
      .input('duration', sql.Int, duration)
      .input('imageUrl', sql.VarChar(500), imageUrl)
      .input('isPublished', sql.Bit, isPublished)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Courses
        SET 
          Title = @title,
          Description = @description,
          Category = @category,
          Level = @level,
          Price = @price,
          Duration = @duration,
          ImageURL = @imageUrl,
          IsPublished = @isPublished,
          UpdatedAt = @updatedAt
        WHERE CourseID = @courseId
      `);
    
    // Update requirements (clear and re-add)
    if (requirements) {
      // Delete existing requirements
      await pool.request()
        .input('courseId', sql.BigInt, id)
        .query('DELETE FROM CourseRequirements WHERE CourseID = @courseId');
      
      // Add new requirements
      if (requirements.length > 0) {
        const requirementPromises = requirements.map((req, index) => {
          return pool.request()
            .input('courseId', sql.BigInt, id)
            .input('requirement', sql.NVarChar(500), req)
            .input('orderIndex', sql.Int, index + 1)
            .query(`
              INSERT INTO CourseRequirements (CourseID, Requirement, OrderIndex)
              VALUES (@courseId, @requirement, @orderIndex)
            `);
        });
        
        await Promise.all(requirementPromises);
      }
    }
    
    // Update objectives (clear and re-add)
    if (objectives) {
      // Delete existing objectives
      await pool.request()
        .input('courseId', sql.BigInt, id)
        .query('DELETE FROM CourseObjectives WHERE CourseID = @courseId');
      
      // Add new objectives
      if (objectives.length > 0) {
        const objectivePromises = objectives.map((obj, index) => {
          return pool.request()
            .input('courseId', sql.BigInt, id)
            .input('objective', sql.NVarChar(500), obj)
            .input('orderIndex', sql.Int, index + 1)
            .query(`
              INSERT INTO CourseObjectives (CourseID, Objective, OrderIndex)
              VALUES (@courseId, @objective, @orderIndex)
            `);
        });
        
        await Promise.all(objectivePromises);
      }
    }
    
    return res.status(200).json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Update Course Error:', error);
    return res.status(500).json({ message: 'Server error while updating course' });
  }
});

// Create course module
router.post('/:courseId/modules', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;
    
    const pool = await poolPromise;
    
    // Check if course exists
    const checkResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query('SELECT * FROM Courses WHERE CourseID = @courseId AND DeletedAt IS NULL');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get current highest order index
    const orderResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT ISNULL(MAX(OrderIndex), 0) as MaxOrder
        FROM CourseModules
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);
    
    const nextOrderIndex = orderResult.recordset[0].MaxOrder + 1;
    
    // Create module
    const result = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('orderIndex', sql.Int, nextOrderIndex)
      .input('createdAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO CourseModules (
          CourseID, Title, Description, OrderIndex, CreatedAt
        )
        OUTPUT INSERTED.ModuleID
        VALUES (
          @courseId, @title, @description, @orderIndex, @createdAt
        )
      `);
    
    const moduleId = result.recordset[0].ModuleID;
    
    return res.status(201).json({
      message: 'Course module created successfully',
      moduleId: moduleId
    });
  } catch (error) {
    console.error('Create Module Error:', error);
    return res.status(500).json({ message: 'Server error while creating course module' });
  }
});

// Get module with lessons
router.get('/modules/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const pool = await poolPromise;
    
    // Get module details
    const moduleResult = await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .query(`
        SELECT m.*, c.Title as CourseTitle
        FROM CourseModules m
        JOIN Courses c ON m.CourseID = c.CourseID
        WHERE m.ModuleID = @moduleId AND m.DeletedAt IS NULL
      `);
    
    if (moduleResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Get lessons in this module
    const lessonsResult = await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .query(`
        SELECT * FROM CourseLessons
        WHERE ModuleID = @moduleId AND DeletedAt IS NULL
        ORDER BY OrderIndex
      `);
    
    return res.status(200).json({
      module: moduleResult.recordset[0],
      lessons: lessonsResult.recordset
    });
  } catch (error) {
    console.error('Get Module Error:', error);
    return res.status(500).json({ message: 'Server error while getting module details' });
  }
});

// Update module
router.put('/modules/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, description, orderIndex } = req.body;
    
    const pool = await poolPromise;
    
    // Check if module exists
    const checkResult = await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .query('SELECT * FROM CourseModules WHERE ModuleID = @moduleId AND DeletedAt IS NULL');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Update module
    await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('orderIndex', sql.Int, orderIndex)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE CourseModules
        SET 
          Title = @title,
          Description = @description,
          OrderIndex = @orderIndex,
          UpdatedAt = @updatedAt
        WHERE ModuleID = @moduleId
      `);
    
    return res.status(200).json({ message: 'Module updated successfully' });
  } catch (error) {
    console.error('Update Module Error:', error);
    return res.status(500).json({ message: 'Server error while updating module' });
  }
});

// Create lesson
router.post('/modules/:moduleId/lessons', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, content, type, duration, videoUrl, orderIndex } = req.body;
    
    const pool = await poolPromise;
    
    // Check if module exists
    const checkResult = await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .query(`
        SELECT m.*, c.CourseID 
        FROM CourseModules m
        JOIN Courses c ON m.CourseID = c.CourseID
        WHERE m.ModuleID = @moduleId AND m.DeletedAt IS NULL
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Get current highest order index if not provided
    let nextOrderIndex = orderIndex;
    if (!nextOrderIndex) {
      const orderResult = await pool.request()
        .input('moduleId', sql.BigInt, moduleId)
        .query(`
          SELECT ISNULL(MAX(OrderIndex), 0) as MaxOrder
          FROM CourseLessons
          WHERE ModuleID = @moduleId AND DeletedAt IS NULL
        `);
      
      nextOrderIndex = orderResult.recordset[0].MaxOrder + 1;
    }
    
    // Create lesson
    const result = await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .input('courseId', sql.BigInt, checkResult.recordset[0].CourseID)
      .input('title', sql.NVarChar(255), title)
      .input('content', sql.NVarChar(sql.MAX), content)
      .input('type', sql.VarChar(50), type)
      .input('duration', sql.Int, duration || 0)
      .input('videoUrl', sql.VarChar(500), videoUrl)
      .input('orderIndex', sql.Int, nextOrderIndex)
      .input('createdAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO CourseLessons (
          ModuleID, CourseID, Title, Content, Type, 
          Duration, VideoURL, OrderIndex, CreatedAt
        )
        OUTPUT INSERTED.LessonID
        VALUES (
          @moduleId, @courseId, @title, @content, @type,
          @duration, @videoUrl, @orderIndex, @createdAt
        )
      `);
    
    const lessonId = result.recordset[0].LessonID;
    
    return res.status(201).json({
      message: 'Lesson created successfully',
      lessonId: lessonId
    });
  } catch (error) {
    console.error('Create Lesson Error:', error);
    return res.status(500).json({ message: 'Server error while creating lesson' });
  }
});

// Get course statistics for admin
router.get('/stats', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN IsPublished = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN DATEDIFF(day, CreatedAt, GETDATE()) <= 30 THEN 1 ELSE 0 END) as newCount,
        SUM(CASE WHEN DATEDIFF(day, UpdatedAt, GETDATE()) <= 7 THEN 1 ELSE 0 END) as recentlyUpdated
      FROM Courses 
      WHERE DeletedAt IS NULL
    `);

    // Calculate change percentage from last month
    const lastMonthResult = await pool.request().query(`
      SELECT COUNT(*) as lastMonthTotal
      FROM Courses
      WHERE 
        DeletedAt IS NULL AND
        CreatedAt >= DATEADD(month, -1, GETDATE())
    `);

    const currentTotal = result.recordset[0].total || 0;
    const lastMonthTotal = lastMonthResult.recordset[0].lastMonthTotal || 1; // Avoid division by zero
    const change = ((currentTotal - lastMonthTotal) / Math.max(lastMonthTotal, 1)) * 100;

    return res.status(200).json({
      success: true,
      data: {
        ...result.recordset[0],
        change: change.toFixed(2),
        changeType: change >= 0 ? 'increase' : 'decrease'
      }
    });
  } catch (error) {
    console.error('Get Course Stats Error:', error);
    return res.status(500).json({
      success: false, 
      message: 'Error getting course stats'
    });
  }
});

// Add route for course completion stats
router.get('/completion', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        c.Category as name,
        COUNT(CASE WHEN ce.CompletedAt IS NOT NULL THEN 1 END) as completed,
        COUNT(CASE WHEN ce.CompletedAt IS NULL THEN 1 END) as incomplete
      FROM Courses c
      LEFT JOIN CourseEnrollments ce ON c.CourseID = ce.CourseID
      WHERE c.DeletedAt IS NULL
      GROUP BY c.Category
    `);

    return res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Get Course Completion Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting course completion stats'  
    });
  }
});

// Get specific course statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate course ID
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const pool = await poolPromise;

    // Get course basic info
    const courseResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT Title, Category, Level, IsPublished
        FROM Courses
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);
    
    if (courseResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get enrollment statistics
    const enrollmentStats = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT 
          COUNT(*) as TotalEnrollments,
          SUM(CASE WHEN CompletedAt IS NOT NULL THEN 1 ELSE 0 END) as CompletedCount,
          AVG(CAST(Rating as FLOAT)) as AverageRating,
          COUNT(DISTINCT UserID) as UniqueStudents
        FROM CourseEnrollments
        WHERE CourseID = @courseId
      `);
    
    // Get monthly enrollment trend for the last 6 months
    const trendResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT 
          MONTH(EnrolledAt) as Month, 
          YEAR(EnrolledAt) as Year,
          COUNT(*) as EnrollmentCount
        FROM CourseEnrollments
        WHERE 
          CourseID = @courseId AND
          EnrolledAt >= DATEADD(month, -6, GETDATE())
        GROUP BY MONTH(EnrolledAt), YEAR(EnrolledAt)
        ORDER BY Year, Month
      `);
    
    // Get module and lesson count
    const contentStats = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM CourseModules WHERE CourseID = @courseId AND DeletedAt IS NULL) as ModuleCount,
          (SELECT COUNT(*) FROM CourseLessons WHERE CourseID = @courseId AND DeletedAt IS NULL) as LessonCount,
          (SELECT SUM(Duration) FROM CourseLessons WHERE CourseID = @courseId AND DeletedAt IS NULL) as TotalDuration
      `);
    
    // Get progress distribution (how far along are students)
    const progressDistribution = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT 
          CASE 
            WHEN Progress = 100 THEN 'Completed'
            WHEN Progress >= 75 THEN '75-99%'
            WHEN Progress >= 50 THEN '50-74%'
            WHEN Progress >= 25 THEN '25-49%'
            ELSE '0-24%'
          END as ProgressBucket,
          COUNT(*) as StudentCount
        FROM CourseEnrollments
        WHERE CourseID = @courseId
        GROUP BY 
          CASE 
            WHEN Progress = 100 THEN 'Completed'
            WHEN Progress >= 75 THEN '75-99%'
            WHEN Progress >= 50 THEN '50-74%'
            WHEN Progress >= 25 THEN '25-49%'
            ELSE '0-24%'
          END
        ORDER BY 
          CASE ProgressBucket
            WHEN 'Completed' THEN 5
            WHEN '75-99%' THEN 4
            WHEN '50-74%' THEN 3
            WHEN '25-49%' THEN 2
            ELSE 1
          END DESC
      `);
    
    return res.status(200).json({
      course: courseResult.recordset[0],
      enrollmentStats: enrollmentStats.recordset[0],
      contentStats: contentStats.recordset[0],
      enrollmentTrend: trendResult.recordset,
      progressDistribution: progressDistribution.recordset
    });
  } catch (error) {
    console.error('Get Course Stats Error:', error);
    return res.status(500).json({ message: 'Server error while getting course statistics' });
  }
});

// Get all enrollments for a specific course with full user details
router.get('/:id/enrollments', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate course ID
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    // Pagination parameters (optional)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const pool = await poolPromise;
    
    // First check if course exists
    const courseExists = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT CourseID
        FROM Courses
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);
    
    if (courseExists.recordset.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get total count for pagination
    const countResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT COUNT(*) as total
        FROM CourseEnrollments
        WHERE CourseID = @courseId
      `);
    
    const totalEnrollments = countResult.recordset[0].total;
    
    // Get enrollments with user data
    const enrollmentsResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT 
          e.EnrollmentID,
          e.UserID,
          e.CourseID,
          e.EnrolledAt as EnrollmentDate,
          e.CompletedAt,
          e.Progress,
          e.LastAccessedAt,
          CASE 
            WHEN e.CompletedAt IS NOT NULL THEN 'completed'
            WHEN e.LastAccessedAt >= DATEADD(day, -7, GETDATE()) THEN 'active'
            ELSE 'inactive'
          END as Status,
          u.FullName,
          u.Email,
          u.Phone,
          u.AvatarUrl
        FROM CourseEnrollments e
        JOIN Users u ON e.UserID = u.UserID
        WHERE e.CourseID = @courseId
        ORDER BY e.EnrolledAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);
    
    // Reformat data to match frontend expectations
    const formattedEnrollments = enrollmentsResult.recordset.map(enrollment => {
      return {
        EnrollmentID: enrollment.EnrollmentID,
        UserID: enrollment.UserID,
        CourseID: enrollment.CourseID,
        EnrollmentDate: enrollment.EnrollmentDate,
        CompletedAt: enrollment.CompletedAt,
        Progress: enrollment.Progress,
        LastAccessedAt: enrollment.LastAccessedAt,
        Status: enrollment.Status,
        User: {
          FullName: enrollment.FullName,
          Email: enrollment.Email,
          Phone: enrollment.Phone,
          AvatarUrl: enrollment.AvatarUrl
        }
      };
    });
    
    return res.status(200).json({
      enrollments: formattedEnrollments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalEnrollments / limit),
        totalItems: totalEnrollments,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get Course Enrollments Error:', error);
    return res.status(500).json({ message: 'Server error while getting course enrollments' });
  }
});

// Delete course (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Soft delete the course
    await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('deletedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Courses
        SET DeletedAt = @deletedAt
        WHERE CourseID = @courseId
      `);
    
    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete Course Error:', error);
    return res.status(500).json({ message: 'Server error while deleting course' });
  }
});

// Upload hình ảnh cho khóa học
router.post('/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    
    const imageFile = req.files.image;
    const fileExtension = path.extname(imageFile.name);
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    // Kiểm tra định dạng file
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid file format. Only jpg, jpeg, png, gif, and webp are allowed.' });
    }
    
    // Tạo tên file unique
    const uniqueFilename = `course_${id}_${Date.now()}${fileExtension}`;
    const uploadPath = path.join(courseUploadsDir, uniqueFilename);
    
    // Di chuyển file
    await imageFile.mv(uploadPath);
    
    // Cập nhật URL hình ảnh trong database
    const pool = await poolPromise;
    await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('imageUrl', sql.VarChar(255), `/uploads/courses/${uniqueFilename}`)
      .query(`
        UPDATE Courses
        SET ImageUrl = @imageUrl,
            UpdatedAt = GETDATE()
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);
    
    return res.status(200).json({
      message: 'Course image uploaded successfully',
      imageUrl: `/uploads/courses/${uniqueFilename}`
    });
  } catch (error) {
    console.error('Upload Course Image Error:', error);
    return res.status(500).json({ message: 'Server error while uploading course image' });
  }
});

// Upload video cho khóa học
router.post('/:id/video', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || !req.files.video) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }
    
    const videoFile = req.files.video;
    const fileExtension = path.extname(videoFile.name);
    const allowedExtensions = ['.mp4', '.webm', '.mov', '.avi'];
    
    // Kiểm tra định dạng file
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid file format. Only mp4, webm, mov, and avi are allowed.' });
    }
    
    // Tạo tên file unique
    const uniqueFilename = `course_${id}_${Date.now()}${fileExtension}`;
    const uploadPath = path.join(courseUploadsDir, uniqueFilename);
    
    // Di chuyển file
    await videoFile.mv(uploadPath);
    
    // Cập nhật URL video trong database
    const pool = await poolPromise;
    await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('videoUrl', sql.VarChar(255), `/uploads/courses/${uniqueFilename}`)
      .query(`
        UPDATE Courses
        SET VideoUrl = @videoUrl,
            UpdatedAt = GETDATE()
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);
    
    return res.status(200).json({
      message: 'Course video uploaded successfully',
      videoUrl: `/uploads/courses/${uniqueFilename}`
    });
  } catch (error) {
    console.error('Upload Course Video Error:', error);
    return res.status(500).json({ message: 'Server error while uploading course video' });
  }
});

// Upload hình ảnh cho module
router.post('/:courseId/modules/:moduleId/image', async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    
    const imageFile = req.files.image;
    const fileExtension = path.extname(imageFile.name);
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    // Kiểm tra định dạng file
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid file format. Only jpg, jpeg, png, gif, and webp are allowed.' });
    }
    
    // Tạo tên file unique
    const uniqueFilename = `module_${moduleId}_${Date.now()}${fileExtension}`;
    const uploadPath = path.join(moduleUploadsDir, uniqueFilename);
    
    // Di chuyển file
    await imageFile.mv(uploadPath);
    
    // Cập nhật URL hình ảnh trong database
    const pool = await poolPromise;
    await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .input('courseId', sql.BigInt, courseId)
      .input('imageUrl', sql.VarChar(500), `/uploads/modules/${uniqueFilename}`)
      .query(`
        UPDATE CourseModules
        SET ImageUrl = @imageUrl,
            UpdatedAt = GETDATE()
        WHERE ModuleID = @moduleId AND CourseID = @courseId
      `);
    
    return res.status(200).json({
      message: 'Module image uploaded successfully',
      imageUrl: `/uploads/modules/${uniqueFilename}`
    });
  } catch (error) {
    console.error('Upload Module Image Error:', error);
    return res.status(500).json({ message: 'Server error while uploading module image' });
  }
});

// Upload video cho module
router.post('/:courseId/modules/:moduleId/video', async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    
    if (!req.files || !req.files.video) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }
    
    const videoFile = req.files.video;
    const fileExtension = path.extname(videoFile.name);
    const allowedExtensions = ['.mp4', '.webm', '.mov', '.avi'];
    
    // Kiểm tra định dạng file
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid file format. Only mp4, webm, mov, and avi are allowed.' });
    }
    
    // Tạo tên file unique
    const uniqueFilename = `module_${moduleId}_${Date.now()}${fileExtension}`;
    const uploadPath = path.join(moduleUploadsDir, uniqueFilename);
    
    // Di chuyển file
    await videoFile.mv(uploadPath);
    
    // Cập nhật URL video trong database
    const pool = await poolPromise;
    await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .input('courseId', sql.BigInt, courseId)
      .input('videoUrl', sql.VarChar(500), `/uploads/modules/${uniqueFilename}`)
      .query(`
        UPDATE CourseModules
        SET VideoUrl = @videoUrl,
            UpdatedAt = GETDATE()
        WHERE ModuleID = @moduleId AND CourseID = @courseId
      `);
    
    return res.status(200).json({
      message: 'Module video uploaded successfully',
      videoUrl: `/uploads/modules/${uniqueFilename}`
    });
  } catch (error) {
    console.error('Upload Module Video Error:', error);
    return res.status(500).json({ message: 'Server error while uploading module video' });
  }
});

// Upload video cho bài học
router.post('/:courseId/modules/:moduleId/lessons/:lessonId/video', async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    
    if (!req.files || !req.files.video) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }
    
    const videoFile = req.files.video;
    const fileExtension = path.extname(videoFile.name);
    const allowedExtensions = ['.mp4', '.webm', '.mov', '.avi'];
    
    // Kiểm tra định dạng file
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid file format. Only mp4, webm, mov, and avi are allowed.' });
    }
    
    // Tạo tên file unique
    const uniqueFilename = `lesson_${lessonId}_${Date.now()}${fileExtension}`;
    const uploadPath = path.join(lessonUploadsDir, uniqueFilename);
    
    // Di chuyển file
    await videoFile.mv(uploadPath);
    
    // Cập nhật URL video trong database
    const pool = await poolPromise;
    await pool.request()
      .input('lessonId', sql.BigInt, lessonId)
      .input('moduleId', sql.BigInt, moduleId)
      .input('videoUrl', sql.VarChar(255), `/uploads/lessons/${uniqueFilename}`)
      .query(`
        UPDATE CourseLessons
        SET VideoUrl = @videoUrl,
            Type = 'video',
            UpdatedAt = GETDATE()
        WHERE LessonID = @lessonId AND ModuleID = @moduleId
      `);
    
    return res.status(200).json({
      message: 'Lesson video uploaded successfully',
      videoUrl: `/uploads/lessons/${uniqueFilename}`
    });
  } catch (error) {
    console.error('Upload Lesson Video Error:', error);
    return res.status(500).json({ message: 'Server error while uploading lesson video' });
  }
});

// Upload file testkey cho bài học (ví dụ: bài tập coding)
router.post('/:courseId/modules/:moduleId/lessons/:lessonId/testkey', async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    
    if (!req.files || !req.files.testkey) {
      return res.status(400).json({ message: 'No testkey file uploaded' });
    }
    
    const testFile = req.files.testkey;
    const fileExtension = path.extname(testFile.name);
    
    // Tạo tên file unique
    const uniqueFilename = `testkey_${lessonId}_${Date.now()}${fileExtension}`;
    const uploadPath = path.join(lessonUploadsDir, uniqueFilename);
    
    // Di chuyển file
    await testFile.mv(uploadPath);
    
    // Đọc nội dung file test
    const testContent = fs.readFileSync(uploadPath, 'utf8');
    
    // Cập nhật thông tin bài tập trong database
    const pool = await poolPromise;
    
    // Kiểm tra xem bài học có tồn tại không
    const lessonCheck = await pool.request()
      .input('lessonId', sql.BigInt, lessonId)
      .query('SELECT Type FROM CourseLessons WHERE LessonID = @lessonId');
      
    if (lessonCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Kiểm tra nếu là bài tập coding
    const lessonType = lessonCheck.recordset[0].Type;
    if (lessonType === 'coding') {
      // Lấy ID của bài tập coding liên quan đến bài học này
      const exerciseCheck = await pool.request()
        .input('lessonId', sql.BigInt, lessonId)
        .query('SELECT ExerciseID FROM CodingExercises WHERE LessonID = @lessonId');
      
      if (exerciseCheck.recordset.length > 0) {
        // Cập nhật bài tập coding hiện có
        const exerciseId = exerciseCheck.recordset[0].ExerciseID;
        await pool.request()
          .input('exerciseId', sql.BigInt, exerciseId)
          .input('testCases', sql.NVarChar(sql.MAX), testContent)
          .input('updatedAt', sql.DateTime, new Date())
          .query(`
            UPDATE CodingExercises
            SET TestCases = @testCases,
                UpdatedAt = @updatedAt
            WHERE ExerciseID = @exerciseId
          `);
      } else {
        // Tạo bài tập coding mới
        await pool.request()
          .input('lessonId', sql.BigInt, lessonId)
          .input('title', sql.NVarChar(255), `Testcase for Lesson ${lessonId}`)
          .input('testCases', sql.NVarChar(sql.MAX), testContent)
          .input('createdAt', sql.DateTime, new Date())
          .query(`
            INSERT INTO CodingExercises (
              LessonID, Title, TestCases, CreatedAt, UpdatedAt
            )
            VALUES (
              @lessonId, @title, @testCases, @createdAt, @createdAt
            )
          `);
      }
    } else {
      // Cập nhật loại bài học thành 'coding'
      await pool.request()
        .input('lessonId', sql.BigInt, lessonId)
        .query(`
          UPDATE CourseLessons
          SET Type = 'coding',
              UpdatedAt = GETDATE()
          WHERE LessonID = @lessonId
        `);
      
      // Tạo bài tập coding mới
      await pool.request()
        .input('lessonId', sql.BigInt, lessonId)
        .input('title', sql.NVarChar(255), `Testcase for Lesson ${lessonId}`)
        .input('testCases', sql.NVarChar(sql.MAX), testContent)
        .input('createdAt', sql.DateTime, new Date())
        .query(`
          INSERT INTO CodingExercises (
            LessonID, Title, TestCases, CreatedAt, UpdatedAt
          )
          VALUES (
            @lessonId, @title, @testCases, @createdAt, @createdAt
          )
        `);
    }
    
    return res.status(200).json({
      message: 'Testkey file uploaded successfully',
      testFilePath: `/uploads/lessons/${uniqueFilename}`
    });
  } catch (error) {
    console.error('Upload Testkey Error:', error);
    return res.status(500).json({ message: 'Server error while uploading testkey file' });
  }
});

// Kiểm tra khóa học đã đủ yêu cầu video và testkey trước khi publish
router.get('/:id/validation', async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    const pool = await poolPromise;
    
    // Kiểm tra khóa học có tồn tại không
    const courseCheck = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query('SELECT Title, VideoUrl, ImageUrl FROM Courses WHERE CourseID = @courseId AND DeletedAt IS NULL');
      
    if (courseCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const course = courseCheck.recordset[0];
    
    // Lấy tất cả modules của khóa học
    const modulesResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT ModuleID, Title, VideoUrl, ImageUrl 
        FROM CourseModules 
        WHERE CourseID = @courseId AND DeletedAt IS NULL
        ORDER BY OrderIndex
      `);
    
    const modules = modulesResult.recordset;
    
    // Kiểm tra xem khóa học có module không
    if (modules.length === 0) {
      return res.status(200).json({
        isValid: false,
        message: 'Course has no modules',
        details: {
          courseHasVideo: !!course.VideoUrl,
          courseHasImage: !!course.ImageUrl,
          hasSufficientModules: false,
          modulesWithMissingContent: [],
          lessonsWithMissingContent: []
        }
      });
    }
    
    // Lấy tất cả các bài học và thông tin exercises
    const lessonsResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT 
          l.LessonID, l.ModuleID, l.Title, l.Type, l.VideoUrl,
          (SELECT COUNT(*) FROM CodingExercises WHERE LessonID = l.LessonID) as HasExercise
        FROM CourseLessons l
        JOIN CourseModules m ON l.ModuleID = m.ModuleID
        WHERE m.CourseID = @courseId AND l.DeletedAt IS NULL AND m.DeletedAt IS NULL
        ORDER BY m.OrderIndex, l.OrderIndex
      `);
    
    const lessons = lessonsResult.recordset;
    
    // Kiểm tra xem tất cả các module có bài học không
    const modulesWithNoLessons = modules.filter(module => 
      !lessons.some(lesson => lesson.ModuleID === module.ModuleID)
    );
    
    // Kiểm tra bài học nào thiếu video
    const lessonsWithNoVideo = lessons.filter(lesson => !lesson.VideoUrl);
    
    // Kiểm tra bài học nào thiếu testkey (chỉ áp dụng cho bài học loại coding)
    const codingLessonsWithNoExercise = lessons.filter(
      lesson => lesson.Type === 'coding' && lesson.HasExercise === 0
    );
    
    // Tổng hợp kết quả
    const isValid = 
      !!course.VideoUrl && 
      !!course.ImageUrl && 
      modules.length > 0 && 
      modulesWithNoLessons.length === 0 && 
      lessonsWithNoVideo.length === 0 && 
      codingLessonsWithNoExercise.length === 0;
    
    const modulesWithMissingContent = [
      ...modulesWithNoLessons.map(m => ({ moduleId: m.ModuleID, title: m.Title, issue: 'No lessons' }))
    ];
    
    const lessonsWithMissingContent = [
      ...lessonsWithNoVideo.map(l => ({ lessonId: l.LessonID, title: l.Title, moduleId: l.ModuleID, issue: 'Missing video' })),
      ...codingLessonsWithNoExercise.map(l => ({ lessonId: l.LessonID, title: l.Title, moduleId: l.ModuleID, issue: 'Coding lesson missing test cases' }))
    ];
    
    return res.status(200).json({
      isValid,
      message: isValid ? 'Course is ready to publish' : 'Course has missing content',
      details: {
        courseHasVideo: !!course.VideoUrl,
        courseHasImage: !!course.ImageUrl,
        hasSufficientModules: modules.length > 0 && modulesWithNoLessons.length === 0,
        modulesWithMissingContent,
        lessonsWithMissingContent
      }
    });
  } catch (error) {
    console.error('Course Validation Error:', error);
    return res.status(500).json({ message: 'Server error while validating course' });
  }
});

// Preview khóa học trước khi đăng tải (học sinh view)
router.get('/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    const pool = await poolPromise;
    
    // Lấy thông tin khóa học
    const courseResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT c.*, u.FullName as InstructorName, u.Email as InstructorEmail,
               u.ProfileImage as InstructorImage
        FROM Courses c
        LEFT JOIN Users u ON c.InstructorID = u.UserID
        WHERE c.CourseID = @courseId AND c.DeletedAt IS NULL
      `);
    
    if (courseResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const course = courseResult.recordset[0];
    
    // Lấy modules và sắp xếp theo orderIndex
    const modulesResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT * FROM CourseModules
        WHERE CourseID = @courseId AND DeletedAt IS NULL
        ORDER BY OrderIndex
      `);
    
    const modules = modulesResult.recordset;
    
    // Lấy tất cả các bài học
    const lessonsResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT l.* 
        FROM CourseLessons l
        JOIN CourseModules m ON l.ModuleID = m.ModuleID
        WHERE m.CourseID = @courseId AND l.DeletedAt IS NULL AND m.DeletedAt IS NULL
        ORDER BY m.OrderIndex, l.OrderIndex
      `);
    
    const lessons = lessonsResult.recordset;
    
    // Lấy các preview lessons (lessons có IsPreview = 1)
    const previewLessons = lessons.filter(lesson => lesson.IsPreview === true);
    
    // Sắp xếp các bài học theo module
    const moduleWithLessons = modules.map(module => {
      const moduleLessons = lessons.filter(lesson => lesson.ModuleID === module.ModuleID);
      return {
        ...module,
        lessons: moduleLessons.map(lesson => ({
          ...lesson,
          // Chỉ đưa URL video nếu là preview lesson
          VideoUrl: lesson.IsPreview ? lesson.VideoUrl : null,
          // Masking nội dung nếu không phải preview
          Content: lesson.IsPreview ? lesson.Content : 'This content is only available after enrollment'
        }))
      };
    });
    
    // Lấy yêu cầu khóa học
    const requirementsResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT * FROM CourseRequirements
        WHERE CourseID = @courseId
        ORDER BY OrderIndex
      `);
    
    // Lấy mục tiêu khóa học
    const objectivesResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT * FROM CourseObjectives
        WHERE CourseID = @courseId
        ORDER BY OrderIndex
      `);
    
    // Tính tổng thời lượng và số bài học
    const totalLessons = lessons.length;
    const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.Duration || 0), 0);
    
    // Tạo response object
    const response = {
      course: {
        ...course,
        Requirements: requirementsResult.recordset.map(r => r.Requirement),
        Objectives: objectivesResult.recordset.map(o => o.Objective)
      },
      modules: moduleWithLessons,
      stats: {
        totalModules: modules.length,
        totalLessons: totalLessons,
        totalDuration: totalDuration,
        previewLessons: previewLessons.length
      },
      isPreview: true
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Course Preview Error:', error);
    return res.status(500).json({ message: 'Server error while getting course preview' });
  }
});

// Publish the course - with validation
router.post('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const courseId = parseInt(id);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    const pool = await poolPromise;
    
    // Đầu tiên kiểm tra xem khóa học đã đủ điều kiện publish chưa
    const validationResponse = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT 
          c.VideoUrl IS NOT NULL as CourseHasVideo,
          c.ImageUrl IS NOT NULL as CourseHasImage,
          (SELECT COUNT(*) FROM CourseModules WHERE CourseID = c.CourseID AND DeletedAt IS NULL) as ModuleCount,
          (
            SELECT COUNT(*) FROM CourseLessons l
            JOIN CourseModules m ON l.ModuleID = m.ModuleID
            WHERE m.CourseID = c.CourseID 
              AND l.DeletedAt IS NULL 
              AND m.DeletedAt IS NULL
              AND (l.Type != 'coding' OR (
                  l.Type = 'coding' AND 
                  EXISTS (SELECT 1 FROM CodingExercises WHERE LessonID = l.LessonID)
              ))
              AND l.VideoUrl IS NOT NULL
          ) as ValidLessonCount,
          (
            SELECT COUNT(*) FROM CourseLessons l
            JOIN CourseModules m ON l.ModuleID = m.ModuleID
            WHERE m.CourseID = c.CourseID 
              AND l.DeletedAt IS NULL 
              AND m.DeletedAt IS NULL
          ) as TotalLessonCount
        FROM Courses c
        WHERE c.CourseID = @courseId AND c.DeletedAt IS NULL
      `);
    
    if (validationResponse.recordset.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const validation = validationResponse.recordset[0];
    
    // Kiểm tra điều kiện publish
    const isValid = 
      validation.CourseHasVideo && 
      validation.CourseHasImage && 
      validation.ModuleCount > 0 &&
      validation.ValidLessonCount === validation.TotalLessonCount;
    
    if (!isValid) {
      return res.status(400).json({
        message: 'Course is not ready to publish',
        details: {
          courseHasVideo: validation.CourseHasVideo,
          courseHasImage: validation.CourseHasImage,
          hasSufficientModules: validation.ModuleCount > 0,
          allLessonsValid: validation.ValidLessonCount === validation.TotalLessonCount,
          missingItems: validation.TotalLessonCount - validation.ValidLessonCount
        }
      });
    }
    
    // Nếu đã đủ điều kiện, tiến hành publish
    await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('publishedAt', sql.DateTime, new Date())
      .query(`
        UPDATE Courses
        SET IsPublished = 1,
            Status = 'published',
            PublishedAt = @publishedAt,
            UpdatedAt = GETDATE()
        WHERE CourseID = @courseId
      `);
    
    return res.status(200).json({
      message: 'Course published successfully',
      publishedAt: new Date()
    });
  } catch (error) {
    console.error('Course Publish Error:', error);
    return res.status(500).json({ message: 'Server error while publishing course' });
  }
});

// Đánh dấu bài học là bài học xem thử (preview)
router.put('/lessons/:lessonId/preview', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { isPreview } = req.body;
    
    if (isPreview === undefined) {
      return res.status(400).json({ message: 'isPreview status is required' });
    }
    
    const pool = await poolPromise;
    
    // Kiểm tra xem bài học tồn tại không
    const lessonCheck = await pool.request()
      .input('lessonId', sql.BigInt, lessonId)
      .query('SELECT * FROM CourseLessons WHERE LessonID = @lessonId AND DeletedAt IS NULL');
    
    if (lessonCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Cập nhật trạng thái xem thử
    await pool.request()
      .input('lessonId', sql.BigInt, lessonId)
      .input('isPreview', sql.Bit, isPreview)
      .query(`
        UPDATE CourseLessons
        SET IsPreview = @isPreview,
            UpdatedAt = GETDATE()
        WHERE LessonID = @lessonId
      `);
    
    return res.status(200).json({
      message: isPreview ? 'Lesson set as preview' : 'Lesson removed from preview',
      lessonId,
      isPreview
    });
  } catch (error) {
    console.error('Update Lesson Preview Status Error:', error);
    return res.status(500).json({ message: 'Server error while updating lesson preview status' });
  }
});

module.exports = router;
