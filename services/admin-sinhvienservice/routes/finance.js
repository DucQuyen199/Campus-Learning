/*-----------------------------------------------------------------
* File: finance.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const financeController = require('../src/controllers/financeController');
const router = express.Router();
const sql = require('mssql');
const { getPool } = require('../src/config/db');
const auth = require('../src/middleware/auth');
const { validateTuitionPayment } = require('../src/middleware/validators');

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
    // Parse pagination parameters
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    const offset = (pageInt - 1) * limitInt;
    
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
    
    // Apply pagination only if limitInt > 0 (for 'all' mode skip pagination)
    if (limitInt > 0) {
      query += ` ORDER BY t.CreatedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      request.input('offset', sql.Int, offset);
      request.input('limit', sql.Int, limitInt);
    } else {
      query += ` ORDER BY t.CreatedAt DESC`;
    }
    
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
    chargeMode = 'credit',
    amountPerCredit = 850000,
    semesterFee = 0,
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
  
  // Validate semester fee for semester mode
  if (chargeMode === 'semester' && (!semesterFee || isNaN(parseFloat(semesterFee)))) {
    return res.status(400).json({ success: false, message: 'Phí học kỳ không hợp lệ' });
  }
  
  let transaction;
  
  try {
    const poolConnection = await getPool();
    // Initialize transaction with the connection pool and start with READ_COMMITTED isolation
    transaction = new sql.Transaction(poolConnection);
    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
    
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
        
        // Determine credits to charge and base amount
        const creditsToCharge = chargeMode === 'semester' ? 0 : TotalCredits;
        const baseTuitionAmount = chargeMode === 'semester'
          ? parseFloat(semesterFee)
          : creditsToCharge * amountPerCredit;
        const discountAmount = discountPercentage > 0 ? (baseTuitionAmount * discountPercentage / 100) : 0;
        const finalAmount = baseTuitionAmount - discountAmount + previousBalance;
        
        // Insert tuition record
        const insertResult = await new sql.Request(transaction)
          .input('studentId', sql.BigInt, studentId)
          .input('semesterId', sql.BigInt, semesterId)
          .input('totalCredits', sql.Int, creditsToCharge)
          .input('amountPerCredit', sql.Decimal(10, 2), chargeMode === 'semester' ? semesterFee : amountPerCredit)
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
    // If error and transaction was initialized, rollback the transaction
    if (transaction && transaction._connected) {
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
router.get('/statistics', financeController.getTuitionStatistics);

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

// Nhận danh sách học phí của tất cả sinh viên
router.get('/tuition', auth, async (req, res) => {
  try {
    const pool = await getPool();
    const { semester, academicYear, status } = req.query;
    
    let query = `
      SELECT tp.*, u.FullName, u.Username, u.Email 
      FROM TuitionPayments tp
      JOIN Users u ON tp.UserID = u.UserID
      WHERE 1=1
    `;
    
    const params = [];
    
    if (semester) {
      query += ' AND tp.Semester = @Semester';
      params.push({ name: 'Semester', type: sql.VarChar, value: semester });
    }
    
    if (academicYear) {
      query += ' AND tp.AcademicYear = @AcademicYear';
      params.push({ name: 'AcademicYear', type: sql.VarChar, value: academicYear });
    }
    
    if (status) {
      query += ' AND tp.Status = @Status';
      params.push({ name: 'Status', type: sql.VarChar, value: status });
    }
    
    query += ' ORDER BY tp.CreatedAt DESC';
    
    const request = pool.request();
    
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching tuition payments:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu học phí', error: error.message });
  }
});

// Nhận chi tiết học phí của một sinh viên
router.get('/tuition/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { semester, academicYear } = req.query;
    
    const pool = await getPool();
    let query = `
      SELECT tp.*, u.FullName, u.Username, u.Email 
      FROM TuitionPayments tp
      JOIN Users u ON tp.UserID = u.UserID
      WHERE tp.UserID = @UserID
    `;
    
    const params = [
      { name: 'UserID', type: sql.BigInt, value: userId }
    ];
    
    if (semester) {
      query += ' AND tp.Semester = @Semester';
      params.push({ name: 'Semester', type: sql.VarChar, value: semester });
    }
    
    if (academicYear) {
      query += ' AND tp.AcademicYear = @AcademicYear';
      params.push({ name: 'AcademicYear', type: sql.VarChar, value: academicYear });
    }
    
    query += ' ORDER BY tp.CreatedAt DESC';
    
    const request = pool.request();
    
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    
    // Lấy thêm chi tiết các khóa học trong học phí
    const courseDetails = [];
    for (const payment of result.recordset) {
      if (payment.IsFullTuition === false) {
        const detailsResult = await pool.request()
          .input('PaymentID', sql.BigInt, payment.PaymentID)
          .query(`
            SELECT tcd.*, c.Title as CourseTitle, c.Slug as CourseSlug 
            FROM TuitionCourseDetails tcd
            JOIN Courses c ON tcd.CourseID = c.CourseID
            WHERE tcd.PaymentID = @PaymentID
          `);
        
        payment.CourseDetails = detailsResult.recordset;
      }
    }
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching student tuition details:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu học phí sinh viên', error: error.message });
  }
});

// Tạo mới yêu cầu thanh toán học phí
router.post('/tuition', auth, validateTuitionPayment, async (req, res) => {
  try {
    const { 
      userId, semester, academicYear, amount, dueDate, 
      isFullTuition, notes, courseDetails 
    } = req.body;
    
    const pool = await getPool();
    
    // Kiểm tra xem sinh viên đã có học phí cho học kỳ này chưa
    const checkResult = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .input('Semester', sql.VarChar, semester)
      .input('AcademicYear', sql.VarChar, academicYear)
      .input('IsFullTuition', sql.Bit, isFullTuition)
      .query(`
        SELECT COUNT(*) AS count 
        FROM TuitionPayments 
        WHERE UserID = @UserID 
        AND Semester = @Semester 
        AND AcademicYear = @AcademicYear
        AND IsFullTuition = @IsFullTuition
        AND Status <> 'CANCELLED'
      `);
    
    if (checkResult.recordset[0].count > 0) {
      return res.status(400).json({ 
        message: 'Sinh viên đã có học phí cho học kỳ này',
        type: 'DUPLICATE_TUITION'
      });
    }
    
    // Bắt đầu transaction để đảm bảo tính nhất quán dữ liệu
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Thêm học phí
      const tuitionResult = await new sql.Request(transaction)
        .input('UserID', sql.BigInt, userId)
        .input('Semester', sql.VarChar, semester)
        .input('AcademicYear', sql.VarChar, academicYear)
        .input('Amount', sql.Decimal(10, 2), amount)
        .input('Status', sql.VarChar, 'PENDING')
        .input('DueDate', sql.DateTime, new Date(dueDate))
        .input('Notes', sql.NVarChar, notes || null)
        .input('IsFullTuition', sql.Bit, isFullTuition)
        .input('InvoiceNumber', sql.VarChar, `INV-${Date.now()}`)
        .query(`
          INSERT INTO TuitionPayments (
            UserID, Semester, AcademicYear, Amount, Status,
            DueDate, Notes, IsFullTuition, InvoiceNumber
          )
          OUTPUT INSERTED.*
          VALUES (
            @UserID, @Semester, @AcademicYear, @Amount, @Status,
            @DueDate, @Notes, @IsFullTuition, @InvoiceNumber
          )
        `);
      
      const newTuition = tuitionResult.recordset[0];
      
      // Nếu là học phí khóa học lẻ, thêm chi tiết khóa học
      if (!isFullTuition && courseDetails && courseDetails.length > 0) {
        for (const course of courseDetails) {
          await new sql.Request(transaction)
            .input('PaymentID', sql.BigInt, newTuition.PaymentID)
            .input('CourseID', sql.BigInt, course.courseId)
            .input('Amount', sql.Decimal(10, 2), course.amount)
            .query(`
              INSERT INTO TuitionCourseDetails (PaymentID, CourseID, Amount)
              VALUES (@PaymentID, @CourseID, @Amount)
            `);
        }
      }
      
      await transaction.commit();
      
      res.status(201).json({ 
        message: 'Đã tạo học phí thành công', 
        tuition: newTuition 
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error creating tuition payment:', error);
    res.status(500).json({ message: 'Lỗi khi tạo học phí', error: error.message });
  }
});

// Cập nhật trạng thái học phí
router.put('/tuition/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, paymentMethod, transactionCode, notes } = req.body;
    
    const pool = await getPool();
    
    // Bắt đầu transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // Cập nhật thông tin học phí
      const updateResult = await new sql.Request(transaction)
        .input('PaymentID', sql.BigInt, paymentId)
        .input('Status', sql.VarChar, status)
        .input('PaymentMethod', sql.VarChar, paymentMethod || null)
        .input('TransactionCode', sql.VarChar, transactionCode || null)
        .input('Notes', sql.NVarChar, notes || null)
        .input('PaymentDate', sql.DateTime, status === 'PAID' ? new Date() : null)
        .input('UpdatedAt', sql.DateTime, new Date())
        .query(`
          UPDATE TuitionPayments
          SET Status = @Status,
              PaymentMethod = @PaymentMethod,
              TransactionCode = @TransactionCode,
              Notes = @Notes,
              PaymentDate = @PaymentDate,
              UpdatedAt = @UpdatedAt
          OUTPUT INSERTED.*
          WHERE PaymentID = @PaymentID
        `);
      
      if (updateResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Không tìm thấy học phí' });
      }
      
      const updatedTuition = updateResult.recordset[0];
      
      // Nếu trạng thái là "đã thanh toán", cập nhật trạng thái học phí của sinh viên
      if (status === 'PAID') {
        await new sql.Request(transaction)
          .input('UserID', sql.BigInt, updatedTuition.UserID)
          .input('TuitionStatus', sql.VarChar, 'PAID')
          .query(`
            UPDATE Users
            SET TuitionStatus = @TuitionStatus
            WHERE UserID = @UserID
          `);
      }
      
      await transaction.commit();
      
      res.json({ 
        message: 'Cập nhật học phí thành công', 
        tuition: updatedTuition 
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error updating tuition payment:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật học phí', error: error.message });
  }
});

// Kiểm tra quyền truy cập khóa học dựa trên tình trạng học phí
router.get('/check-course-access/:userId/:courseId', async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    
    const pool = await getPool();
    
    // Kiểm tra tình trạng học phí của sinh viên
    const userResult = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .query(`
        SELECT TuitionStatus FROM Users WHERE UserID = @UserID
      `);
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
    }
    
    const tuitionStatus = userResult.recordset[0].TuitionStatus;
    
    // Nếu sinh viên đã đóng học phí toàn phần, cho phép truy cập
    if (tuitionStatus === 'PAID') {
      return res.json({ 
        hasAccess: true, 
        message: 'Sinh viên đã đóng học phí toàn phần',
        requiresPayment: false
      });
    }
    
    // Kiểm tra xem sinh viên đã đóng học phí cho khóa học cụ thể này chưa
    const coursePaymentResult = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .input('CourseID', sql.BigInt, courseId)
      .query(`
        SELECT tp.* 
        FROM TuitionPayments tp
        JOIN TuitionCourseDetails tcd ON tp.PaymentID = tcd.PaymentID
        WHERE tp.UserID = @UserID 
        AND tcd.CourseID = @CourseID
        AND tp.Status = 'PAID'
        AND tp.IsFullTuition = 0
      `);
    
    if (coursePaymentResult.recordset.length > 0) {
      return res.json({ 
        hasAccess: true, 
        message: 'Sinh viên đã đóng học phí cho khóa học này',
        requiresPayment: false
      });
    }
    
    // Lấy thông tin khóa học để kiểm tra giá
    const courseResult = await pool.request()
      .input('CourseID', sql.BigInt, courseId)
      .query(`
        SELECT Title, Price FROM Courses WHERE CourseID = @CourseID
      `);
    
    if (courseResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }
    
    const course = courseResult.recordset[0];
    
    // Nếu khóa học miễn phí, cho phép truy cập
    if (course.Price === 0) {
      return res.json({ 
        hasAccess: true, 
        message: 'Khóa học này miễn phí',
        requiresPayment: false
      });
    }
    
    // Nếu không thỏa mãn các điều kiện trên, yêu cầu thanh toán
    res.json({ 
      hasAccess: false, 
      message: 'Cần thanh toán học phí để truy cập khóa học này',
      requiresPayment: true,
      course: course
    });
  } catch (error) {
    console.error('Error checking course access:', error);
    res.status(500).json({ message: 'Lỗi khi kiểm tra quyền truy cập khóa học', error: error.message });
  }
});

// Thêm API endpoint để lấy thống kê học phí
router.get('/tuition-stats', auth, async (req, res) => {
  try {
    const { academicYear } = req.query;
    
    const pool = await getPool();
    
    let query = `
      SELECT 
        COUNT(CASE WHEN Status = 'PENDING' THEN 1 END) AS pendingCount,
        COUNT(CASE WHEN Status = 'PAID' THEN 1 END) AS paidCount,
        SUM(CASE WHEN Status = 'PAID' THEN Amount ELSE 0 END) AS totalCollected,
        SUM(Amount) AS totalAmount,
        COUNT(DISTINCT UserID) AS studentCount,
        COUNT(CASE WHEN IsFullTuition = 1 THEN 1 END) AS fullTuitionCount,
        COUNT(CASE WHEN IsFullTuition = 0 THEN 1 END) AS courseTuitionCount
      FROM TuitionPayments
      WHERE 1=1
    `;
    
    const params = [];
    
    if (academicYear) {
      query += ' AND AcademicYear = @AcademicYear';
      params.push({ name: 'AcademicYear', type: sql.VarChar, value: academicYear });
    }
    
    const request = pool.request();
    
    params.forEach(param => {
      request.input(param.name, param.type, param.value);
    });
    
    const result = await request.query(query);
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching tuition statistics:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê học phí', error: error.message });
  }
});

module.exports = router; 
