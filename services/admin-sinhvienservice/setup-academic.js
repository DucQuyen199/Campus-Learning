const sql = require('mssql');
const { getPool } = require('./src/config/db');

// Sample data for academic results
const academicPrograms = [
  { code: 'CS', name: 'Computer Science', department: 'Computer Science', faculty: 'Engineering', totalCredits: 140 },
  { code: 'BA', name: 'Business Administration', department: 'Business', faculty: 'Economics', totalCredits: 120 },
  { code: 'EE', name: 'Electrical Engineering', department: 'Electrical', faculty: 'Engineering', totalCredits: 145 }
];

const semesters = [
  { code: 'SP2023', name: 'Spring 2023', startDate: '2023-01-10', endDate: '2023-05-20', isCurrent: 0 },
  { code: 'FA2023', name: 'Fall 2023', startDate: '2023-08-15', endDate: '2023-12-20', isCurrent: 0 },
  { code: 'SP2024', name: 'Spring 2024', startDate: '2024-01-08', endDate: '2024-05-15', isCurrent: 1 }
];

const subjects = [
  { code: 'CS101', name: 'Introduction to Programming', credits: 3, department: 'Computer Science' },
  { code: 'CS201', name: 'Data Structures and Algorithms', credits: 4, department: 'Computer Science' },
  { code: 'BA101', name: 'Principles of Marketing', credits: 3, department: 'Business' },
  { code: 'EE101', name: 'Electric Circuits', credits: 4, department: 'Electrical' }
];

const students = [
  { code: '2020001', fullName: 'Nguyen Van A', email: 'nvana@example.com' },
  { code: '2020002', fullName: 'Tran Thi B', email: 'tthib@example.com' },
  { code: '2020003', fullName: 'Le Van C', email: 'lvanc@example.com' },
  { code: '2020004', fullName: 'Pham Thi D', email: 'pthid@example.com' },
  { code: '2020005', fullName: 'Vo Van E', email: 'vvane@example.com' }
];

