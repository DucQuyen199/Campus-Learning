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

// Export the router
module.exports = router; 