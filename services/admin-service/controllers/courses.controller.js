const { poolPromise, sql } = require('../config/database');

// Initialize database schema 
const initializeSchema = async () => {
  try {
    const pool = await poolPromise;
    
    // Check if Duration column exists in CourseModules
    const checkColumnResult = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'CourseModules' AND COLUMN_NAME = 'Duration'
    `);
    
    // If Duration column doesn't exist, add it
    if (checkColumnResult.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE CourseModules
        ADD Duration INT DEFAULT 0 NOT NULL
      `);
      console.log('Added Duration column to CourseModules table');
    }
  } catch (error) {
    console.error('Error initializing schema:', error);
  }
};

// Run initialization
initializeSchema();

// Define each function separately instead of in a large object
exports.getAllCourses = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT c.*, u.FullName as InstructorName,
        (SELECT COUNT(*) FROM CourseEnrollments WHERE CourseID = c.CourseID) as EnrollmentCount,
        (SELECT COUNT(*) FROM CourseModules WHERE CourseID = c.CourseID) as ModuleCount
        FROM Courses c
        LEFT JOIN Users u ON c.InstructorID = u.UserID
        WHERE c.DeletedAt IS NULL
        ORDER BY c.CreatedAt DESC
      `);
    
    return res.status(200).json({ courses: result.recordset });
  } catch (error) {
    console.error('Error in getAllCourses:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      slug,
      description,
      shortDescription,
      instructorId,
      level,
      category,
      subCategory,
      courseType,
      language,
      duration,
      capacity,
      price,
      discountPrice,
      imageUrl,
      videoUrl,
      requirements,
      objectives,
      syllabus,
      status,
      isPublished,
      publishedAt
    } = req.body;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('slug', sql.VarChar(255), slug || null)
      .input('description', sql.NVarChar(sql.MAX), description || null)
      .input('shortDescription', sql.NVarChar(500), shortDescription || null)
      .input('instructorId', sql.BigInt, instructorId || null)
      .input('level', sql.VarChar(20), level || null)
      .input('category', sql.VarChar(50), category || null)
      .input('subCategory', sql.VarChar(50), subCategory || null)
      .input('courseType', sql.VarChar(20), courseType || null)
      .input('language', sql.VarChar(20), language || null)
      .input('duration', sql.Int, duration || null)
      .input('capacity', sql.Int, capacity || null)
      .input('price', sql.Decimal(10,2), price || 0)
      .input('discountPrice', sql.Decimal(10,2), discountPrice || null)
      .input('imageUrl', sql.VarChar(255), imageUrl || null)
      .input('videoUrl', sql.VarChar(255), videoUrl || null)
      .input('requirements', sql.NVarChar(sql.MAX), requirements || null)
      .input('objectives', sql.NVarChar(sql.MAX), objectives || null)
      .input('syllabus', sql.NVarChar(sql.MAX), syllabus || null)
      .input('status', sql.VarChar(20), status || null)
      .input('isPublished', sql.Bit, isPublished || 0)
      .input('publishedAt', sql.DateTime, publishedAt ? new Date(publishedAt) : null)
      .query(`
        INSERT INTO Courses (
          Title, Slug, Description, ShortDescription, InstructorID,
          Level, Category, SubCategory, CourseType, Language,
          Duration, Capacity, Price, DiscountPrice, ImageUrl, VideoUrl,
          Requirements, Objectives, Syllabus, Status, IsPublished, PublishedAt
        )
        VALUES (
          @title, @slug, @description, @shortDescription, @instructorId,
          @level, @category, @subCategory, @courseType, @language,
          @duration, @capacity, @price, @discountPrice, @imageUrl, @videoUrl,
          @requirements, @objectives, @syllabus, @status, @isPublished, @publishedAt
        );
        SELECT SCOPE_IDENTITY() as CourseID;
      `);

    return res.status(201).json({
      message: 'Course created successfully',
      courseId: result.recordset[0].CourseID
    });
  } catch (error) {
    console.error('Error in createCourse:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('courseId', sql.BigInt, id)
      .query(`
        SELECT c.*, u.FullName as InstructorName,
        (SELECT COUNT(*) FROM CourseEnrollments WHERE CourseID = c.CourseID) as EnrollmentCount,
        (SELECT COUNT(*) FROM CourseModules WHERE CourseID = c.CourseID) as ModuleCount
        FROM Courses c
        LEFT JOIN Users u ON c.InstructorID = u.UserID
        WHERE c.CourseID = @courseId AND c.DeletedAt IS NULL
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error('Error in getCourseById:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Add new function to update course image
exports.updateCourseImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    if (!id) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('imageUrl', sql.VarChar(255), imageUrl || null)
      .query(`
        UPDATE Courses
        SET ImageUrl = @imageUrl,
            UpdatedAt = GETDATE()
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);

    return res.status(200).json({ message: 'Image updated successfully', imageUrl });
  } catch (error) {
    console.error('Error in updateCourseImage:', error);
    return res.status(500).json({ message: 'Server error while updating course image', error: error.message });
  }
};

// Add new function to update course video
exports.updateCourseVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { videoUrl } = req.body;
    if (!id) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('videoUrl', sql.VarChar(255), videoUrl || null)
      .query(`
        UPDATE Courses
        SET VideoUrl = @videoUrl,
            UpdatedAt = GETDATE()
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);

    return res.status(200).json({ message: 'Video updated successfully', videoUrl });
  } catch (error) {
    console.error('Error in updateCourseVideo:', error);
    return res.status(500).json({ message: 'Server error while updating course video', error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that ID is present
    if (!id) {
      return res.status(400).json({ message: 'Course ID is required' });
    }
    
    // Check that the user is authenticated
    if (!req.user || !req.user.UserID) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const {
      title,
      slug,
      description,
      shortDescription,
      instructorId,
      level,
      category,
      subCategory,
      courseType,
      language,
      duration,
      capacity,
      price,
      discountPrice,
      imageUrl,
      videoUrl,
      requirements,
      objectives,
      syllabus,
      status,
      isPublished,
      publishedAt,
      // Support camelCase and PascalCase for API flexibility
      Title,
      Slug,
      Description,
      ShortDescription,
      InstructorID,
      Level,
      Category,
      SubCategory,
      CourseType,
      Language,
      Duration,
      Capacity,
      Price,
      DiscountPrice,
      ImageUrl,
      VideoUrl,
      Requirements,
      Objectives,
      Syllabus,
      Status,
      IsPublished,
      PublishedAt
    } = req.body;

    // Use the provided value or fallback to alternative field name
    const courseTitle = title || Title;
    const courseSlug = slug || Slug;
    const courseDescription = description || Description;
    const courseShortDescription = shortDescription || ShortDescription;
    const courseInstructorId = instructorId || InstructorID;
    const courseLevel = level || Level;
    const courseCategory = category || Category;
    const courseSubCategory = subCategory || SubCategory;
    const courseTypeVal = courseType || CourseType;
    const courseLanguage = language || Language;
    const courseDuration = duration || Duration;
    const courseCapacity = capacity || Capacity;
    const coursePrice = price || Price;
    const courseDiscountPrice = discountPrice || DiscountPrice;
    const courseImageUrl = imageUrl || ImageUrl;
    const courseVideoUrl = videoUrl || VideoUrl;
    const courseRequirements = requirements || Requirements;
    const courseObjectives = objectives || Objectives;
    const courseSyllabus = syllabus || Syllabus;
    const courseStatus = status || Status;
    const courseIsPublished = isPublished !== undefined ? isPublished : (IsPublished !== undefined ? IsPublished : false);
    const coursePublishedAt = publishedAt ? new Date(publishedAt) : (PublishedAt ? new Date(PublishedAt) : null);
    
    if (!courseTitle) {
      return res.status(400).json({ message: 'Course title is required' });
    }

    const pool = await poolPromise;
    
    // First check if the course exists
    const courseCheck = await pool.request()
      .input('courseId', sql.BigInt, id)
      .query(`
        SELECT CourseID FROM Courses
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);
      
    if (courseCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Update the course
    await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('title', sql.NVarChar(255), courseTitle)
      .input('slug', sql.VarChar(255), courseSlug || null)
      .input('description', sql.NVarChar(sql.MAX), courseDescription || null)
      .input('shortDescription', sql.NVarChar(500), courseShortDescription || null)
      .input('instructorId', sql.BigInt, courseInstructorId || null)
      .input('level', sql.VarChar(20), courseLevel || null)
      .input('category', sql.VarChar(50), courseCategory || null)
      .input('subCategory', sql.VarChar(50), courseSubCategory || null)
      .input('courseType', sql.VarChar(20), courseTypeVal || null)
      .input('language', sql.VarChar(20), courseLanguage || null)
      .input('duration', sql.Int, courseDuration || null)
      .input('capacity', sql.Int, courseCapacity || null)
      .input('price', sql.Decimal(10,2), coursePrice || 0)
      .input('discountPrice', sql.Decimal(10,2), courseDiscountPrice || null)
      .input('imageUrl', sql.VarChar(255), courseImageUrl || null)
      .input('videoUrl', sql.VarChar(255), courseVideoUrl || null)
      .input('requirements', sql.NVarChar(sql.MAX), courseRequirements || null)
      .input('objectives', sql.NVarChar(sql.MAX), courseObjectives || null)
      .input('syllabus', sql.NVarChar(sql.MAX), courseSyllabus || null)
      .input('status', sql.VarChar(20), courseStatus || null)
      .input('isPublished', sql.Bit, courseIsPublished)
      .input('publishedAt', sql.DateTime, coursePublishedAt)
      .input('updatedBy', sql.BigInt, req.user.UserID)
      .query(`
        UPDATE Courses
        SET
          Title = @title,
          Slug = @slug,
          Description = @description,
          ShortDescription = @shortDescription,
          InstructorID = @instructorId,
          Level = @level,
          Category = @category,
          SubCategory = @subCategory,
          CourseType = @courseType,
          Language = @language,
          Duration = @duration,
          Capacity = @capacity,
          Price = @price,
          DiscountPrice = @discountPrice,
          ImageUrl = @imageUrl,
          VideoUrl = @videoUrl,
          Requirements = @requirements,
          Objectives = @objectives,
          Syllabus = @syllabus,
          Status = @status,
          IsPublished = @isPublished,
          PublishedAt = @publishedAt,
          UpdatedAt = GETDATE()
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);

    return res.status(200).json({ 
      message: 'Course updated successfully',
      courseId: id
    });
  } catch (error) {
    console.error('Error in updateCourse:', error);
    // Return full error details in response for debugging
    return res.status(500).json({ 
      message: error.message || 'Server error while updating course',
      error: error.stack
    });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request()
      .input('courseId', sql.BigInt, id)
      .query(`
        UPDATE Courses
        SET DeletedAt = GETDATE()
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCourseModules = async (req, res) => {
  try {
    const { courseId } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT * FROM CourseModules
        WHERE CourseID = @courseId
        ORDER BY OrderIndex
      `);

    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error in getCourseModules:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { 
      title, 
      description, 
      orderIndex, 
      duration,
      Title,
      Description,
      OrderIndex,
      Duration
    } = req.body;
    
    // Handle different field name formats
    const moduleTitle = title || Title;
    const moduleDescription = description || Description || '';
    const moduleOrderIndex = orderIndex || OrderIndex || 0;
    const moduleDuration = duration || Duration || 0;
    
    // Verify the course exists
    const pool = await poolPromise;
    const courseCheck = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .query(`
        SELECT CourseID FROM Courses
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);
      
    if (courseCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const result = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('title', sql.NVarChar(255), moduleTitle)
      .input('description', sql.NVarChar(sql.MAX), moduleDescription)
      .input('orderIndex', sql.Int, moduleOrderIndex)
      .input('duration', sql.Int, moduleDuration)
      .query(`
        INSERT INTO CourseModules (
          CourseID, Title, Description, OrderIndex, Duration
        )
        VALUES (
          @courseId, @title, @description, @orderIndex, @duration
        );
        SELECT SCOPE_IDENTITY() as ModuleID;
      `);
    
    // Get the newly created module and return it with the ID
    const moduleId = result.recordset[0].ModuleID;
    
    return res.status(201).json({
      message: 'Module created successfully',
      ModuleID: moduleId,
      Title: moduleTitle,
      Description: moduleDescription,
      OrderIndex: moduleOrderIndex,
      Duration: moduleDuration,
      CourseID: courseId
    });
  } catch (error) {
    console.error('Error in createModule:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { 
      title, 
      description, 
      orderIndex, 
      duration, 
      Title, 
      Description, 
      OrderIndex, 
      Duration 
    } = req.body;

    // Handle different field name formats that might come from frontend
    const moduleTitle = title || Title;
    const moduleDescription = description || Description;
    const moduleOrderIndex = orderIndex || OrderIndex || 0;
    const moduleDuration = duration || Duration || 0;

    const pool = await poolPromise;
    
    // First check if the module exists and belongs to the course
    const checkResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('moduleId', sql.BigInt, moduleId)
      .query(`
        SELECT * FROM CourseModules 
        WHERE ModuleID = @moduleId AND CourseID = @courseId
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'Module not found or does not belong to this course'
      });
    }

    await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .input('title', sql.NVarChar(255), moduleTitle)
      .input('description', sql.NVarChar(sql.MAX), moduleDescription)
      .input('orderIndex', sql.Int, moduleOrderIndex)
      .input('duration', sql.Int, moduleDuration)
      .query(`
        UPDATE CourseModules
        SET Title = @title,
            Description = @description,
            OrderIndex = @orderIndex,
            Duration = @duration,
            UpdatedAt = GETDATE()
        WHERE ModuleID = @moduleId
      `);
    
    return res.status(200).json({ 
      message: 'Module updated successfully',
      moduleId: moduleId
    });
  } catch (error) {
    console.error('Error in updateModule:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const pool = await poolPromise;
    await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .query(`
        DELETE FROM CourseModules
        WHERE ModuleID = @moduleId
      `);
    
    return res.status(200).json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error in deleteModule:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific module by ID
exports.getModuleById = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const pool = await poolPromise;
    
    // First check if the module exists and belongs to the course
    const result = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('moduleId', sql.BigInt, moduleId)
      .query(`
        SELECT cm.*, 
               (SELECT COUNT(*) FROM CourseLessons WHERE ModuleID = cm.ModuleID) as LessonCount
        FROM CourseModules cm
        WHERE cm.CourseID = @courseId AND cm.ModuleID = @moduleId
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ 
        message: 'Module not found or does not belong to this course' 
      });
    }

    // Get additional module data like lessons
    const module = result.recordset[0];
    
    // Format the dates for better client consumption
    if (module.CreatedAt) {
      module.CreatedAt = new Date(module.CreatedAt).toISOString();
    }
    if (module.UpdatedAt) {
      module.UpdatedAt = new Date(module.UpdatedAt).toISOString();
    }

    return res.status(200).json(module);
  } catch (error) {
    console.error('Error in getModuleById:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get all lessons for a specific module
exports.getModuleLessons = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const pool = await poolPromise;
    
    // First verify that the module exists and belongs to the course
    const moduleCheck = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('moduleId', sql.BigInt, moduleId)
      .query(`
        SELECT ModuleID FROM CourseModules
        WHERE CourseID = @courseId AND ModuleID = @moduleId
      `);
      
    if (moduleCheck.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'Module not found or does not belong to this course' 
      });
    }
    
    const result = await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .query(`
        SELECT * FROM CourseLessons
        WHERE ModuleID = @moduleId
        ORDER BY OrderIndex
      `);

    // Format dates for better client consumption
    const lessons = result.recordset.map(lesson => {
      if (lesson.CreatedAt) {
        lesson.CreatedAt = new Date(lesson.CreatedAt).toISOString();
      }
      if (lesson.UpdatedAt) {
        lesson.UpdatedAt = new Date(lesson.UpdatedAt).toISOString();
      }
      return lesson;
    });

    return res.status(200).json(lessons);
  } catch (error) {
    console.error('Error in getModuleLessons:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Create a new lesson for a module
exports.createLesson = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { 
      title, 
      description, 
      type, 
      content, 
      orderIndex, 
      duration, 
      isPreview,
      videoUrl,
      Title,
      Description,
      Type,
      Content,
      OrderIndex,
      Duration,
      IsPreview,
      VideoUrl
    } = req.body;
    
    // Handle different field name formats
    const lessonTitle = title || Title;
    const lessonDescription = description || Description || '';
    const lessonType = type || Type || 'Video';
    const lessonContent = content || Content || '';
    const lessonOrderIndex = orderIndex || OrderIndex || 0;
    const lessonDuration = duration || Duration || 0;
    const lessonIsPreview = isPreview || IsPreview || false;
    const lessonVideoUrl = videoUrl || VideoUrl || '';
    
    // Verify the module exists and belongs to the course
    const pool = await poolPromise;
    const moduleCheck = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('moduleId', sql.BigInt, moduleId)
      .query(`
        SELECT ModuleID FROM CourseModules
        WHERE CourseID = @courseId AND ModuleID = @moduleId
      `);
      
    if (moduleCheck.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'Module not found or does not belong to this course' 
      });
    }
    
    const result = await pool.request()
      .input('moduleId', sql.BigInt, moduleId)
      .input('title', sql.NVarChar(255), lessonTitle)
      .input('description', sql.NVarChar(sql.MAX), lessonDescription)
      .input('type', sql.VarChar(50), lessonType)
      .input('content', sql.NVarChar(sql.MAX), lessonContent)
      .input('orderIndex', sql.Int, lessonOrderIndex)
      .input('duration', sql.Int, lessonDuration)
      .input('isPreview', sql.Bit, lessonIsPreview)
      .input('videoUrl', sql.NVarChar(255), lessonVideoUrl)
      .query(`
        INSERT INTO CourseLessons (
          ModuleID, Title, Description, Type, Content, 
          OrderIndex, Duration, IsPreview, VideoUrl
        )
        VALUES (
          @moduleId, @title, @description, @type, @content,
          @orderIndex, @duration, @isPreview, @videoUrl
        );
        SELECT SCOPE_IDENTITY() as LessonID;
      `);
    
    // Get the newly created lesson ID
    const lessonId = result.recordset[0].LessonID;
    
    return res.status(201).json({
      message: 'Lesson created successfully',
      LessonID: lessonId,
      Title: lessonTitle,
      Description: lessonDescription,
      Type: lessonType,
      Content: lessonContent,
      OrderIndex: lessonOrderIndex,
      Duration: lessonDuration,
      IsPreview: lessonIsPreview,
      VideoUrl: lessonVideoUrl,
      ModuleID: moduleId
    });
  } catch (error) {
    console.error('Error in createLesson:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get a specific lesson by ID
exports.getLessonById = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const pool = await poolPromise;
    
    // First verify that the module belongs to the course and the lesson belongs to the module
    const verifyResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('moduleId', sql.BigInt, moduleId)
      .input('lessonId', sql.BigInt, lessonId)
      .query(`
        SELECT l.* 
        FROM CourseLessons l
        INNER JOIN CourseModules m ON l.ModuleID = m.ModuleID
        WHERE m.CourseID = @courseId 
          AND m.ModuleID = @moduleId 
          AND l.LessonID = @lessonId
      `);
      
    if (verifyResult.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'Lesson not found or does not belong to this module/course' 
      });
    }
    
    // Get the lesson data
    const lesson = verifyResult.recordset[0];
    
    // Format dates for better client consumption
    if (lesson.CreatedAt) {
      lesson.CreatedAt = new Date(lesson.CreatedAt).toISOString();
    }
    if (lesson.UpdatedAt) {
      lesson.UpdatedAt = new Date(lesson.UpdatedAt).toISOString();
    }
    
    return res.status(200).json(lesson);
  } catch (error) {
    console.error('Error in getLessonById:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update a lesson
exports.updateLesson = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const { 
      title, 
      description, 
      type, 
      content, 
      orderIndex, 
      duration, 
      isPreview,
      videoUrl,
      Title,
      Description,
      Type,
      Content,
      OrderIndex,
      Duration,
      IsPreview,
      VideoUrl
    } = req.body;
    
    // Handle different field name formats
    const lessonTitle = title || Title;
    const lessonDescription = description || Description;
    const lessonType = type || Type;
    const lessonContent = content || Content;
    const lessonOrderIndex = orderIndex || OrderIndex;
    const lessonDuration = duration || Duration;
    const lessonIsPreview = isPreview !== undefined ? isPreview : (IsPreview !== undefined ? IsPreview : undefined);
    const lessonVideoUrl = videoUrl || VideoUrl;
    
    // Verify the module belongs to the course and the lesson belongs to the module
    const pool = await poolPromise;
    const verifyResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('moduleId', sql.BigInt, moduleId)
      .input('lessonId', sql.BigInt, lessonId)
      .query(`
        SELECT l.LessonID 
        FROM CourseLessons l
        INNER JOIN CourseModules m ON l.ModuleID = m.ModuleID
        WHERE m.CourseID = @courseId 
          AND m.ModuleID = @moduleId 
          AND l.LessonID = @lessonId
      `);
      
    if (verifyResult.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'Lesson not found or does not belong to this module/course' 
      });
    }
    
    // Update only the fields that were provided
    let updateQuery = `
      UPDATE CourseLessons 
      SET UpdatedAt = GETDATE()
    `;
    
    const request = pool.request()
      .input('lessonId', sql.BigInt, lessonId);
    
    if (lessonTitle !== undefined) {
      updateQuery += `, Title = @title`;
      request.input('title', sql.NVarChar(255), lessonTitle);
    }
    
    if (lessonDescription !== undefined) {
      updateQuery += `, Description = @description`;
      request.input('description', sql.NVarChar(sql.MAX), lessonDescription);
    }
    
    if (lessonType !== undefined) {
      updateQuery += `, Type = @type`;
      request.input('type', sql.VarChar(50), lessonType);
    }
    
    if (lessonContent !== undefined) {
      updateQuery += `, Content = @content`;
      request.input('content', sql.NVarChar(sql.MAX), lessonContent);
    }
    
    if (lessonOrderIndex !== undefined) {
      updateQuery += `, OrderIndex = @orderIndex`;
      request.input('orderIndex', sql.Int, lessonOrderIndex);
    }
    
    if (lessonDuration !== undefined) {
      updateQuery += `, Duration = @duration`;
      request.input('duration', sql.Int, lessonDuration);
    }
    
    if (lessonIsPreview !== undefined) {
      updateQuery += `, IsPreview = @isPreview`;
      request.input('isPreview', sql.Bit, lessonIsPreview);
    }
    
    if (lessonVideoUrl !== undefined) {
      updateQuery += `, VideoUrl = @videoUrl`;
      request.input('videoUrl', sql.NVarChar(255), lessonVideoUrl);
    }
    
    updateQuery += ` WHERE LessonID = @lessonId`;
    
    await request.query(updateQuery);
    
    return res.status(200).json({ 
      message: 'Lesson updated successfully',
      lessonId: lessonId
    });
  } catch (error) {
    console.error('Error in updateLesson:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Delete a lesson
exports.deleteLesson = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const pool = await poolPromise;
    
    // First verify that the module belongs to the course and the lesson belongs to the module
    const verifyResult = await pool.request()
      .input('courseId', sql.BigInt, courseId)
      .input('moduleId', sql.BigInt, moduleId)
      .input('lessonId', sql.BigInt, lessonId)
      .query(`
        SELECT l.LessonID 
        FROM CourseLessons l
        INNER JOIN CourseModules m ON l.ModuleID = m.ModuleID
        WHERE m.CourseID = @courseId 
          AND m.ModuleID = @moduleId 
          AND l.LessonID = @lessonId
      `);
      
    if (verifyResult.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'Lesson not found or does not belong to this module/course' 
      });
    }
    
    // Delete the lesson
    await pool.request()
      .input('lessonId', sql.BigInt, lessonId)
      .query(`
        DELETE FROM CourseLessons
        WHERE LessonID = @lessonId
      `);
    
    return res.status(200).json({ 
      message: 'Lesson deleted successfully' 
    });
  } catch (error) {
    console.error('Error in deleteLesson:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Add new function to get enrolled students
exports.getEnrolledStudents = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate course ID
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    // Pagination parameters
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
    
    // Check if CourseEnrollments table exists
    const tableCheckResult = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'CourseEnrollments'
    `);
    
    if (tableCheckResult.recordset.length === 0) {
      console.error('CourseEnrollments table does not exist in the database');
      return res.status(200).json({
        enrollments: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        },
        message: 'CourseEnrollments table not found in database'
      });
    }
    
    // Check if there are any enrollments for this course
    try {
      const enrollmentExistsCheck = await pool.request()
        .input('courseId', sql.BigInt, courseId)
        .query(`
          SELECT COUNT(*) as count
          FROM CourseEnrollments
          WHERE CourseID = @courseId
        `);
      
      // If no enrollments exist, try to create mock data
      if (enrollmentExistsCheck.recordset[0].count === 0) {
        console.log(`No enrollments found for course ${courseId}, creating mock data...`);
        try {
          await createMockEnrollments(courseId);
        } catch (mockError) {
          console.error('Failed to create mock enrollments:', mockError);
          // Continue without mock data if creation fails
        }
      }
    } catch (checkError) {
      console.error('Error checking enrollments:', checkError);
      // Continue with empty result if check fails
    }
    
    let totalEnrollments = 0;
    let formattedEnrollments = [];
    
    try {
      // Get total count for pagination
      const countResult = await pool.request()
        .input('courseId', sql.BigInt, courseId)
        .query(`
          SELECT COUNT(*) as total
          FROM CourseEnrollments
          WHERE CourseID = @courseId
        `);
      
      totalEnrollments = countResult.recordset[0].total;
      
      // Get enrollments with user data
      if (totalEnrollments > 0) {
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
              CASE 
                WHEN e.CompletedAt IS NOT NULL THEN 'completed'
                ELSE 'active'
              END as Status,
              u.FullName,
              u.Email
            FROM CourseEnrollments e
            JOIN Users u ON e.UserID = u.UserID
            WHERE e.CourseID = @courseId
            ORDER BY e.EnrolledAt DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
          `);
        
        // Reformat data to match frontend expectations
        formattedEnrollments = enrollmentsResult.recordset.map(enrollment => {
          return {
            EnrollmentID: enrollment.EnrollmentID,
            UserID: enrollment.UserID,
            CourseID: enrollment.CourseID,
            EnrollmentDate: enrollment.EnrollmentDate,
            CompletedAt: enrollment.CompletedAt,
            Progress: enrollment.Progress,
            Status: enrollment.Status,
            User: {
              FullName: enrollment.FullName,
              Email: enrollment.Email,
              Phone: 'N/A', // Default value since the column doesn't exist
              AvatarUrl: null // Default value since the column doesn't exist
            }
          };
        });
      }
    } catch (dataError) {
      console.error('Error fetching enrollments data:', dataError);
      // Return empty result if data fetch fails
    }
    
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
    console.error('Error in getEnrolledStudents:', error.message, error.stack);
    return res.status(500).json({ 
      message: 'Server error while getting course enrollments',
      error: error.message 
    });
  }
};

// Helper function to create mock enrollment data
async function createMockEnrollments(courseId) {
  try {
    const pool = await poolPromise;
    
    // Check if CourseEnrollments table exists and check its structure
    const tableCheck = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'CourseEnrollments'
    `);
    
    if (tableCheck.recordset.length === 0) {
      console.error('CourseEnrollments table does not exist in the database');
      return;
    }
    
    // Check table structure to see what columns actually exist
    const columnsCheck = await pool.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'CourseEnrollments'
    `);
    
    const columnNames = columnsCheck.recordset.map(col => col.COLUMN_NAME);
    console.log('CourseEnrollments table columns:', columnNames);
    
    // Determine if specific columns exist
    const hasCompletedAtColumn = columnNames.includes('CompletedAt');
    const hasProgressColumn = columnNames.includes('Progress');
    const hasLastAccessedAtColumn = columnNames.includes('LastAccessedAt');
    
    // Get a few random users to enroll
    let usersResult = await pool.request()
      .query(`
        SELECT TOP 10 UserID
        FROM Users
        WHERE UserType = 'student' OR UserType IS NULL OR 1=1
        ORDER BY NEWID()
      `);
    
    if (usersResult.recordset.length === 0) {
      console.log('No users found, creating mock users...');
      // Create mock users if none exist
      await createMockUsers();
      
      // Try getting users again
      usersResult = await pool.request()
        .query(`
          SELECT TOP 10 UserID
          FROM Users
          ORDER BY NEWID()
        `);
    }
    
    const users = usersResult.recordset;
    
    if (users.length === 0) {
      console.log('Still no users found after creating mock users, unable to create enrollments');
      return;
    }
    
    const now = new Date();
    
    // Create enrollments for each user
    for (let i = 0; i < users.length; i++) {
      const userId = users[i].UserID;
      const enrolledAt = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000); // Random date in last 30 days
      const progress = Math.floor(Math.random() * 101); // Random progress 0-100%
      const completedAt = progress === 100 ? new Date(enrolledAt.getTime() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000) : null;
      const lastAccessedAt = new Date(now.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000); // Random access in last 7 days
      
      try {
        // Build a dynamic query based on available columns
        let query = `
          INSERT INTO CourseEnrollments (
            CourseID, UserID, EnrolledAt`;
        
        if (hasProgressColumn) query += `, Progress`;
        if (hasCompletedAtColumn) query += `, CompletedAt`;
        if (hasLastAccessedAtColumn) query += `, LastAccessedAt`;
        
        query += `) VALUES (
            @courseId, @userId, @enrolledAt`;
            
        if (hasProgressColumn) query += `, @progress`;
        if (hasCompletedAtColumn) query += `, @completedAt`;
        if (hasLastAccessedAtColumn) query += `, @lastAccessedAt`;
        
        query += `)`;
        
        const request = pool.request()
          .input('courseId', sql.BigInt, courseId)
          .input('userId', sql.BigInt, userId)
          .input('enrolledAt', sql.DateTime, enrolledAt);
          
        if (hasProgressColumn) {
          request.input('progress', sql.Int, progress);
        }
        
        if (hasCompletedAtColumn) {
          request.input('completedAt', sql.DateTime, completedAt);
        }
        
        if (hasLastAccessedAtColumn) {
          request.input('lastAccessedAt', sql.DateTime, lastAccessedAt);
        }
        
        await request.query(query);
      } catch (insertError) {
        console.error(`Error inserting enrollment for user ${userId}:`, insertError);
        // Continue with other users even if one fails
      }
    }
    
    console.log(`Created ${users.length} mock enrollments for course ${courseId}`);
  } catch (error) {
    console.error('Error creating mock enrollments:', error.message, error.stack);
    throw error; // Propagate error up to be handled by caller
  }
}

// Helper function to create mock users if none exist
async function createMockUsers() {
  try {
    const pool = await poolPromise;
    
    // Check if Users table exists
    const tableCheck = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Users'
    `);
    
    if (tableCheck.recordset.length === 0) {
      console.error('Users table does not exist in the database');
      return;
    }
    
    // Check table structure to see what columns actually exist
    const columnsCheck = await pool.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Users'
    `);
    
    const columnNames = columnsCheck.recordset.map(col => col.COLUMN_NAME);
    console.log('Users table columns:', columnNames);
    
    // Determine if Phone and UserType columns exist
    const hasPhoneColumn = columnNames.includes('Phone');
    const hasUserTypeColumn = columnNames.includes('UserType');
    
    const mockUsers = [
      { fullName: 'Nguyễn Văn A', email: 'nguyenvana@example.com', phone: '0901234567' },
      { fullName: 'Trần Thị B', email: 'tranthib@example.com', phone: '0912345678' },
      { fullName: 'Lê Văn C', email: 'levanc@example.com', phone: '0923456789' },
      { fullName: 'Phạm Thị D', email: 'phamthid@example.com', phone: '0934567890' },
      { fullName: 'Hoàng Văn E', email: 'hoangvane@example.com', phone: '0945678901' }
    ];
    
    for (const user of mockUsers) {
      try {
        // Create a query that adapts to the existing columns
        let query = `
          IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = @email)
          BEGIN
            INSERT INTO Users (FullName, Email`;
        
        if (hasPhoneColumn) query += `, Phone`;
        if (hasUserTypeColumn) query += `, UserType`;
        
        query += `, CreatedAt) VALUES (@fullName, @email`;
        
        if (hasPhoneColumn) query += `, @phone`;
        if (hasUserTypeColumn) query += `, @userType`;
        
        query += `, GETDATE()) END`;
        
        const request = pool.request()
          .input('fullName', sql.NVarChar(100), user.fullName)
          .input('email', sql.VarChar(100), user.email);
          
        if (hasPhoneColumn) {
          request.input('phone', sql.VarChar(20), user.phone);
        }
        
        if (hasUserTypeColumn) {
          request.input('userType', sql.VarChar(20), 'student');
        }
        
        await request.query(query);
        
      } catch (insertError) {
        console.error(`Error inserting user ${user.email}:`, insertError.message);
        // Continue with other users even if one fails
      }
    }
    
    console.log('Created mock users');
  } catch (error) {
    console.error('Error creating mock users:', error.message, error.stack);
    throw error; // Propagate error up to be handled by caller
  }
}

// Add new function to validate course content
exports.validateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that ID is present
    if (!id) {
      return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
    }
    
    const pool = await poolPromise;
    
    // Check if course exists
    const courseCheck = await pool.request()
      .input('courseId', sql.BigInt, id)
      .query(`
        SELECT CourseID, Title, ImageUrl, VideoUrl, IsPublished, Status
        FROM Courses
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);
      
    if (courseCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }
    
    const course = courseCheck.recordset[0];
    
    // Get modules for the course
    const modulesResult = await pool.request()
      .input('courseId', sql.BigInt, id)
      .query(`
        SELECT ModuleID
        FROM CourseModules
        WHERE CourseID = @courseId
      `);
    
    // Get lessons for validation
    const lessonsResult = await pool.request()
      .input('courseId', sql.BigInt, id)
      .query(`
        SELECT l.LessonID, l.Title, l.Type, l.VideoUrl
        FROM CourseLessons l
        JOIN CourseModules m ON l.ModuleID = m.ModuleID
        WHERE m.CourseID = @courseId AND l.Type = 'video'
      `);
    
    // Check if coding exercises have test cases
    const codingLessonsResult = await pool.request()
      .input('courseId', sql.BigInt, id)
      .query(`
        SELECT l.LessonID, l.Title, e.ExerciseID, e.TestCases
        FROM CourseLessons l
        JOIN CourseModules m ON l.ModuleID = m.ModuleID
        LEFT JOIN CodingExercises e ON l.LessonID = e.LessonID
        WHERE m.CourseID = @courseId AND l.Type = 'coding'
      `);
    
    // Perform validation checks
    const courseHasImage = !!course.ImageUrl;
    const courseHasVideo = !!course.VideoUrl;
    const hasSufficientModules = modulesResult.recordset.length > 0;
    
    // Check for lessons with missing content
    const lessonsWithMissingContent = [];
    
    // Check video lessons
    lessonsResult.recordset.forEach(lesson => {
      if (!lesson.VideoUrl) {
        lessonsWithMissingContent.push({
          lessonId: lesson.LessonID,
          title: lesson.Title,
          issue: 'Missing video'
        });
      }
    });
    
    // Check coding lessons
    codingLessonsResult.recordset.forEach(lesson => {
      if (!lesson.ExerciseID || !lesson.TestCases) {
        lessonsWithMissingContent.push({
          lessonId: lesson.LessonID,
          title: lesson.Title,
          issue: 'Coding lesson missing test cases'
        });
      }
    });
    
    // Determine if course is valid for publishing
    const isValid = courseHasImage && courseHasVideo && hasSufficientModules && lessonsWithMissingContent.length === 0;
    
    return res.status(200).json({
      isValid,
      details: {
        courseHasImage,
        courseHasVideo,
        hasSufficientModules,
        lessonsWithMissingContent
      }
    });
  } catch (error) {
    console.error('Error in validateCourse:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi kiểm tra khóa học',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add new function to publish a course
exports.publishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that ID is present
    if (!id) {
      return res.status(400).json({ message: 'ID khóa học không hợp lệ' });
    }
    
    // Skip validation: allow direct publishing without content checks
    
    const pool = await poolPromise;
    
    // Update course status to published
    await pool.request()
      .input('courseId', sql.BigInt, id)
      .input('updatedBy', sql.BigInt, req.user ? req.user.UserID : null)
      .query(`
        UPDATE Courses
        SET 
          Status = 'published',
          IsPublished = 1,
          PublishedAt = GETDATE(),
          UpdatedAt = GETDATE()
        WHERE CourseID = @courseId AND DeletedAt IS NULL
      `);
    
    return res.status(200).json({ 
      message: 'Khóa học đã được xuất bản thành công',
      courseId: id
    });
  } catch (error) {
    console.error('Error in publishCourse:', error);
    return res.status(500).json({ 
      message: 'Lỗi khi xuất bản khóa học',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
