const express = require('express');
const router = express.Router();
const { executeQuery, sql } = require('../config/db');

/**
 * Get all academic programs
 * GET /api/academic/programs
 */
router.get('/programs', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.ProgramID, p.ProgramCode, p.ProgramName, p.Department, p.Faculty,
        p.Description, p.TotalCredits, p.ProgramDuration, p.DegreeName, 
        p.ProgramType, p.IsActive, p.CreatedAt, p.UpdatedAt,
        (SELECT COUNT(*) FROM StudentPrograms sp WHERE sp.ProgramID = p.ProgramID) AS StudentCount
      FROM AcademicPrograms p
      ORDER BY p.ProgramName
    `;

    const result = await executeQuery(query);
    
    return res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching academic programs:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách chương trình đào tạo.'
    });
  }
});

/**
 * Get a specific program by ID
 * GET /api/academic/programs/:id
 */
router.get('/programs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID chương trình không hợp lệ.'
      });
    }
    
    const query = `
      SELECT 
        p.ProgramID, p.ProgramCode, p.ProgramName, p.Department, p.Faculty,
        p.Description, p.TotalCredits, p.ProgramDuration, p.DegreeName, 
        p.ProgramType, p.IsActive, p.CreatedAt, p.UpdatedAt,
        (SELECT COUNT(*) FROM StudentPrograms sp WHERE sp.ProgramID = p.ProgramID) AS StudentCount
      FROM AcademicPrograms p
      WHERE p.ProgramID = @id
    `;
    
    const result = await executeQuery(query, {
      id: { type: sql.BigInt, value: id }
    });
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình đào tạo.'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error fetching academic program:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin chương trình đào tạo.'
    });
  }
});

/**
 * Create a new academic program
 * POST /api/academic/programs
 */
router.post('/programs', async (req, res) => {
  try {
    const {
      programCode,
      programName,
      department,
      faculty,
      description,
      totalCredits,
      programDuration,
      degreeName,
      programType,
      isActive
    } = req.body;
    
    // Validate required fields
    if (!programCode || !programName) {
      return res.status(400).json({
        success: false,
        message: 'Mã chương trình và tên chương trình là bắt buộc.'
      });
    }
    
    // Check if program code already exists
    const checkQuery = `
      SELECT ProgramID FROM AcademicPrograms
      WHERE ProgramCode = @programCode
    `;
    
    const checkResult = await executeQuery(checkQuery, {
      programCode: { type: sql.VarChar, value: programCode }
    });
    
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã chương trình đã tồn tại.'
      });
    }
    
    // Insert new program
    const insertQuery = `
      INSERT INTO AcademicPrograms (
        ProgramCode, ProgramName, Department, Faculty,
        Description, TotalCredits, ProgramDuration, DegreeName,
        ProgramType, IsActive
      )
      VALUES (
        @programCode, @programName, @department, @faculty,
        @description, @totalCredits, @programDuration, @degreeName,
        @programType, @isActive
      );
      
      SELECT SCOPE_IDENTITY() AS ProgramID;
    `;
    
    const insertResult = await executeQuery(insertQuery, {
      programCode: { type: sql.VarChar, value: programCode },
      programName: { type: sql.NVarChar, value: programName },
      department: { type: sql.NVarChar, value: department || null },
      faculty: { type: sql.NVarChar, value: faculty || null },
      description: { type: sql.NVarChar, value: description || null },
      totalCredits: { type: sql.Int, value: totalCredits || null },
      programDuration: { type: sql.Int, value: programDuration || null },
      degreeName: { type: sql.NVarChar, value: degreeName || null },
      programType: { type: sql.VarChar, value: programType || 'regular' },
      isActive: { type: sql.Bit, value: isActive !== undefined ? isActive : true }
    });
    
    const programId = insertResult.recordset[0].ProgramID;
    
    return res.status(201).json({
      success: true,
      message: 'Tạo chương trình đào tạo thành công.',
      programId
    });
  } catch (error) {
    console.error('Error creating academic program:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo chương trình đào tạo.'
    });
  }
});

/**
 * Update an existing academic program
 * PUT /api/academic/programs/:id
 */
router.put('/programs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      programCode,
      programName,
      department,
      faculty,
      description,
      totalCredits,
      programDuration,
      degreeName,
      programType,
      isActive
    } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID chương trình không hợp lệ.'
      });
    }
    
    // Check if program exists
    const checkQuery = `
      SELECT ProgramID FROM AcademicPrograms
      WHERE ProgramID = @id
    `;
    
    const checkResult = await executeQuery(checkQuery, {
      id: { type: sql.BigInt, value: id }
    });
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình đào tạo.'
      });
    }
    
    // Update program
    const updateQuery = `
      UPDATE AcademicPrograms
      SET
        ProgramCode = ISNULL(@programCode, ProgramCode),
        ProgramName = ISNULL(@programName, ProgramName),
        Department = ISNULL(@department, Department),
        Faculty = ISNULL(@faculty, Faculty),
        Description = ISNULL(@description, Description),
        TotalCredits = ISNULL(@totalCredits, TotalCredits),
        ProgramDuration = ISNULL(@programDuration, ProgramDuration),
        DegreeName = ISNULL(@degreeName, DegreeName),
        ProgramType = ISNULL(@programType, ProgramType),
        IsActive = ISNULL(@isActive, IsActive),
        UpdatedAt = GETDATE()
      WHERE ProgramID = @id;
    `;
    
    await executeQuery(updateQuery, {
      id: { type: sql.BigInt, value: id },
      programCode: { type: sql.VarChar, value: programCode || null },
      programName: { type: sql.NVarChar, value: programName || null },
      department: { type: sql.NVarChar, value: department || null },
      faculty: { type: sql.NVarChar, value: faculty || null },
      description: { type: sql.NVarChar, value: description || null },
      totalCredits: { type: sql.Int, value: totalCredits || null },
      programDuration: { type: sql.Int, value: programDuration || null },
      degreeName: { type: sql.NVarChar, value: degreeName || null },
      programType: { type: sql.VarChar, value: programType || null },
      isActive: { type: sql.Bit, value: isActive !== undefined ? isActive : null }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật chương trình đào tạo thành công.'
    });
  } catch (error) {
    console.error('Error updating academic program:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật chương trình đào tạo.'
    });
  }
});

/**
 * Get all subjects with filtering options
 * GET /api/academic/subjects
 */
router.get('/subjects', async (req, res) => {
  try {
    // Extract query parameters
    const { faculty, department, search, isActive, programId } = req.query;
    
    console.log('Subjects request with params:', { faculty, department, search, isActive, programId });
    
    // Base query for subjects
    let query = `
      SELECT 
        s.SubjectID, s.SubjectCode, s.SubjectName, s.Credits,
        s.TheoryCredits, s.PracticeCredits, s.Prerequisites,
        s.Description, s.Department, s.Faculty,
        s.IsRequired, s.IsActive, s.CreatedAt, s.UpdatedAt
      FROM Subjects s
      WHERE 1=1
    `;
    
    // Parameters for the query
    const params = {};
    
    // Add filters
    if (faculty) {
      query += ` AND s.Faculty = @faculty`;
      params.faculty = { type: sql.NVarChar, value: faculty };
    }
    
    if (department) {
      query += ` AND s.Department = @department`;
      params.department = { type: sql.NVarChar, value: department };
    }
    
    if (search) {
      query += ` AND (s.SubjectCode LIKE @search OR s.SubjectName LIKE @search)`;
      params.search = { type: sql.NVarChar, value: `%${search}%` };
    }
    
    if (isActive !== undefined && isActive !== null) {
      const activeValue = isActive === 'true' || isActive === true || isActive === 1 || isActive === '1';
      query += ` AND s.IsActive = @isActive`;
      params.isActive = { type: sql.Bit, value: activeValue };
    }
    
    // If programId is provided, join with ProgramSubjects to filter
    if (programId) {
      query = `
        SELECT 
          s.SubjectID, s.SubjectCode, s.SubjectName, s.Credits,
          s.TheoryCredits, s.PracticeCredits, s.Prerequisites,
          s.Description, s.Department, s.Faculty,
          s.IsRequired, s.IsActive, s.CreatedAt, s.UpdatedAt,
          ps.Semester, ps.SubjectType, ps.IsRequired AS IsProgramRequired
        FROM Subjects s
        INNER JOIN ProgramSubjects ps ON s.SubjectID = ps.SubjectID
        WHERE ps.ProgramID = @programId
      `;
      
      params.programId = { type: sql.BigInt, value: programId };
      
      // Add additional filters
      if (faculty) {
        query += ` AND s.Faculty = @faculty`;
      }
      
      if (department) {
        query += ` AND s.Department = @department`;
      }
      
      if (search) {
        query += ` AND (s.SubjectCode LIKE @search OR s.SubjectName LIKE @search)`;
      }
      
      if (isActive !== undefined && isActive !== null) {
        query += ` AND s.IsActive = @isActive`;
      }
    }
    
    // Add order by
    query += ` ORDER BY s.SubjectCode, s.SubjectName`;
    
    // Execute the query
    const result = await executeQuery(query, params);
    
    return res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách môn học.'
    });
  }
});

/**
 * Get a specific subject by ID
 * GET /api/academic/subjects/:id
 */
router.get('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID môn học không hợp lệ.'
      });
    }
    
    const query = `
      SELECT 
        s.SubjectID, s.SubjectCode, s.SubjectName, s.Credits,
        s.TheoryCredits, s.PracticeCredits, s.Prerequisites,
        s.Description, s.Department, s.Faculty,
        s.IsRequired, s.IsActive, s.CreatedAt, s.UpdatedAt
      FROM Subjects s
      WHERE s.SubjectID = @id
    `;
    
    const result = await executeQuery(query, {
      id: { type: sql.BigInt, value: id }
    });
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học.'
      });
    }
    
    // Get programs that include this subject
    const programsQuery = `
      SELECT 
        p.ProgramID, p.ProgramCode, p.ProgramName, p.Department,
        ps.Semester, ps.SubjectType, ps.IsRequired,
        ps.MinimumGrade
      FROM ProgramSubjects ps
      INNER JOIN AcademicPrograms p ON ps.ProgramID = p.ProgramID
      WHERE ps.SubjectID = @id
      ORDER BY p.ProgramName
    `;
    
    const programsResult = await executeQuery(programsQuery, {
      id: { type: sql.BigInt, value: id }
    });
    
    // Combine results
    const subject = result.recordset[0];
    subject.programs = programsResult.recordset;
    
    return res.status(200).json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Error fetching subject:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin môn học.'
    });
  }
});

/**
 * Create a new subject
 * POST /api/academic/subjects
 */
router.post('/subjects', async (req, res) => {
  try {
    const {
      subjectCode,
      subjectName,
      credits,
      theoryCredits,
      practiceCredits,
      prerequisites,
      description,
      department,
      faculty,
      isRequired,
      isActive,
      programId,
      semester,
      subjectType
    } = req.body;
    
    // Validate required fields
    if (!subjectCode || !subjectName || !credits) {
      return res.status(400).json({
        success: false,
        message: 'Mã môn học, tên môn học và số tín chỉ là bắt buộc.'
      });
    }
    
    // Check if subject code already exists
    const checkQuery = `
      SELECT SubjectID FROM Subjects
      WHERE SubjectCode = @subjectCode
    `;
    
    const checkResult = await executeQuery(checkQuery, {
      subjectCode: { type: sql.VarChar, value: subjectCode }
    });
    
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã môn học đã tồn tại.'
      });
    }
    
    // Begin transaction
    const pool = await require('../config/db').getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Insert new subject
      const insertQuery = `
        INSERT INTO Subjects (
          SubjectCode, SubjectName, Credits, TheoryCredits,
          PracticeCredits, Prerequisites, Description, Department,
          Faculty, IsRequired, IsActive
        )
        VALUES (
          @subjectCode, @subjectName, @credits, @theoryCredits,
          @practiceCredits, @prerequisites, @description, @department,
          @faculty, @isRequired, @isActive
        );
        
        SELECT SCOPE_IDENTITY() AS SubjectID;
      `;
      
      const insertRequest = new sql.Request(transaction);
      insertRequest.input('subjectCode', sql.VarChar, subjectCode);
      insertRequest.input('subjectName', sql.NVarChar, subjectName);
      insertRequest.input('credits', sql.Int, credits);
      insertRequest.input('theoryCredits', sql.Int, theoryCredits || null);
      insertRequest.input('practiceCredits', sql.Int, practiceCredits || null);
      insertRequest.input('prerequisites', sql.NVarChar, prerequisites || null);
      insertRequest.input('description', sql.NVarChar, description || null);
      insertRequest.input('department', sql.NVarChar, department || null);
      insertRequest.input('faculty', sql.NVarChar, faculty || null);
      insertRequest.input('isRequired', sql.Bit, isRequired !== undefined ? isRequired : true);
      insertRequest.input('isActive', sql.Bit, isActive !== undefined ? isActive : true);
      
      const insertResult = await insertRequest.query(insertQuery);
      const subjectId = insertResult.recordset[0].SubjectID;
      
      // If programId is provided, create association in ProgramSubjects
      if (programId) {
        const insertProgramSubjectQuery = `
          INSERT INTO ProgramSubjects (
            ProgramID, SubjectID, Semester, SubjectType, IsRequired
          )
          VALUES (
            @programId, @subjectId, @semester, @subjectType, @isRequired
          );
        `;
        
        const insertProgramRequest = new sql.Request(transaction);
        insertProgramRequest.input('programId', sql.BigInt, programId);
        insertProgramRequest.input('subjectId', sql.BigInt, subjectId);
        insertProgramRequest.input('semester', sql.Int, semester || null);
        insertProgramRequest.input('subjectType', sql.VarChar(50), subjectType || null);
        insertProgramRequest.input('isRequired', sql.Bit, isRequired !== undefined ? isRequired : true);
        
        await insertProgramRequest.query(insertProgramSubjectQuery);
      }
      
      // Commit transaction
      await transaction.commit();
      
      return res.status(201).json({
        success: true,
        message: 'Tạo môn học thành công.',
        subjectId
      });
    } catch (error) {
      // Rollback on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating subject:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo môn học.'
    });
  }
});

/**
 * Update an existing subject
 * PUT /api/academic/subjects/:id
 */
router.put('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subjectCode,
      subjectName,
      credits,
      theoryCredits,
      practiceCredits,
      prerequisites,
      description,
      department,
      faculty,
      isRequired,
      isActive
    } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID môn học không hợp lệ.'
      });
    }
    
    // Check if subject exists
    const checkQuery = `
      SELECT SubjectID FROM Subjects
      WHERE SubjectID = @id
    `;
    
    const checkResult = await executeQuery(checkQuery, {
      id: { type: sql.BigInt, value: id }
    });
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học.'
      });
    }
    
    // Update subject
    const updateQuery = `
      UPDATE Subjects
      SET
        SubjectCode = ISNULL(@subjectCode, SubjectCode),
        SubjectName = ISNULL(@subjectName, SubjectName),
        Credits = ISNULL(@credits, Credits),
        TheoryCredits = ISNULL(@theoryCredits, TheoryCredits),
        PracticeCredits = ISNULL(@practiceCredits, PracticeCredits),
        Prerequisites = ISNULL(@prerequisites, Prerequisites),
        Description = ISNULL(@description, Description),
        Department = ISNULL(@department, Department),
        Faculty = ISNULL(@faculty, Faculty),
        IsRequired = ISNULL(@isRequired, IsRequired),
        IsActive = ISNULL(@isActive, IsActive),
        UpdatedAt = GETDATE()
      WHERE SubjectID = @id;
    `;
    
    await executeQuery(updateQuery, {
      id: { type: sql.BigInt, value: id },
      subjectCode: { type: sql.VarChar, value: subjectCode || null },
      subjectName: { type: sql.NVarChar, value: subjectName || null },
      credits: { type: sql.Int, value: credits || null },
      theoryCredits: { type: sql.Int, value: theoryCredits || null },
      practiceCredits: { type: sql.Int, value: practiceCredits || null },
      prerequisites: { type: sql.NVarChar, value: prerequisites || null },
      description: { type: sql.NVarChar, value: description || null },
      department: { type: sql.NVarChar, value: department || null },
      faculty: { type: sql.NVarChar, value: faculty || null },
      isRequired: { type: sql.Bit, value: isRequired !== undefined ? isRequired : null },
      isActive: { type: sql.Bit, value: isActive !== undefined ? isActive : null }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật môn học thành công.'
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật môn học.'
    });
  }
});

/**
 * Get subjects for a specific program
 * GET /api/academic/programs/:id/subjects
 */
router.get('/programs/:id/subjects', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID chương trình không hợp lệ.'
      });
    }
    
    // Query to get subjects in the program with additional details
    const query = `
      SELECT 
        s.SubjectID, s.SubjectCode, s.SubjectName, s.Credits,
        s.TheoryCredits, s.PracticeCredits, s.Prerequisites,
        s.Description, s.Department, s.Faculty,
        ps.Semester, ps.SubjectType, ps.IsRequired,
        ps.MinimumGrade
      FROM ProgramSubjects ps
      INNER JOIN Subjects s ON ps.SubjectID = s.SubjectID
      WHERE ps.ProgramID = @id
      ORDER BY ps.Semester, s.SubjectCode
    `;
    
    const result = await executeQuery(query, {
      id: { type: sql.BigInt, value: id }
    });
    
    return res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching program subjects:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách môn học của chương trình.'
    });
  }
});

/**
 * Add a subject to a program
 * POST /api/academic/programs/:programId/subjects/:subjectId
 */
router.post('/programs/:programId/subjects/:subjectId', async (req, res) => {
  try {
    const { programId, subjectId } = req.params;
    const { semester, subjectType, isRequired, minimumGrade } = req.body;
    
    if (!programId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'ID chương trình và ID môn học là bắt buộc.'
      });
    }
    
    // Check if the association already exists
    const checkQuery = `
      SELECT ProgramSubjectID 
      FROM ProgramSubjects
      WHERE ProgramID = @programId AND SubjectID = @subjectId
    `;
    
    const checkResult = await executeQuery(checkQuery, {
      programId: { type: sql.BigInt, value: programId },
      subjectId: { type: sql.BigInt, value: subjectId }
    });
    
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Môn học đã được thêm vào chương trình này.'
      });
    }
    
    // Insert new association
    const insertQuery = `
      INSERT INTO ProgramSubjects (
        ProgramID, SubjectID, Semester, SubjectType,
        IsRequired, MinimumGrade
      )
      VALUES (
        @programId, @subjectId, @semester, @subjectType,
        @isRequired, @minimumGrade
      );
    `;
    
    await executeQuery(insertQuery, {
      programId: { type: sql.BigInt, value: programId },
      subjectId: { type: sql.BigInt, value: subjectId },
      semester: { type: sql.Int, value: semester || null },
      subjectType: { type: sql.VarChar, value: subjectType || null },
      isRequired: { type: sql.Bit, value: isRequired !== undefined ? isRequired : true },
      minimumGrade: { type: sql.Decimal, value: minimumGrade || null }
    });
    
    return res.status(201).json({
      success: true,
      message: 'Thêm môn học vào chương trình thành công.'
    });
  } catch (error) {
    console.error('Error adding subject to program:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm môn học vào chương trình.'
    });
  }
});

/**
 * Remove a subject from a program
 * DELETE /api/academic/programs/:programId/subjects/:subjectId
 */
router.delete('/programs/:programId/subjects/:subjectId', async (req, res) => {
  try {
    const { programId, subjectId } = req.params;
    
    if (!programId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'ID chương trình và ID môn học là bắt buộc.'
      });
    }
    
    // Check if the association exists
    const checkQuery = `
      SELECT ProgramSubjectID 
      FROM ProgramSubjects
      WHERE ProgramID = @programId AND SubjectID = @subjectId
    `;
    
    const checkResult = await executeQuery(checkQuery, {
      programId: { type: sql.BigInt, value: programId },
      subjectId: { type: sql.BigInt, value: subjectId }
    });
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học trong chương trình này.'
      });
    }
    
    // Delete the association
    const deleteQuery = `
      DELETE FROM ProgramSubjects
      WHERE ProgramID = @programId AND SubjectID = @subjectId
    `;
    
    await executeQuery(deleteQuery, {
      programId: { type: sql.BigInt, value: programId },
      subjectId: { type: sql.BigInt, value: subjectId }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Xóa môn học khỏi chương trình thành công.'
    });
  } catch (error) {
    console.error('Error removing subject from program:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa môn học khỏi chương trình.'
    });
  }
});

/**
 * Get all semesters
 * GET /api/academic/semesters
 */
router.get('/semesters', async (req, res) => {
  try {
    const query = `
      SELECT 
        SemesterID, SemesterCode, SemesterName, AcademicYear,
        StartDate, EndDate, RegistrationStartDate, RegistrationEndDate,
        Status, IsCurrent
      FROM Semesters
      ORDER BY StartDate DESC
    `;
    
    const result = await executeQuery(query);
    
    return res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách học kỳ.'
    });
  }
});

/**
 * Get dashboard stats for academic data
 * GET /api/academic/dashboard/stats
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Query to get students stats
    const studentsQuery = `
      SELECT 
        COUNT(u.UserID) AS total,
        SUM(CASE WHEN u.AccountStatus = 'ACTIVE' THEN 1 ELSE 0 END) AS active
      FROM Users u
      WHERE u.Role = 'STUDENT'
    `;
    
    // Query to get programs count
    const programsQuery = `
      SELECT COUNT(ProgramID) AS total
      FROM AcademicPrograms
      WHERE IsActive = 1
    `;
    
    // Query to get subjects count
    const subjectsQuery = `
      SELECT COUNT(SubjectID) AS total
      FROM Subjects
      WHERE IsActive = 1
    `;
    
    // Query to get current semester
    const semesterQuery = `
      SELECT TOP 1 *
      FROM Semesters
      WHERE IsCurrent = 1
      ORDER BY StartDate DESC
    `;
    
    // Execute all queries concurrently
    const [
      studentsResult,
      programsResult,
      subjectsResult,
      semesterResult
    ] = await Promise.all([
      executeQuery(studentsQuery),
      executeQuery(programsQuery),
      executeQuery(subjectsQuery),
      executeQuery(semesterQuery)
    ]);
    
    // Mock some recent activities (replace with actual data in production)
    const recentActivities = [
      {
        id: 1,
        type: 'student_created',
        content: 'Sinh viên mới đã được thêm vào hệ thống',
        user: 'Admin',
        time: 'Vài giờ trước'
      },
      {
        id: 2,
        type: 'grade_updated',
        content: 'Điểm học phần đã được cập nhật',
        user: 'Admin',
        time: '1 ngày trước'
      }
    ];
    
    // Mock some warnings (replace with actual data in production)
    const warnings = [
      {
        id: 1,
        type: 'academic_performance',
        student: 'Nguyen Van A',
        description: 'Điểm GPA dưới 1.5',
        date: '2023-01-15'
      }
    ];
    
    return res.status(200).json({
      success: true,
      data: {
        students: studentsResult.recordset[0],
        programs: programsResult.recordset[0].total,
        subjects: subjectsResult.recordset[0].total,
        currentSemester: semesterResult.recordset[0] || null,
        recentActivities,
        warnings
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy dữ liệu thống kê.'
    });
  }
});

/**
 * Get a simplified list of all programs for dropdowns and selectors
 * GET /api/academic/programs-list
 */
router.get('/programs-list', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.ProgramID as id, 
        p.ProgramCode as code, 
        p.ProgramName as name,
        p.Faculty as faculty,
        p.Department as department
      FROM AcademicPrograms p
      WHERE p.IsActive = 1
      ORDER BY p.ProgramName
    `;

    const result = await executeQuery(query);
    
    return res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching programs list:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách chương trình đào tạo.'
    });
  }
});

