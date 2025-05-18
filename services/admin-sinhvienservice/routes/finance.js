const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getPool } = require('../src/config/db');

// Mock tuition data
const tuition = [
  { 
    id: 1, 
    studentId: '2020001', 
    studentName: 'Nguyen Van A', 
    semester: 'Spring 2023',
    amount: 8500000,
    status: 'Paid',
    paymentDate: '2023-01-15'
  },
  { 
    id: 2, 
    studentId: '2020002', 
    studentName: 'Tran Thi B', 
    semester: 'Spring 2023',
    amount: 8500000,
    status: 'Pending',
    paymentDate: null
  },
  { 
    id: 3, 
    studentId: '2020003', 
    studentName: 'Le Van C', 
    semester: 'Spring 2023',
    amount: 7800000,
    status: 'Partial',
    paymentDate: '2023-01-20'
  }
];

// Tuition routes
router.get('/tuition', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', semesterId = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const poolConnection = await getPool();
    let query = `
      SELECT 
        t.TuitionID, t.UserID, u.FullName, u.Email, 
        s.SemesterName, s.AcademicYear,
        t.TotalCredits, t.AmountPerCredit, t.TotalAmount,
        t.ScholarshipAmount, t.FinalAmount, t.DueDate, t.Status,
        (SELECT SUM(Amount) FROM TuitionPayments WHERE TuitionID = t.TuitionID AND Status = 'Completed') AS PaidAmount
      FROM Tuition t
      INNER JOIN Users u ON t.UserID = u.UserID
      INNER JOIN Semesters s ON t.SemesterID = s.SemesterID
      WHERE 1=1
    `;
    
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM Tuition t
      INNER JOIN Users u ON t.UserID = u.UserID
      INNER JOIN Semesters s ON t.SemesterID = s.SemesterID
      WHERE 1=1
    `;
    
    const request = poolConnection.request();
    
    if (search) {
      query += ` AND (u.FullName LIKE @search OR CAST(u.UserID AS NVARCHAR) LIKE @search)`;
      countQuery += ` AND (u.FullName LIKE @search OR CAST(u.UserID AS NVARCHAR) LIKE @search)`;
      request.input('search', sql.NVarChar, `%${search}%`);
    }
    
    if (semesterId) {
      query += ` AND t.SemesterID = @semesterId`;
      countQuery += ` AND t.SemesterID = @semesterId`;
      request.input('semesterId', sql.BigInt, semesterId);
    }
    
    if (status) {
      query += ` AND t.Status = @status`;
      countQuery += ` AND t.Status = @status`;
      request.input('status', sql.VarChar, status);
    }
    
    query += ` ORDER BY t.CreatedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, parseInt(limit));
    
    const result = await request.query(query);
    const countResult = await poolConnection.request().query(countQuery);
    
    const total = countResult.recordset[0].total;
    
    res.json({
      success: true,
      data: result.recordset,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tuition data:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải dữ liệu học phí', error: error.message });
  }
});

// New endpoints for tuition generation