const setupData = async () => {
  try {
    console.log('Connecting to database...');
    const pool = await getPool();
    console.log('Connected to database');

    // Insert academic programs
    for (const program of academicPrograms) {
      // Check if program already exists
      const programCheck = await pool.request()
        .input('code', sql.VarChar, program.code)
        .query('SELECT ProgramID FROM AcademicPrograms WHERE ProgramCode = @code');
      
      if (programCheck.recordset.length === 0) {
        await pool.request()
          .input('code', sql.VarChar, program.code)
          .input('name', sql.NVarChar, program.name)
          .input('department', sql.NVarChar, program.department)
          .input('faculty', sql.NVarChar, program.faculty)
          .input('totalCredits', sql.Int, program.totalCredits)
          .query(`
            INSERT INTO AcademicPrograms (ProgramCode, ProgramName, Department, Faculty, TotalCredits, IsActive)
            VALUES (@code, @name, @department, @faculty, @totalCredits, 1)
          `);
        console.log(`Added program: ${program.name}`);
      } else {
        console.log(`Program ${program.name} already exists`);
      }
    }

    // Insert semesters
    for (const semester of semesters) {
      // Check if semester already exists
      const semesterCheck = await pool.request()
        .input('code', sql.VarChar, semester.code)
        .query('SELECT SemesterID FROM Semesters WHERE SemesterCode = @code');
      
      if (semesterCheck.recordset.length === 0) {
        await pool.request()
          .input('code', sql.VarChar, semester.code)
          .input('name', sql.NVarChar, semester.name)
          .input('startDate', sql.Date, semester.startDate)
          .input('endDate', sql.Date, semester.endDate)
          .input('isCurrent', sql.Bit, semester.isCurrent)
          .query(`
            INSERT INTO Semesters (SemesterCode, SemesterName, StartDate, EndDate, IsCurrent, Status)
            VALUES (@code, @name, @startDate, @endDate, @isCurrent, 'Ongoing')
          `);
        console.log(`Added semester: ${semester.name}`);
      } else {
        console.log(`Semester ${semester.name} already exists`);
      }
    }

    // Insert subjects
    for (const subject of subjects) {
      // Check if subject already exists
      const subjectCheck = await pool.request()
        .input('code', sql.VarChar, subject.code)
        .query('SELECT SubjectID FROM Subjects WHERE SubjectCode = @code');
      
      if (subjectCheck.recordset.length === 0) {
        await pool.request()
          .input('code', sql.VarChar, subject.code)
          .input('name', sql.NVarChar, subject.name)
          .input('credits', sql.Int, subject.credits)
          .input('department', sql.NVarChar, subject.department)
          .query(`
            INSERT INTO Subjects (SubjectCode, SubjectName, Credits, Department, IsActive)
            VALUES (@code, @name, @credits, @department, 1)
          `);
        console.log(`Added subject: ${subject.name}`);
      } else {
        console.log(`Subject ${subject.name} already exists`);
      }
    }

    // Insert users and student details
    for (const student of students) {
      // Check if user already exists
      const userCheck = await pool.request()
        .input('email', sql.VarChar, student.email)
        .query('SELECT UserID FROM Users WHERE Email = @email');
      
      let userId;
      if (userCheck.recordset.length === 0) {
        // Insert user
        const userResult = await pool.request()
          .input('username', sql.VarChar, student.code)
          .input('email', sql.VarChar, student.email)
          .input('password', sql.VarChar, 'password123') // In a real app, this would be hashed
          .input('fullName', sql.NVarChar, student.fullName)
          .query(`
            INSERT INTO Users (Username, Email, Password, FullName, Role, AccountStatus)
            VALUES (@username, @email, @password, @fullName, 'STUDENT', 'ACTIVE');
            SELECT SCOPE_IDENTITY() AS UserID;
          `);
        userId = userResult.recordset[0].UserID;
        console.log(`Added user: ${student.fullName}`);

        // Insert student details
        await pool.request()
          .input('userId', sql.BigInt, userId)
          .input('studentCode', sql.VarChar, student.code)
          .query(`
            INSERT INTO StudentDetails (UserID, StudentCode, Gender, AcademicStatus)
            VALUES (@userId, @studentCode, 'Male', 'Regular')
          `);
        console.log(`Added student details for: ${student.fullName}`);

        // Assign to first program
        const firstProgram = await pool.request()
          .query('SELECT TOP 1 ProgramID FROM AcademicPrograms');
        
        if (firstProgram.recordset.length > 0) {
          await pool.request()
            .input('userId', sql.BigInt, userId)
            .input('programId', sql.BigInt, firstProgram.recordset[0].ProgramID)
            .query(`
              INSERT INTO StudentPrograms (UserID, ProgramID, EntryYear, Status, IsPrimary)
              VALUES (@userId, @programId, 2020, 'Active', 1)
            `);
          console.log(`Assigned ${student.fullName} to program`);
        }
      } else {
        userId = userCheck.recordset[0].UserID;
        console.log(`User ${student.fullName} already exists`);
      }
    }

    // Insert course classes
    const semestersResult = await pool.request()
      .query('SELECT SemesterID, SemesterName FROM Semesters');
    
    const subjectsResult = await pool.request()
      .query('SELECT SubjectID, SubjectName FROM Subjects');

    // Get a teacher ID
    let teacherId;
    const teacherCheck = await pool.request()
      .query("SELECT TOP 1 UserID FROM Users WHERE Role = 'TEACHER'");
    
    if (teacherCheck.recordset.length === 0) {
      // No teacher found, create one
      const teacherResult = await pool.request()
        .query(`
          INSERT INTO Users (Username, Email, Password, FullName, Role, AccountStatus)
          VALUES ('teacher1', 'teacher1@example.com', 'password123', 'Teacher One', 'TEACHER', 'ACTIVE');
          SELECT SCOPE_IDENTITY() AS UserID;
        `);
      teacherId = teacherResult.recordset[0].UserID;
      console.log('Created a teacher');
    } else {
      teacherId = teacherCheck.recordset[0].UserID;
    }

    // Create course classes
    for (const semester of semestersResult.recordset) {
      for (const subject of subjectsResult.recordset) {
        // Check if class already exists
        const classCheck = await pool.request()
          .input('semesterId', sql.BigInt, semester.SemesterID)
          .input('subjectId', sql.BigInt, subject.SubjectID)
          .query('SELECT ClassID FROM CourseClasses WHERE SemesterID = @semesterId AND SubjectID = @subjectId');
        
        if (classCheck.recordset.length === 0) {
          // Create a more unique class code using subject code and semester ID
          const classCode = `${subject.SubjectID}-${semester.SemesterID}`;
          await pool.request()
            .input('classCode', sql.VarChar, classCode)
            .input('subjectId', sql.BigInt, subject.SubjectID)
            .input('semesterId', sql.BigInt, semester.SemesterID)
            .input('teacherId', sql.BigInt, teacherId)
            .query(`
              INSERT INTO CourseClasses (ClassCode, SubjectID, SemesterID, TeacherID, MaxStudents, Status)
              VALUES (@classCode, @subjectId, @semesterId, @teacherId, 30, 'Ongoing')
            `);
          console.log(`Created class: ${classCode}`);
        } else {
          console.log(`Class for ${subject.SubjectName} in ${semester.SemesterName} already exists`);
        }
      }
    }

    // Get students
    const studentsResult = await pool.request()
      .query(`
        SELECT u.UserID, u.FullName, sd.StudentCode 
        FROM Users u 
        JOIN StudentDetails sd ON u.UserID = sd.UserID 
        WHERE u.Role = 'STUDENT'
      `);

    // Get classes
    const classesResult = await pool.request()
      .query(`
        SELECT cc.ClassID, cc.ClassCode, s.SubjectID, s.SubjectName, sem.SemesterName
        FROM CourseClasses cc
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
      `);

    // Register students to classes and create academic results
    for (const student of studentsResult.recordset) {
      for (const classInfo of classesResult.recordset) {
        // Check if already registered
        const registrationCheck = await pool.request()
          .input('userId', sql.BigInt, student.UserID)
          .input('classId', sql.BigInt, classInfo.ClassID)
          .query('SELECT RegistrationID FROM CourseRegistrations WHERE UserID = @userId AND ClassID = @classId');
        
        if (registrationCheck.recordset.length === 0) {
          // Register student
          await pool.request()
            .input('userId', sql.BigInt, student.UserID)
            .input('classId', sql.BigInt, classInfo.ClassID)
            .query(`
              INSERT INTO CourseRegistrations (UserID, ClassID, Status, AdminApproval)
              VALUES (@userId, @classId, 'Approved', 1)
            `);
          console.log(`Registered ${student.FullName} to ${classInfo.ClassCode}`);

          // Create random academic result
          const isPassed = Math.random() > 0.2; // 80% chance of passing
          const totalScore = isPassed ? 5 + Math.random() * 5 : 2 + Math.random() * 3; // Between 5-10 if passed, 2-5 if failed
          const letterGrade = totalScore >= 8.5 ? 'A' : totalScore >= 7 ? 'B' : totalScore >= 5.5 ? 'C' : totalScore >= 4 ? 'D' : 'F';
          
          // Check if result already exists
          const resultCheck = await pool.request()
            .input('userId', sql.BigInt, student.UserID)
            .input('classId', sql.BigInt, classInfo.ClassID)
            .query('SELECT ResultID FROM AcademicResults WHERE UserID = @userId AND ClassID = @classId');
          
          if (resultCheck.recordset.length === 0) {
            await pool.request()
              .input('userId', sql.BigInt, student.UserID)
              .input('classId', sql.BigInt, classInfo.ClassID)
              .input('attendanceScore', sql.Decimal, 7 + Math.random() * 3) // 7-10
              .input('assignmentScore', sql.Decimal, 6 + Math.random() * 4) // 6-10
              .input('midtermScore', sql.Decimal, 5 + Math.random() * 5) // 5-10
              .input('finalScore', sql.Decimal, 4 + Math.random() * 6) // 4-10
              .input('totalScore', sql.Decimal, totalScore)
              .input('letterGrade', sql.VarChar, letterGrade)
              .input('gpa', sql.Decimal, totalScore / 2.5) // Simple conversion
              .input('isCompleted', sql.Bit, 1)
              .input('isPassed', sql.Bit, isPassed ? 1 : 0)
              .query(`
                INSERT INTO AcademicResults (
                  UserID, ClassID, AttendanceScore, AssignmentScore, MidtermScore,
                  FinalScore, TotalScore, LetterGrade, GPA, IsCompleted, IsPassed
                ) VALUES (
                  @userId, @classId, @attendanceScore, @assignmentScore, @midtermScore,
                  @finalScore, @totalScore, @letterGrade, @gpa, @isCompleted, @isPassed
                )
              `);
            console.log(`Created academic result for ${student.FullName} in ${classInfo.ClassCode}`);
          } else {
            console.log(`Academic result for ${student.FullName} in ${classInfo.ClassCode} already exists`);
          }
        } else {
          console.log(`${student.FullName} already registered to ${classInfo.ClassCode}`);
        }
      }
    }

    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Error during setup:', error);
  } finally {
    process.exit(0);
  }
};

setupData(); 