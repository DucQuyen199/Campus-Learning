const { sqlConnection } = require('../config/database');

const ExamScheduleModel = {
  /**
   * Get all semesters that have exams
   */
  async getExamSemesters() {
    try {
      const poolConnection = await sqlConnection.connect();
      
      const result = await poolConnection.request()
        .query(`
          SELECT DISTINCT s.SemesterID, s.SemesterCode, s.SemesterName, s.AcademicYear, s.IsCurrent
          FROM Semesters s
          INNER JOIN Exams e ON e.SemesterID = s.SemesterID
          ORDER BY s.StartDate DESC
        `);
      
      if (result.recordset.length === 0) {
        return [];
      }
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getExamSemesters model:', error);
      throw new Error('Failed to retrieve exam semesters');
    }
  },

  /**
   * Get current semester exam schedule for a student
   */
  async getCurrentExamSchedule(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // First get the current semester
      const currentSemesterResult = await poolConnection.request()
        .query(`
          SELECT TOP 1 SemesterID, SemesterName, AcademicYear, StartDate, EndDate
          FROM Semesters
          WHERE IsCurrent = 1
          ORDER BY StartDate DESC
        `);
      
      let currentSemester = null;
      
      if (currentSemesterResult.recordset.length > 0) {
        currentSemester = currentSemesterResult.recordset[0];
      } else {
        // If no current semester, get the most recent one
        const recentSemesterResult = await poolConnection.request()
          .query(`
            SELECT TOP 1 SemesterID, SemesterName, AcademicYear, StartDate, EndDate 
            FROM Semesters
            ORDER BY StartDate DESC
          `);
        
        if (recentSemesterResult.recordset.length > 0) {
          currentSemester = recentSemesterResult.recordset[0];
        } else {
          throw new Error('No semester found in the database');
        }
      }
      
      // Get exams for this student in the current semester
      return await this.getSemesterExamSchedule(userId, currentSemester.SemesterID);
    } catch (error) {
      console.error('Error in getCurrentExamSchedule model:', error);
      throw new Error('Failed to retrieve current exam schedule');
    }
  },

  /**
   * Get exam schedule for a specific semester
   */
  async getSemesterExamSchedule(userId, semesterId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Get semester info
      const semesterResult = await poolConnection.request()
        .input('semesterId', sqlConnection.sql.BigInt, semesterId)
        .query(`
          SELECT SemesterID, SemesterCode, SemesterName, AcademicYear, StartDate, EndDate
          FROM Semesters
          WHERE SemesterID = @semesterId
        `);
      
      if (semesterResult.recordset.length === 0) {
        throw new Error('Semester not found');
      }
      
      const semesterInfo = semesterResult.recordset[0];
      
      // Get exams for this student in the specified semester
      const examResult = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .input('semesterId', sqlConnection.sql.BigInt, semesterId)
        .query(`
          SELECT 
            e.ExamID, 
            e.ExamName,
            e.ExamType,
            e.ExamDate,
            CONVERT(VARCHAR(5), e.StartTime, 108) AS StartTime,
            CONVERT(VARCHAR(5), e.EndTime, 108) AS EndTime,
            e.Location AS ExamRoom,
            s.SubjectCode AS CourseCode,
            s.SubjectName AS CourseName,
            cr.SeatNumber,
            cc.ClassCode
          FROM Exams e
          INNER JOIN CourseClasses cc ON e.ClassID = cc.ClassID
          INNER JOIN Subjects s ON cc.SubjectID = s.SubjectID
          INNER JOIN CourseRegistrations cr ON cc.ClassID = cr.ClassID
          WHERE e.SemesterID = @semesterId
          AND cr.UserID = @userId
          AND cr.Status = 'Approved'
          ORDER BY e.ExamDate, e.StartTime
        `);
      
      // Format the response
      const examSchedule = {
        semester: {
          id: semesterInfo.SemesterID,
          code: semesterInfo.SemesterCode,
          name: semesterInfo.SemesterName,
          academicYear: semesterInfo.AcademicYear,
          examPeriod: {
            start: this.formatDate(semesterInfo.StartDate),
            end: this.formatDate(semesterInfo.EndDate)
          }
        },
        exams: examResult.recordset.map(exam => ({
          id: exam.ExamID,
          courseCode: exam.CourseCode,
          courseName: exam.CourseName,
          examDate: this.formatDate(exam.ExamDate),
          examTime: `${exam.StartTime} - ${exam.EndTime}`,
          examRoom: exam.ExamRoom,
          examType: exam.ExamType,
          seatNumber: exam.SeatNumber || 'N/A',
          classCode: exam.ClassCode
        }))
      };
      
      return examSchedule;
    } catch (error) {
      console.error('Error in getSemesterExamSchedule model:', error);
      throw new Error('Failed to retrieve exam schedule for the specified semester');
    }
  },
  
  /**
   * Format a date as DD/MM/YYYY
   */
  formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }
};

module.exports = ExamScheduleModel; 