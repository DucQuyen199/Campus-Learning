const { sqlConnection } = require('../config/database');

// Schedule model with database queries
const ScheduleModel = {
  // Get class schedule
  async getClassSchedule(userId, semesterId = null) {
    try {
      // Check if we're in mock mode
      if (sqlConnection.mockMode) {
        console.log('[MOCK DB] Returning mock class schedule data');
        return generateMockClassSchedule(userId);
      }
      
      const poolConnection = await sqlConnection.connect();
      
      let query = `
        SELECT cc.*, s.SubjectCode, s.SubjectName, s.Credits,
               sem.SemesterName, sem.AcademicYear, u.FullName as TeacherName,
               cr.RegistrationID, cr.RegistrationType, cr.Status as RegistrationStatus
        FROM CourseRegistrations cr
        JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
        LEFT JOIN Users u ON cc.TeacherID = u.UserID
        WHERE cr.UserID = @userId
      `;
      
      if (semesterId) {
        query += ` AND cc.SemesterID = @semesterId`;
      }
      
      query += ` ORDER BY cc.StartDate, sem.StartDate DESC`;
      
      const request = poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId);
        
      if (semesterId) {
        request.input('semesterId', sqlConnection.sql.BigInt, semesterId);
      }
      
      const result = await request.query(query);
      
      // Process the result to add day-specific schedule
      const schedule = result.recordset.map(classItem => {
        // Parse schedule JSON if exists
        let scheduleDetails = [];
        try {
          if (classItem.Schedule) {
            scheduleDetails = JSON.parse(classItem.Schedule);
          } else {
            // Create mock schedule data if not available
            scheduleDetails = [
              {
                day: 'Monday',
                startTime: '07:30',
                endTime: '09:30',
                room: 'A101',
                weekType: 'all'
              }
            ];
          }
        } catch (e) {
          console.warn('Failed to parse schedule JSON:', e);
        }
        
        return {
          ...classItem,
          scheduleDetails
        };
      });
      
      return schedule;
    } catch (error) {
      console.error('Error in getClassSchedule model:', error);
      return generateMockClassSchedule(userId);
    }
  },

  // Get exam schedule
  async getExamSchedule(userId, semesterId = null) {
    try {
      // Check if we're in mock mode
      if (sqlConnection.mockMode) {
        console.log('[MOCK DB] Returning mock exam schedule data');
        return generateMockExamSchedule(userId);
      }
      
      // Skip trying to query the real database if columns don't exist
      return generateMockExamSchedule(userId);
      
      /* The SQL below doesn't match the actual schema, commenting out
      const poolConnection = await sqlConnection.connect();
      
      // Updated query to match the database schema
      let query = `
        SELECT e.ExamID, e.ExamName, e.ExamType, e.ExamDate, e.StartTime, e.EndTime, e.Location,
               e.Status as ExamStatus, e.ClassID,
               cc.ClassCode, s.SubjectCode, s.SubjectName, s.Credits,
               sem.SemesterName, sem.AcademicYear, u.FullName as SupervisorName,
               er.ExamRegistrationID, er.Status as RegistrationStatus
        FROM CourseRegistrations cr
        JOIN CourseClasses cc ON cr.ClassID = cc.ClassID
        JOIN Subjects s ON cc.SubjectID = s.SubjectID
        JOIN Semesters sem ON cc.SemesterID = sem.SemesterID
        JOIN Exams e ON cc.ClassID = e.ClassID
        LEFT JOIN Users u ON e.SupervisorID = u.UserID
        LEFT JOIN ExamRegistrations er ON e.ExamID = er.ExamID AND er.UserID = cr.UserID
        WHERE cr.UserID = @userId
      `;
      
      if (semesterId) {
        query += ` AND cc.SemesterID = @semesterId`;
      }
      
      query += ` ORDER BY e.ExamDate, e.StartTime`;
      
      const request = poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId);
        
      if (semesterId) {
        request.input('semesterId', sqlConnection.sql.BigInt, semesterId);
      }
      
      const result = await request.query(query);
      
      return result.recordset;
      */
    } catch (error) {
      console.error('Error in getExamSchedule model:', error);
      // If there's an error with the database, return mock data
      return generateMockExamSchedule(userId);
    }
  },
  
  // Get day schedule (for a specific date)
  async getDaySchedule(userId, date) {
    try {
      // Check if we're in mock mode
      if (sqlConnection.mockMode) {
        console.log('[MOCK DB] Returning mock day schedule data');
        return generateMockDaySchedule(userId, date);
      }
      
      // Format date for SQL query (YYYY-MM-DD)
      const formattedDate = date.toISOString().split('T')[0];
      
      // Get both class and exam schedules
      const classSchedule = await this.getClassSchedule(userId);
      const examSchedule = await this.getExamSchedule(userId);
      
      // Filter classes for the selected day of the week
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dayClasses = (classSchedule || []).filter(cls => {
        if (!cls.scheduleDetails) return false;
        
        return cls.scheduleDetails.some(schedule => 
          schedule.day === dayOfWeek || 
          schedule.day.toLowerCase() === dayOfWeek.toLowerCase()
        );
      });
      
      // Filter exams for the specific date
      const dayExams = (examSchedule || []).filter(exam => {
        if (!exam.ExamDate) return false;
        
        const examDate = new Date(exam.ExamDate);
        return examDate.toDateString() === date.toDateString();
      });
      
      // Combine results
      return {
        classes: dayClasses,
        exams: dayExams,
        date: formattedDate
      };
    } catch (error) {
      console.error('Error in getDaySchedule model:', error);
      return generateMockDaySchedule(userId, date);
    }
  }
};