/**
 * Get a simplified list of all subjects for dropdowns and selectors
 * GET /api/academic/subjects-list
 */
router.get('/subjects-list', async (req, res) => {
  try {
    const { programId } = req.query;
    
    let query;
    const params = {};
    
    if (programId) {
      // If programId is provided, get subjects for that program
      query = `
        SELECT 
          s.SubjectID as id, 
          s.SubjectCode as code, 
          s.SubjectName as name,
          s.Credits as credits,
          ps.Semester as semester
        FROM Subjects s
        INNER JOIN ProgramSubjects ps ON s.SubjectID = ps.SubjectID
        WHERE ps.ProgramID = @programId AND s.IsActive = 1
        ORDER BY ps.Semester, s.SubjectName
      `;
      
      params.programId = { type: sql.BigInt, value: programId };
    } else {
      // Otherwise, get all active subjects
      query = `
        SELECT 
          s.SubjectID as id, 
          s.SubjectCode as code, 
          s.SubjectName as name,
          s.Credits as credits,
          s.Department as department,
          s.Faculty as faculty
        FROM Subjects s
        WHERE s.IsActive = 1
        ORDER BY s.SubjectCode
      `;
    }

    const result = await executeQuery(query, params);
    
    return res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching subjects list:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách môn học.'
    });
  }
});

