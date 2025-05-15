const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getPool } = require('../src/config/db');

// Mock data for subjects and semesters (will be updated later)
const subjects = [
  { id: 1, code: 'CS101', name: 'Introduction to Programming', credits: 3, program: 'Computer Science' },
  { id: 2, code: 'CS201', name: 'Data Structures', credits: 4, program: 'Computer Science' },
  { id: 3, code: 'BA101', name: 'Principles of Management', credits: 3, program: 'Business Administration' }
];

const semesters = [
  { id: 1, name: 'Spring 2023', startDate: '2023-01-10', endDate: '2023-05-20' },
  { id: 2, name: 'Fall 2023', startDate: '2023-08-15', endDate: '2023-12-20' }
];

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
        SELECT SubjectID, SubjectCode, SubjectName, Credits, TheoryCredits,
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
router.get('/semesters', (req, res) => {
  res.json({ success: true, data: semesters });
});

router.get('/semesters/:id', (req, res) => {
  const semester = semesters.find(s => s.id === parseInt(req.params.id));
  if (!semester) {
    return res.status(404).json({ success: false, message: 'Semester not found' });
  }
  res.json({ success: true, data: semester });
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

module.exports = router; 