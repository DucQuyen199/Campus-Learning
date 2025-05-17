const { executeQuery, sql } = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * Get all students with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllStudents = async (req, res) => {
  try {
    // Check if this is a request for all students with direct SQL
    const directSql = req.query.directSql === 'true';
    const selectAll = req.query.selectAll === 'true';
    const noLimit = req.query.noLimit === 'true';
    const skipPagination = req.query.skipPagination === 'true';
    
    // If directSql and selectAll parameters are present, use a more efficient query
    if (directSql && selectAll && (noLimit || skipPagination)) {
      console.log('Using optimized query to fetch all students at once');
      
      // Direct SQL query to fetch all students efficiently
      const query = `
        SELECT 
          u.UserID, u.Username, u.Email, u.FullName, u.DateOfBirth,
          u.PhoneNumber, u.Address, u.City, u.Country,
          u.Status, u.AccountStatus, u.CreatedAt, u.UpdatedAt, u.Avatar,
          sd.StudentCode, sd.Class, sd.CurrentSemester, sd.AcademicStatus,
          ap.ProgramName, ap.Faculty, ap.Department
        FROM Users u
        LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
        LEFT JOIN StudentPrograms sp ON u.UserID = sp.UserID AND sp.IsPrimary = 1
        LEFT JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
        WHERE u.Role = 'STUDENT'
        ORDER BY u.UserID
      `;
      
      const result = await executeQuery(query);
      
      return res.status(200).json({
        success: true,
        data: result.recordset
      });
    }
    
    // Handle request for a specific user by ID
    if (req.query.exactUserId) {
      const userId = req.query.exactUserId;
      
      const query = `
        SELECT 
          u.UserID, u.Username, u.Email, u.FullName, u.DateOfBirth,
          u.PhoneNumber, u.Address, u.City, u.Country,
          u.Status, u.AccountStatus, u.CreatedAt, u.UpdatedAt, u.Avatar,
          sd.StudentCode, sd.Class, sd.CurrentSemester, sd.AcademicStatus,
          ap.ProgramName, ap.Faculty, ap.Department
        FROM Users u
        LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
        LEFT JOIN StudentPrograms sp ON u.UserID = sp.UserID AND sp.IsPrimary = 1
        LEFT JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
        WHERE u.Role = 'STUDENT' AND u.UserID = @userId
      `;
      
      const result = await executeQuery(query, {
        userId: { type: sql.BigInt, value: userId }
      });
      
      return res.status(200).json({
        success: true,
        data: result.recordset
      });
    }
    
    // Standard pagination approach
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.pageSize) || parseInt(req.query.limit) || 10;
    const offset = page * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const programId = req.query.programId || '';

    // Base query with joins to related tables
    let query = `
      SELECT 
        u.UserID, u.Username, u.Email, u.FullName, u.DateOfBirth,
        u.Status, u.AccountStatus, u.CreatedAt, u.UpdatedAt,
        sd.StudentCode, sd.Class, sd.AcademicStatus,
        ap.ProgramName, ap.Faculty, ap.Department
      FROM Users u
      LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
      LEFT JOIN StudentPrograms sp ON u.UserID = sp.UserID AND sp.IsPrimary = 1
      LEFT JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
      WHERE u.Role = 'STUDENT'
    `;

    // Add search filters
    const params = {};
    
    if (search) {
      query += ` AND (u.FullName LIKE @search OR u.Email LIKE @search OR u.Username LIKE @search OR sd.StudentCode LIKE @search)`;
      params.search = { type: sql.NVarChar, value: `%${search}%` };
    }
    
    if (status) {
      query += ` AND u.AccountStatus = @status`;
      params.status = { type: sql.VarChar, value: status };
    }
    
    if (programId) {
      query += ` AND sp.ProgramID = @programId`;
      params.programId = { type: sql.BigInt, value: programId };
    }

    // Count total records (for pagination)
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) AS countTable`;
    const countResult = await executeQuery(countQuery, params);
    const totalStudents = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalStudents / limit);

    // Add pagination
    query += ` ORDER BY u.UserID OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    params.offset = { type: sql.Int, value: offset };
    params.limit = { type: sql.Int, value: limit };

    // Execute the main query
    const result = await executeQuery(query, params);

    return res.status(200).json({
      success: true,
      data: result.recordset,
      pagination: {
        total: totalStudents,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách sinh viên.'
    });
  }
};

