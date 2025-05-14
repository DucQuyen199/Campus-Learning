const { executeQuery, sql } = require('../config/db');

/**
 * Get all academic programs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllPrograms = async (req, res) => {
  try {
    const query = `
      SELECT 
        ProgramID, ProgramCode, ProgramName, Department, Faculty,
        Description, TotalCredits, ProgramDuration, DegreeName,
        ProgramType, IsActive, CreatedAt, UpdatedAt
      FROM AcademicPrograms
      ORDER BY Faculty, Department, ProgramName
    `;

    const result = await executeQuery(query);

    return res.status(200).json({
      success: true,
      programs: result.recordset
    });
  } catch (error) {
    console.error('Error fetching academic programs:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách chương trình đào tạo.'
    });
  }
};

/**
 * Get program by ID with detailed information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID chương trình không hợp lệ.'
      });
    }

    // Get program information
    const query = `
      SELECT 
        ProgramID, ProgramCode, ProgramName, Department, Faculty,
        Description, TotalCredits, ProgramDuration, DegreeName,
        ProgramType, IsActive, CreatedAt, UpdatedAt
      FROM AcademicPrograms
      WHERE ProgramID = @id
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

    const program = result.recordset[0];

    // Get subjects in the program
    const subjectsQuery = `
      SELECT 
        ps.ProgramSubjectID, ps.Semester, ps.SubjectType, ps.IsRequired,
        ps.MinimumGrade, s.SubjectID, s.SubjectCode, s.SubjectName,
        s.Credits, s.TheoryCredits, s.PracticeCredits, s.Prerequisites,
        s.Department, s.Faculty, s.IsRequired as SubjectIsRequired,
        s.IsActive
      FROM ProgramSubjects ps
      INNER JOIN Subjects s ON ps.SubjectID = s.SubjectID
      WHERE ps.ProgramID = @id
      ORDER BY ps.Semester, s.SubjectName
    `;

    const subjectsResult = await executeQuery(subjectsQuery, {
      id: { type: sql.BigInt, value: id }
    });

    // Get student count in program
    const studentsQuery = `
      SELECT COUNT(DISTINCT UserID) as StudentCount
      FROM StudentPrograms
      WHERE ProgramID = @id AND Status IN ('Active', 'Completed')
    `;

    const studentsResult = await executeQuery(studentsQuery, {
      id: { type: sql.BigInt, value: id }
    });

    // Organize subjects by semester
    const semesterSubjects = {};
    let totalCredits = 0;
    let requiredCredits = 0;

    subjectsResult.recordset.forEach(subject => {
      const sem = subject.Semester || 0;
      
      if (!semesterSubjects[sem]) {
        semesterSubjects[sem] = [];
      }
      
      semesterSubjects[sem].push(subject);
      totalCredits += subject.Credits;
      
      if (subject.IsRequired) {
        requiredCredits += subject.Credits;
      }
    });

    // Combine results
    const programData = {
      ...program,
      subjects: subjectsResult.recordset,
      semesterSubjects,
      stats: {
        totalCredits,
        requiredCredits,
        studentCount: studentsResult.recordset[0].StudentCount,
        subjectCount: subjectsResult.recordset.length
      }
    };

    return res.status(200).json({
      success: true,
      program: programData
    });
  } catch (error) {
    console.error('Error fetching program details:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin chương trình đào tạo.'
    });
  }
};

/**
 * Create a new academic program
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createProgram = async (req, res) => {
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
      programType
    } = req.body;

    // Basic validation
    if (!programCode || !programName || !faculty) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.'
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
        ProgramType, IsActive, CreatedAt, UpdatedAt
      )
      VALUES (
        @programCode, @programName, @department, @faculty,
        @description, @totalCredits, @programDuration, @degreeName,
        @programType, 1, GETDATE(), GETDATE()
      );
      
      SELECT SCOPE_IDENTITY() AS ProgramID;
    `;

    const insertResult = await executeQuery(insertQuery, {
      programCode: { type: sql.VarChar, value: programCode },
      programName: { type: sql.NVarChar, value: programName },
      department: { type: sql.NVarChar, value: department },
      faculty: { type: sql.NVarChar, value: faculty },
      description: { type: sql.NVarChar, value: description },
      totalCredits: { type: sql.Int, value: totalCredits },
      programDuration: { type: sql.Int, value: programDuration },
      degreeName: { type: sql.NVarChar, value: degreeName },
      programType: { type: sql.VarChar, value: programType }
    });

    const programId = insertResult.recordset[0].ProgramID;

    return res.status(201).json({
      success: true,
      message: 'Tạo chương trình đào tạo thành công.',
      programId: programId
    });
  } catch (error) {
    console.error('Error creating academic program:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo chương trình đào tạo.'
    });
  }
};

/**
 * Update an academic program
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const {
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
      programName: { type: sql.NVarChar, value: programName },
      department: { type: sql.NVarChar, value: department },
      faculty: { type: sql.NVarChar, value: faculty },
      description: { type: sql.NVarChar, value: description },
      totalCredits: { type: sql.Int, value: totalCredits },
      programDuration: { type: sql.Int, value: programDuration },
      degreeName: { type: sql.NVarChar, value: degreeName },
      programType: { type: sql.VarChar, value: programType },
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
};

/**
 * Get all subjects
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllSubjects = async (req, res) => {
  try {
    const faculty = req.query.faculty || '';
    const department = req.query.department || '';
    const search = req.query.search || '';
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : null;

    // Base query
    let query = `
      SELECT 
        SubjectID, SubjectCode, SubjectName, Credits, TheoryCredits,
        PracticeCredits, Prerequisites, Description, Department,
        Faculty, IsRequired, IsActive, CreatedAt, UpdatedAt
      FROM Subjects
      WHERE 1=1
    `;

    const params = {};

    // Add filters
    if (faculty) {
      query += ` AND Faculty = @faculty`;
      params.faculty = { type: sql.NVarChar, value: faculty };
    }

    if (department) {
      query += ` AND Department = @department`;
      params.department = { type: sql.NVarChar, value: department };
    }

    if (search) {
      query += ` AND (SubjectCode LIKE @search OR SubjectName LIKE @search)`;
      params.search = { type: sql.NVarChar, value: `%${search}%` };
    }

    if (isActive !== null) {
      query += ` AND IsActive = @isActive`;
      params.isActive = { type: sql.Bit, value: isActive };
    }

    // Add ordering
    query += ` ORDER BY SubjectCode`;

    const result = await executeQuery(query, params);

    return res.status(200).json({
      success: true,
      subjects: result.recordset
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách môn học.'
    });
  }
};

/**
 * Create a new subject
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSubject = async (req, res) => {
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
      isRequired
    } = req.body;

    // Basic validation
    if (!subjectCode || !subjectName || !credits) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.'
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

    // Insert new subject
    const insertQuery = `
      INSERT INTO Subjects (
        SubjectCode, SubjectName, Credits, TheoryCredits,
        PracticeCredits, Prerequisites, Description, Department,
        Faculty, IsRequired, IsActive, CreatedAt, UpdatedAt
      )
      VALUES (
        @subjectCode, @subjectName, @credits, @theoryCredits,
        @practiceCredits, @prerequisites, @description, @department,
        @faculty, @isRequired, 1, GETDATE(), GETDATE()
      );
      
      SELECT SCOPE_IDENTITY() AS SubjectID;
    `;

    const insertResult = await executeQuery(insertQuery, {
      subjectCode: { type: sql.VarChar, value: subjectCode },
      subjectName: { type: sql.NVarChar, value: subjectName },
      credits: { type: sql.Int, value: credits },
      theoryCredits: { type: sql.Int, value: theoryCredits || null },
      practiceCredits: { type: sql.Int, value: practiceCredits || null },
      prerequisites: { type: sql.NVarChar, value: prerequisites || null },
      description: { type: sql.NVarChar, value: description || null },
      department: { type: sql.NVarChar, value: department || null },
      faculty: { type: sql.NVarChar, value: faculty || null },
      isRequired: { type: sql.Bit, value: isRequired !== undefined ? isRequired : true }
    });

    const subjectId = insertResult.recordset[0].SubjectID;

    return res.status(201).json({
      success: true,
      message: 'Tạo môn học thành công.',
      subjectId: subjectId
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo môn học.'
    });
  }
};

/**
 * Add a subject to a program
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addSubjectToProgram = async (req, res) => {
  try {
    const { programId, subjectId } = req.params;
    const {
      semester,
      subjectType,
      isRequired,
      minimumGrade
    } = req.body;

    // Basic validation
    if (!programId || !subjectId || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.'
      });
    }

    // Check if program exists
    const checkProgramQuery = `
      SELECT ProgramID FROM AcademicPrograms
      WHERE ProgramID = @programId
    `;

    const programResult = await executeQuery(checkProgramQuery, {
      programId: { type: sql.BigInt, value: programId }
    });

    if (programResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình đào tạo.'
      });
    }

    // Check if subject exists
    const checkSubjectQuery = `
      SELECT SubjectID FROM Subjects
      WHERE SubjectID = @subjectId
    `;

    const subjectResult = await executeQuery(checkSubjectQuery, {
      subjectId: { type: sql.BigInt, value: subjectId }
    });

    if (subjectResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học.'
      });
    }

    // Check if subject is already in program
    const checkExistsQuery = `
      SELECT ProgramSubjectID FROM ProgramSubjects
      WHERE ProgramID = @programId AND SubjectID = @subjectId
    `;

    const existsResult = await executeQuery(checkExistsQuery, {
      programId: { type: sql.BigInt, value: programId },
      subjectId: { type: sql.BigInt, value: subjectId }
    });

    if (existsResult.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Môn học đã tồn tại trong chương trình đào tạo.'
      });
    }

    // Add subject to program
    const insertQuery = `
      INSERT INTO ProgramSubjects (
        ProgramID, SubjectID, Semester, SubjectType,
        IsRequired, MinimumGrade, CreatedAt, UpdatedAt
      )
      VALUES (
        @programId, @subjectId, @semester, @subjectType,
        @isRequired, @minimumGrade, GETDATE(), GETDATE()
      );
      
      SELECT SCOPE_IDENTITY() AS ProgramSubjectID;
    `;

    const insertResult = await executeQuery(insertQuery, {
      programId: { type: sql.BigInt, value: programId },
      subjectId: { type: sql.BigInt, value: subjectId },
      semester: { type: sql.Int, value: semester },
      subjectType: { type: sql.VarChar, value: subjectType || null },
      isRequired: { type: sql.Bit, value: isRequired !== undefined ? isRequired : true },
      minimumGrade: { type: sql.Decimal(5, 2), value: minimumGrade || null }
    });

    const programSubjectId = insertResult.recordset[0].ProgramSubjectID;

    return res.status(201).json({
      success: true,
      message: 'Thêm môn học vào chương trình đào tạo thành công.',
      programSubjectId: programSubjectId
    });
  } catch (error) {
    console.error('Error adding subject to program:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm môn học vào chương trình đào tạo.'
    });
  }
};

/**
 * Get all semesters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllSemesters = async (req, res) => {
  try {
    const query = `
      SELECT 
        SemesterID, SemesterCode, SemesterName, AcademicYear,
        StartDate, EndDate, RegistrationStartDate, RegistrationEndDate,
        Status, IsCurrent, CreatedAt, UpdatedAt
      FROM Semesters
      ORDER BY StartDate DESC
    `;

    const result = await executeQuery(query);

    return res.status(200).json({
      success: true,
      semesters: result.recordset
    });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách học kỳ.'
    });
  }
};

/**
 * Create a new semester
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSemester = async (req, res) => {
  try {
    const {
      semesterCode,
      semesterName,
      academicYear,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      status,
      isCurrent
    } = req.body;

    // Basic validation
    if (!semesterCode || !semesterName || !academicYear || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.'
      });
    }

    // Check if semester code already exists
    const checkQuery = `
      SELECT SemesterID FROM Semesters
      WHERE SemesterCode = @semesterCode
    `;

    const checkResult = await executeQuery(checkQuery, {
      semesterCode: { type: sql.VarChar, value: semesterCode }
    });

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã học kỳ đã tồn tại.'
      });
    }

    // Begin transaction
    const pool = await require('../config/db').getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();

      // If setting as current semester, update all other semesters
      if (isCurrent) {
        const updateCurrentQuery = `
          UPDATE Semesters
          SET IsCurrent = 0
          WHERE IsCurrent = 1;
        `;

        const updateCurrentRequest = new sql.Request(transaction);
        await updateCurrentRequest.query(updateCurrentQuery);
      }

      // Insert new semester
      const insertQuery = `
        INSERT INTO Semesters (
          SemesterCode, SemesterName, AcademicYear, StartDate,
          EndDate, RegistrationStartDate, RegistrationEndDate,
          Status, IsCurrent, CreatedAt, UpdatedAt
        )
        VALUES (
          @semesterCode, @semesterName, @academicYear, @startDate,
          @endDate, @registrationStartDate, @registrationEndDate,
          @status, @isCurrent, GETDATE(), GETDATE()
        );
        
        SELECT SCOPE_IDENTITY() AS SemesterID;
      `;

      const insertRequest = new sql.Request(transaction);
      insertRequest.input('semesterCode', sql.VarChar, semesterCode);
      insertRequest.input('semesterName', sql.NVarChar, semesterName);
      insertRequest.input('academicYear', sql.VarChar, academicYear);
      insertRequest.input('startDate', sql.Date, startDate);
      insertRequest.input('endDate', sql.Date, endDate);
      insertRequest.input('registrationStartDate', sql.Date, registrationStartDate || null);
      insertRequest.input('registrationEndDate', sql.Date, registrationEndDate || null);
      insertRequest.input('status', sql.VarChar, status || 'Upcoming');
      insertRequest.input('isCurrent', sql.Bit, isCurrent || false);
      
      const insertResult = await insertRequest.query(insertQuery);
      const semesterId = insertResult.recordset[0].SemesterID;

      // Commit the transaction
      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: 'Tạo học kỳ thành công.',
        semesterId: semesterId
      });
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating semester:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo học kỳ.'
    });
  }
};

module.exports = {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  getAllSubjects,
  createSubject,
  addSubjectToProgram,
  getAllSemesters,
  createSemester
}; 