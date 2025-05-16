const sql = require('mssql');
const { getPool } = require('./src/config/db');

async function insertSampleData() {
  try {
    console.log('Connecting to database...');
    const poolConnection = await getPool();
    
    // Check if semesters already exist
    const checkResult = await poolConnection.request().query(
      'SELECT COUNT(*) as count FROM Semesters'
    );
    
    if (checkResult.recordset[0].count > 0) {
      console.log('Semesters already exist in the database');
      return;
    }
    
    console.log('Inserting sample semester...');
    // Insert a sample semester
    const currentYear = new Date().getFullYear();
    const result = await poolConnection.request()
      .input('semesterCode', sql.VarChar, `${currentYear}1`)
      .input('semesterName', sql.NVarChar, `Học kỳ 1`)
      .input('academicYear', sql.VarChar, `${currentYear}-${currentYear + 1}`)
      .input('startDate', sql.Date, new Date(`${currentYear}-09-01`))
      .input('endDate', sql.Date, new Date(`${currentYear}-12-31`))
      .input('registrationStartDate', sql.Date, new Date(`${currentYear}-08-15`))
      .input('registrationEndDate', sql.Date, new Date(`${currentYear}-08-25`))
      .input('status', sql.VarChar, 'Ongoing')
      .input('isCurrent', sql.Bit, 1)
      .query(`
        INSERT INTO Semesters (
          SemesterCode, SemesterName, AcademicYear, StartDate,
          EndDate, RegistrationStartDate, RegistrationEndDate,
          Status, IsCurrent, CreatedAt, UpdatedAt
        )
        VALUES (
          @semesterCode, @semesterName, @academicYear, @startDate,
          @endDate, @registrationStartDate, @registrationEndDate,
          @status, @isCurrent, GETDATE(), GETDATE()
        );
      `);
    
    console.log('Sample semester inserted successfully');
    
    // Check academic programs
    const programResult = await poolConnection.request().query(
      'SELECT COUNT(*) as count FROM AcademicPrograms'
    );
    
    if (programResult.recordset[0].count === 0) {
      console.log('Inserting sample academic program...');
      // Insert a sample academic program
      await poolConnection.request()
        .input('programCode', sql.VarChar, 'CS')
        .input('programName', sql.NVarChar, 'Computer Science')
        .input('department', sql.NVarChar, 'Information Technology')
        .input('faculty', sql.NVarChar, 'Engineering')
        .input('totalCredits', sql.Int, 145)
        .input('programDuration', sql.Int, 8)
        .query(`
          INSERT INTO AcademicPrograms (
            ProgramCode, ProgramName, Department, Faculty,
            TotalCredits, ProgramDuration, IsActive, CreatedAt, UpdatedAt
          )
          VALUES (
            @programCode, @programName, @department, @faculty,
            @totalCredits, @programDuration, 1, GETDATE(), GETDATE()
          );
        `);
      console.log('Sample academic program inserted successfully');
    } else {
      console.log('Academic programs already exist in the database');
    }
    
    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Error setting up sample data:', error);
  }
}

// Execute the function
insertSampleData()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  }); 