/*-----------------------------------------------------------------
* File: academic.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the student admin backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getPool } = require('../src/config/db');

// Programs routes
router.get('/programs', async (req, res) => {
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .query(`
        SELECT p.ProgramID as id, p.ProgramCode as code, p.ProgramName as name, 
               p.Department as department, 
               CASE WHEN p.IsActive = 1 THEN 'Active' ELSE 'Inactive' END as status,
               (SELECT COUNT(*) FROM StudentPrograms sp WHERE sp.ProgramID = p.ProgramID) as students
        FROM AcademicPrograms p
      `);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ success: false, message: 'Error fetching programs', error: error.message });
  }
});

router.get('/programs/:id', async (req, res) => {
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .input('id', sql.BigInt, req.params.id)
      .query(`
        SELECT p.ProgramID as id, p.ProgramCode as code, p.ProgramName as name,
               p.Department as department,
               CASE WHEN p.IsActive = 1 THEN 'Active' ELSE 'Inactive' END as status,
               (SELECT COUNT(*) FROM StudentPrograms sp WHERE sp.ProgramID = p.ProgramID) as students,
               p.Faculty as faculty, p.Description as description,
               p.TotalCredits as totalCredits, p.ProgramDuration as duration,
               p.DegreeName as degree, p.ProgramType as type
        FROM AcademicPrograms p
        WHERE p.ProgramID = @id
      `);
    
    if (result.recordset.length === 0) {
    return res.status(404).json({ success: false, message: 'Program not found' });
  }
    
    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({ success: false, message: 'Error fetching program', error: error.message });
  }
});

router.post('/programs', async (req, res) => {
  const { code, name, department, faculty, description, totalCredits, duration, degree, type, status = 'Active' } = req.body;
  
  if (!code || !name) {
    return res.status(400).json({ success: false, message: 'Code and name are required' });
  }
  
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .input('code', sql.NVarChar, code)
      .input('name', sql.NVarChar, name)
      .input('department', sql.NVarChar, department || null)
      .input('faculty', sql.NVarChar, faculty || null)
      .input('description', sql.NVarChar, description || null)
      .input('totalCredits', sql.Int, totalCredits || null)
      .input('duration', sql.Int, duration || null)
      .input('degree', sql.NVarChar, degree || null)
      .input('type', sql.NVarChar, type || null)
      .input('isActive', sql.Bit, status === 'Active' ? 1 : 0)
      .query(`
        INSERT INTO AcademicPrograms (
          ProgramCode, ProgramName, Department, Faculty, Description,
          TotalCredits, ProgramDuration, DegreeName, ProgramType, IsActive,
          CreatedAt, UpdatedAt
        )
        VALUES (
          @code, @name, @department, @faculty, @description,
          @totalCredits, @duration, @degree, @type, @isActive,
          GETDATE(), GETDATE()
        );
        
        SELECT SCOPE_IDENTITY() AS id;
      `);
    
    const id = result.recordset[0].id;
    
    res.status(201).json({ 
      success: true, 
      data: { 
        id, code, name, department, faculty, description,
        totalCredits, duration, degree, type, status
      } 
    });
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({ success: false, message: 'Error creating program', error: error.message });
  }
});

router.put('/programs/:id', async (req, res) => {
  const { code, name, department, faculty, description, totalCredits, duration, degree, type, status } = req.body;
  
  if (!code && !name && !department && !faculty && !description && 
      totalCredits === undefined && duration === undefined && !degree && !type && !status) {
    return res.status(400).json({ success: false, message: 'At least one field to update is required' });
  }
  
  try {
    const poolConnection = await getPool();
    const request = poolConnection.request()
      .input('id', sql.BigInt, req.params.id);
    
    let updateQuery = 'UPDATE AcademicPrograms SET UpdatedAt = GETDATE()';
    
    if (code) {
      updateQuery += ', ProgramCode = @code';
      request.input('code', sql.NVarChar, code);
    }
    
    if (name) {
      updateQuery += ', ProgramName = @name';
      request.input('name', sql.NVarChar, name);
    }
    
    if (department) {
      updateQuery += ', Department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    if (faculty) {
      updateQuery += ', Faculty = @faculty';
      request.input('faculty', sql.NVarChar, faculty);
    }
    
    if (description) {
      updateQuery += ', Description = @description';
      request.input('description', sql.NVarChar, description);
    }
    
    if (totalCredits !== undefined) {
      updateQuery += ', TotalCredits = @totalCredits';
      request.input('totalCredits', sql.Int, totalCredits);
    }
    
    if (duration !== undefined) {
      updateQuery += ', ProgramDuration = @duration';
      request.input('duration', sql.Int, duration);
    }
    
    if (degree) {
      updateQuery += ', DegreeName = @degree';
      request.input('degree', sql.NVarChar, degree);
    }
    
    if (type) {
      updateQuery += ', ProgramType = @type';
      request.input('type', sql.NVarChar, type);
    }
    
    if (status) {
      updateQuery += ', IsActive = @isActive';
      request.input('isActive', sql.Bit, status === 'Active' ? 1 : 0);
    }
    
    updateQuery += ' WHERE ProgramID = @id';
    
    await request.query(updateQuery);
    
    res.json({ success: true, message: 'Program updated successfully' });
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(500).json({ success: false, message: 'Error updating program', error: error.message });
  }
});

// Subjects routes
router.get('/subjects', async (req, res) => {
  try {
    const { faculty, department, search, isActive, programId } = req.query;
    
    const poolConnection = await getPool();
    let query = `
      SELECT s.SubjectID, s.SubjectCode, s.SubjectName, s.Credits, 
             s.TheoryCredits, s.PracticeCredits, s.Prerequisites,
             s.Department, s.Faculty, s.Description, s.IsActive,
             s.IsRequired
      FROM Subjects s
    `;
    
    // If programId is provided, get subjects for that program
    if (programId) {
      query = `
        SELECT s.SubjectID, s.SubjectCode, s.SubjectName, s.Credits, 
               s.TheoryCredits, s.PracticeCredits, s.Prerequisites,
               s.Department, s.Faculty, s.Description, s.IsActive,
               ps.Semester, ps.SubjectType, ps.IsRequired
        FROM Subjects s
        INNER JOIN ProgramSubjects ps ON s.SubjectID = ps.SubjectID
        WHERE ps.ProgramID = @programId
      `;
    }
    
    const request = poolConnection.request();
    
    // Add filters
    if (programId) {
      request.input('programId', sql.BigInt, programId);
    }
    
    if (faculty) {
      query += programId ? ' AND' : ' WHERE';
      query += ' s.Faculty = @faculty';
      request.input('faculty', sql.NVarChar, faculty);
    }
    
    if (department) {
      query += (programId || faculty) ? ' AND' : ' WHERE';
      query += ' s.Department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    if (search) {
      query += (programId || faculty || department) ? ' AND' : ' WHERE';
      query += ' (s.SubjectCode LIKE @search OR s.SubjectName LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }
    
    if (isActive !== undefined && isActive !== null) {
      query += (programId || faculty || department || search) ? ' AND' : ' WHERE';
      query += ' s.IsActive = @isActive';
      request.input('isActive', sql.Bit, isActive === 'true' ? 1 : 0);
    }
    
    // Add order by
    query += ' ORDER BY s.SubjectCode ASC';
    
    const result = await request.query(query);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, message: 'Error fetching subjects', error: error.message });
  }
});

// Get a single subject by ID (using the database)
router.get('/subjects/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT 
          SubjectID, SubjectCode, SubjectName, Credits, TheoryCredits,
          PracticeCredits, Prerequisites, Description, Department,
          Faculty, IsRequired, IsActive, CreatedAt, UpdatedAt
        FROM Subjects
        WHERE SubjectID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    
    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ success: false, message: 'Error fetching subject', error: error.message });
  }
});

// Create new subject
router.post('/subjects', async (req, res) => {
  const { subjectCode, subjectName, credits, theoryCredits, practiceCredits, prerequisites, description, department, faculty, isRequired } = req.body;
  
  if (!subjectCode || !subjectName || !credits) {
    return res.status(400).json({ success: false, message: 'Subject code, name and credits are required' });
  }
  
  try {
    // Check if subject code already exists
    const poolConnection = await getPool();
    const checkResult = await poolConnection.request()
      .input('subjectCode', sql.VarChar, subjectCode)
      .query(`
        SELECT SubjectID FROM Subjects
        WHERE SubjectCode = @subjectCode
      `);
    
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject code already exists' 
      });
    }
    
    // Insert the new subject
    const result = await poolConnection.request()
      .input('subjectCode', sql.VarChar, subjectCode)
      .input('subjectName', sql.NVarChar, subjectName)
      .input('credits', sql.Int, credits)
      .input('theoryCredits', sql.Int, theoryCredits || null)
      .input('practiceCredits', sql.Int, practiceCredits || null)
      .input('prerequisites', sql.NVarChar, prerequisites || null)
      .input('description', sql.NVarChar, description || null)
      .input('department', sql.NVarChar, department || null)
      .input('faculty', sql.NVarChar, faculty || null)
      .input('isRequired', sql.Bit, isRequired === false ? 0 : 1)
      .query(`
        INSERT INTO Subjects (
          SubjectCode, SubjectName, Credits, TheoryCredits,
          PracticeCredits, Prerequisites, Description, Department,
          Faculty, IsRequired, IsActive, CreatedAt, UpdatedAt
        ) VALUES (
          @subjectCode, @subjectName, @credits, @theoryCredits,
          @practiceCredits, @prerequisites, @description, @department,
          @faculty, @isRequired, 1, GETDATE(), GETDATE()
        );
        
        SELECT SCOPE_IDENTITY() AS SubjectID;
      `);
    
    const subjectId = result.recordset[0].SubjectID;
    
    res.status(201).json({ 
      success: true, 
      message: 'Subject created successfully',
      subjectId: subjectId
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating subject', 
      error: error.message 
    });
  }
});

// Update a subject
router.put('/subjects/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    subjectCode, subjectName, credits, theoryCredits, practiceCredits, 
    prerequisites, description, department, faculty, isRequired, isActive 
  } = req.body;
  
  if (!subjectCode && !subjectName && credits === undefined) {
    return res.status(400).json({ success: false, message: 'At least one field to update is required' });
  }
  
  try {
    const poolConnection = await getPool();
    const request = poolConnection.request()
      .input('id', sql.BigInt, id);
    
    // Check if subject exists
    const checkResult = await request.query(`
      SELECT SubjectID FROM Subjects WHERE SubjectID = @id
    `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    
    // Check if updating to an existing subject code
    if (subjectCode) {
      const codeCheckResult = await poolConnection.request()
        .input('code', sql.VarChar, subjectCode)
        .input('id', sql.BigInt, id)
        .query(`
          SELECT SubjectID FROM Subjects 
          WHERE SubjectCode = @code AND SubjectID != @id
        `);
      
      if (codeCheckResult.recordset.length > 0) {
        return res.status(400).json({ success: false, message: 'Subject code already exists' });
      }
    }
    
    let updateQuery = 'UPDATE Subjects SET UpdatedAt = GETDATE()';
    
    if (subjectCode) {
      updateQuery += ', SubjectCode = @subjectCode';
      request.input('subjectCode', sql.VarChar, subjectCode);
    }
    
    if (subjectName) {
      updateQuery += ', SubjectName = @subjectName';
      request.input('subjectName', sql.NVarChar, subjectName);
    }
    
    if (credits !== undefined) {
      updateQuery += ', Credits = @credits';
      request.input('credits', sql.Int, credits);
    }
    
    if (theoryCredits !== undefined) {
      updateQuery += ', TheoryCredits = @theoryCredits';
      request.input('theoryCredits', sql.Int, theoryCredits);
    }
    
    if (practiceCredits !== undefined) {
      updateQuery += ', PracticeCredits = @practiceCredits';
      request.input('practiceCredits', sql.Int, practiceCredits);
    }
    
    if (prerequisites !== undefined) {
      updateQuery += ', Prerequisites = @prerequisites';
      request.input('prerequisites', sql.NVarChar, prerequisites);
    }
    
    if (description !== undefined) {
      updateQuery += ', Description = @description';
      request.input('description', sql.NVarChar, description);
    }
    
    if (department !== undefined) {
      updateQuery += ', Department = @department';
      request.input('department', sql.NVarChar, department);
    }
    
    if (faculty !== undefined) {
      updateQuery += ', Faculty = @faculty';
      request.input('faculty', sql.NVarChar, faculty);
    }
    
    if (isRequired !== undefined) {
      updateQuery += ', IsRequired = @isRequired';
      request.input('isRequired', sql.Bit, isRequired ? 1 : 0);
    }
    
    if (isActive !== undefined) {
      updateQuery += ', IsActive = @isActive';
      request.input('isActive', sql.Bit, isActive ? 1 : 0);
    }
    
    updateQuery += ' WHERE SubjectID = @id';
    
    await request.query(updateQuery);
    
    res.json({ success: true, message: 'Subject updated successfully' });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ success: false, message: 'Error updating subject', error: error.message });
  }
});

// Delete a subject
router.delete('/subjects/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const poolConnection = await getPool();
    
    // First check if this subject is used in any program
    const checkResult = await poolConnection.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT COUNT(*) AS usageCount FROM ProgramSubjects 
        WHERE SubjectID = @id
      `);
    
    if (checkResult.recordset[0].usageCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete subject as it is used in one or more programs. Remove it from all programs first.' 
      });
    }
    
    // If not used in any program, proceed with deletion
    const result = await poolConnection.request()
      .input('id', sql.BigInt, id)
      .query(`
        DELETE FROM Subjects WHERE SubjectID = @id
      `);
    
    if (result.rowsAffected[0] === 0) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ success: false, message: 'Error deleting subject', error: error.message });
  }
});

// Semesters routes
router.get('/semesters', async (req, res) => {
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .query(`
        SELECT 
          SemesterID, SemesterCode, SemesterName, AcademicYear,
          StartDate, EndDate, RegistrationStartDate, RegistrationEndDate,
          Status, IsCurrent, CreatedAt, UpdatedAt
        FROM Semesters
        ORDER BY StartDate DESC
      `);
    
    res.json({ 
      success: true, 
      data: result.recordset 
    });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching semesters', 
      error: error.message 
    });
  }
});

router.get('/semesters/:id', async (req, res) => {
  try {
    const poolConnection = await getPool();
    
    // Validate ID parameter
    const semesterId = parseInt(req.params.id, 10);
    if (isNaN(semesterId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid semester ID format' 
      });
    }
    
    const result = await poolConnection.request()
      .input('id', sql.BigInt, semesterId)
      .query(`
        SELECT 
          SemesterID, SemesterCode, SemesterName,
          AcademicYear, StartDate, EndDate,
          RegistrationStartDate, RegistrationEndDate,
          Status, IsCurrent,
          (SELECT COUNT(*) FROM CourseClasses cc WHERE cc.SemesterID = s.SemesterID) AS SubjectCount,
          (SELECT COUNT(DISTINCT cr.UserID) FROM CourseRegistrations cr 
           INNER JOIN CourseClasses cc ON cr.ClassID = cc.ClassID 
           WHERE cc.SemesterID = s.SemesterID) AS StudentCount,
          (SELECT COUNT(DISTINCT cr.UserID) FROM CourseRegistrations cr 
           INNER JOIN CourseClasses cc ON cr.ClassID = cc.ClassID 
           WHERE cc.SemesterID = s.SemesterID AND cr.Status = 'Approved') AS RegisteredStudentCount,
          (SELECT COUNT(DISTINCT cr.UserID) FROM CourseRegistrations cr 
           INNER JOIN CourseClasses cc ON cr.ClassID = cc.ClassID 
           INNER JOIN AcademicResults ar ON ar.ClassID = cc.ClassID AND ar.UserID = cr.UserID
           WHERE cc.SemesterID = s.SemesterID AND ar.IsCompleted = 1) AS CompletedStudentCount
        FROM Semesters s
        WHERE SemesterID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Semester not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.recordset[0] 
    });
  } catch (error) {
    console.error('Error fetching semester:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching semester', 
      error: error.message 
    });
  }
});

router.post('/semesters', async (req, res) => {
  const { 
    semesterCode, 
    semesterName, 
    academicYear, 
    startDate, 
    endDate, 
    registrationStartDate, 
    registrationEndDate, 
    status, 
    isCurrent 
  } = req.body;
  
  if (!semesterCode || !semesterName || !academicYear || !startDate || !endDate) {
    return res.status(400).json({ 
      success: false, 
      message: 'Semester code, name, academic year, start date, and end date are required'
    });
  }
  
  try {
    const poolConnection = await getPool();
    
    // Check if semester code already exists
    const checkResult = await poolConnection.request()
      .input('semesterCode', sql.VarChar, semesterCode)
      .query(`
        SELECT SemesterID FROM Semesters
        WHERE SemesterCode = @semesterCode
      `);
    
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Semester code already exists' 
      });
    }
    
    // If setting as current semester, update other semesters
    if (isCurrent) {
      await poolConnection.request().query(`
        UPDATE Semesters SET IsCurrent = 0 WHERE IsCurrent = 1
      `);
    }
    
    // Insert the new semester
    const result = await poolConnection.request()
      .input('semesterCode', sql.VarChar, semesterCode)
      .input('semesterName', sql.NVarChar, semesterName)
      .input('academicYear', sql.VarChar, academicYear)
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .input('registrationStartDate', sql.Date, registrationStartDate || null)
      .input('registrationEndDate', sql.Date, registrationEndDate || null)
      .input('status', sql.VarChar, status || 'Upcoming')
      .input('isCurrent', sql.Bit, isCurrent ? 1 : 0)
      .query(`
        INSERT INTO Semesters (
          SemesterCode, SemesterName, AcademicYear,
          StartDate, EndDate, RegistrationStartDate,
          RegistrationEndDate, Status, IsCurrent,
          CreatedAt, UpdatedAt
        ) VALUES (
          @semesterCode, @semesterName, @academicYear,
          @startDate, @endDate, @registrationStartDate,
          @registrationEndDate, @status, @isCurrent,
          GETDATE(), GETDATE()
        );
        
        SELECT SCOPE_IDENTITY() AS SemesterID;
      `);
    
    const semesterId = result.recordset[0].SemesterID;
    
    res.status(201).json({ 
      success: true, 
      message: 'Semester created successfully',
      data: {
        SemesterID: semesterId,
        SemesterCode: semesterCode,
        SemesterName: semesterName,
        AcademicYear: academicYear,
        StartDate: startDate,
        EndDate: endDate,
        RegistrationStartDate: registrationStartDate,
        RegistrationEndDate: registrationEndDate,
        Status: status || 'Upcoming',
        IsCurrent: isCurrent
      }
    });
  } catch (error) {
    console.error('Error creating semester:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating semester', 
      error: error.message 
    });
  }
});

router.put('/semesters/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    semesterCode, 
    semesterName, 
    academicYear, 
    startDate, 
    endDate, 
    registrationStartDate, 
    registrationEndDate, 
    status, 
    isCurrent 
  } = req.body;
  
  if (!semesterCode && !semesterName && !academicYear && 
      !startDate && !endDate && registrationStartDate === undefined && 
      registrationEndDate === undefined && !status && isCurrent === undefined) {
    return res.status(400).json({ success: false, message: 'At least one field to update is required' });
  }
  
  try {
    const poolConnection = await getPool();
    
    // Check if semester exists
    const checkResult = await poolConnection.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT SemesterID FROM Semesters WHERE SemesterID = @id
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }
    
    // Check if updating to an existing semester code
    if (semesterCode) {
      const codeCheckResult = await poolConnection.request()
        .input('code', sql.VarChar, semesterCode)
        .input('id', sql.BigInt, id)
        .query(`
          SELECT SemesterID FROM Semesters 
          WHERE SemesterCode = @code AND SemesterID != @id
        `);
      
      if (codeCheckResult.recordset.length > 0) {
        return res.status(400).json({ success: false, message: 'Semester code already exists' });
      }
    }
    
    // If setting as current semester, update other semesters
    if (isCurrent) {
      await poolConnection.request().query(`
        UPDATE Semesters SET IsCurrent = 0 WHERE IsCurrent = 1
      `);
    }
    
    const request = poolConnection.request()
      .input('id', sql.BigInt, id);
      
    let updateQuery = 'UPDATE Semesters SET UpdatedAt = GETDATE()';
    
    if (semesterCode) {
      updateQuery += ', SemesterCode = @semesterCode';
      request.input('semesterCode', sql.VarChar, semesterCode);
    }
    
    if (semesterName) {
      updateQuery += ', SemesterName = @semesterName';
      request.input('semesterName', sql.NVarChar, semesterName);
    }
    
    if (academicYear) {
      updateQuery += ', AcademicYear = @academicYear';
      request.input('academicYear', sql.VarChar, academicYear);
    }
    
    if (startDate) {
      updateQuery += ', StartDate = @startDate';
      request.input('startDate', sql.Date, startDate);
    }
    
    if (endDate) {
      updateQuery += ', EndDate = @endDate';
      request.input('endDate', sql.Date, endDate);
    }
    
    if (registrationStartDate !== undefined) {
      updateQuery += ', RegistrationStartDate = @registrationStartDate';
      request.input('registrationStartDate', sql.Date, registrationStartDate || null);
    }
    
    if (registrationEndDate !== undefined) {
      updateQuery += ', RegistrationEndDate = @registrationEndDate';
      request.input('registrationEndDate', sql.Date, registrationEndDate || null);
    }
    
    if (status) {
      updateQuery += ', Status = @status';
      request.input('status', sql.VarChar, status);
    }
    
    if (isCurrent !== undefined) {
      updateQuery += ', IsCurrent = @isCurrent';
      request.input('isCurrent', sql.Bit, isCurrent ? 1 : 0);
    }
    
    updateQuery += ' WHERE SemesterID = @id';
    
    await request.query(updateQuery);
    
    res.json({ 
      success: true, 
      message: 'Semester updated successfully'
    });
  } catch (error) {
    console.error('Error updating semester:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating semester', 
      error: error.message 
    });
  }
});

router.delete('/semesters/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const poolConnection = await getPool();
    
    // Check if semester exists
    const checkResult = await poolConnection.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT Status, IsCurrent FROM Semesters 
        WHERE SemesterID = @id
      `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Semester not found' });
    }
    
    // Check if semester is ongoing or current
    if (checkResult.recordset[0].Status === 'Ongoing' || checkResult.recordset[0].IsCurrent === true) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete a semester that is ongoing or marked as current'
      });
    }
    
    // Check if this semester is referenced in other tables
    const dependencyCheck = await poolConnection.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM CourseClasses WHERE SemesterID = @id) AS ClassCount,
          (SELECT COUNT(*) FROM AcademicWarnings WHERE SemesterID = @id) AS WarningCount,
          (SELECT COUNT(*) FROM ConductScores WHERE SemesterID = @id) AS ConductCount,
          (SELECT COUNT(*) FROM Tuition WHERE SemesterID = @id) AS TuitionCount
      `);
    
    const record = dependencyCheck.recordset[0];
    if (record.ClassCount > 0 || record.WarningCount > 0 || record.ConductCount > 0 || record.TuitionCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete semester as it is referenced by classes, warnings, conduct scores, or tuition records'
      });
    }
    
    // If all checks pass, proceed with deletion
    const result = await poolConnection.request()
      .input('id', sql.BigInt, id)
      .query(`
        DELETE FROM Semesters WHERE SemesterID = @id
      `);
    
    if (result.rowsAffected[0] === 0) {
    return res.status(404).json({ success: false, message: 'Semester not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Semester deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting semester:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting semester', 
      error: error.message 
    });
  }
});

// Get subjects for a semester
router.get('/semesters/:id/subjects', async (req, res) => {
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .input('id', sql.BigInt, req.params.id)
      .query(`
        SELECT 
          s.SubjectID, s.SubjectCode, s.SubjectName, s.Credits,
          s.Department, s.Faculty, cc.ClassID,
          COUNT(DISTINCT cr.UserID) AS EnrolledStudents
        FROM Subjects s
        INNER JOIN CourseClasses cc ON s.SubjectID = cc.SubjectID
        LEFT JOIN CourseRegistrations cr ON cc.ClassID = cr.ClassID AND cr.Status = 'Approved'
        WHERE cc.SemesterID = @id
        GROUP BY s.SubjectID, s.SubjectCode, s.SubjectName, s.Credits, s.Department, s.Faculty, cc.ClassID
        ORDER BY s.SubjectCode
      `);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error fetching semester subjects:', error);
    res.status(500).json({ success: false, message: 'Error fetching semester subjects', error: error.message });
  }
});

// Academic results
router.get('/results', (req, res) => {
  const results = [
    { id: 1, studentId: '2020001', studentName: 'Nguyen Van A', semester: 'Spring 2023', subject: 'Introduction to Programming', grade: 8.5 },
    { id: 2, studentId: '2020002', studentName: 'Tran Thi B', semester: 'Spring 2023', subject: 'Principles of Management', grade: 7.8 }
  ];
  res.json({ success: true, data: results });
});

// Subject-Program relationship routes
router.get('/programs/:programId/subjects', async (req, res) => {
  const { programId } = req.params;
  
  if (!programId) {
    return res.status(400).json({ success: false, message: 'Program ID is required' });
  }
  
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .input('programId', sql.BigInt, programId)
      .query(`
        SELECT s.SubjectID, s.SubjectCode, s.SubjectName, s.Credits, 
               s.Department, s.Faculty, s.Description, s.IsActive,
               ps.Semester, ps.SubjectType, ps.IsRequired, ps.ProgramSubjectID
        FROM Subjects s
        INNER JOIN ProgramSubjects ps ON s.SubjectID = ps.SubjectID
        WHERE ps.ProgramID = @programId
        ORDER BY ps.Semester, s.SubjectName
      `);
    
    res.json({ 
      success: true, 
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching program subjects:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching program subjects', 
      error: error.message 
    });
  }
});

router.post('/programs/:programId/subjects/:subjectId', async (req, res) => {
  const { programId, subjectId } = req.params;
  const { semester, subjectType, isRequired } = req.body;
  
  if (!programId || !subjectId) {
    return res.status(400).json({ success: false, message: 'Program ID and Subject ID are required' });
  }
  
  try {
    // Check if this subject is already in the program
    const poolConnection = await getPool();
    const checkResult = await poolConnection.request()
      .input('programId', sql.BigInt, programId)
      .input('subjectId', sql.BigInt, subjectId)
      .query(`
        SELECT * FROM ProgramSubjects 
        WHERE ProgramID = @programId AND SubjectID = @subjectId
      `);
    
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This subject is already part of this program' 
      });
    }
    
    // Insert the new program-subject relationship
    await poolConnection.request()
      .input('programId', sql.BigInt, programId)
      .input('subjectId', sql.BigInt, subjectId)
      .input('semester', sql.Int, semester || 1)
      .input('subjectType', sql.NVarChar, subjectType || 'Core')
      .input('isRequired', sql.Bit, isRequired === false ? 0 : 1)
      .query(`
        INSERT INTO ProgramSubjects (
          ProgramID, SubjectID, Semester, SubjectType, IsRequired, CreatedAt, UpdatedAt
        ) VALUES (
          @programId, @subjectId, @semester, @subjectType, @isRequired, GETDATE(), GETDATE()
        )
      `);
    
    res.status(201).json({ 
      success: true, 
      message: 'Subject added to program successfully'
    });
  } catch (error) {
    console.error('Error adding subject to program:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding subject to program', 
      error: error.message 
    });
  }
});

router.delete('/programs/:programId/subjects/:subjectId', async (req, res) => {
  const { programId, subjectId } = req.params;
  
  if (!programId || !subjectId) {
    return res.status(400).json({ success: false, message: 'Program ID and Subject ID are required' });
  }
  
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .input('programId', sql.BigInt, programId)
      .input('subjectId', sql.BigInt, subjectId)
      .query(`
        DELETE FROM ProgramSubjects 
        WHERE ProgramID = @programId AND SubjectID = @subjectId
      `);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found in this program' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Subject removed from program successfully' 
    });
  } catch (error) {
    console.error('Error removing subject from program:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error removing subject from program', 
      error: error.message 
    });
  }
});

// Academic Results routes
router.get('/academic-results', async (req, res) => {
  try {
    const { semester, program, subject, search } = req.query;
    
    const poolConnection = await getPool();
    let query = `
      SELECT 
        ar.ResultID,
        u.UserID,
        u.FullName as StudentName,
        sd.StudentCode as StudentID,
        s.SemesterName as Semester,
        ap.ProgramName as Program,
        sub.SubjectName as Subject,
        sub.Credits as Credits,
        ar.AttendanceScore,
        ar.AssignmentScore,
        ar.MidtermScore,
        ar.FinalScore,
        ar.TotalScore as Grade,
        ar.LetterGrade,
        ar.GPA,
        CASE WHEN ar.IsPassed = 1 THEN 'Passed' ELSE 'Failed' END as Status,
        ar.UpdatedAt as Date
      FROM AcademicResults ar
      INNER JOIN Users u ON ar.UserID = u.UserID
      INNER JOIN StudentDetails sd ON u.UserID = sd.UserID
      INNER JOIN CourseClasses cc ON ar.ClassID = cc.ClassID
      INNER JOIN Subjects sub ON cc.SubjectID = sub.SubjectID
      INNER JOIN Semesters s ON cc.SemesterID = s.SemesterID
      LEFT JOIN StudentPrograms sp ON u.UserID = sp.UserID
      LEFT JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
      WHERE 1=1
    `;
    
    const request = poolConnection.request();
    
    // Add filters
    if (semester) {
      query += ' AND s.SemesterName = @semester';
      request.input('semester', sql.NVarChar, semester);
    }
    
    if (program) {
      query += ' AND ap.ProgramName = @program';
      request.input('program', sql.NVarChar, program);
    }
    
    if (subject) {
      query += ' AND sub.SubjectName = @subject';
      request.input('subject', sql.NVarChar, subject);
    }
    
    if (search) {
      query += ' AND (u.FullName LIKE @search OR sd.StudentCode LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }
    
    // Add order by
    query += ' ORDER BY s.SemesterName DESC, u.FullName ASC';
    
    const result = await request.query(query);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error fetching academic results:', error);
    res.status(500).json({ success: false, message: 'Error fetching academic results', error: error.message });
  }
});

// Get all semesters for dropdown
router.get('/semesters', async (req, res) => {
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .query(`
        SELECT 
          SemesterID as id,
          SemesterName as name,
          StartDate as startDate,
          EndDate as endDate,
          CASE WHEN IsCurrent = 1 THEN 'Current' ELSE Status END as status
        FROM Semesters
        ORDER BY StartDate DESC
      `);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    res.status(500).json({ success: false, message: 'Error fetching semesters', error: error.message });
  }
});

// Get all programs for dropdown
router.get('/programs-list', async (req, res) => {
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .query(`
        SELECT 
          ProgramID as id,
          ProgramName as name
        FROM AcademicPrograms
        WHERE IsActive = 1
        ORDER BY ProgramName
      `);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error fetching programs list:', error);
    res.status(500).json({ success: false, message: 'Error fetching programs list', error: error.message });
  }
});

// Get all subjects for dropdown
router.get('/subjects-list', async (req, res) => {
  try {
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .query(`
        SELECT 
          SubjectID as id,
          SubjectName as name
        FROM Subjects
        WHERE IsActive = 1
        ORDER BY SubjectName
      `);
    
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    console.error('Error fetching subjects list:', error);
    res.status(500).json({ success: false, message: 'Error fetching subjects list', error: error.message });
  }
});

// Academic Warnings routes
router.get('/warnings', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', semesterId = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const poolConnection = await getPool();
    let query = `
      SELECT 
        aw.WarningID,
        u.UserID,
        u.FullName as StudentName,
        sd.StudentCode as StudentID,
        s.SemesterID,
        s.SemesterName,
        s.AcademicYear,
        aw.WarningType,
        aw.Reason,
        aw.WarningDate,
        aw.RequiredAction,
        aw.ResolvedDate,
        aw.Status,
        aw.CreatedAt,
        createdBy.FullName as CreatedByName
      FROM AcademicWarnings aw
      INNER JOIN Users u ON aw.UserID = u.UserID
      INNER JOIN StudentDetails sd ON u.UserID = sd.UserID
      INNER JOIN Semesters s ON aw.SemesterID = s.SemesterID
      LEFT JOIN Users createdBy ON aw.CreatedBy = createdBy.UserID
      WHERE 1=1
    `;
    
    const request = poolConnection.request();
    
    // Add filters
    let isNumeric = false;
    if (search) {
      // Check if search is a numeric value (could be UserID)
      isNumeric = /^\d+$/.test(search.trim());
      
      if (isNumeric) {
        query += ' AND (u.FullName LIKE @search OR sd.StudentCode LIKE @search OR u.UserID = @userId)';
        request.input('search', sql.NVarChar, `%${search}%`);
        request.input('userId', sql.BigInt, parseInt(search.trim()));
      } else {
        query += ' AND (u.FullName LIKE @search OR sd.StudentCode LIKE @search)';
        request.input('search', sql.NVarChar, `%${search}%`);
      }
    }
    
    if (status) {
      query += ' AND aw.Status = @status';
      request.input('status', sql.VarChar, status);
    }
    
    if (semesterId) {
      query += ' AND aw.SemesterID = @semesterId';
      request.input('semesterId', sql.BigInt, semesterId);
    }
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM AcademicWarnings aw
      INNER JOIN Users u ON aw.UserID = u.UserID
      INNER JOIN StudentDetails sd ON u.UserID = sd.UserID
      WHERE 1=1
    `;
    
    if (search) {
      if (isNumeric) {
        countQuery += ' AND (u.FullName LIKE @search OR sd.StudentCode LIKE @search OR u.UserID = @userId)';
      } else {
        countQuery += ' AND (u.FullName LIKE @search OR sd.StudentCode LIKE @search)';
      }
    }
    
    if (status) {
      countQuery += ' AND aw.Status = @status';
    }
    
    if (semesterId) {
      countQuery += ' AND aw.SemesterID = @semesterId';
    }
    
    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;
    
    // Add sorting and pagination
    query += ' ORDER BY aw.WarningDate DESC, aw.WarningID DESC';
    query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, parseInt(limit));
    
    const result = await request.query(query);
    
    res.json({ 
      success: true, 
      warnings: result.recordset,
      total: total 
    });
  } catch (error) {
    console.error('Error fetching academic warnings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching academic warnings', 
      error: error.message 
    });
  }
});

// Get a specific academic warning by ID
router.get('/warnings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const poolConnection = await getPool();
    const result = await poolConnection.request()
      .input('id', sql.BigInt, id)
      .query(`
        SELECT 
          aw.WarningID,
          u.UserID,
          u.FullName as StudentName,
          sd.StudentCode as StudentID,
          s.SemesterID,
          s.SemesterName,
          s.AcademicYear,
          aw.WarningType,
          aw.Reason,
          aw.RequiredAction,
          aw.WarningDate,
          aw.ResolvedDate,
          aw.Status,
          aw.CreatedAt,
          aw.UpdatedAt,
          createdBy.FullName as CreatedByName,
          createdBy.UserID as CreatedByID
        FROM AcademicWarnings aw
        INNER JOIN Users u ON aw.UserID = u.UserID
        INNER JOIN StudentDetails sd ON u.UserID = sd.UserID
        INNER JOIN Semesters s ON aw.SemesterID = s.SemesterID
        LEFT JOIN Users createdBy ON aw.CreatedBy = createdBy.UserID
        WHERE aw.WarningID = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Academic warning not found' });
    }
    
    res.json({ 
      success: true, 
      warning: result.recordset[0] 
    });
  } catch (error) {
    console.error('Error fetching academic warning:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching academic warning', 
      error: error.message 
    });
  }
});

// Create a new academic warning
router.post('/warnings', async (req, res) => {
  try {
    const { 
      studentId, 
      semesterId, 
      warningType, 
      reason, 
      requiredAction,
      status = 'Active'
    } = req.body;
    
    if (!studentId || !semesterId || !warningType || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID, semester ID, warning type, and reason are required' 
      });
    }
    
    const currentDate = new Date();
    const poolConnection = await getPool();
    
    // Check if student exists
    const studentCheck = await poolConnection.request()
      .input('studentId', sql.BigInt, studentId)
      .query(`SELECT UserID FROM Users WHERE UserID = @studentId`);
    
    if (studentCheck.recordset.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    
    // Check if semester exists
    const semesterCheck = await poolConnection.request()
      .input('semesterId', sql.BigInt, semesterId)
      .query(`SELECT SemesterID FROM Semesters WHERE SemesterID = @semesterId`);
    
    if (semesterCheck.recordset.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Semester not found' 
      });
    }
    
    // Create the warning
    const result = await poolConnection.request()
      .input('studentId', sql.BigInt, studentId)
      .input('semesterId', sql.BigInt, semesterId)
      .input('warningType', sql.VarChar, warningType)
      .input('reason', sql.NVarChar, reason)
      .input('requiredAction', sql.NVarChar, requiredAction || null)
      .input('warningDate', sql.Date, currentDate)
      .input('status', sql.VarChar, status)
      .input('createdBy', sql.BigInt, 1) // Assuming admin ID 1 for now
      .query(`
        INSERT INTO AcademicWarnings (
          UserID, SemesterID, WarningType, Reason, 
          RequiredAction, WarningDate, Status, 
          CreatedBy, CreatedAt, UpdatedAt
        )
        VALUES (
          @studentId, @semesterId, @warningType, @reason, 
          @requiredAction, @warningDate, @status, 
          @createdBy, GETDATE(), GETDATE()
        );
        
        SELECT SCOPE_IDENTITY() AS WarningID;
      `);
    
    const warningId = result.recordset[0].WarningID;
    
    // Get the newly created warning
    const warningResult = await poolConnection.request()
      .input('id', sql.BigInt, warningId)
      .query(`
        SELECT 
          aw.WarningID,
          u.UserID,
          u.FullName as StudentName,
          sd.StudentCode as StudentID,
          s.SemesterID,
          s.SemesterName,
          aw.WarningType,
          aw.Reason,
          aw.RequiredAction,
          aw.WarningDate,
          aw.Status,
          aw.CreatedAt
        FROM AcademicWarnings aw
        INNER JOIN Users u ON aw.UserID = u.UserID
        INNER JOIN StudentDetails sd ON u.UserID = sd.UserID
        INNER JOIN Semesters s ON aw.SemesterID = s.SemesterID
        WHERE aw.WarningID = @id
      `);
    
    res.status(201).json({ 
      success: true, 
      message: 'Academic warning created successfully',
      warning: warningResult.recordset[0]
    });
  } catch (error) {
    console.error('Error creating academic warning:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating academic warning', 
      error: error.message 
    });
  }
});

// Update an academic warning
router.put('/warnings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      warningType, 
      reason, 
      requiredAction, 
      resolvedDate,
      status
    } = req.body;
    
    if (!warningType && !reason && requiredAction === undefined && 
        resolvedDate === undefined && !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one field to update is required' 
      });
    }
    
    // Check if warning exists
    const poolConnection = await getPool();
    const checkResult = await poolConnection.request()
      .input('id', sql.BigInt, id)
      .query(`SELECT WarningID FROM AcademicWarnings WHERE WarningID = @id`);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Academic warning not found' 
      });
    }
    
    // Build the update query
    let updateQuery = 'UPDATE AcademicWarnings SET UpdatedAt = GETDATE()';
    const request = poolConnection.request().input('id', sql.BigInt, id);
    
    if (warningType) {
      updateQuery += ', WarningType = @warningType';
      request.input('warningType', sql.VarChar, warningType);
    }
    
    if (reason) {
      updateQuery += ', Reason = @reason';
      request.input('reason', sql.NVarChar, reason);
    }
    
    if (requiredAction !== undefined) {
      updateQuery += ', RequiredAction = @requiredAction';
      request.input('requiredAction', sql.NVarChar, requiredAction || null);
    }
    
    if (resolvedDate !== undefined) {
      updateQuery += ', ResolvedDate = @resolvedDate';
      request.input('resolvedDate', sql.Date, resolvedDate ? new Date(resolvedDate) : null);
      
      // If resolvedDate is set, update status to 'Resolved'
      if (resolvedDate && !status) {
        updateQuery += ", Status = 'Resolved'";
      }
    }
    
    if (status) {
      updateQuery += ', Status = @status';
      request.input('status', sql.VarChar, status);
    }
    
    updateQuery += ' WHERE WarningID = @id';
    
    await request.query(updateQuery);
    
    res.json({ 
      success: true, 
      message: 'Academic warning updated successfully' 
    });
  } catch (error) {
    console.error('Error updating academic warning:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating academic warning', 
      error: error.message 
    });
  }
});

// Dashboard statistics endpoint
router.get('/dashboard/stats', async (req, res) => {
  try {
    const poolConnection = await getPool();
    
    // Get total and active students
    const studentsResult = await poolConnection.request().query(`
      SELECT 
        COUNT(*) AS totalStudents,
        (SELECT COUNT(*) FROM Users u JOIN StudentDetails sd ON u.UserID = sd.UserID 
         WHERE u.Role = 'STUDENT' AND u.AccountStatus = 'ACTIVE') AS activeStudents
      FROM Users u 
      JOIN StudentDetails sd ON u.UserID = sd.UserID 
      WHERE u.Role = 'STUDENT'
    `);
    
    // Get program count
    const programsResult = await poolConnection.request().query(`
      SELECT COUNT(*) AS totalPrograms
      FROM AcademicPrograms
      WHERE IsActive = 1
    `);
    
    // Get subject count
    const subjectsResult = await poolConnection.request().query(`
      SELECT COUNT(*) AS totalSubjects
      FROM Subjects
      WHERE IsActive = 1
    `);
    
    // Get current semester
    const semesterResult = await poolConnection.request().query(`
      SELECT 
        SemesterID, SemesterCode, SemesterName, AcademicYear, 
        StartDate, EndDate, RegistrationStartDate, RegistrationEndDate,
        Status
      FROM Semesters
      WHERE IsCurrent = 1
    `);
    
    // Get recent activities (for a real implementation, this would be from an audit log table)
    // For now, we'll generate some representative data
    const recentActivities = [
      { id: 1, type: 'student_created', user: 'Admin', content: 'Tạo tài khoản sinh viên mới', time: '15 phút trước' },
      { id: 2, type: 'grade_updated', user: 'Admin', content: 'Cập nhật điểm học phần CS101', time: '30 phút trước' },
      { id: 3, type: 'program_updated', user: 'Admin', content: 'Cập nhật chương trình CNTT', time: '1 giờ trước' },
      { id: 4, type: 'semester_created', user: 'Admin', content: 'Tạo học kỳ mới', time: '2 giờ trước' },
      { id: 5, type: 'student_updated', user: 'Admin', content: 'Cập nhật thông tin sinh viên', time: '1 ngày trước' },
    ];
    
    // Get recent academic warnings
    const warningsResult = await poolConnection.request().query(`
      SELECT TOP 5
        w.WarningID as id, 
        u.FullName as studentName,
        sd.StudentCode as studentCode,
        w.WarningType as type,
        FORMAT(w.CreatedAt, 'dd/MM/yyyy') as created,
        w.Status as status
      FROM AcademicWarnings w
      JOIN Users u ON w.UserID = u.UserID
      JOIN StudentDetails sd ON u.UserID = sd.UserID
      ORDER BY w.CreatedAt DESC
    `);
    
    res.json({
      success: true,
      data: {
        students: {
          total: studentsResult.recordset[0].totalStudents,
          active: studentsResult.recordset[0].activeStudents
        },
        programs: programsResult.recordset[0].totalPrograms,
        subjects: subjectsResult.recordset[0].totalSubjects,
        currentSemester: semesterResult.recordset.length > 0 ? semesterResult.recordset[0] : null,
        recentActivities: recentActivities,
        warnings: warningsResult.recordset
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard statistics', 
      error: error.message 
    });
  }
});

// Course Enrollments - Đăng ký khóa học với kiểm tra học phí
router.post('/course-enrollments', async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    
    if (!userId || !courseId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp đầy đủ thông tin UserId và CourseId' 
      });
    }
    
    const pool = await getPool();
    
    // Kiểm tra người dùng
    const userResult = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .query('SELECT UserID, TuitionStatus FROM Users WHERE UserID = @UserID');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    
    // Kiểm tra khóa học
    const courseResult = await pool.request()
      .input('CourseID', sql.BigInt, courseId)
      .query('SELECT CourseID, Title, Price FROM Courses WHERE CourseID = @CourseID');
    
    if (courseResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
    }
    
    const course = courseResult.recordset[0];
    const user = userResult.recordset[0];
    
    // Kiểm tra đã đăng ký chưa
    const enrollmentCheck = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .input('CourseID', sql.BigInt, courseId)
      .query(`
        SELECT EnrollmentID FROM CourseEnrollments 
        WHERE UserID = @UserID AND CourseID = @CourseID AND Status <> 'dropped'
      `);
    
    if (enrollmentCheck.recordset.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Người dùng đã đăng ký khóa học này' 
      });
    }
    
    // Kiểm tra tình trạng học phí
    if (user.TuitionStatus === 'PAID') {
      // Nếu đã đóng học phí toàn phần, cho phép đăng ký
      const insertResult = await pool.request()
        .input('UserID', sql.BigInt, userId)
        .input('CourseID', sql.BigInt, courseId)
        .query(`
          INSERT INTO CourseEnrollments (UserID, CourseID, Status, EnrolledAt)
          OUTPUT INSERTED.*
          VALUES (@UserID, @CourseID, 'active', GETDATE())
        `);
      
      // Cập nhật số lượng đăng ký khóa học
      await pool.request()
        .input('CourseID', sql.BigInt, courseId)
        .query(`
          UPDATE Courses 
          SET EnrolledCount = EnrolledCount + 1 
          WHERE CourseID = @CourseID
        `);
      
      return res.status(201).json({ 
        success: true, 
        message: 'Đăng ký khóa học thành công', 
        enrollment: insertResult.recordset[0],
        paymentRequired: false
      });
    } else if (course.Price <= 0) {
      // Nếu khóa học miễn phí, cho phép đăng ký
      const insertResult = await pool.request()
        .input('UserID', sql.BigInt, userId)
        .input('CourseID', sql.BigInt, courseId)
        .query(`
          INSERT INTO CourseEnrollments (UserID, CourseID, Status, EnrolledAt)
          OUTPUT INSERTED.*
          VALUES (@UserID, @CourseID, 'active', GETDATE())
        `);
      
      // Cập nhật số lượng đăng ký khóa học
      await pool.request()
        .input('CourseID', sql.BigInt, courseId)
        .query(`
          UPDATE Courses 
          SET EnrolledCount = EnrolledCount + 1 
          WHERE CourseID = @CourseID
        `);
      
      return res.status(201).json({ 
        success: true, 
        message: 'Đăng ký khóa học miễn phí thành công', 
        enrollment: insertResult.recordset[0],
        paymentRequired: false
      });
    } else {
      // Kiểm tra học phí khóa học riêng lẻ
      const coursePaymentCheck = await pool.request()
        .input('UserID', sql.BigInt, userId)
        .input('CourseID', sql.BigInt, courseId)
        .query(`
          SELECT tp.* 
          FROM TuitionPayments tp
          JOIN TuitionCourseDetails tcd ON tp.PaymentID = tcd.PaymentID
          WHERE tp.UserID = @UserID 
          AND tcd.CourseID = @CourseID
          AND tp.Status = 'PAID'
          AND tp.IsFullTuition = 0
        `);
      
      if (coursePaymentCheck.recordset.length > 0) {
        // Nếu đã thanh toán học phí cho khóa học này, cho phép đăng ký
        const insertResult = await pool.request()
          .input('UserID', sql.BigInt, userId)
          .input('CourseID', sql.BigInt, courseId)
          .query(`
            INSERT INTO CourseEnrollments (UserID, CourseID, Status, EnrolledAt)
            OUTPUT INSERTED.*
            VALUES (@UserID, @CourseID, 'active', GETDATE())
          `);
        
        // Cập nhật số lượng đăng ký khóa học
        await pool.request()
          .input('CourseID', sql.BigInt, courseId)
          .query(`
            UPDATE Courses 
            SET EnrolledCount = EnrolledCount + 1 
            WHERE CourseID = @CourseID
          `);
        
        return res.status(201).json({ 
          success: true, 
          message: 'Đăng ký khóa học thành công', 
          enrollment: insertResult.recordset[0],
          paymentRequired: false
        });
      } else {
        // Cần thanh toán học phí trước khi đăng ký
        return res.status(402).json({ 
          success: false, 
          message: 'Cần thanh toán học phí trước khi đăng ký khóa học này', 
          paymentRequired: true,
          course: {
            courseId: course.CourseID,
            title: course.Title,
            price: course.Price
          }
        });
      }
    }
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi đăng ký khóa học', 
      error: error.message 
    });
  }
});

// Lấy danh sách đăng ký khóa học của người dùng
router.get('/users/:userId/enrollments', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const pool = await getPool();
    const result = await pool.request()
      .input('UserID', sql.BigInt, userId)
      .query(`
        SELECT 
          ce.EnrollmentID, ce.CourseID, ce.UserID, ce.Progress,
          ce.EnrolledAt, ce.CompletedAt, ce.Status,
          c.Title as CourseTitle, c.Description as CourseDescription,
          c.ImageUrl, c.Level, c.Duration
        FROM CourseEnrollments ce
        JOIN Courses c ON ce.CourseID = c.CourseID
        WHERE ce.UserID = @UserID
        ORDER BY ce.EnrolledAt DESC
      `);
    
    res.json({ 
      success: true, 
      enrollments: result.recordset 
    });
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách đăng ký khóa học', 
      error: error.message 
    });
  }
});

// Hủy đăng ký khóa học
router.put('/course-enrollments/:enrollmentId/drop', async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { reason } = req.body;
    
    const pool = await getPool();
    
    // Lấy thông tin đăng ký
    const enrollmentResult = await pool.request()
      .input('EnrollmentID', sql.BigInt, enrollmentId)
      .query(`
        SELECT 
          ce.EnrollmentID, ce.CourseID, ce.UserID, ce.Status,
          c.Title as CourseTitle
        FROM CourseEnrollments ce
        JOIN Courses c ON ce.CourseID = c.CourseID
        WHERE ce.EnrollmentID = @EnrollmentID
      `);
    
    if (enrollmentResult.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đăng ký khóa học' 
      });
    }
    
    const enrollment = enrollmentResult.recordset[0];
    
    if (enrollment.Status === 'dropped') {
      return res.status(400).json({ 
        success: false, 
        message: 'Đăng ký khóa học này đã được hủy trước đó' 
      });
    }
    
    // Cập nhật trạng thái đăng ký
    await pool.request()
      .input('EnrollmentID', sql.BigInt, enrollmentId)
      .query(`
        UPDATE CourseEnrollments
        SET Status = 'dropped'
        WHERE EnrollmentID = @EnrollmentID
      `);
    
    // Giảm số lượng đăng ký của khóa học
    await pool.request()
      .input('CourseID', sql.BigInt, enrollment.CourseID)
      .query(`
        UPDATE Courses 
        SET EnrolledCount = EnrolledCount - 1 
        WHERE CourseID = @CourseID AND EnrolledCount > 0
      `);
    
    res.json({ 
      success: true, 
      message: 'Đã hủy đăng ký khóa học thành công',
      enrollmentId: enrollmentId
    });
  } catch (error) {
    console.error('Error dropping course enrollment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi hủy đăng ký khóa học', 
      error: error.message 
    });
  }
});

module.exports = router; 