/**
 * Get all students in a single query without pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllStudentsDirectly = async (req, res) => {
  try {
    console.log('Direct request for all students at once');
    
    // Direct SQL query to fetch all students efficiently
    const query = `
      SELECT 
        u.UserID, u.Username, u.Email, u.FullName, u.DateOfBirth,
        u.PhoneNumber, u.Address, u.City, u.Country,
        u.Status, u.AccountStatus, u.CreatedAt, u.UpdatedAt, u.Avatar,
        sd.StudentCode, sd.Class, sd.CurrentSemester, sd.AcademicStatus,
        ap.ProgramName, ap.Faculty, ap.Department
      FROM Users u
      LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
      LEFT JOIN StudentPrograms sp ON u.UserID = sp.UserID AND sp.IsPrimary = 1
      LEFT JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
      WHERE u.Role = 'STUDENT'
      ORDER BY u.UserID
    `;
    
    // Use the pool directly instead of executeQuery helper to bypass parameter validation
    // Get a direct connection to the SQL pool
    const { getPool } = require('../config/db');
    const pool = await getPool();
    
    // Execute the query directly without parameters
    const result = await pool.request().query(query);
    
    return res.status(200).json({
      success: true,
      data: result.recordset,
      totalCount: result.recordset.length
    });
  } catch (error) {
    console.error('Error fetching all students directly:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách sinh viên.'
    });
  }
};

/**
 * Get student by ID with detailed information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID sinh viên không hợp lệ.'
      });
    }

    // Get basic student information
    const query = `
      SELECT 
        u.UserID, u.Username, u.Email, u.FullName, u.DateOfBirth,
        u.Gender, u.PhoneNumber, u.Address, u.City, u.Country,
        u.Status, u.AccountStatus, u.CreatedAt, u.UpdatedAt, u.Avatar,
        sd.*
      FROM Users u
      LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
      WHERE u.UserID = @id AND u.Role = 'STUDENT'
    `;

    const result = await executeQuery(query, {
      id: { type: sql.BigInt, value: id }
    });

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên.'
      });
    }

    const student = result.recordset[0];

    // Get academic programs
    const programsQuery = `
      SELECT 
        sp.StudentProgramID, sp.EntryYear, sp.ExpectedGraduationYear,
        sp.Status AS ProgramStatus, sp.IsPrimary,
        ap.ProgramID, ap.ProgramCode, ap.ProgramName, ap.Faculty, ap.Department,
        ap.TotalCredits, ap.DegreeName, ap.ProgramType,
        u.FullName AS AdvisorName, u.Email AS AdvisorEmail, u.PhoneNumber AS AdvisorPhone
      FROM StudentPrograms sp
      INNER JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
      LEFT JOIN Users u ON sp.AdvisorID = u.UserID
      WHERE sp.UserID = @id
      ORDER BY sp.IsPrimary DESC
    `;

    const programsResult = await executeQuery(programsQuery, {
      id: { type: sql.BigInt, value: id }
    });

    // Get academic results by semester
    const resultsQuery = `
      SELECT 
        ar.ResultID, ar.ClassID, ar.AttendanceScore, ar.AssignmentScore,
        ar.MidtermScore, ar.FinalScore, ar.TotalScore, ar.LetterGrade,
        ar.GPA, ar.IsCompleted, ar.IsPassed, ar.Comments,
        s.SubjectCode, s.SubjectName, s.Credits,
        sem.SemesterCode, sem.SemesterName, sem.AcademicYear
      FROM AcademicResults ar
      INNER JOIN CourseClasses cc ON ar.ClassID = cc.ClassID
      INNER JOIN Subjects s ON cc.SubjectID = s.SubjectID
      INNER JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
      WHERE ar.UserID = @id
      ORDER BY sem.StartDate DESC, s.SubjectName
    `;

    const resultsResult = await executeQuery(resultsQuery, {
      id: { type: sql.BigInt, value: id }
    });

    // Get warnings
    const warningsQuery = `
      SELECT 
        aw.WarningID, aw.WarningType, aw.Reason, aw.WarningDate,
        aw.RequiredAction, aw.ResolvedDate, aw.Status,
        sem.SemesterCode, sem.SemesterName, sem.AcademicYear
      FROM AcademicWarnings aw
      INNER JOIN Semesters sem ON aw.SemesterID = sem.SemesterID
      WHERE aw.UserID = @id
      ORDER BY aw.WarningDate DESC
    `;

    const warningsResult = await executeQuery(warningsQuery, {
      id: { type: sql.BigInt, value: id }
    });

    // Get tuition information
    const tuitionQuery = `
      SELECT 
        t.TuitionID, t.TotalCredits, t.AmountPerCredit, t.TotalAmount,
        t.ScholarshipAmount, t.FinalAmount, t.DueDate, t.Status,
        sem.SemesterCode, sem.SemesterName, sem.AcademicYear
      FROM Tuition t
      INNER JOIN Semesters sem ON t.SemesterID = sem.SemesterID
      WHERE t.UserID = @id
      ORDER BY sem.StartDate DESC
    `;

    const tuitionResult = await executeQuery(tuitionQuery, {
      id: { type: sql.BigInt, value: id }
    });

    // Combine all data
    const studentData = {
      ...student,
      programs: programsResult.recordset,
      academicResults: resultsResult.recordset,
      warnings: warningsResult.recordset,
      tuition: tuitionResult.recordset
    };

    return res.status(200).json({
      success: true,
      student: studentData
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin sinh viên.'
    });
  }
};

/**
 * Create a new student account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createStudent = async (req, res) => {
  try {
    const {
      username,
      email,
      fullName,
      password,
      dateOfBirth,
      phoneNumber,
      studentCode,
      gender,
      programId,
      entryYear,
      expectedGraduationYear,
      advisorId,
      class: studentClass
    } = req.body;

    // Basic validation
    if (!username || !email || !fullName || !password || !studentCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.'
      });
    }

    // Check if username or email already exists
    const checkQuery = `
      SELECT UserID FROM Users
      WHERE Username = @username OR Email = @email
    `;

    const checkResult = await executeQuery(checkQuery, {
      username: { type: sql.VarChar, value: username },
      email: { type: sql.VarChar, value: email }
    });

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập hoặc email đã tồn tại.'
      });
    }

    // Check if student code already exists
    const checkCodeQuery = `
      SELECT DetailID FROM StudentDetails
      WHERE StudentCode = @studentCode
    `;

    const checkCodeResult = await executeQuery(checkCodeQuery, {
      studentCode: { type: sql.VarChar, value: studentCode }
    });

    if (checkCodeResult.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã sinh viên đã tồn tại.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Begin transaction
    const pool = await require('../config/db').getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();

      // 1. Create user account
      const insertUserQuery = `
        INSERT INTO Users (
          Username, Email, Password, FullName, DateOfBirth,
          PhoneNumber, Role, Status, AccountStatus
        )
        VALUES (
          @username, @email, @password, @fullName, @dateOfBirth,
          @phoneNumber, 'STUDENT', 'ONLINE', 'ACTIVE'
        );
        SELECT SCOPE_IDENTITY() AS UserID;
      `;

      const insertUserRequest = new sql.Request(transaction);
      insertUserRequest.input('username', sql.VarChar(50), username);
      insertUserRequest.input('email', sql.VarChar(100), email);
      insertUserRequest.input('password', sql.VarChar(255), hashedPassword);
      insertUserRequest.input('fullName', sql.NVarChar(100), fullName);
      insertUserRequest.input('dateOfBirth', sql.Date, dateOfBirth || null);
      insertUserRequest.input('phoneNumber', sql.VarChar(15), phoneNumber || null);
      
      const userResult = await insertUserRequest.query(insertUserQuery);
      const userId = userResult.recordset[0].UserID;

      // 2. Create student details
      const insertDetailsQuery = `
        INSERT INTO StudentDetails (
          UserID, StudentCode, Gender, Class, EnrollmentDate, CurrentSemester, AcademicStatus
        )
        VALUES (
          @userId, @studentCode, @gender, @class, GETDATE(), 1, 'Regular'
        );
      `;

      const insertDetailsRequest = new sql.Request(transaction);
      insertDetailsRequest.input('userId', sql.BigInt, userId);
      insertDetailsRequest.input('studentCode', sql.VarChar(20), studentCode);
      insertDetailsRequest.input('gender', sql.VarChar(10), gender || null);
      insertDetailsRequest.input('class', sql.NVarChar(50), studentClass || null);
      
      await insertDetailsRequest.query(insertDetailsQuery);

      // 3. Assign to academic program if provided
      if (programId) {
        const insertProgramQuery = `
          INSERT INTO StudentPrograms (
            UserID, ProgramID, EntryYear, ExpectedGraduationYear,
            AdvisorID, Status, IsPrimary
          )
          VALUES (
            @userId, @programId, @entryYear, @expectedGraduationYear,
            @advisorId, 'Active', 1
          );
        `;

        const insertProgramRequest = new sql.Request(transaction);
        insertProgramRequest.input('userId', sql.BigInt, userId);
        insertProgramRequest.input('programId', sql.BigInt, programId);
        insertProgramRequest.input('entryYear', sql.Int, entryYear || new Date().getFullYear());
        insertProgramRequest.input('expectedGraduationYear', sql.Int, expectedGraduationYear || (new Date().getFullYear() + 4));
        insertProgramRequest.input('advisorId', sql.BigInt, advisorId || null);
        
        await insertProgramRequest.query(insertProgramQuery);
      }

      // Commit the transaction
      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: 'Tạo tài khoản sinh viên thành công.',
        userId: userId
      });
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating student:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo tài khoản sinh viên.'
    });
  }
};

/**
 * Update student information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      phoneNumber,
      address,
      city,
      country,
      status,
      accountStatus,
      gender,
      dateOfBirth,
      studentCode,
      class: studentClass,
      academicStatus,
      programId,
      advisorId
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID sinh viên không hợp lệ.'
      });
    }

    // Check if student exists
    const checkQuery = `
      SELECT UserID FROM Users
      WHERE UserID = @id AND Role = 'STUDENT'
    `;

    const checkResult = await executeQuery(checkQuery, {
      id: { type: sql.BigInt, value: id }
    });

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên.'
      });
    }

    // Begin transaction
    const pool = await require('../config/db').getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();

      // 1. Update user information
      const updateUserQuery = `
        UPDATE Users
        SET
          FullName = ISNULL(@fullName, FullName),
          Email = ISNULL(@email, Email),
          PhoneNumber = ISNULL(@phoneNumber, PhoneNumber),
          Address = ISNULL(@address, Address),
          City = ISNULL(@city, City),
          Country = ISNULL(@country, Country),
          Status = ISNULL(@status, Status),
          AccountStatus = ISNULL(@accountStatus, AccountStatus),
          DateOfBirth = ISNULL(@dateOfBirth, DateOfBirth),
          UpdatedAt = GETDATE()
        WHERE UserID = @id;
      `;

      const updateUserRequest = new sql.Request(transaction);
      updateUserRequest.input('id', sql.BigInt, id);
      updateUserRequest.input('fullName', sql.NVarChar(100), fullName || null);
      updateUserRequest.input('email', sql.VarChar(100), email || null);
      updateUserRequest.input('phoneNumber', sql.VarChar(15), phoneNumber || null);
      updateUserRequest.input('address', sql.NVarChar(255), address || null);
      updateUserRequest.input('city', sql.NVarChar(100), city || null);
      updateUserRequest.input('country', sql.NVarChar(100), country || null);
      updateUserRequest.input('status', sql.VarChar(20), status || null);
      updateUserRequest.input('accountStatus', sql.VarChar(20), accountStatus || null);
      updateUserRequest.input('dateOfBirth', sql.Date, dateOfBirth || null);
      
      await updateUserRequest.query(updateUserQuery);

      // 2. Update student details
      const updateDetailsQuery = `
        UPDATE StudentDetails
        SET
          StudentCode = ISNULL(@studentCode, StudentCode),
          Gender = ISNULL(@gender, Gender),
          Class = ISNULL(@class, Class),
          AcademicStatus = ISNULL(@academicStatus, AcademicStatus),
          UpdatedAt = GETDATE()
        WHERE UserID = @id;
      `;

      const updateDetailsRequest = new sql.Request(transaction);
      updateDetailsRequest.input('id', sql.BigInt, id);
      updateDetailsRequest.input('studentCode', sql.VarChar(20), studentCode || null);
      updateDetailsRequest.input('gender', sql.VarChar(10), gender || null);
      updateDetailsRequest.input('class', sql.NVarChar(50), studentClass || null);
      updateDetailsRequest.input('academicStatus', sql.VarChar(30), academicStatus || null);
      
      await updateDetailsRequest.query(updateDetailsQuery);

      // 3. Update program information if provided
      if (programId) {
        // Check if student is already enrolled in this program
        const checkProgramQuery = `
          SELECT StudentProgramID
          FROM StudentPrograms
          WHERE UserID = @id AND ProgramID = @programId;
        `;

        const checkProgramRequest = new sql.Request(transaction);
        checkProgramRequest.input('id', sql.BigInt, id);
        checkProgramRequest.input('programId', sql.BigInt, programId);
        
        const programResult = await checkProgramRequest.query(checkProgramQuery);

        if (programResult.recordset.length > 0) {
          // Update existing program
          const updateProgramQuery = `
            UPDATE StudentPrograms
            SET
              AdvisorID = ISNULL(@advisorId, AdvisorID),
              UpdatedAt = GETDATE()
            WHERE UserID = @id AND ProgramID = @programId;
          `;

          const updateProgramRequest = new sql.Request(transaction);
          updateProgramRequest.input('id', sql.BigInt, id);
          updateProgramRequest.input('programId', sql.BigInt, programId);
          updateProgramRequest.input('advisorId', sql.BigInt, advisorId || null);
          
          await updateProgramRequest.query(updateProgramQuery);
        } else {
          // Add new program
          const insertProgramQuery = `
            INSERT INTO StudentPrograms (
              UserID, ProgramID, EntryYear, AdvisorID, Status, IsPrimary
            )
            VALUES (
              @id, @programId, YEAR(GETDATE()), @advisorId, 'Active', 0
            );
          `;

          const insertProgramRequest = new sql.Request(transaction);
          insertProgramRequest.input('id', sql.BigInt, id);
          insertProgramRequest.input('programId', sql.BigInt, programId);
          insertProgramRequest.input('advisorId', sql.BigInt, advisorId || null);
          
          await insertProgramRequest.query(insertProgramQuery);
        }
      }

      // Commit the transaction
      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin sinh viên thành công.'
      });
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating student:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông tin sinh viên.'
    });
  }
};

/**
 * Reset student password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID sinh viên không hợp lệ.'
      });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 8 ký tự.'
      });
    }

    // Check if student exists
    const checkQuery = `
      SELECT UserID FROM Users
      WHERE UserID = @id AND Role = 'STUDENT'
    `;

    const checkResult = await executeQuery(checkQuery, {
      id: { type: sql.BigInt, value: id }
    });

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên.'
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    const updateQuery = `
      UPDATE Users
      SET Password = @password, UpdatedAt = GETDATE()
      WHERE UserID = @id;
    `;

    await executeQuery(updateQuery, {
      id: { type: sql.BigInt, value: id },
      password: { type: sql.VarChar, value: hashedPassword }
    });

    return res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu sinh viên thành công.'
    });
  } catch (error) {
    console.error('Error resetting student password:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đặt lại mật khẩu sinh viên.'
    });
  }
};

/**
 * Get student's academic results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStudentResults = async (req, res) => {
  try {
    const { id } = req.params;
    const semesterId = req.query.semesterId || '';
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID sinh viên không hợp lệ.'
      });
    }

    // Check if student exists
    const checkQuery = `
      SELECT UserID FROM Users
      WHERE UserID = @id AND Role = 'STUDENT'
    `;

    const checkResult = await executeQuery(checkQuery, {
      id: { type: sql.BigInt, value: id }
    });

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên.'
      });
    }

    // Base query
    let query = `
      SELECT 
        ar.ResultID, ar.ClassID, ar.AttendanceScore, ar.AssignmentScore,
        ar.MidtermScore, ar.FinalScore, ar.TotalScore, ar.LetterGrade,
        ar.GPA, ar.IsCompleted, ar.IsPassed, ar.Comments,
        s.SubjectID, s.SubjectCode, s.SubjectName, s.Credits,
        s.TheoryCredits, s.PracticeCredits,
        sem.SemesterID, sem.SemesterCode, sem.SemesterName, sem.AcademicYear,
        cc.TeacherID, u.FullName AS TeacherName
      FROM AcademicResults ar
      INNER JOIN CourseClasses cc ON ar.ClassID = cc.ClassID
      INNER JOIN Subjects s ON cc.SubjectID = s.SubjectID
      INNER JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
      LEFT JOIN Users u ON cc.TeacherID = u.UserID
      WHERE ar.UserID = @id
    `;

    // Add semester filter if provided
    const params = {
      id: { type: sql.BigInt, value: id }
    };

    if (semesterId) {
      query += ` AND sem.SemesterID = @semesterId`;
      params.semesterId = { type: sql.BigInt, value: semesterId };
    }

    // Add ordering
    query += ` ORDER BY sem.StartDate DESC, s.SubjectName`;

    // Execute the query
    const result = await executeQuery(query, params);

    // Calculate semester GPA and summary
    const semesterResults = {};
    let totalGPA = 0;
    let totalCredits = 0;
    let passedCredits = 0;

    result.recordset.forEach(record => {
      const semId = record.SemesterID;
      
      // Initialize semester if not exists
      if (!semesterResults[semId]) {
        semesterResults[semId] = {
          semesterId: semId,
          semesterCode: record.SemesterCode,
          semesterName: record.SemesterName,
          academicYear: record.AcademicYear,
          results: [],
          semesterGPA: 0,
          semesterCredits: 0,
          passedCredits: 0
        };
      }
      
      // Add result to semester
      semesterResults[semId].results.push(record);
      
      // Update semester stats
      if (record.IsPassed) {
        semesterResults[semId].passedCredits += record.Credits;
        passedCredits += record.Credits;
      }
      
      semesterResults[semId].semesterCredits += record.Credits;
      totalCredits += record.Credits;
      
      // Update GPA calculation
      if (record.GPA) {
        semesterResults[semId].semesterGPA += record.GPA * record.Credits;
        totalGPA += record.GPA * record.Credits;
      }
    });

    // Calculate final GPA for each semester
    Object.keys(semesterResults).forEach(semId => {
      const sem = semesterResults[semId];
      if (sem.semesterCredits > 0) {
        sem.semesterGPA = +(sem.semesterGPA / sem.semesterCredits).toFixed(2);
      }
    });

    // Calculate overall GPA
    const overallGPA = totalCredits > 0 ? +(totalGPA / totalCredits).toFixed(2) : 0;

    // Convert to array and sort by semester
    const semestersArray = Object.values(semesterResults).sort((a, b) => {
      return b.semesterCode.localeCompare(a.semesterCode);
    });

    return res.status(200).json({
      success: true,
      results: {
        semesters: semestersArray,
        summary: {
          totalCredits,
          passedCredits,
          overallGPA
        }
      }
    });
  } catch (error) {
    console.error('Error fetching student results:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy kết quả học tập.'
    });
  }
};

module.exports = {
  getAllStudents,
  getAllStudentsDirectly,
  getStudentById,
  createStudent,
  updateStudent,
  resetPassword,
  getStudentResults
}; 