/**
 * Get academic results for a student or for all students
 * GET /api/academic/academic-results
 */
router.get('/academic-results', async (req, res) => {
  try {
    const { studentId, programId, semesterId, subjectId, search } = req.query;
    
    // Build query based on parameters
    let query;
    const params = {};
    
    if (studentId) {
      // Get results for a specific student
      query = `
        SELECT 
          ar.ResultID, 
          ar.AttendanceScore, 
          ar.AssignmentScore,
          ar.MidtermScore, 
          ar.FinalScore, 
          ar.TotalScore, 
          ar.LetterGrade,
          ar.GPA, 
          ar.IsCompleted, 
          ar.IsPassed,
          ar.UpdatedAt,
          u.UserID as StudentID,
          u.FullName as StudentName,
          sd.StudentCode,
          s.SubjectID,
          s.SubjectCode,
          s.SubjectName,
          s.Credits,
          sem.SemesterID,
          sem.SemesterCode,
          sem.SemesterName,
          sem.AcademicYear,
          cc.ClassID,
          t.FullName as TeacherName,
          p.ProgramName
        FROM AcademicResults ar
        INNER JOIN Users u ON ar.UserID = u.UserID
        INNER JOIN StudentDetails sd ON u.UserID = sd.UserID
        INNER JOIN CourseClasses cc ON ar.ClassID = cc.ClassID
        INNER JOIN Subjects s ON cc.SubjectID = s.SubjectID
        INNER JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
        LEFT JOIN Users t ON cc.TeacherID = t.UserID
        LEFT JOIN StudentPrograms sp ON u.UserID = sp.UserID AND sp.IsPrimary = 1
        LEFT JOIN AcademicPrograms p ON sp.ProgramID = p.ProgramID
        WHERE ar.UserID = @studentId
      `;
      
      params.studentId = { type: sql.BigInt, value: studentId };
      
      // Add additional filters if provided
      if (semesterId) {
        query += ` AND sem.SemesterID = @semesterId`;
        params.semesterId = { type: sql.BigInt, value: semesterId };
      }
      
      if (subjectId) {
        query += ` AND s.SubjectID = @subjectId`;
        params.subjectId = { type: sql.BigInt, value: subjectId };
      }
      
      if (programId) {
        query += ` AND EXISTS (
          SELECT 1 FROM StudentPrograms sp 
          WHERE sp.UserID = u.UserID AND sp.ProgramID = @programId
        )`;
        params.programId = { type: sql.BigInt, value: programId };
      }
      
      query += ` ORDER BY sem.StartDate DESC, s.SubjectName`;
    } else {
      // Get results for all students with search and filtering
      query = `
        SELECT 
          ar.ResultID, 
          ar.AttendanceScore, 
          ar.AssignmentScore,
          ar.MidtermScore, 
          ar.FinalScore, 
          ar.TotalScore, 
          ar.LetterGrade,
          ar.GPA, 
          ar.IsCompleted, 
          ar.IsPassed,
          ar.UpdatedAt,
          u.UserID as StudentID,
          u.FullName as StudentName,
          sd.StudentCode,
          s.SubjectID,
          s.SubjectCode,
          s.SubjectName,
          s.Credits,
          sem.SemesterID,
          sem.SemesterCode,
          sem.SemesterName,
          sem.AcademicYear,
          cc.ClassID,
          p.ProgramID,
          p.ProgramName
        FROM AcademicResults ar
        INNER JOIN Users u ON ar.UserID = u.UserID
        INNER JOIN StudentDetails sd ON u.UserID = sd.UserID
        INNER JOIN CourseClasses cc ON ar.ClassID = cc.ClassID
        INNER JOIN Subjects s ON cc.SubjectID = s.SubjectID
        INNER JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
        LEFT JOIN StudentPrograms sp ON u.UserID = sp.UserID AND sp.IsPrimary = 1
        LEFT JOIN AcademicPrograms p ON sp.ProgramID = p.ProgramID
        WHERE 1=1
      `;
      
      // Add search filter if provided
      if (search) {
        query += ` AND (sd.StudentCode LIKE @search OR u.FullName LIKE @search)`;
        params.search = { type: sql.NVarChar, value: `%${search}%` };
      }
      
      // Add additional filters if provided
      if (semesterId) {
        query += ` AND sem.SemesterID = @semesterId`;
        params.semesterId = { type: sql.BigInt, value: semesterId };
      }
      
      if (subjectId) {
        query += ` AND s.SubjectID = @subjectId`;
        params.subjectId = { type: sql.BigInt, value: subjectId };
      }
      
      if (programId) {
        query += ` AND (sp.ProgramID = @programId OR p.ProgramID = @programId)`;
        params.programId = { type: sql.BigInt, value: programId };
      }
      
      query += ` ORDER BY u.FullName, sem.StartDate DESC, s.SubjectName`;
    }
    
    const result = await executeQuery(query, params);
    
    return res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching academic results:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy kết quả học tập.'
    });
  }
});

