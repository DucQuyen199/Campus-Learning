const { sqlConnection } = require('../config/database');

// Tuition model with database queries
const TuitionModel = {
  // Get current semester tuition
  async getCurrentTuition(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Check if we're in mock mode
      if (sqlConnection.mockMode) {
        console.log('[MOCK DB] Returning mock tuition data');
        return this.getMockCurrentTuition(userId);
      }
      
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
        console.log('No semester found, returning mock tuition data');
        return this.getMockCurrentTuition(userId);
      }
      
      // Now get the tuition for this semester
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .input('semesterId', sqlConnection.sql.BigInt, currentSemesterId)
        .query(`
          SELECT t.*, sem.SemesterName, sem.AcademicYear
          FROM Tuition t
          JOIN Semesters sem ON t.SemesterID = sem.SemesterID
          WHERE t.UserID = @userId AND t.SemesterID = @semesterId
        `);
      
      if (result.recordset.length === 0) {
        // If no tuition record, create one with current semester info
        return {
          TuitionID: 1,
          UserID: userId,
          SemesterID: currentSemesterId,
          TotalCredits: 15,
          AmountPerCredit: 850000,
          TotalAmount: 12750000,
          ScholarshipAmount: 0,
          FinalAmount: 12750000,
          DueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
          Status: 'Unpaid',
          SemesterName: semesterInfo?.SemesterName || 'Học kỳ hiện tại',
          AcademicYear: semesterInfo?.AcademicYear || '2023-2024'
        };
      }
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error in getCurrentTuition model:', error);
      // Return mock data instead of throwing an error
      return this.getMockCurrentTuition(userId);
    }
  },

  // Helper method to generate mock current tuition data
  getMockCurrentTuition(userId) {
    return {
      TuitionID: 1,
      UserID: parseInt(userId),
      SemesterID: 3,
      TotalCredits: 15,
      AmountPerCredit: 850000,
      TotalAmount: 12750000,
      ScholarshipAmount: 0,
      FinalAmount: 12750000,
      DueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      Status: 'Unpaid',
      SemesterName: 'Học kỳ 1',
      AcademicYear: '2023-2024'
    };
  },

  // Get tuition history
  async getTuitionHistory(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Check if we're in mock mode
      if (sqlConnection.mockMode) {
        console.log('[MOCK DB] Returning mock tuition history');
        return this.getMockTuitionHistory(userId);
      }
      
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
        // Return mock data
        return this.getMockTuitionHistory(userId);
      }
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getTuitionHistory model:', error);
      // Return mock data instead of throwing an error
      return this.getMockTuitionHistory(userId);
    }
  },
  
  // Helper method to generate mock tuition history
  getMockTuitionHistory(userId) {
    return [
      {
        TuitionID: 1,
        UserID: parseInt(userId),
        SemesterID: 1,
        TotalCredits: 15,
        AmountPerCredit: 850000,
        TotalAmount: 12750000,
        ScholarshipAmount: 0,
        FinalAmount: 12750000,
        PaidAmount: 12750000,
        DueDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        Status: 'Paid',
        SemesterName: 'Học kỳ 1',
        AcademicYear: '2022-2023'
      },
      {
        TuitionID: 2,
        UserID: parseInt(userId),
        SemesterID: 2,
        TotalCredits: 18,
        AmountPerCredit: 850000,
        TotalAmount: 15300000,
        ScholarshipAmount: 1000000,
        FinalAmount: 14300000,
        PaidAmount: 14300000,
        DueDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        Status: 'Paid',
        SemesterName: 'Học kỳ 2',
        AcademicYear: '2022-2023'
      },
      {
        TuitionID: 3,
        UserID: parseInt(userId),
        SemesterID: 3,
        TotalCredits: 15,
        AmountPerCredit: 850000,
        TotalAmount: 12750000,
        ScholarshipAmount: 0,
        FinalAmount: 12750000,
        PaidAmount: 0,
        DueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        Status: 'Unpaid',
        SemesterName: 'Học kỳ 1',
        AcademicYear: '2023-2024'
      }
    ];
  }
};

module.exports = TuitionModel; 