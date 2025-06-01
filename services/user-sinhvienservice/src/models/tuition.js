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
      
      return tuitionResult.recordset[0];
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
  }
};

module.exports = TuitionModel; 