// Get students for tuition generation
router.get('/tuition/students', async (req, res) => {
  try {
    const { semesterId, programIds = '', hasPreviousBalance } = req.query;
    
    // Validate semesterId parameter
    if (!semesterId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mã học kỳ không được để trống' 
      });
    }

    // Ensure semesterId is a valid number
    const semesterIdInt = parseInt(semesterId);
    if (isNaN(semesterIdInt)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mã học kỳ phải là số' 
      });
    }
    
    const poolConnection = await getPool();
    let query = `
      SELECT 
        u.UserID, u.FullName, u.Email,
        p.ProgramName, p.ProgramID,
        COALESCE(Balances.CurrentBalance, 0) AS CurrentBalance,
        COALESCE(Courses.RegisteredCourses, 0) AS RegisteredCourses,
        COALESCE(Courses.TotalCredits, 0) AS TotalCredits,
        COALESCE(LastAmount.AmountPerCredit, 850000) AS LastAmountPerCredit
      FROM Users u
      INNER JOIN StudentPrograms sp ON u.UserID = sp.UserID
      INNER JOIN AcademicPrograms p ON sp.ProgramID = p.ProgramID
      OUTER APPLY (
        SELECT 
          SUM(t.FinalAmount - COALESCE(tp.PaidAmount, 0)) AS CurrentBalance
        FROM Tuition t 
        LEFT JOIN (
          SELECT TuitionID, SUM(Amount) AS PaidAmount 
          FROM TuitionPayments 
          WHERE Status = 'Completed' 
          GROUP BY TuitionID
        ) tp ON t.TuitionID = tp.TuitionID
        WHERE t.UserID = u.UserID 
          AND t.Status IN ('Unpaid', 'Partial')
          AND t.SemesterID != @semesterId
      ) AS Balances
      OUTER APPLY (
        SELECT 
          COUNT(*) AS RegisteredCourses,
          SUM(s.Credits) AS TotalCredits
        FROM CourseRegistrations cr 
        INNER JOIN CourseClasses cc ON cr.ClassID = cc.ClassID 
        INNER JOIN Subjects s ON cc.SubjectID = s.SubjectID
        WHERE cr.UserID = u.UserID AND cc.SemesterID = @semesterId
      ) AS Courses
      OUTER APPLY (
        SELECT TOP 1 
          t.AmountPerCredit
        FROM Tuition t 
        WHERE t.UserID = u.UserID 
        ORDER BY t.CreatedAt DESC
      ) AS LastAmount
      WHERE u.Role = 'STUDENT' AND u.AccountStatus = 'ACTIVE'
    `;
    
    const request = poolConnection.request()
      .input('semesterId', sql.BigInt, semesterIdInt);
    
    // Add program filter if specified
    if (programIds && programIds.length > 0) {
      const programIdArray = programIds.split(',').filter(id => id.trim() !== '');
      if (programIdArray.length > 0) {
        query += ` AND p.ProgramID IN (`;
        let validProgramsAdded = 0;
        for (let i = 0; i < programIdArray.length; i++) {
          const paramName = `programId${i}`;
          const programId = parseInt(programIdArray[i]);
          
          // Skip invalid program IDs
          if (isNaN(programId)) continue;
          
          query += validProgramsAdded === 0 ? `@${paramName}` : `, @${paramName}`;
          request.input(paramName, sql.BigInt, programId);
          validProgramsAdded++;
        }
        
        // If after all that filtering we don't have any valid IDs, remove the IN clause
        if (validProgramsAdded === 0) {
          query = query.replace(` AND p.ProgramID IN (`, '');
        } else {
          query += `)`;
        }
      }
    }
    
    // Check for previous balance if requested - fix nested aggregation here too
    if (hasPreviousBalance === 'true') {
      query += ` AND EXISTS (
        SELECT 1
        FROM Tuition t
        LEFT JOIN (
          SELECT TuitionID, SUM(Amount) AS PaidAmount 
          FROM TuitionPayments 
          WHERE Status = 'Completed' 
          GROUP BY TuitionID
        ) tp ON t.TuitionID = tp.TuitionID
        WHERE t.UserID = u.UserID 
          AND t.Status IN ('Unpaid', 'Partial')
          AND t.SemesterID != @semesterId
          AND (t.FinalAmount - COALESCE(tp.PaidAmount, 0)) > 0
      )`;
    }
    
    // Add order by
    query += ` ORDER BY u.FullName`;
    
    try {
      const result = await request.query(query);
      
      // If no students found, return empty array with success
      if (result.recordset.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'Không tìm thấy sinh viên nào phù hợp với điều kiện đã chọn'
        });
      }
      
      // Calculate suggested tuition amount
      const standardCreditAmount = 850000; // Default amount per credit if none found
      
      const students = result.recordset.map(student => ({
        ...student,
        TuitionAmount: student.TotalCredits * (student.LastAmountPerCredit || standardCreditAmount)
      }));
      
      res.json({
        success: true,
        data: students
      });
    } catch (queryError) {
      console.error('Database query error when fetching students:', queryError);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi truy vấn dữ liệu sinh viên', 
        error: queryError.message 
      });
    }
  } catch (error) {
    console.error('Error fetching students for tuition:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tải danh sách sinh viên', 
      error: error.message 
    });
  }
});