/**
 * Get academic warnings with filtering and pagination
 * GET /api/academic/warnings
 */
router.get('/warnings', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', semesterId = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // Build the base query with joins
    let query = `
      SELECT 
        w.WarningID, w.UserID, w.SemesterID, w.WarningType,
        w.Reason, w.WarningDate, w.RequiredAction, w.ResolvedDate,
        w.Status, w.CreatedBy, 
        u.FullName as StudentName,
        sd.StudentCode as StudentID,
        s.SemesterName, s.SemesterCode, s.AcademicYear
      FROM AcademicWarnings w
      INNER JOIN Users u ON w.UserID = u.UserID
      INNER JOIN StudentDetails sd ON u.UserID = sd.UserID
      INNER JOIN Semesters s ON w.SemesterID = s.SemesterID
      WHERE 1=1
    `;
    
    const params = {};
    
    // Add search filter
    if (search) {
      query += ` AND (sd.StudentCode LIKE @search OR u.FullName LIKE @search OR CAST(w.UserID AS VARCHAR) = @exactSearch)`;
      params.search = { type: sql.NVarChar, value: `%${search}%` };
      params.exactSearch = { type: sql.VarChar, value: search };
    }
    
    // Add status filter
    if (status) {
      query += ` AND w.Status = @status`;
      params.status = { type: sql.VarChar, value: status };
    }
    
    // Add semester filter
    if (semesterId) {
      query += ` AND w.SemesterID = @semesterId`;
      params.semesterId = { type: sql.BigInt, value: semesterId };
    }
    
    // Count total records for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM AcademicWarnings w
      INNER JOIN Users u ON w.UserID = u.UserID
      INNER JOIN StudentDetails sd ON u.UserID = sd.UserID
      WHERE 1=1
      ${search ? ` AND (sd.StudentCode LIKE @search OR u.FullName LIKE @search OR CAST(w.UserID AS VARCHAR) = @exactSearch)` : ''}
      ${status ? ` AND w.Status = @status` : ''}
      ${semesterId ? ` AND w.SemesterID = @semesterId` : ''}
    `;
    
    // Add pagination
    query += ` ORDER BY w.WarningDate DESC
               OFFSET ${offset} ROWS
               FETCH NEXT ${limit} ROWS ONLY`;
    
    // Execute both queries
    const [warningsResult, countResult] = await Promise.all([
      executeQuery(query, params),
      executeQuery(countQuery, params)
    ]);
    
    return res.status(200).json({
      success: true,
      warnings: warningsResult.recordset,
      total: countResult.recordset[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching academic warnings:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách cảnh báo học tập.'
    });
  }
});

/**
 * Get a specific academic warning by ID
 * GET /api/academic/warnings/:id
 */
router.get('/warnings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID cảnh báo không hợp lệ.'
      });
    }
    
    const query = `
      SELECT 
        w.WarningID, w.UserID, w.SemesterID, w.WarningType,
        w.Reason, w.WarningDate, w.RequiredAction, w.ResolvedDate,
        w.Status, w.CreatedBy, w.CreatedAt, w.UpdatedAt,
        u.FullName as StudentName, u.Email as StudentEmail,
        sd.StudentCode, sd.CurrentSemester, sd.AcademicStatus,
        s.SemesterName, s.SemesterCode, s.AcademicYear,
        c.FullName as CreatorName,
        p.ProgramName
      FROM AcademicWarnings w
      INNER JOIN Users u ON w.UserID = u.UserID
      INNER JOIN StudentDetails sd ON u.UserID = sd.UserID
      INNER JOIN Semesters s ON w.SemesterID = s.SemesterID
      LEFT JOIN Users c ON w.CreatedBy = c.UserID
      LEFT JOIN StudentPrograms sp ON u.UserID = sp.UserID AND sp.IsPrimary = 1
      LEFT JOIN AcademicPrograms p ON sp.ProgramID = p.ProgramID
      WHERE w.WarningID = @id
    `;
    
    const result = await executeQuery(query, {
      id: { type: sql.BigInt, value: id }
    });
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cảnh báo học tập.'
      });
    }
    
    // Get academic results for the student in the warning semester
    const resultsQuery = `
      SELECT 
        ar.ResultID, ar.ClassID, ar.TotalScore, ar.LetterGrade, ar.GPA,
        ar.IsCompleted, ar.IsPassed,
        s.SubjectID, s.SubjectCode, s.SubjectName, s.Credits
      FROM AcademicResults ar
      INNER JOIN CourseClasses cc ON ar.ClassID = cc.ClassID
      INNER JOIN Subjects s ON cc.SubjectID = s.SubjectID
      WHERE ar.UserID = @userId AND cc.SemesterID = @semesterId
    `;
    
    const resultsResult = await executeQuery(resultsQuery, {
      userId: { type: sql.BigInt, value: result.recordset[0].UserID },
      semesterId: { type: sql.BigInt, value: result.recordset[0].SemesterID }
    });
    
    // Combine results
    const warning = result.recordset[0];
    warning.academicResults = resultsResult.recordset;
    
    return res.status(200).json({
      success: true,
      warning
    });
  } catch (error) {
    console.error('Error fetching academic warning:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin cảnh báo học tập.'
    });
  }
});

/**
 * Create a new academic warning
 * POST /api/academic/warnings
 */
router.post('/warnings', async (req, res) => {
  try {
    const {
      userId,
      semesterId,
      warningType,
      reason,
      warningDate,
      requiredAction,
      status = 'Active'
    } = req.body;
    
    // Validate required fields
    if (!userId || !semesterId || !warningType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: StudentID, SemesterID, WarningType, Reason'
      });
    }
    
    // Insert the new warning
    const query = `
      INSERT INTO AcademicWarnings (
        UserID, SemesterID, WarningType, Reason,
        WarningDate, RequiredAction, Status, CreatedBy
      )
      VALUES (
        @userId, @semesterId, @warningType, @reason,
        @warningDate, @requiredAction, @status, @createdBy
      );
      
      SELECT SCOPE_IDENTITY() AS WarningID;
    `;
    
    const result = await executeQuery(query, {
      userId: { type: sql.BigInt, value: userId },
      semesterId: { type: sql.BigInt, value: semesterId },
      warningType: { type: sql.VarChar, value: warningType },
      reason: { type: sql.NVarChar, value: reason },
      warningDate: { type: sql.Date, value: warningDate || new Date() },
      requiredAction: { type: sql.NVarChar, value: requiredAction || null },
      status: { type: sql.VarChar, value: status },
      createdBy: { type: sql.BigInt, value: req.user?.UserID || null }
    });
    
    // Get the created warning ID
    const warningId = result.recordset[0].WarningID;
    
    return res.status(201).json({
      success: true,
      message: 'Tạo cảnh báo học tập thành công.',
      warningId
    });
  } catch (error) {
    console.error('Error creating academic warning:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo cảnh báo học tập.'
    });
  }
});

/**
 * Update an existing academic warning
 * PUT /api/academic/warnings/:id
 */
router.put('/warnings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      warningType,
      reason,
      warningDate,
      requiredAction,
      status,
      resolvedDate
    } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID cảnh báo không hợp lệ.'
      });
    }
    
    // Check if the warning exists
    const checkQuery = `
      SELECT WarningID FROM AcademicWarnings
      WHERE WarningID = @id
    `;
    
    const checkResult = await executeQuery(checkQuery, {
      id: { type: sql.BigInt, value: id }
    });
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cảnh báo học tập.'
      });
    }
    
    // Update the warning
    const updateQuery = `
      UPDATE AcademicWarnings
      SET
        WarningType = ISNULL(@warningType, WarningType),
        Reason = ISNULL(@reason, Reason),
        WarningDate = ISNULL(@warningDate, WarningDate),
        RequiredAction = ISNULL(@requiredAction, RequiredAction),
        Status = ISNULL(@status, Status),
        ResolvedDate = ISNULL(@resolvedDate, ResolvedDate),
        UpdatedAt = GETDATE()
      WHERE WarningID = @id;
    `;
    
    await executeQuery(updateQuery, {
      id: { type: sql.BigInt, value: id },
      warningType: { type: sql.VarChar, value: warningType || null },
      reason: { type: sql.NVarChar, value: reason || null },
      warningDate: { type: sql.Date, value: warningDate || null },
      requiredAction: { type: sql.NVarChar, value: requiredAction || null },
      status: { type: sql.VarChar, value: status || null },
      resolvedDate: { type: sql.Date, value: resolvedDate || null }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật cảnh báo học tập thành công.'
    });
  } catch (error) {
    console.error('Error updating academic warning:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật cảnh báo học tập.'
    });
  }
});

// Export the router
module.exports = router; 