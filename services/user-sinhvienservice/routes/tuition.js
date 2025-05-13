const express = require('express');
const router = express.Router();
const { sql, pool } = require('../sever');

// Get student's current semester tuition
router.get('/current/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching current tuition for user ID: ${userId}`);

    // Kết nối đến cơ sở dữ liệu
    const pool = await sqlConnection.connect();

    // Kiểm tra xem userId có tồn tại không
    const userResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT * FROM Users WHERE UserID = @userId
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin sinh viên'
      });
    }

    // Truy vấn học phí hiện tại từ bảng Tuition
    const tuitionResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT TOP 1 t.*, s.SemesterName, s.AcademicYear 
        FROM Tuition t
        JOIN Semesters s ON t.SemesterID = s.SemesterID
        WHERE t.UserID = @userId
        ORDER BY t.DueDate DESC
      `);

    // Nếu không tìm thấy dữ liệu học phí, trả về mẫu dữ liệu giả định
    if (tuitionResult.recordset.length === 0) {
      const currentDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(currentDate.getDate() + 30);

      return res.json({
        TuitionID: 1,
        UserID: parseInt(userId),
        SemesterID: 1,
        SemesterName: 'Học kỳ 1',
        AcademicYear: '2023-2024',
        TotalCredits: 15,
        AmountPerCredit: 850000,
        TotalAmount: 12750000,
        ScholarshipAmount: 0,
        FinalAmount: 12750000,
        DueDate: dueDate.toISOString(),
        Status: 'Unpaid',
        CreatedAt: currentDate.toISOString(),
        UpdatedAt: currentDate.toISOString()
      });
    }

    // Trả về dữ liệu học phí
    res.json(tuitionResult.recordset[0]);
  } catch (err) {
    console.error('Error in tuition info:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin học phí',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get student's tuition history
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Kết nối đến cơ sở dữ liệu
    const pool = await sqlConnection.connect();
    
    // Lấy lịch sử học phí
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT t.*, s.SemesterName, s.AcademicYear,
               (SELECT COUNT(*) FROM TuitionPayments WHERE TuitionID = t.TuitionID) AS PaymentCount
        FROM Tuition t
        JOIN Semesters s ON t.SemesterID = s.SemesterID
        WHERE t.UserID = @userId
        ORDER BY t.CreatedAt DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching tuition history:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử học phí',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get payment history
router.get('/payments/:tuitionId', async (req, res) => {
  try {
    const tuitionId = req.params.tuitionId;
    
    // Kết nối đến cơ sở dữ liệu
    const pool = await sqlConnection.connect();
    
    // Lấy thông tin thanh toán
    const result = await pool.request()
      .input('tuitionId', sql.BigInt, tuitionId)
      .query(`
        SELECT * FROM TuitionPayments
        WHERE TuitionID = @tuitionId
        ORDER BY PaymentDate DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching tuition payments:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin thanh toán học phí',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Make a payment
router.post('/payment', async (req, res) => {
  try {
    const {
      userId,
      tuitionId,
      amount,
      paymentMethod,
      transactionCode,
      bankReference,
      notes
    } = req.body;
    
    // Validate payment amount
    const tuitionResult = await pool.request()
      .input('tuitionId', sql.BigInt, tuitionId)
      .query(`
        SELECT FinalAmount, Status
        FROM Tuition
        WHERE TuitionID = @tuitionId
      `);
    
    if (tuitionResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Tuition record not found' });
    }
    
    const { FinalAmount, Status } = tuitionResult.recordset[0];
    
    if (Status === 'Paid') {
      return res.status(400).json({ message: 'Tuition has already been paid in full' });
    }
    
    // Begin transaction
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Insert payment record
      const paymentResult = await transaction.request()
        .input('tuitionId', sql.BigInt, tuitionId)
        .input('userId', sql.BigInt, userId)
        .input('amount', sql.Decimal(10, 2), amount)
        .input('paymentMethod', sql.VarChar(50), paymentMethod)
        .input('transactionCode', sql.VarChar(100), transactionCode)
        .input('bankReference', sql.VarChar(100), bankReference)
        .input('notes', sql.NVarChar(255), notes)
        .query(`
          INSERT INTO TuitionPayments
          (TuitionID, UserID, Amount, PaymentMethod, TransactionCode, PaymentDate, Status, BankReference, Notes)
          VALUES
          (@tuitionId, @userId, @amount, @paymentMethod, @transactionCode, GETDATE(), 'Completed', @bankReference, @notes);
          
          SELECT SCOPE_IDENTITY() AS PaymentID
        `);
      
      const paymentId = paymentResult.recordset[0].PaymentID;
      
      // Update tuition status
      const paymentsResult = await transaction.request()
        .input('tuitionId', sql.BigInt, tuitionId)
        .query(`
          SELECT SUM(Amount) AS TotalPaid
          FROM TuitionPayments
          WHERE TuitionID = @tuitionId AND Status = 'Completed'
        `);
      
      const totalPaid = paymentsResult.recordset[0].TotalPaid || 0;
      
      let newStatus = 'Unpaid';
      if (totalPaid >= FinalAmount) {
        newStatus = 'Paid';
      } else if (totalPaid > 0) {
        newStatus = 'Partial';
      }
      
      await transaction.request()
        .input('tuitionId', sql.BigInt, tuitionId)
        .input('status', sql.VarChar(20), newStatus)
        .query(`
          UPDATE Tuition
          SET Status = @status, UpdatedAt = GETDATE()
          WHERE TuitionID = @tuitionId
        `);
      
      await transaction.commit();
      
      res.json({ 
        message: 'Payment successful',
        paymentId,
        status: newStatus 
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 