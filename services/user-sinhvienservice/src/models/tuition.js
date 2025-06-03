const { sqlConnection } = require('../config/database');

// Tuition model with database queries
const TuitionModel = {
  // Get current semester tuition
  async getCurrentTuition(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // First get the current semester
      const currentSemesterResult = await poolConnection.request()
        .query(`
          SELECT TOP 1 SemesterID, SemesterName, AcademicYear
          FROM Semesters
          WHERE IsCurrent = 1
        `);
      
      let currentSemesterId = null;
      let semesterInfo = null;
      
      if (currentSemesterResult.recordset.length > 0) {
        currentSemesterId = currentSemesterResult.recordset[0].SemesterID;
        semesterInfo = currentSemesterResult.recordset[0];
      } else {
        // If no current semester, get the most recent one
        const recentSemesterResult = await poolConnection.request()
          .query(`
            SELECT TOP 1 SemesterID, SemesterName, AcademicYear
            FROM Semesters
            ORDER BY StartDate DESC
          `);
        
        if (recentSemesterResult.recordset.length > 0) {
          currentSemesterId = recentSemesterResult.recordset[0].SemesterID;
          semesterInfo = recentSemesterResult.recordset[0];
        }
      }
      
      if (!currentSemesterId) {
        throw new Error('No semester found in the database');
      }
      
      // Now get tuition for this user and semester
      const tuitionResult = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .input('semesterId', sqlConnection.sql.BigInt, currentSemesterId)
        .query(`
          SELECT t.*, s.SemesterName, s.AcademicYear
          FROM Tuition t
          JOIN Semesters s ON t.SemesterID = s.SemesterID
          WHERE t.UserID = @userId AND t.SemesterID = @semesterId
        `);
      
      if (tuitionResult.recordset.length === 0) {
        throw new Error('No tuition data found for this semester');
      }
      
      // Get tuition detail items
      const tuitionItems = await this.getTuitionItems(tuitionResult.recordset[0].TuitionID);
      
      // Get paid amount
      const paidAmount = await this.getPaidAmount(tuitionResult.recordset[0].TuitionID);
      
      // Get payment history
      const payments = await this.getTuitionPayments(tuitionResult.recordset[0].TuitionID);
      
      return {
        ...tuitionResult.recordset[0],
        items: tuitionItems,
        paid: paidAmount,
        remaining: tuitionResult.recordset[0].FinalAmount - paidAmount,
        payments: payments
      };
    } catch (error) {
      console.error('Error in getCurrentTuition model:', error);
      throw new Error('Unable to retrieve current tuition from database');
    }
  },

  // Get tuition history
  async getTuitionHistory(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT t.*, sem.SemesterName, sem.AcademicYear,
                 ISNULL((SELECT SUM(Amount) FROM TuitionPayments WHERE TuitionID = t.TuitionID), 0) as PaidAmount
          FROM Tuition t
          JOIN Semesters sem ON t.SemesterID = sem.SemesterID
          WHERE t.UserID = @userId
          ORDER BY sem.StartDate DESC
        `);
      
      if (result.recordset.length === 0) {
        throw new Error('No tuition history found');
      }
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getTuitionHistory model:', error);
      throw new Error('Unable to retrieve tuition history from database');
    }
  },
  
  // Get payments for a specific tuition
  async getTuitionPayments(tuitionId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      const result = await poolConnection.request()
        .input('tuitionId', sqlConnection.sql.BigInt, tuitionId)
        .query(`
          SELECT tp.*, u.FullName as ProcessedByName
          FROM TuitionPayments tp
          LEFT JOIN Users u ON tp.ProcessedBy = u.UserID
          WHERE tp.TuitionID = @tuitionId
          ORDER BY tp.PaymentDate DESC
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getTuitionPayments model:', error);
      throw new Error('Unable to retrieve tuition payments from database');
    }
  },
  
  // Get paid amount for a tuition
  async getPaidAmount(tuitionId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      const result = await poolConnection.request()
        .input('tuitionId', sqlConnection.sql.BigInt, tuitionId)
        .query(`
          SELECT ISNULL(SUM(Amount), 0) as PaidAmount
          FROM TuitionPayments
          WHERE TuitionID = @tuitionId AND Status = 'Completed'
        `);
      
      return result.recordset[0].PaidAmount;
    } catch (error) {
      console.error('Error in getPaidAmount model:', error);
      return 0;
    }
  },
  
  // Get tuition details/items
  async getTuitionItems(tuitionId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Try to get items from TuitionCourseDetails if available
      const result = await poolConnection.request()
        .input('tuitionId', sqlConnection.sql.BigInt, tuitionId)
        .query(`
          IF OBJECT_ID('TuitionCourseDetails', 'U') IS NOT NULL
          BEGIN
            SELECT tcd.DetailID as id, c.Title as name, tcd.Amount as amount
            FROM TuitionCourseDetails tcd
            JOIN Courses c ON tcd.CourseID = c.CourseID
            WHERE tcd.PaymentID IN (SELECT PaymentID FROM TuitionPayments WHERE TuitionID = @tuitionId)
          END
          ELSE
          BEGIN
            -- If no detailed breakdown exists, create generic items
            SELECT 1 as id, 'Tuition Fee' as name, 
                  (SELECT TotalAmount * 0.8 FROM Tuition WHERE TuitionID = @tuitionId) as amount
            UNION
            SELECT 2 as id, 'Student Services Fee' as name, 
                  (SELECT TotalAmount * 0.15 FROM Tuition WHERE TuitionID = @tuitionId) as amount
            UNION
            SELECT 3 as id, 'Facility Fee' as name, 
                  (SELECT TotalAmount * 0.05 FROM Tuition WHERE TuitionID = @tuitionId) as amount
          END
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getTuitionItems model:', error);
      
      // Return generic items as fallback
      const tuition = await poolConnection.request()
        .input('tuitionId', sqlConnection.sql.BigInt, tuitionId)
        .query('SELECT TotalAmount FROM Tuition WHERE TuitionID = @tuitionId');
      
      if (tuition.recordset.length === 0) return [];
      
      const totalAmount = tuition.recordset[0].TotalAmount;
      return [
        { id: 1, name: 'Tuition Fee', amount: totalAmount * 0.8 },
        { id: 2, name: 'Student Services Fee', amount: totalAmount * 0.15 },
        { id: 3, name: 'Facility Fee', amount: totalAmount * 0.05 }
      ];
    }
  },
  
  // Make a tuition payment
  async makePayment(tuitionId, userId, amount, paymentMethod, transactionCode = null) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // First check if tuition exists and get remaining amount
      const tuitionResult = await poolConnection.request()
        .input('tuitionId', sqlConnection.sql.BigInt, tuitionId)
        .query(`
          SELECT TuitionID, FinalAmount, 
                 (SELECT ISNULL(SUM(Amount), 0) FROM TuitionPayments 
                  WHERE TuitionID = Tuition.TuitionID AND Status = 'Completed') as PaidAmount
          FROM Tuition
          WHERE TuitionID = @tuitionId
        `);
      
      if (tuitionResult.recordset.length === 0) {
        throw new Error('Tuition record not found');
      }
      
      const tuition = tuitionResult.recordset[0];
      const remainingAmount = tuition.FinalAmount - tuition.PaidAmount;
      
      if (amount > remainingAmount) {
        throw new Error('Payment amount exceeds remaining tuition amount');
      }
      
      // Create payment record
      const paymentResult = await poolConnection.request()
        .input('tuitionId', sqlConnection.sql.BigInt, tuitionId)
        .input('userId', sqlConnection.sql.BigInt, userId)
        .input('amount', sqlConnection.sql.Decimal(10, 2), amount)
        .input('paymentMethod', sqlConnection.sql.VarChar(50), paymentMethod)
        .input('transactionCode', sqlConnection.sql.VarChar(100), transactionCode)
        .query(`
          INSERT INTO TuitionPayments (
            TuitionID,
            UserID,
            Amount,
            PaymentMethod,
            TransactionCode,
            PaymentDate,
            Status,
            CreatedAt,
            UpdatedAt
          )
          VALUES (
            @tuitionId,
            @userId,
            @amount,
            @paymentMethod,
            @transactionCode,
            GETDATE(),
            'Completed',
            GETDATE(),
            GETDATE()
          );
          
          SELECT SCOPE_IDENTITY() as PaymentID;
        `);
      
      const paymentId = paymentResult.recordset[0].PaymentID;
      
      // Update tuition status if fully paid
      if (amount >= remainingAmount) {
        await poolConnection.request()
          .input('tuitionId', sqlConnection.sql.BigInt, tuitionId)
          .query(`
            UPDATE Tuition
            SET Status = 'Paid', UpdatedAt = GETDATE()
            WHERE TuitionID = @tuitionId
          `);
      } else if (tuition.PaidAmount === 0 && amount > 0) {
        await poolConnection.request()
          .input('tuitionId', sqlConnection.sql.BigInt, tuitionId)
          .query(`
            UPDATE Tuition
            SET Status = 'Partial', UpdatedAt = GETDATE()
            WHERE TuitionID = @tuitionId
          `);
      }
      
      // Get the created payment details
      const payment = await poolConnection.request()
        .input('paymentId', sqlConnection.sql.BigInt, paymentId)
        .query(`
          SELECT tp.*, u.FullName as ProcessedByName
          FROM TuitionPayments tp
          LEFT JOIN Users u ON tp.ProcessedBy = u.UserID
          WHERE tp.PaymentID = @paymentId
        `);
      
      return payment.recordset[0];
    } catch (error) {
      console.error('Error in makePayment model:', error);
      throw error;
    }
  },
  
  // Get tuition details by ID
  async getTuitionById(tuitionId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      const tuitionResult = await poolConnection.request()
        .input('tuitionId', sqlConnection.sql.BigInt, tuitionId)
        .query(`
          SELECT t.*, s.SemesterName, s.AcademicYear, u.FullName as StudentName, u.StudentCode
          FROM Tuition t
          JOIN Semesters s ON t.SemesterID = s.SemesterID
          JOIN Users u ON t.UserID = u.UserID
          LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
          WHERE t.TuitionID = @tuitionId
        `);
      
      if (tuitionResult.recordset.length === 0) {
        throw new Error('Tuition not found');
      }
      
      // Get tuition detail items
      const tuitionItems = await this.getTuitionItems(tuitionId);
      
      // Get paid amount
      const paidAmount = await this.getPaidAmount(tuitionId);
      
      return {
        ...tuitionResult.recordset[0],
        items: tuitionItems,
        paid: paidAmount,
        remaining: tuitionResult.recordset[0].FinalAmount - paidAmount
      };
    } catch (error) {
      console.error('Error in getTuitionById model:', error);
      throw error;
    }
  }
};

module.exports = TuitionModel; 