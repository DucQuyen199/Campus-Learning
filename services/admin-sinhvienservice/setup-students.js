const sql = require('mssql');
const { getPool } = require('./src/config/db');
const bcrypt = require('bcrypt');

async function setupStudentData() {
  try {
    console.log('Connecting to database...');
    const poolConnection = await getPool();
    
    // Check if we already have student users
    const checkStudentsResult = await poolConnection.request().query(
      `SELECT COUNT(*) as count FROM Users WHERE Role = 'STUDENT'`
    );
    
    if (checkStudentsResult.recordset[0].count > 0) {
      console.log(`${checkStudentsResult.recordset[0].count} student users already exist in the database`);
    } else {
      console.log('No student users found. Adding sample students...');
      
      // Get the first program
      const programResult = await poolConnection.request().query(
        'SELECT TOP 1 ProgramID FROM AcademicPrograms'
      );
      
      if (programResult.recordset.length === 0) {
        throw new Error('No academic programs found in the database. Please run setup-data.js first.');
      }
      
      const programId = programResult.recordset[0].ProgramID;
      
      // Create 5 sample students
      for (let i = 1; i <= 5; i++) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // Insert student user
        const userId = await addStudent(
          poolConnection,
          `student${i}`,
          `student${i}@example.com`,
          hashedPassword,
          `Student ${i}`,
          new Date(2000, 0, i) // January i, 2000
        );
        
        // Link student to program
        await linkStudentToProgram(poolConnection, userId, programId);
        
        console.log(`Added student ${i} with UserID ${userId} and linked to ProgramID ${programId}`);
      }
    }
    
    // Check if we have any student program links
    const checkStudentProgramsResult = await poolConnection.request().query(
      'SELECT COUNT(*) as count FROM StudentPrograms'
    );
    
    if (checkStudentProgramsResult.recordset[0].count > 0) {
      console.log(`${checkStudentProgramsResult.recordset[0].count} student-program links already exist in the database`);
    } else {
      // Get all students without program links
      const studentsResult = await poolConnection.request().query(
        `SELECT UserID FROM Users WHERE Role = 'STUDENT' AND 
         UserID NOT IN (SELECT UserID FROM StudentPrograms)`
      );
      
      // Get the first program
      const programResult = await poolConnection.request().query(
        'SELECT TOP 1 ProgramID FROM AcademicPrograms'
      );
      
      if (programResult.recordset.length === 0) {
        throw new Error('No academic programs found in the database.');
      }
      
      const programId = programResult.recordset[0].ProgramID;
      
      // Link students to program
      for (const student of studentsResult.recordset) {
        await linkStudentToProgram(poolConnection, student.UserID, programId);
        console.log(`Linked existing student ${student.UserID} to program ${programId}`);
      }
    }
    
    console.log('Student setup completed successfully!');
  } catch (error) {
    console.error('Error setting up student data:', error);
  }
}

async function addStudent(pool, username, email, password, fullName, dateOfBirth) {
  const result = await pool.request()
    .input('username', sql.VarChar, username)
    .input('email', sql.VarChar, email)
    .input('password', sql.VarChar, password)
    .input('fullName', sql.NVarChar, fullName)
    .input('dateOfBirth', sql.Date, dateOfBirth)
    .input('role', sql.VarChar, 'STUDENT')
    .query(`
      INSERT INTO Users (
        Username, Email, Password, FullName, DateOfBirth, Role,
        Status, AccountStatus, CreatedAt, UpdatedAt
      )
      VALUES (
        @username, @email, @password, @fullName, @dateOfBirth, @role,
        'ONLINE', 'ACTIVE', GETDATE(), GETDATE()
      );
      
      SELECT SCOPE_IDENTITY() AS UserID;
    `);
  
  return result.recordset[0].UserID;
}

async function linkStudentToProgram(pool, userId, programId) {
  const currentYear = new Date().getFullYear();
  
  await pool.request()
    .input('userId', sql.BigInt, userId)
    .input('programId', sql.BigInt, programId)
    .input('entryYear', sql.Int, currentYear - 1) // Last year
    .input('expectedGraduationYear', sql.Int, currentYear + 3) // 4 years later
    .query(`
      INSERT INTO StudentPrograms (
        UserID, ProgramID, EntryYear, ExpectedGraduationYear,
        Status, IsPrimary, CreatedAt, UpdatedAt
      )
      VALUES (
        @userId, @programId, @entryYear, @expectedGraduationYear,
        'Active', 1, GETDATE(), GETDATE()
      );
    `);
}

// Execute the function
setupStudentData()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  }); 