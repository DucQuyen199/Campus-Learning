const { sqlConnection } = require('../config/database');

const AcademicTranscriptModel = {
  /**
   * Get academic summary for a student
   */
  async getAcademicSummary(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Get student information
      const studentResult = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT 
            u.Username as StudentId,
            u.FullName as Name,
            sd.StudentCode,
            s.SubjectName as Major,
            f.FacultyName as Faculty,
            ap.ProgramName as ProgramName,
            YEAR(sd.EnrollmentDate) as EnrollmentYear,
            DATEADD(YEAR, ap.ProgramDuration/2, sd.EnrollmentDate) as ExpectedGraduation
          FROM Users u
          LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
          LEFT JOIN StudentPrograms sp ON u.UserID = sp.UserID AND sp.IsPrimary = 1
          LEFT JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
          LEFT JOIN Subjects s ON ap.MajorSubjectID = s.SubjectID
          LEFT JOIN Faculties f ON ap.FacultyID = f.FacultyID
          WHERE u.UserID = @userId
        `);
      
      if (studentResult.recordset.length === 0) {
        throw new Error('Student not found');
      }
      
      const studentInfo = studentResult.recordset[0];
      
      // Get GPA and credit stats
      const academicResult = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT 
            ISNULL(AVG(ar.TotalScore), 0) as OverallGPA,
            SUM(CASE WHEN ar.IsPassed = 1 THEN sub.Credits ELSE 0 END) as CompletedCredits,
            (SELECT SUM(Credits) FROM ProgramSubjects ps 
              INNER JOIN StudentPrograms sp ON ps.ProgramID = sp.ProgramID
              INNER JOIN Subjects sub ON ps.SubjectID = sub.SubjectID
              WHERE sp.UserID = @userId AND sp.IsPrimary = 1) as RequiredCredits
          FROM AcademicResults ar
          INNER JOIN CourseClasses cc ON ar.ClassID = cc.ClassID
          INNER JOIN Subjects sub ON cc.SubjectID = sub.SubjectID
          WHERE ar.UserID = @userId AND ar.IsCompleted = 1
        `);
      
      // Format expected graduation date
      let expectedGraduation = 'N/A';
      if (studentInfo.ExpectedGraduation) {
        expectedGraduation = new Date(studentInfo.ExpectedGraduation).getFullYear().toString();
      }
      
      // Return combined result
      return {
        studentId: studentInfo.StudentCode || studentInfo.StudentId,
        name: studentInfo.Name,
        major: studentInfo.Major || 'Not specified',
        faculty: studentInfo.Faculty || 'Not specified',
        program: studentInfo.ProgramName || 'Regular',
        enrollmentYear: studentInfo.EnrollmentYear?.toString() || 'Not specified',
        expectedGraduation: expectedGraduation,
        overallGPA: Number(academicResult.recordset[0].OverallGPA) || 0,
        completedCredits: Number(academicResult.recordset[0].CompletedCredits) || 0,
        requiredCredits: Number(academicResult.recordset[0].RequiredCredits) || 0
      };
    } catch (error) {
      console.error('Error in getAcademicSummary model:', error);
      throw error;
    }
  },

  /**
   * Get all semesters with grades for a student
   */
  async getStudentSemesters(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Get the unique semesters where student has grades
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT DISTINCT
            s.SemesterID,
            s.SemesterCode,
            s.SemesterName,
            s.AcademicYear
          FROM AcademicResults ar
          INNER JOIN CourseClasses cc ON ar.ClassID = cc.ClassID
          INNER JOIN Semesters s ON cc.SemesterID = s.SemesterID
          WHERE ar.UserID = @userId AND ar.IsCompleted = 1
          ORDER BY s.StartDate DESC
        `);
      
      if (result.recordset.length === 0) {
        return [];
      }
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getStudentSemesters model:', error);
      throw new Error('Failed to retrieve student semesters');
    }
  },

  /**
   * Get grades for a specific semester
   */
  async getSemesterGrades(userId, semesterId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Get semester info
      const semesterResult = await poolConnection.request()
        .input('semesterId', sqlConnection.sql.BigInt, semesterId)
        .query(`
          SELECT SemesterID, SemesterCode, SemesterName, AcademicYear
          FROM Semesters
          WHERE SemesterID = @semesterId
        `);
      
      if (semesterResult.recordset.length === 0) {
        throw new Error('Semester not found');
      }
      
      const semesterInfo = semesterResult.recordset[0];
      
      // Get grades for this semester
      const gradesResult = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .input('semesterId', sqlConnection.sql.BigInt, semesterId)
        .query(`
          SELECT 
            ar.ResultID as id,
            sub.SubjectCode as courseCode,
            sub.SubjectName as courseName,
            sub.Credits as credits,
            ar.LetterGrade as grade,
            ar.GPA as points,
            cc.ClassCode as classCode,
            s.SemesterID,
            s.SemesterName,
            s.AcademicYear
          FROM AcademicResults ar
          INNER JOIN CourseClasses cc ON ar.ClassID = cc.ClassID
          INNER JOIN Subjects sub ON cc.SubjectID = sub.SubjectID
          INNER JOIN Semesters s ON cc.SemesterID = s.SemesterID
          WHERE ar.UserID = @userId 
            AND s.SemesterID = @semesterId 
            AND ar.IsCompleted = 1
          ORDER BY sub.SubjectCode
        `);
      
      // Calculate semester GPA
      let gpa = 0;
      if (gradesResult.recordset.length > 0) {
        const totalPoints = gradesResult.recordset.reduce(
          (sum, course) => sum + (course.points * course.credits), 0
        );
        const totalCredits = gradesResult.recordset.reduce(
          (sum, course) => sum + course.credits, 0
        );
        gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
      }
      
      return {
        semester: {
          id: semesterInfo.SemesterID,
          code: semesterInfo.SemesterCode,
          name: semesterInfo.SemesterName,
          academicYear: semesterInfo.AcademicYear
        },
        courses: gradesResult.recordset,
        gpa: gpa,
      };
    } catch (error) {
      console.error('Error in getSemesterGrades model:', error);
      throw error;
    }
  },

  /**
   * Get all grades for a student across all semesters
   */
  async getAllGrades(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Get academic summary
      const summary = await this.getAcademicSummary(userId);
      
      // Get all grades
      const gradesResult = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT 
            ar.ResultID as id,
            sub.SubjectCode as courseCode,
            sub.SubjectName as courseName,
            sub.Credits as credits,
            ar.LetterGrade as grade,
            ar.GPA as points,
            cc.ClassCode as classCode,
            s.SemesterID,
            s.SemesterName,
            s.AcademicYear
          FROM AcademicResults ar
          INNER JOIN CourseClasses cc ON ar.ClassID = cc.ClassID
          INNER JOIN Subjects sub ON cc.SubjectID = sub.SubjectID
          INNER JOIN Semesters s ON cc.SemesterID = s.SemesterID
          WHERE ar.UserID = @userId AND ar.IsCompleted = 1
          ORDER BY s.StartDate DESC, sub.SubjectCode
        `);
      
      // Get list of all semesters with grades
      const semesters = await this.getStudentSemesters(userId);
      
      // Organize by semester
      const gradeBySemester = {};
      semesters.forEach(semester => {
        gradeBySemester[semester.SemesterCode] = gradesResult.recordset
          .filter(grade => grade.SemesterID === semester.SemesterID);
      });
      
      // Calculate semester GPAs
      const semesterGPAs = {};
      semesters.forEach(semester => {
        const courses = gradeBySemester[semester.SemesterCode];
        if (courses && courses.length > 0) {
          const totalPoints = courses.reduce(
            (sum, course) => sum + (course.points * course.credits), 0
          );
          const totalCredits = courses.reduce(
            (sum, course) => sum + course.credits, 0
          );
          semesterGPAs[semester.SemesterCode] = totalCredits > 0 ? totalPoints / totalCredits : 0;
        } else {
          semesterGPAs[semester.SemesterCode] = 0;
        }
      });
      
      return {
        summary: summary,
        semesters: semesters,
        courses: gradesResult.recordset,
        gradeBySemester: gradeBySemester,
        semesterGPAs: semesterGPAs
      };
    } catch (error) {
      console.error('Error in getAllGrades model:', error);
      throw error;
    }
  }
};

module.exports = AcademicTranscriptModel; 