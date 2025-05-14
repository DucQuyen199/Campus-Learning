const sql = require('mssql');
const dotenv = require('dotenv');
const { demoMode } = require('./app');

// Load environment variables
dotenv.config();

// Database configuration with default fallbacks
const dbConfig = {
  user: process.env.SQL_USER || process.env.DB_USER || 'sa',
  password: process.env.SQL_PASSWORD || process.env.DB_PASSWORD || '123456aA@$',
  server: process.env.SQL_SERVER || process.env.DB_SERVER || 'localhost',
  database: process.env.SQL_DATABASE || process.env.DB_NAME || 'SinhVienDB',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Create singleton for SQL connection
const sqlConnection = {
  sql: sql,
  pool: null,
  mockMode: demoMode || process.env.DEMO_MODE === 'true' || false,
  connect: async function() {
    // If mock mode is enabled, return a mock connection
    if (this.mockMode) {
      console.log('Running in mock/demo mode - no real database connection will be made');
      return this.getMockPool();
    }
    
    try {
      // If pool already exists, return it
      if (this.pool) {
        console.log('Using existing SQL connection pool');
        return this.pool;
      }
      
      console.log('Connecting to SQL Server...');
      
      try {
        // First attempt with current config
        this.pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server successfully');
        return this.pool;
      } catch (firstErr) {
        console.warn('First connection attempt failed:', firstErr.message);
        
        // Try alternative configuration
        console.log('Trying alternative connection configuration...');
        const altConfig = {
          ...dbConfig,
          options: {
            ...dbConfig.options,
            encrypt: !dbConfig.options.encrypt, // Try opposite encrypt setting
            port: 1433 // Explicitly set default SQL Server port
          }
        };
        
        console.log(`Alternative connection info:
          Server: ${altConfig.server}
          Database: ${altConfig.database}
          Encrypt: ${altConfig.options.encrypt}
          Port: ${altConfig.options.port}
        `);
        
        try {
          this.pool = await sql.connect(altConfig);
          console.log('Connected to SQL Server with alternative config');
          return this.pool;
        } catch (secondErr) {
          console.error('Alternative connection also failed:', secondErr.message);
          console.log('Switching to mock/demo mode - using simulated data');
          this.mockMode = true;
          return this.getMockPool();
        }
      }
    } catch (err) {
      console.error('Database connection failed:', err);
      console.error('Database connection details:', {
        server: dbConfig.server,
        database: dbConfig.database,
        user: dbConfig.user,
        // Don't log password
      });
      console.log('Switching to mock/demo mode - using simulated data');
      this.mockMode = true;
      return this.getMockPool();
    }
  },
  
  // Create a mock pool that simulates database operations
  getMockPool: function() {
    const self = this;
    return {
      request: () => {
        // Create a mock request object that preserves method chaining
        const mockRequest = {
          _params: {},
          
          // Store params for reference
          input: function(paramName, paramType, paramValue) {
            this._params[paramName] = paramValue;
            return this; // Return self for chaining
          },
          
          // Mock query execution
          query: async function(queryText) {
            console.log(`[MOCK DB] Query executed: ${queryText.substring(0, 100)}...`);
            
            // Generate mock data based on the query
            return self.generateMockQueryResult(queryText, this._params);
          }
        };
        
        return mockRequest;
      }
    };
  },
  
  // Generate mock data based on query
  generateMockQueryResult: function(query, params) {
    // Clear params for next request
    const savedParams = {...params} || {};
    
    console.log(`[MOCK DB] Processing query with params:`, savedParams);
    
    // Handle different types of queries based on tables mentioned
    if (query.includes('Users') && query.includes('UserProfiles') && query.includes('StudentDetails')) {
      // This is a profile query
      return {
        recordset: [{
          UserID: savedParams.userId || 1,
          Username: `student${savedParams.userId || 1}`,
          Email: `student${savedParams.userId || 1}@example.com`,
          FullName: `Sinh Viên ${savedParams.userId || 1}`,
          PhoneNumber: '0987654321',
          Address: 'Hà Nội, Việt Nam',
          DateOfBirth: '2000-01-01',
          Gender: 'Nam',
          StudentID: `SV${(savedParams.userId || 1).toString().padStart(6, '0')}`,
          Faculty: 'Công nghệ thông tin',
          Program: 'Kỹ sư phần mềm',
          EnrollmentYear: 2020
        }]
      };
    } else if (query.includes('AcademicWarnings')) {
      // This is an academic warnings query
      return {
        recordset: [
          {
            WarningID: 1,
            UserID: savedParams.userId || 1,
            SemesterID: 1,
            WarningType: 'Level1',
            Reason: 'GPA dưới ngưỡng cho phép trong học kỳ',
            WarningDate: new Date().toISOString(),
            RequiredAction: 'Liên hệ với cố vấn học tập để được tư vấn',
            Status: 'Active',
            SemesterName: 'Học kỳ 1',
            AcademicYear: '2023-2024',
            CreatedByName: 'Giáo vụ khoa'
          }
        ]
      };
    } else if (query.includes('CourseRegistrations') && query.includes('CourseClasses')) {
      // This is a class schedule query
      return {
        recordset: [
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
            RegistrationType: 'Regular',
            RegistrationStatus: 'Approved',
            RegistrationID: 1001,
            Schedule: JSON.stringify([
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
            ])
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
            RegistrationType: 'Regular',
            RegistrationStatus: 'Approved',
            RegistrationID: 1002,
            Schedule: JSON.stringify([
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
            ])
          }
        ]
      };
    } else if (query.includes('Exams')) {
      // This is an exam schedule query
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return {
        recordset: [
          {
            ExamID: 1,
            ClassID: 101,
            ExamName: 'Midterm Exam',
            ExamType: 'Midterm',
            ExamDate: today.toISOString().split('T')[0],
            StartTime: '08:00:00',
            EndTime: '10:00:00',
            Location: 'Room A201',
            Status: 'Scheduled',
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
            Status: 'Scheduled',
            SubjectCode: 'MATH201',
            SubjectName: 'Calculus II',
            Credits: 4,
            SemesterName: 'Spring 2025',
            AcademicYear: '2024-2025',
            SupervisorName: 'Prof. Tran Thi B',
            RegistrationStatus: 'Approved'
          }
        ]
      };
    } else if (query.includes('ProfileUpdates')) {
      return {
        recordset: [{
          UpdateID: 1,
          UserID: savedParams.userId || 1,
          FieldName: 'PhoneNumber',
          OldValue: '0123456789',
          NewValue: '0987654321',
          UpdateTime: new Date().toISOString(),
          Status: 'Approved'
        }]
      };
    } else if (query.includes('Tuition')) {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 30);
      
      return {
        recordset: [{
          TuitionID: 1,
          UserID: savedParams.userId || 1,
          SemesterID: 3,
          TotalCredits: 15,
          AmountPerCredit: 850000,
          TotalAmount: 12750000,
          ScholarshipAmount: 0,
          FinalAmount: 12750000,
          DueDate: dueDate.toISOString(),
          Status: 'Unpaid',
          SemesterName: 'Học kỳ 1',
          AcademicYear: '2023-2024'
        }]
      };
    } else {
      // Default empty response
      console.log(`[MOCK DB] No specific mock data for this query type, returning empty recordset`);
      return { recordset: [] };
    }
  }
};

// Function to check if SQL Server is running
async function isSqlServerRunning(host, port) {
  if (demoMode || process.env.DEMO_MODE === 'true') {
    console.log('Demo mode enabled, skipping SQL Server check');
    return false;
  }
  
  return new Promise((resolve) => {
    const socket = new require('net').Socket();
    const timeoutId = setTimeout(() => {
      socket.destroy();
      console.log(`Connection to SQL Server at ${host}:${port} timed out`);
      resolve(false);
    }, 3000);
    
    socket.connect(port, host, () => {
      clearTimeout(timeoutId);
      socket.destroy();
      console.log(`SQL Server at ${host}:${port} is reachable`);
      resolve(true);
    });
    
    socket.on('error', (err) => {
      clearTimeout(timeoutId);
      console.log(`SQL Server at ${host}:${port} is not reachable:`, err.message);
      resolve(false);
    });
  });
}

module.exports = {
  dbConfig,
  sqlConnection,
  isSqlServerRunning
}; 