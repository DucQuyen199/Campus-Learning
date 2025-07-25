/*-----------------------------------------------------------------
* File: financeController.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { executeQuery, sql } = require('../config/db');

/**
 * Get all tuition records with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllTuition = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', semesterId = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    // Build the WHERE clause based on filters
    let whereClause = '1=1';
    const params = {};
    
    if (search) {
      whereClause += ` AND (
        s.StudentCode LIKE @search 
        OR u.FullName LIKE @search
      )`;
      params.search = { type: sql.VarChar, value: `%${search}%` };
    }
    
    if (semesterId) {
      whereClause += ' AND t.SemesterID = @semesterId';
      params.semesterId = { type: sql.BigInt, value: semesterId };
    }
    
    if (status) {
      whereClause += ' AND t.Status = @status';
      params.status = { type: sql.VarChar, value: status };
    }
    
    // Add pagination parameters
    params.offset = { type: sql.Int, value: offset };
    params.limit = { type: sql.Int, value: parseInt(limit) };
    
    // Query to get tuition records
    const query = `
      SELECT 
        t.TuitionID, t.UserID, t.SemesterID, t.TotalCredits,
        t.AmountPerCredit, t.TotalAmount, t.ScholarshipAmount,
        t.FinalAmount, t.DueDate, t.Status,
        u.FullName as StudentName, s.StudentCode,
        sem.SemesterName, sem.AcademicYear,
        (SELECT ISNULL(SUM(tp.Amount), 0) FROM TuitionPayments tp WHERE tp.TuitionID = t.TuitionID AND tp.Status = 'Completed') as PaidAmount,
        (t.FinalAmount - ISNULL((SELECT SUM(tp.Amount) FROM TuitionPayments tp WHERE tp.TuitionID = t.TuitionID AND tp.Status = 'Completed'), 0)) as RemainingAmount,
        c.Class as ClassName, ap.ProgramName as ProgramName, 
        d.Faculty as FacultyName
      FROM Tuition t
      INNER JOIN Users u ON t.UserID = u.UserID
      INNER JOIN StudentDetails s ON u.UserID = s.UserID
      INNER JOIN Semesters sem ON t.SemesterID = sem.SemesterID
      LEFT JOIN StudentDetails d ON u.UserID = d.UserID
      LEFT JOIN (
        SELECT UserID, Class FROM StudentDetails
      ) c ON u.UserID = c.UserID
      LEFT JOIN (
        SELECT sp.UserID, ap.ProgramName 
        FROM StudentPrograms sp
        INNER JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
        WHERE sp.IsPrimary = 1
      ) ap ON u.UserID = ap.UserID
      WHERE ${whereClause}
      ORDER BY t.DueDate DESC, u.FullName
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    // Query to get total count
    const countQuery = `
      SELECT COUNT(*) as TotalCount
      FROM Tuition t
      INNER JOIN Users u ON t.UserID = u.UserID
      INNER JOIN StudentDetails s ON u.UserID = s.UserID
      INNER JOIN Semesters sem ON t.SemesterID = sem.SemesterID
      WHERE ${whereClause}
    `;
    
    // Execute queries
    const result = await executeQuery(query, params);
    const countResult = await executeQuery(countQuery, params);
    
    const totalCount = countResult.recordset[0].TotalCount;
    const totalPages = Math.ceil(totalCount / limit);
    
    return res.status(200).json({
      success: true,
      tuition: result.recordset,
      pagination: {
        total: totalCount,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tuition records:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách học phí.'
    });
  }
};

/**
 * Get tuition details by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTuitionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID học phí không hợp lệ.'
      });
    }
    
    // Query to get tuition details
    const query = `
      SELECT 
        t.TuitionID, t.UserID, t.SemesterID, t.TotalCredits,
        t.AmountPerCredit, t.TotalAmount, t.ScholarshipAmount,
        t.FinalAmount, t.DueDate, t.Status, t.Notes,
        u.FullName as StudentName, s.StudentCode,
        sem.SemesterName, sem.AcademicYear,
        (SELECT ISNULL(SUM(tp.Amount), 0) FROM TuitionPayments tp WHERE tp.TuitionID = t.TuitionID AND tp.Status = 'Completed') as PaidAmount,
        (t.FinalAmount - ISNULL((SELECT SUM(tp.Amount) FROM TuitionPayments tp WHERE tp.TuitionID = t.TuitionID AND tp.Status = 'Completed'), 0)) as RemainingAmount,
        c.Class as ClassName, ap.ProgramName, 
        d.Faculty as FacultyName
      FROM Tuition t
      INNER JOIN Users u ON t.UserID = u.UserID
      INNER JOIN StudentDetails s ON u.UserID = s.UserID
      INNER JOIN Semesters sem ON t.SemesterID = sem.SemesterID
      LEFT JOIN StudentDetails d ON u.UserID = d.UserID
      LEFT JOIN (
        SELECT UserID, Class FROM StudentDetails
      ) c ON u.UserID = c.UserID
      LEFT JOIN (
        SELECT sp.UserID, ap.ProgramName 
        FROM StudentPrograms sp
        INNER JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
        WHERE sp.IsPrimary = 1
      ) ap ON u.UserID = ap.UserID
      WHERE t.TuitionID = @id
    `;
    
    const result = await executeQuery(query, {
      id: { type: sql.BigInt, value: id }
    });
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin học phí.'
      });
    }
    
    const tuition = result.recordset[0];
    
    return res.status(200).json({
      success: true,
      tuition
    });
  } catch (error) {
    console.error('Error fetching tuition details:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin học phí.'
    });
  }
};

/**
 * Get payment history for a tuition record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID học phí không hợp lệ.'
      });
    }
    
    // Query to get payment history
    const query = `
      SELECT 
        tp.PaymentID, tp.TuitionID, tp.UserID, tp.Amount,
        tp.PaymentMethod, tp.TransactionCode, tp.PaymentDate,
        tp.Status, tp.BankReference, tp.Notes,
        u.FullName as ProcessedBy
      FROM TuitionPayments tp
      LEFT JOIN Users u ON tp.UserID = u.UserID
      WHERE tp.TuitionID = @id
      ORDER BY tp.PaymentDate DESC
    `;
    
    const result = await executeQuery(query, {
      id: { type: sql.BigInt, value: id }
    });
    
    return res.status(200).json({
      success: true,
      payments: result.recordset
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy lịch sử thanh toán.'
    });
  }
};

/**
 * Process a payment for a tuition record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, transactionCode, bankReference, paymentDate, notes } = req.body;
    const userId = req.user.id; // Assuming user info is in request
    
    if (!id || !amount || !paymentMethod || !paymentDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.'
      });
    }
    
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán phải lớn hơn 0.'
      });
    }
    
    // Check if tuition exists and get remaining amount
    const checkQuery = `
      SELECT 
        t.TuitionID, t.FinalAmount,
        (t.FinalAmount - ISNULL((SELECT SUM(tp.Amount) FROM TuitionPayments tp WHERE tp.TuitionID = t.TuitionID AND tp.Status = 'Completed'), 0)) as RemainingAmount,
        t.Status
      FROM Tuition t
      WHERE t.TuitionID = @id
    `;
    
    const checkResult = await executeQuery(checkQuery, {
      id: { type: sql.BigInt, value: id }
    });
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin học phí.'
      });
    }
    
    const tuition = checkResult.recordset[0];
    
    if (tuition.Status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Học phí này đã được thanh toán đầy đủ.'
      });
    }
    
    if (parseFloat(amount) > parseFloat(tuition.RemainingAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán không được vượt quá số tiền còn lại.'
      });
    }
    
    // Insert payment record
    const insertQuery = `
      INSERT INTO TuitionPayments (
        TuitionID, UserID, Amount, PaymentMethod, TransactionCode,
        PaymentDate, Status, BankReference, Notes
      )
      VALUES (
        @id, @userId, @amount, @paymentMethod, @transactionCode,
        @paymentDate, 'Completed', @bankReference, @notes
      );
      
      SELECT SCOPE_IDENTITY() as PaymentID;
    `;
    
    const paymentResult = await executeQuery(insertQuery, {
      id: { type: sql.BigInt, value: id },
      userId: { type: sql.BigInt, value: userId },
      amount: { type: sql.Decimal, value: amount },
      paymentMethod: { type: sql.VarChar, value: paymentMethod },
      transactionCode: { type: sql.VarChar, value: transactionCode || null },
      paymentDate: { type: sql.DateTime, value: new Date(paymentDate) },
      bankReference: { type: sql.VarChar, value: bankReference || null },
      notes: { type: sql.NVarChar, value: notes || null }
    });
    
    const paymentId = paymentResult.recordset[0].PaymentID;
    
    // Calculate new paid amount and update tuition status if fully paid
    const updateStatusQuery = `
      DECLARE @paidAmount DECIMAL(10,2);
      
      SELECT @paidAmount = ISNULL(SUM(Amount), 0)
      FROM TuitionPayments
      WHERE TuitionID = @id AND Status = 'Completed';
      
      UPDATE Tuition
      SET 
        Status = CASE 
          WHEN @paidAmount >= FinalAmount THEN 'paid'
          WHEN @paidAmount > 0 THEN 'partial'
          ELSE Status
        END,
        UpdatedAt = GETDATE()
      WHERE TuitionID = @id;
    `;
    
    await executeQuery(updateStatusQuery, {
      id: { type: sql.BigInt, value: id }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Thanh toán đã được xử lý thành công.',
      payment: {
        paymentId,
        amount,
        paymentMethod,
        paymentDate,
        status: 'Completed'
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý thanh toán.'
    });
  }
};

/**
 * Generate tuition invoices for students in a semester
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateSemesterInvoices = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { programId, amountPerCredit, dueDate, notes } = req.body;
    
    if (!semesterId || !amountPerCredit || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.'
      });
    }
    
    // Check if semester exists
    const semesterQuery = `
      SELECT SemesterID, SemesterName
      FROM Semesters
      WHERE SemesterID = @semesterId
    `;
    
    const semesterResult = await executeQuery(semesterQuery, {
      semesterId: { type: sql.BigInt, value: semesterId }
    });
    
    if (semesterResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin học kỳ.'
      });
    }
    
    // Build query based on filters
    let studentsQuery = `
      SELECT 
        u.UserID, 
        (SELECT COUNT(*) FROM CourseRegistrations cr 
         INNER JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
         INNER JOIN Subjects s ON cc.SubjectID = s.SubjectID
         WHERE cr.UserID = u.UserID AND cc.SemesterID = @semesterId AND cr.Status = 'Approved') as RegisteredCredits
      FROM Users u
      INNER JOIN StudentDetails sd ON u.UserID = sd.UserID
    `;
    
    const params = {
      semesterId: { type: sql.BigInt, value: semesterId },
      amountPerCredit: { type: sql.Decimal, value: amountPerCredit },
      dueDate: { type: sql.Date, value: new Date(dueDate) },
      notes: { type: sql.NVarChar, value: notes || null }
    };
    
    // Add program filter if specified
    if (programId) {
      studentsQuery += ` INNER JOIN StudentPrograms sp ON u.UserID = sp.UserID 
                        WHERE sp.ProgramID = @programId AND sp.Status = 'Active'`;
      params.programId = { type: sql.BigInt, value: programId };
    } else {
      studentsQuery += ` WHERE u.Role = 'STUDENT' AND u.AccountStatus = 'ACTIVE'`;
    }
    
    const studentsResult = await executeQuery(studentsQuery, params);
    
    if (studentsResult.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy sinh viên phù hợp để tạo hóa đơn học phí.'
      });
    }
    
    // Generate tuition invoices
    let createdCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const student of studentsResult.recordset) {
      if (!student.RegisteredCredits || student.RegisteredCredits <= 0) {
        continue; // Skip students with no registered credits
      }
      
      // Check if student already has tuition for this semester
      const checkQuery = `
        SELECT TuitionID FROM Tuition
        WHERE UserID = @userId AND SemesterID = @semesterId
      `;
      
      const checkResult = await executeQuery(checkQuery, {
        userId: { type: sql.BigInt, value: student.UserID },
        semesterId: { type: sql.BigInt, value: semesterId }
      });
      
      if (checkResult.recordset.length > 0) {
        errorCount++;
        errors.push(`UserID ${student.UserID} đã có hóa đơn học phí cho học kỳ này.`);
        continue;
      }
      
      try {
        // Calculate total amount
        const totalAmount = student.RegisteredCredits * amountPerCredit;
        
        // Get scholarship amount if any (example logic)
        const scholarshipQuery = `
          SELECT ISNULL(SUM(Amount), 0) as ScholarshipAmount
          FROM StudentAwards
          WHERE UserID = @userId AND AwardType = 'Scholarship'
          AND AwardDate BETWEEN DATEADD(MONTH, -6, GETDATE()) AND GETDATE()
        `;
        
        const scholarshipResult = await executeQuery(scholarshipQuery, {
          userId: { type: sql.BigInt, value: student.UserID }
        });
        
        const scholarshipAmount = scholarshipResult.recordset[0].ScholarshipAmount || 0;
        const finalAmount = totalAmount - scholarshipAmount;
        
        // Insert tuition record
        const insertQuery = `
          INSERT INTO Tuition (
            UserID, SemesterID, TotalCredits, AmountPerCredit,
            TotalAmount, ScholarshipAmount, FinalAmount, DueDate,
            Status, Notes, CreatedAt, UpdatedAt
          )
          VALUES (
            @userId, @semesterId, @totalCredits, @amountPerCredit,
            @totalAmount, @scholarshipAmount, @finalAmount, @dueDate,
            'unpaid', @notes, GETDATE(), GETDATE()
          )
        `;
        
        await executeQuery(insertQuery, {
          userId: { type: sql.BigInt, value: student.UserID },
          semesterId: { type: sql.BigInt, value: semesterId },
          totalCredits: { type: sql.Int, value: student.RegisteredCredits },
          amountPerCredit: { type: sql.Decimal, value: amountPerCredit },
          totalAmount: { type: sql.Decimal, value: totalAmount },
          scholarshipAmount: { type: sql.Decimal, value: scholarshipAmount },
          finalAmount: { type: sql.Decimal, value: finalAmount },
          dueDate: { type: sql.Date, value: new Date(dueDate) },
          notes: { type: sql.NVarChar, value: notes || null }
        });
        
        createdCount++;
      } catch (error) {
        console.error(`Error creating tuition for UserID ${student.UserID}:`, error);
        errorCount++;
        errors.push(`Lỗi khi tạo hóa đơn cho UserID ${student.UserID}: ${error.message}`);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Đã tạo ${createdCount} hóa đơn học phí thành công.`,
      stats: {
        totalStudents: studentsResult.recordset.length,
        createdCount,
        errorCount
      },
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Error generating tuition invoices:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo hóa đơn học phí.'
    });
  }
};

/**
 * Get tuition statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTuitionStatistics = async (req, res) => {
  try {
    const { semesterId } = req.query;
    
    let whereClause = '1=1';
    const params = {};
    
    if (semesterId) {
      whereClause += ' AND t.SemesterID = @semesterId';
      params.semesterId = { type: sql.BigInt, value: semesterId };
    }
    
    // Get overall statistics with pre-aggregated payments
    const statsQuery = `
      SELECT
        COUNT(t.TuitionID) AS TotalInvoices,
        SUM(t.FinalAmount) AS TotalAmount,
        SUM(CASE WHEN t.Status = 'paid' THEN t.FinalAmount ELSE 0 END) AS TotalPaid,
        SUM(CASE WHEN t.Status = 'unpaid' THEN t.FinalAmount ELSE 0 END) AS TotalUnpaid,
        SUM(CASE WHEN t.Status = 'partial' THEN t.FinalAmount - ISNULL(tp.PaidAmount, 0) ELSE 0 END) AS TotalPartial,
        SUM(CASE WHEN t.Status = 'overdue' THEN t.FinalAmount ELSE 0 END) AS TotalOverdue,
        SUM(CASE WHEN t.Status = 'waived' THEN t.FinalAmount ELSE 0 END) AS TotalWaived,
        AVG(t.FinalAmount) AS AverageAmount
      FROM Tuition t
      LEFT JOIN (
        SELECT TuitionID, SUM(Amount) AS PaidAmount
        FROM TuitionPayments
        WHERE Status = 'Completed'
        GROUP BY TuitionID
      ) tp ON t.TuitionID = tp.TuitionID
      WHERE ${whereClause}
    `;
    
    // Get payment method statistics
    const methodsQuery = `
      SELECT
        tp.PaymentMethod,
        COUNT(tp.PaymentID) as PaymentCount,
        SUM(tp.Amount) as TotalAmount
      FROM TuitionPayments tp
      INNER JOIN Tuition t ON tp.TuitionID = t.TuitionID
      WHERE tp.Status = 'Completed' AND ${whereClause}
      GROUP BY tp.PaymentMethod
      ORDER BY TotalAmount DESC
    `;
    
    // Get statistics by program
    const programsQuery = `
      SELECT
        ap.ProgramName,
        COUNT(t.TuitionID) as InvoiceCount,
        SUM(t.FinalAmount) as TotalAmount,
        SUM(CASE WHEN t.Status = 'paid' THEN t.FinalAmount ELSE 0 END) as PaidAmount,
        SUM(CASE WHEN t.Status != 'paid' THEN t.FinalAmount ELSE 0 END) as UnpaidAmount
      FROM Tuition t
      INNER JOIN Users u ON t.UserID = u.UserID
      INNER JOIN StudentPrograms sp ON u.UserID = sp.UserID
      INNER JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
      WHERE sp.IsPrimary = 1 AND ${whereClause}
      GROUP BY ap.ProgramName
      ORDER BY TotalAmount DESC
    `;
    
    // Execute queries
    const statsResult = await executeQuery(statsQuery, params);
    const methodsResult = await executeQuery(methodsQuery, params);
    const programsResult = await executeQuery(programsQuery, params);
    
    // Get payment timeline (last 6 months)
    const timelineQuery = `
      SELECT
        CONVERT(VARCHAR(7), tp.PaymentDate, 120) as Month,
        COUNT(tp.PaymentID) as PaymentCount,
        SUM(tp.Amount) as TotalAmount
      FROM TuitionPayments tp
      INNER JOIN Tuition t ON tp.TuitionID = t.TuitionID
      WHERE tp.Status = 'Completed' 
      AND tp.PaymentDate >= DATEADD(MONTH, -6, GETDATE())
      AND ${whereClause}
      GROUP BY CONVERT(VARCHAR(7), tp.PaymentDate, 120)
      ORDER BY Month
    `;
    
    const timelineResult = await executeQuery(timelineQuery, params);
    
    return res.status(200).json({
      success: true,
      statistics: {
        overview: statsResult.recordset[0],
        paymentMethods: methodsResult.recordset,
        programs: programsResult.recordset,
        timeline: timelineResult.recordset
      }
    });
  } catch (error) {
    console.error('Error fetching tuition statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê học phí.'
    });
  }
};

/**
 * Get payment receipt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPaymentReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'ID thanh toán không hợp lệ.'
      });
    }
    
    // Get payment details
    const query = `
      SELECT
        tp.PaymentID, tp.TuitionID, tp.UserID, tp.Amount,
        tp.PaymentMethod, tp.TransactionCode, tp.PaymentDate,
        tp.Status, tp.BankReference, tp.Notes,
        u.FullName as StudentName, ud.StudentCode,
        up.FullName as ProcessedBy,
        t.SemesterID, s.SemesterName, s.AcademicYear
      FROM TuitionPayments tp
      INNER JOIN Tuition t ON tp.TuitionID = t.TuitionID
      INNER JOIN Users u ON t.UserID = u.UserID
      INNER JOIN StudentDetails ud ON u.UserID = ud.UserID
      INNER JOIN Semesters s ON t.SemesterID = s.SemesterID
      LEFT JOIN Users up ON tp.UserID = up.UserID
      WHERE tp.PaymentID = @paymentId
    `;
    
    const result = await executeQuery(query, {
      paymentId: { type: sql.BigInt, value: paymentId }
    });
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thanh toán.'
      });
    }
    
    const payment = result.recordset[0];
    
    // Generate receipt data
    const receipt = {
      ...payment,
      receiptNumber: `RECEIPT-${payment.PaymentID}`,
      receiptDate: new Date().toISOString(),
      institutionName: 'Trường Đại học Hutech',
      institutionAddress: '123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh',
      institutionTaxCode: '0123456789',
    };
    
    return res.status(200).json({
      success: true,
      receipt
    });
  } catch (error) {
    console.error('Error generating payment receipt:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo biên lai thanh toán.'
    });
  }
};

// Export controller functions
module.exports = {
  getAllTuition,
  getTuitionById,
  getPaymentHistory,
  processPayment,
  generateSemesterInvoices,
  getTuitionStatistics,
  getPaymentReceipt
}; 