// Get a single tuition record
router.get('/tuition/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that id is a valid number before proceeding
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mã học phí không hợp lệ. Mã học phí phải là số.' 
      });
    }
    
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .input('id', sql.BigInt, parseInt(id)) // Ensure id is parsed as an integer
      .query(`
        SELECT 
          t.TuitionID, t.UserID, u.FullName, u.Email, 
          s.SemesterName, s.AcademicYear,
          t.TotalCredits, t.AmountPerCredit, t.TotalAmount,
          t.ScholarshipAmount, t.FinalAmount, t.DueDate, t.Status,
          t.CreatedAt, t.UpdatedAt,
          (SELECT SUM(Amount) FROM TuitionPayments WHERE TuitionID = t.TuitionID AND Status = 'Completed') AS PaidAmount
        FROM Tuition t
        INNER JOIN Users u ON t.UserID = u.UserID
        INNER JOIN Semesters s ON t.SemesterID = s.SemesterID
        WHERE t.TuitionID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học phí' });
    }
    
    // Get payment history
    const paymentsResult = await poolConnection.request()
      .input('tuitionId', sql.BigInt, parseInt(id)) // Ensure id is parsed as an integer
      .query(`
        SELECT 
          PaymentID, Amount, PaymentMethod, TransactionCode,
          PaymentDate, Status, BankReference, Notes, CreatedAt
        FROM TuitionPayments
        WHERE TuitionID = @tuitionId
        ORDER BY PaymentDate DESC
      `);
    
    const tuition = result.recordset[0];
    tuition.payments = paymentsResult.recordset;
    
    res.json({ success: true, data: tuition });
  } catch (error) {
    console.error('Error fetching tuition record:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải thông tin học phí', error: error.message });
  }
});

// Generate tuition
router.post('/tuition/generate', async (req, res) => {
  const { 
    semesterId, 
    academicYear,
    dueDate,
    studentIds,
    amountPerCredit = 850000,
    discountPercentage = 0,
    includePreviousBalance = true,
    paymentDeadline = 14,
    latePaymentFee = 5,
    notifyStudents = true
  } = req.body;
  
  if (!semesterId || !academicYear || !dueDate || !studentIds || studentIds.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Thiếu thông tin bắt buộc để tạo học phí' 
    });
  }
  
  const transaction = new sql.Transaction();
  
  try {
    const poolConnection = await getPool();
    await transaction.begin(poolConnection);
    
    // Array to store the generated tuition IDs
    const generatedTuitionIds = [];
    const errors = [];
    
    // Process each student
    for (const studentId of studentIds) {
      try {
        // Get student's registered courses and credits
        const coursesResult = await new sql.Request(transaction)
          .input('studentId', sql.BigInt, studentId)
          .input('semesterId', sql.BigInt, semesterId)
          .query(`
            SELECT 
              COALESCE(SUM(s.Credits), 0) AS TotalCredits,
              COUNT(*) AS CourseCount
            FROM CourseRegistrations cr 
            INNER JOIN CourseClasses cc ON cr.ClassID = cc.ClassID 
            INNER JOIN Subjects s ON cc.SubjectID = s.SubjectID
            WHERE cr.UserID = @studentId AND cc.SemesterID = @semesterId
          `);
        
        const { TotalCredits = 0, CourseCount = 0 } = coursesResult.recordset[0] || {};
        
        // If student has no courses, skip
        if (CourseCount === 0) {
          errors.push({
            studentId,
            message: 'Sinh viên không có môn học nào trong học kỳ này'
          });
          continue;
        }
        
        // Calculate previous balance if needed
        let previousBalance = 0;
        if (includePreviousBalance) {
          const balanceResult = await new sql.Request(transaction)
            .input('studentId', sql.BigInt, studentId)
            .input('semesterId', sql.BigInt, semesterId)
            .query(`
              WITH PaymentSums AS (
                SELECT 
                  TuitionID, 
                  SUM(Amount) AS PaidAmount
                FROM TuitionPayments 
                WHERE Status = 'Completed'
                GROUP BY TuitionID
              )
              SELECT 
                COALESCE(SUM(t.FinalAmount - COALESCE(ps.PaidAmount, 0)), 0) AS PreviousBalance
              FROM Tuition t 
              LEFT JOIN PaymentSums ps ON t.TuitionID = ps.TuitionID
              WHERE t.UserID = @studentId 
                AND t.Status IN ('Unpaid', 'Partial')
                AND t.SemesterID != @semesterId
            `);
          
          previousBalance = balanceResult.recordset[0].PreviousBalance || 0;
        }
        
        // Calculate tuition amount
        const baseTuitionAmount = TotalCredits * amountPerCredit;
        const discountAmount = discountPercentage > 0 ? (baseTuitionAmount * discountPercentage / 100) : 0;
        const finalAmount = baseTuitionAmount - discountAmount + previousBalance;
        
        // Insert tuition record
        const insertResult = await new sql.Request(transaction)
          .input('studentId', sql.BigInt, studentId)
          .input('semesterId', sql.BigInt, semesterId)
          .input('totalCredits', sql.Int, TotalCredits)
          .input('amountPerCredit', sql.Decimal(10, 2), amountPerCredit)
          .input('totalAmount', sql.Decimal(10, 2), baseTuitionAmount)
          .input('scholarshipAmount', sql.Decimal(10, 2), discountAmount)
          .input('finalAmount', sql.Decimal(10, 2), finalAmount)
          .input('dueDate', sql.Date, new Date(dueDate))
          .input('status', sql.VarChar, 'Unpaid')
          .query(`
            INSERT INTO Tuition (
              UserID, SemesterID, TotalCredits, AmountPerCredit, 
              TotalAmount, ScholarshipAmount, FinalAmount, 
              DueDate, Status, CreatedAt, UpdatedAt
            )
            VALUES (
              @studentId, @semesterId, @totalCredits, @amountPerCredit,
              @totalAmount, @scholarshipAmount, @finalAmount,
              @dueDate, @status, GETDATE(), GETDATE()
            );
            
            SELECT SCOPE_IDENTITY() AS TuitionID;
          `);
        
        const tuitionId = insertResult.recordset[0].TuitionID;
        generatedTuitionIds.push(tuitionId);
        
        // TODO: If notifyStudents is true, send notification (implement later)
      } catch (studentError) {
        console.error(`Error generating tuition for student ${studentId}:`, studentError);
        errors.push({
          studentId,
          message: 'Lỗi khi tạo học phí: ' + studentError.message
        });
      }
    }
    
    // Commit the transaction
    await transaction.commit();
    
    // Return the result
    res.json({
      success: true,
      message: `Đã tạo học phí thành công cho ${generatedTuitionIds.length} sinh viên`,
      data: {
        generatedCount: generatedTuitionIds.length,
        tuitionIds: generatedTuitionIds,
        errors: errors.length > 0 ? errors : null
      }
    });
  } catch (error) {
    // If error, rollback the transaction
    if (transaction._connected) {
      await transaction.rollback();
    }
    
    console.error('Error generating tuition:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tạo học phí', 
      error: error.message 
    });
  }
});

// Get available programs for tuition generation
router.get('/tuition/programs', async (req, res) => {
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .query(`
        SELECT 
          p.ProgramID, p.ProgramName, p.ProgramCode,
          COUNT(DISTINCT sp.UserID) AS StudentCount
        FROM AcademicPrograms p
        LEFT JOIN StudentPrograms sp ON p.ProgramID = sp.ProgramID
        WHERE p.IsActive = 1
        GROUP BY p.ProgramID, p.ProgramName, p.ProgramCode
        ORDER BY p.ProgramName
      `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching programs for tuition:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tải danh sách chương trình đào tạo', 
      error: error.message 
    });
  }
});

// Process payment
router.post('/tuition/:id/payment', (req, res) => {
  res.json({
    success: true,
    message: 'Payment processed successfully',
    data: {
      id: parseInt(req.params.id),
      status: 'Paid',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: req.body.amount || 8500000,
      paymentMethod: req.body.paymentMethod || 'Bank Transfer'
    }
  });
});

// Get tuition statistics
router.get('/statistics', (req, res) => {
  res.json({
    success: true,
    data: {
      totalTuition: 24800000,
      collectedAmount: 16300000,
      outstandingAmount: 8500000,
      paymentRate: 65.7,
      paymentMethods: [
        { name: 'Bank Transfer', value: 65 },
        { name: 'Cash', value: 35 }
      ],
      programBreakdown: [
        { program: 'Computer Science', students: 120, totalAmount: 10200000, collected: 8500000 },
        { program: 'Business Administration', students: 85, totalAmount: 7225000, collected: 5100000 },
        { program: 'Electrical Engineering', students: 65, totalAmount: 5525000, collected: 2700000 }
      ]
    }
  });
});

// Get academic programs for tuition
router.get('/programs', async (req, res) => {
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request().query(`
      SELECT 
        p.ProgramID, 
        p.ProgramCode, 
        p.ProgramName, 
        p.Department, 
        p.Faculty,
        p.TotalCredits,
        p.ProgramDuration,
        (SELECT COUNT(*) FROM StudentPrograms sp WHERE sp.ProgramID = p.ProgramID AND sp.Status = 'Active') AS StudentCount
      FROM AcademicPrograms p
      WHERE p.IsActive = 1
      ORDER BY p.ProgramName
    `);

    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching tuition programs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tải dữ liệu chương trình học', 
      error: error.message 
    });
  }
});

// Diagnostic route to check database tables
router.get('/diagnostic', async (req, res) => {
  try {
    const poolConnection = await getPool();
    
    // Check Semesters table
    const semestersResult = await poolConnection.request().query(
      'SELECT COUNT(*) as semesterCount FROM Semesters'
    );
    
    // Check AcademicPrograms table
    const programsResult = await poolConnection.request().query(
      'SELECT COUNT(*) as programCount FROM AcademicPrograms'
    );
    
    // Check Users table
    const usersResult = await poolConnection.request().query(
      `SELECT COUNT(*) as userCount FROM Users WHERE Role = 'STUDENT'`
    );
    
    // Check StudentPrograms table
    const studentProgramsResult = await poolConnection.request().query(
      'SELECT COUNT(*) as studentProgramCount FROM StudentPrograms'
    );
    
    // Return the diagnostic data
    res.json({
      success: true,
      data: {
        semesterCount: semestersResult.recordset[0].semesterCount,
        programCount: programsResult.recordset[0].programCount,
        studentCount: usersResult.recordset[0].userCount,
        studentProgramCount: studentProgramsResult.recordset[0].studentProgramCount
      }
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi chạy chuẩn đoán', 
      error: error.message 
    });
  }
});

module.exports = router; 