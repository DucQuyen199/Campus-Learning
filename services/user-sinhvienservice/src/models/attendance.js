const { sqlConnection } = require('../config/database');

// Attendance model with database queries
const AttendanceModel = {
  // Get semesters where user has attendance records
  async getSemesters(userId) {
    try {
      const pool = await sqlConnection.connect();
      const result = await pool.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT DISTINCT sem.SemesterID, sem.SemesterName, sem.AcademicYear, sem.StartDate
          FROM Attendance a
          JOIN CourseClasses cc ON a.ClassID = cc.ClassID
          JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
          WHERE a.UserID = @userId
          ORDER BY sem.StartDate DESC
        `);
      return result.recordset;
    } catch (error) {
      console.error('Error in getSemesters model:', error);
      throw new Error('Unable to retrieve semesters');
    }
  },

  // Get courses (classes) with attendance records for user (optionally by semester)
  async getCourses(userId, semesterId = null) {
    try {
      const pool = await sqlConnection.connect();
      let query = `
        SELECT DISTINCT cc.ClassID, cc.ClassCode, s.SubjectCode, s.SubjectName, cc.SemesterID
        FROM Attendance a
        JOIN CourseClasses cc ON a.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        WHERE a.UserID = @userId`;
      if (semesterId) {
        query += ` AND cc.SemesterID = @semesterId`;
      }
      query += ` ORDER BY s.SubjectName`;

      const request = pool.request()
        .input('userId', sqlConnection.sql.BigInt, userId);
      if (semesterId) {
        request.input('semesterId', sqlConnection.sql.BigInt, semesterId);
      }
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error in getCourses model:', error);
      throw new Error('Unable to retrieve courses');
    }
  },

  // Get attendance entries for user & class (optionally semester)
  async getAttendance(userId, classId, semesterId = null) {
    try {
      const pool = await sqlConnection.connect();
      let query = `
        SELECT a.AttendanceID, a.SessionDate, a.Status, a.CheckInTime, a.CheckOutTime, a.Method,
               cc.ClassID, cc.ClassCode, s.SubjectCode, s.SubjectName, cc.Room as Location
        FROM Attendance a
        JOIN CourseClasses cc ON a.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        WHERE a.UserID = @userId`;
      if (classId) {
        query += ` AND a.ClassID = @classId`;
      }
      if (semesterId) {
        query += ` AND cc.SemesterID = @semesterId`;
      }
      query += ` ORDER BY a.SessionDate`;

      const request = pool.request()
        .input('userId', sqlConnection.sql.BigInt, userId);
      if (classId) {
        request.input('classId', sqlConnection.sql.BigInt, classId);
      }
      if (semesterId) {
        request.input('semesterId', sqlConnection.sql.BigInt, semesterId);
      }
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error in getAttendance model:', error);
      throw new Error('Unable to retrieve attendance');
    }
  }
};

module.exports = AttendanceModel; 