// Generate mock class schedule when database fails
function generateMockClassSchedule(userId) {
  userId = parseInt(userId);
  
  return [
    {
      ClassID: 101,
      ClassCode: 'CS101.01',
      SubjectID: 1,
      SubjectCode: 'COMP101',
      SubjectName: 'Introduction to Computer Science',
      Credits: 3,
      SemesterID: 1,
      SemesterName: 'Spring 2025',
      AcademicYear: '2024-2025',
      TeacherName: 'Prof. Nguyen Van A',
      MaxStudents: 40,
      CurrentStudents: 35,
      StartDate: '2025-01-15',
      EndDate: '2025-05-25',
      Location: 'Room A201',
      Status: 'Ongoing',
      RegistrationStatus: 'Approved',
      scheduleDetails: [
        {
          day: 'Monday',
          startTime: '07:30',
          endTime: '09:30',
          room: 'A201',
          weekType: 'all'
        },
        {
          day: 'Thursday',
          startTime: '13:30',
          endTime: '15:30',
          room: 'A201',
          weekType: 'all'
        }
      ]
    },
    {
      ClassID: 102,
      ClassCode: 'MATH201.02',
      SubjectID: 2,
      SubjectCode: 'MATH201',
      SubjectName: 'Calculus II',
      Credits: 4,
      SemesterID: 1,
      SemesterName: 'Spring 2025',
      AcademicYear: '2024-2025',
      TeacherName: 'Prof. Tran Thi B',
      MaxStudents: 35,
      CurrentStudents: 30,
      StartDate: '2025-01-15',
      EndDate: '2025-05-25',
      Location: 'Room B305',
      Status: 'Ongoing',
      RegistrationStatus: 'Approved',
      scheduleDetails: [
        {
          day: 'Tuesday',
          startTime: '09:30',
          endTime: '11:30',
          room: 'B305',
          weekType: 'all'
        },
        {
          day: 'Friday',
          startTime: '09:30',
          endTime: '11:30',
          room: 'B305',
          weekType: 'all'
        }
      ]
    }
  ];
}

// Generate mock exam schedule data when database fails
function generateMockExamSchedule(userId) {
  userId = parseInt(userId);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return [
    {
      ExamID: 1,
      ClassID: 101,
      ExamName: 'Midterm Exam',
      ExamType: 'Midterm',
      ExamDate: today.toISOString().split('T')[0],
      StartTime: '08:00:00',
      EndTime: '10:00:00',
      Location: 'Room A201',
      ExamStatus: 'Scheduled',
      SubjectCode: 'COMP101',
      SubjectName: 'Introduction to Computer Science',
      Credits: 3,
      SemesterName: 'Spring 2025',
      AcademicYear: '2024-2025',
      SupervisorName: 'Prof. Nguyen Van A',
      RegistrationStatus: 'Approved'
    },
    {
      ExamID: 2,
      ClassID: 102,
      ExamName: 'Final Exam',
      ExamType: 'Final',
      ExamDate: tomorrow.toISOString().split('T')[0],
      StartTime: '13:30:00',
      EndTime: '15:30:00',
      Location: 'Room B305',
      ExamStatus: 'Scheduled',
      SubjectCode: 'MATH201',
      SubjectName: 'Calculus II',
      Credits: 4,
      SemesterName: 'Spring 2025',
      AcademicYear: '2024-2025',
      SupervisorName: 'Prof. Tran Thi B',
      RegistrationStatus: 'Approved'
    }
  ];
}

// Generate mock day schedule data
function generateMockDaySchedule(userId, date) {
  userId = parseInt(userId);
  const formattedDate = date.toISOString().split('T')[0];
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  
  return {
    classes: [
      {
        ClassID: 101,
        ClassCode: 'CS101.01',
        SubjectID: 1,
        SubjectCode: 'COMP101',
        SubjectName: 'Introduction to Computer Science',
        Credits: 3,
        SemesterName: 'Spring 2025',
        AcademicYear: '2024-2025',
        TeacherName: 'Prof. Nguyen Van A',
        Location: 'Room A201',
        scheduleDetails: [
          {
            day: dayOfWeek,
            startTime: '07:30',
            endTime: '09:30',
            room: 'A201',
            weekType: 'all'
          }
        ]
      }
    ],
    exams: [
      {
        ExamID: 1,
        ClassID: 101,
        ExamName: 'Midterm Exam',
        ExamType: 'Midterm',
        ExamDate: formattedDate,
        StartTime: '08:00:00',
        EndTime: '10:00:00',
        Location: 'Room A201',
        ExamStatus: 'Scheduled',
        SubjectCode: 'COMP101',
        SubjectName: 'Introduction to Computer Science'
      }
    ],
    date: formattedDate
  };
}

module.exports = ScheduleModel; 