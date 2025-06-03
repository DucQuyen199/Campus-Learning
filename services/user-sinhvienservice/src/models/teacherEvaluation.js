const { sqlConnection } = require('../config/database');

const TeacherEvaluationModel = {
  /**
   * Get classes pending teacher evaluation for a student
   */
  async getPendingEvaluations(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Find completed classes where student hasn't evaluated the teacher yet
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT 
            cc.ClassID as id,
            s.SubjectCode as courseCode,
            s.SubjectName as courseName,
            u.FullName as teacherName,
            sem.SemesterCode as semesterCode,
            sem.SemesterName as semesterName,
            sem.AcademicYear as academicYear
          FROM CourseRegistrations cr
          INNER JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
          INNER JOIN Subjects s ON cc.SubjectID = s.SubjectID
          INNER JOIN Users u ON cc.TeacherID = u.UserID
          INNER JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
          LEFT JOIN TeacherEvaluations te ON cc.ClassID = te.ClassID AND cr.UserID = te.UserID
          WHERE cr.UserID = @userId
            AND cr.Status = 'Approved'
            AND cc.Status IN ('Completed', 'Cancelled')  -- Only finished courses
            AND te.EvaluationID IS NULL  -- No evaluation exists
          ORDER BY sem.StartDate DESC, s.SubjectCode
        `);
      
      if (result.recordset.length === 0) {
        return [];
      }
      
      // Format the semester info
      return result.recordset.map(item => ({
        id: item.id,
        courseCode: item.courseCode,
        courseName: item.courseName,
        teacherName: item.teacherName,
        semester: `${item.semesterName}-${item.academicYear}`
      }));
    } catch (error) {
      console.error('Error in getPendingEvaluations model:', error);
      throw new Error('Failed to retrieve pending evaluations');
    }
  },

  /**
   * Get submitted teacher evaluations by a student
   */
  async getSubmittedEvaluations(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT 
            te.EvaluationID as id,
            s.SubjectCode as courseCode,
            s.SubjectName as courseName,
            u.FullName as teacherName,
            sem.SemesterName as semesterName,
            sem.AcademicYear as academicYear,
            FORMAT(te.SubmittedAt, 'dd/MM/yyyy') as submittedDate,
            te.OverallScore as overallScore
          FROM TeacherEvaluations te
          INNER JOIN CourseClasses cc ON te.ClassID = cc.ClassID
          INNER JOIN Subjects s ON cc.SubjectID = s.SubjectID
          INNER JOIN Users u ON cc.TeacherID = u.UserID
          INNER JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
          WHERE te.UserID = @userId
          ORDER BY te.SubmittedAt DESC
        `);
      
      if (result.recordset.length === 0) {
        return [];
      }
      
      // Format the semester info
      return result.recordset.map(item => ({
        id: item.id,
        courseCode: item.courseCode,
        courseName: item.courseName,
        teacherName: item.teacherName,
        semester: `${item.semesterName}-${item.academicYear}`,
        submittedDate: item.submittedDate,
        overallScore: parseFloat(item.overallScore) || 0
      }));
    } catch (error) {
      console.error('Error in getSubmittedEvaluations model:', error);
      throw new Error('Failed to retrieve submitted evaluations');
    }
  },

  /**
   * Submit a new teacher evaluation
   */
  async submitEvaluation(evaluationData) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // First check if teacher evaluation already exists
      const checkResult = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, evaluationData.userId)
        .input('classId', sqlConnection.sql.BigInt, evaluationData.classId)
        .query(`
          SELECT COUNT(*) as count
          FROM TeacherEvaluations
          WHERE UserID = @userId AND ClassID = @classId
        `);
      
      if (checkResult.recordset[0].count > 0) {
        throw new Error('You have already evaluated this teacher for this class');
      }
      
      // Get teacher ID from course class
      const teacherResult = await poolConnection.request()
        .input('classId', sqlConnection.sql.BigInt, evaluationData.classId)
        .query(`
          SELECT TeacherID
          FROM CourseClasses
          WHERE ClassID = @classId
        `);
        
      if (teacherResult.recordset.length === 0) {
        throw new Error('Class not found');
      }
      
      const teacherId = teacherResult.recordset[0].TeacherID;
      
      // Find semester ID
      const semesterResult = await poolConnection.request()
        .input('classId', sqlConnection.sql.BigInt, evaluationData.classId)
        .query(`
          SELECT SemesterID
          FROM CourseClasses
          WHERE ClassID = @classId
        `);
        
      if (semesterResult.recordset.length === 0) {
        throw new Error('Semester not found');
      }
      
      const semesterId = semesterResult.recordset[0].SemesterID;
      
      // Insert evaluation
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, evaluationData.userId)
        .input('teacherId', sqlConnection.sql.BigInt, teacherId)
        .input('classId', sqlConnection.sql.BigInt, evaluationData.classId)
        .input('semesterId', sqlConnection.sql.BigInt, semesterId)
        .input('teachingScore', sqlConnection.sql.Int, evaluationData.teachingScore)
        .input('contentScore', sqlConnection.sql.Int, evaluationData.contentScore)
        .input('attitudeScore', sqlConnection.sql.Int, evaluationData.attitudeScore)
        .input('overallScore', sqlConnection.sql.Int, evaluationData.overallScore)
        .input('comments', sqlConnection.sql.NVarChar, evaluationData.comments)
        .input('isAnonymous', sqlConnection.sql.Bit, evaluationData.isAnonymous)
        .query(`
          INSERT INTO TeacherEvaluations (
            UserID, TeacherID, ClassID, SemesterID, 
            TeachingScore, ContentScore, AttitudeScore, OverallScore,
            Comments, IsAnonymous, SubmittedAt
          )
          VALUES (
            @userId, @teacherId, @classId, @semesterId,
            @teachingScore, @contentScore, @attitudeScore, @overallScore,
            @comments, @isAnonymous, GETDATE()
          );
          
          SELECT SCOPE_IDENTITY() as EvaluationID;
        `);
      
      return {
        evaluationId: result.recordset[0].EvaluationID,
        userId: evaluationData.userId,
        classId: evaluationData.classId,
        submittedAt: new Date()
      };
    } catch (error) {
      console.error('Error in submitEvaluation model:', error);
      throw error;
    }
  }
};

module.exports = TeacherEvaluationModel; 