const express = require('express');
const router = express.Router();
const { sql, pool } = require('../sever');

// Get available semesters for registration
router.get('/semesters', async (req, res) => {
  try {
    const result = await pool.request()
      .query(`
        SELECT * FROM Semesters
        WHERE RegistrationStartDate <= GETDATE() 
        AND RegistrationEndDate >= GETDATE()
        AND Status IN ('Upcoming', 'Ongoing')
        ORDER BY StartDate
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching available semesters:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get available courses for registration
router.get('/courses/:semesterId', async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { type } = req.query; // Regular, Retake, Improvement
    
    let query = `
      SELECT cc.*, s.SubjectCode, s.SubjectName, s.Credits, 
             u.FullName as TeacherName, cc.CurrentStudents as Enrolled,
             cc.MaxStudents as Capacity
      FROM CourseClasses cc
      JOIN Subjects s ON cc.SubjectID = s.SubjectID
      LEFT JOIN Users u ON cc.TeacherID = u.UserID
      WHERE cc.SemesterID = @semesterId AND cc.Status = 'Registration'
    `;
    
    if (type) {
      query += ' AND cc.Type = @type';
    }
    
    query += ' ORDER BY s.SubjectName';
    
    const request = pool.request()
      .input('semesterId', sql.BigInt, semesterId);
      
    if (type) {
      request.input('type', sql.VarChar(20), type);
    }
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching available courses:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get student's registered courses
router.get('/registered/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { semesterId } = req.query;
    
    let query = `
      SELECT cr.*, cc.ClassCode, s.SubjectCode, s.SubjectName, s.Credits,
             u.FullName as TeacherName, cc.Schedule, cc.Location,
             sem.SemesterName, sem.AcademicYear, cc.Type
      FROM CourseRegistrations cr
      JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
      JOIN Subjects s ON cc.SubjectID = s.SubjectID
      JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
      LEFT JOIN Users u ON cc.TeacherID = u.UserID
      WHERE cr.UserID = @userId
    `;
    
    if (semesterId) {
      query += ' AND cc.SemesterID = @semesterId';
    }
    
    query += ' ORDER BY cr.RegistrationTime DESC';
    
    const request = pool.request()
      .input('userId', sql.BigInt, userId);
      
    if (semesterId) {
      request.input('semesterId', sql.BigInt, semesterId);
    }
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching registered courses:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Register for a course
router.post('/course', async (req, res) => {
  try {
    const { userId, classId, registrationType } = req.body;
    
    // Check if already registered
    const checkResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('classId', sql.BigInt, classId)
      .query(`
        SELECT * FROM CourseRegistrations 
        WHERE UserID = @userId AND ClassID = @classId
      `);
    
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Already registered for this course' });
    }
    
    // Check class capacity
    const classResult = await pool.request()
      .input('classId', sql.BigInt, classId)
      .query(`
        SELECT CurrentStudents, MaxStudents 
        FROM CourseClasses 
        WHERE ClassID = @classId
      `);
    
    if (classResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    const { CurrentStudents, MaxStudents } = classResult.recordset[0];
    
    if (CurrentStudents >= MaxStudents) {
      return res.status(400).json({ message: 'Class is full' });
    }
    
    // Begin transaction
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();
      
      // Insert registration
      await transaction.request()
        .input('userId', sql.BigInt, userId)
        .input('classId', sql.BigInt, classId)
        .input('registrationType', sql.VarChar(20), registrationType || 'Regular')
        .query(`
          INSERT INTO CourseRegistrations 
          (UserID, ClassID, RegistrationType, Status)
          VALUES (@userId, @classId, @registrationType, 'Pending')
        `);
      
      // Update class capacity
      await transaction.request()
        .input('classId', sql.BigInt, classId)
        .query(`
          UPDATE CourseClasses
          SET CurrentStudents = CurrentStudents + 1
          WHERE ClassID = @classId
        `);
      
      await transaction.commit();
      res.json({ message: 'Course registration successful' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error registering for course:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Cancel course registration
router.delete('/course/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason } = req.body;
    
    // Begin transaction
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Get class ID for updating capacity
      const regResult = await transaction.request()
        .input('registrationId', sql.BigInt, registrationId)
        .query(`
          SELECT ClassID FROM CourseRegistrations
          WHERE RegistrationID = @registrationId
        `);
      
      if (regResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Registration not found' });
      }
      
      const { ClassID } = regResult.recordset[0];
      
      // Update registration status
      await transaction.request()
        .input('registrationId', sql.BigInt, registrationId)
        .input('reason', sql.NVarChar(255), reason)
        .query(`
          UPDATE CourseRegistrations
          SET Status = 'Cancelled',
              CancellationReason = @reason,
              CancelledAt = GETDATE(),
              UpdatedAt = GETDATE()
          WHERE RegistrationID = @registrationId
        `);
      
      // Update class capacity
      await transaction.request()
        .input('classId', sql.BigInt, ClassID)
        .query(`
          UPDATE CourseClasses
          SET CurrentStudents = CurrentStudents - 1
          WHERE ClassID = @classId
        `);
      
      await transaction.commit();
      res.json({ message: 'Registration cancelled successfully' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error cancelling registration:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Register for graduation
router.post('/graduation', async (req, res) => {
  try {
    const {
      userId, semesterId, expectedGraduationDate, totalCredits,
      averageGPA, hasThesis, thesisTitle, thesisSupervisorId,
      engCertificate, itCertificate
    } = req.body;
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('semesterId', sql.BigInt, semesterId)
      .input('expectedGraduationDate', sql.Date, expectedGraduationDate)
      .input('totalCredits', sql.Int, totalCredits)
      .input('averageGPA', sql.Decimal(5, 2), averageGPA)
      .input('hasThesis', sql.Bit, hasThesis || 0)
      .input('thesisTitle', sql.NVarChar(200), thesisTitle)
      .input('thesisSupervisorId', sql.BigInt, thesisSupervisorId)
      .input('engCertificate', sql.NVarChar(100), engCertificate)
      .input('itCertificate', sql.NVarChar(100), itCertificate)
      .query(`
        INSERT INTO GraduationRegistrations
        (UserID, SemesterID, ExpectedGraduationDate, TotalCredits, AverageGPA,
         HasThesis, ThesisTitle, ThesisSupervisorID, EngCertificate, ItCertificate)
        VALUES
        (@userId, @semesterId, @expectedGraduationDate, @totalCredits, @averageGPA,
         @hasThesis, @thesisTitle, @thesisSupervisorId, @engCertificate, @itCertificate)
      `);
    
    res.json({ message: 'Graduation registration submitted successfully' });
  } catch (err) {
    console.error('Error registering for graduation:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Register for second major
router.post('/second-major', async (req, res) => {
  try {
    const {
      userId, programId, currentGPA, completedCredits,
      reason, startSemesterId
    } = req.body;
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('programId', sql.BigInt, programId)
      .input('currentGPA', sql.Decimal(5, 2), currentGPA)
      .input('completedCredits', sql.Int, completedCredits)
      .input('reason', sql.NVarChar(sql.MAX), reason)
      .input('startSemesterId', sql.BigInt, startSemesterId)
      .query(`
        INSERT INTO SecondMajorRegistrations
        (UserID, ProgramID, CurrentGPA, CompletedCredits, Reason, StartSemesterID)
        VALUES
        (@userId, @programId, @currentGPA, @completedCredits, @reason, @startSemesterId)
      `);
    
    res.json({ message: 'Second major registration submitted successfully' });
  } catch (err) {
    console.error('Error registering for second major:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Register for exam improvement
router.post('/exam', async (req, res) => {
  try {
    const { userId, examId } = req.body;
    
    // Check if already registered
    const checkResult = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('examId', sql.BigInt, examId)
      .query(`
        SELECT * FROM ExamRegistrations 
        WHERE UserID = @userId AND ExamID = @examId
      `);
    
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Already registered for this exam' });
    }
    
    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('examId', sql.BigInt, examId)
      .query(`
        INSERT INTO ExamRegistrations
        (UserID, ExamID)
        VALUES (@userId, @examId)
      `);
    
    res.json({ message: 'Exam registration successful' });
  } catch (err) {
    console.error('Error registering for exam:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 