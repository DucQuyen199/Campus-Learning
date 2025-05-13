const express = require('express');
const router = express.Router();
const { sql, pool } = require('../sever');

// Get classes available for evaluation
router.get('/available-classes/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { semesterId } = req.query;
    
    let query = `
      SELECT cc.ClassID, cc.ClassCode, s.SubjectCode, s.SubjectName,
             u.UserID as TeacherID, u.FullName as TeacherName,
             sem.SemesterID, sem.SemesterName, sem.AcademicYear
      FROM CourseRegistrations cr
      JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
      JOIN Subjects s ON cc.SubjectID = s.SubjectID
      JOIN Users u ON cc.TeacherID = u.UserID
      JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
      WHERE cr.UserID = @userId
      AND cr.Status = 'Approved'
      AND NOT EXISTS (
        SELECT 1 FROM TeacherEvaluations te
        WHERE te.UserID = cr.UserID
        AND te.ClassID = cr.ClassID
        AND te.TeacherID = cc.TeacherID
      )
    `;
    
    if (semesterId) {
      query += ' AND cc.SemesterID = @semesterId';
    } else {
      query += ' AND sem.EndDate <= GETDATE()';
    }
    
    query += ' ORDER BY sem.StartDate DESC';
    
    const request = pool.request()
      .input('userId', sql.BigInt, userId);
      
    if (semesterId) {
      request.input('semesterId', sql.BigInt, semesterId);
    }
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching classes for evaluation:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get submitted evaluations
router.get('/submitted/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT te.*, u.FullName as TeacherName, s.SubjectName,
               cc.ClassCode, sem.SemesterName
        FROM TeacherEvaluations te
        JOIN Users u ON te.TeacherID = u.UserID
        JOIN CourseClasses cc ON te.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN Semesters sem ON te.SemesterID = sem.SemesterID
        WHERE te.UserID = @userId
        ORDER BY te.SubmittedAt DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching submitted evaluations:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Submit a teacher evaluation
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      teacherId,
      classId,
      semesterId,
      teachingScore,
      contentScore,
      attitudeScore,
      comments,
      isAnonymous
    } = req.body;
    
    // Calculate overall score
    const overallScore = Math.round((teachingScore + contentScore + attitudeScore) / 3);
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('teacherId', sql.BigInt, teacherId)
      .input('classId', sql.BigInt, classId)
      .input('semesterId', sql.BigInt, semesterId)
      .input('teachingScore', sql.Int, teachingScore)
      .input('contentScore', sql.Int, contentScore)
      .input('attitudeScore', sql.Int, attitudeScore)
      .input('overallScore', sql.Int, overallScore)
      .input('comments', sql.NVarChar(sql.MAX), comments)
      .input('isAnonymous', sql.Bit, isAnonymous || 1)
      .query(`
        INSERT INTO TeacherEvaluations
        (UserID, TeacherID, ClassID, SemesterID, TeachingScore, ContentScore, 
         AttitudeScore, OverallScore, Comments, IsAnonymous)
        VALUES
        (@userId, @teacherId, @classId, @semesterId, @teachingScore, @contentScore,
         @attitudeScore, @overallScore, @comments, @isAnonymous);
         
        SELECT SCOPE_IDENTITY() AS EvaluationID
      `);
    
    const evaluationId = result.recordset[0].EvaluationID;
    
    res.json({ 
      message: 'Evaluation submitted successfully',
      evaluationId 
    });
  } catch (err) {
    console.error('Error submitting evaluation:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 