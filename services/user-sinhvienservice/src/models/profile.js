const { sqlConnection } = require('../config/database');

// Profile model with database queries
const ProfileModel = {
  // Get student profile by user ID
  async getProfileById(userId) {
    try {
      // Connect to database
      const poolConnection = await sqlConnection.connect();

      // Query to get full student profile by joining relevant tables
      const query = `
        SELECT 
          u.UserID, u.Username, u.Email, u.FullName, u.DateOfBirth, u.Role, 
          u.Status, u.PhoneNumber, u.Address, u.City, u.Country, u.Bio, 
          u.Image, u.CreatedAt, u.UpdatedAt,
          sd.StudentCode, sd.IdentityCardNumber, sd.IdentityCardIssueDate,
          sd.IdentityCardIssuePlace, sd.Gender, sd.MaritalStatus, 
          sd.BirthPlace, sd.Ethnicity, sd.Religion, sd.HomeTown,
          sd.ParentName, sd.ParentPhone, sd.ParentEmail,
          sd.EmergencyContact, sd.EmergencyPhone, sd.HealthInsuranceNumber,
          sd.BloodType, sd.EnrollmentDate, sd.GraduationDate, sd.Class,
          sd.CurrentSemester, sd.AcademicStatus, sd.BankAccountNumber, sd.BankName
        FROM Users u
        LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
        WHERE u.UserID = @userId
      `;

      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(query);

      return result.recordset[0];
    } catch (error) {
      console.error('Error in getProfileById:', error);
      throw error;
    }
  },

  // Get academic information for a student
  async getAcademicInfo(userId) {
    try {
      // Connect to database
      const poolConnection = await sqlConnection.connect();
      
      // Query academic program information
      const query = `
        SELECT 
          ap.ProgramID, ap.ProgramCode, ap.ProgramName, ap.Department, 
          ap.Faculty, ap.Description, ap.TotalCredits, ap.ProgramDuration,
          ap.DegreeName, ap.ProgramType,
          sp.EntryYear, sp.ExpectedGraduationYear, sp.Status,
          u.FullName as AdvisorName, u.Email as AdvisorEmail, u.PhoneNumber as AdvisorPhone
        FROM StudentPrograms sp
        JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
        LEFT JOIN Users u ON sp.AdvisorID = u.UserID
        WHERE sp.UserID = @userId
        ORDER BY sp.IsPrimary DESC
      `;
      
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(query);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getAcademicInfo:', error);
      throw error;
    }
  },

  // Get student metrics
  async getMetrics(userId) {
    try {
      // Connect to database
      const poolConnection = await sqlConnection.connect();
      
      // Query academic metrics
      const query = `
        SELECT 
          am.MetricID, am.SemesterID, am.TotalCredits, am.EarnedCredits,
          am.SemesterGPA, am.CumulativeGPA, am.AcademicStanding, am.RankInClass,
          am.CreditsRegistered, am.CreditsPassed, am.CreditsFailed,
          s.SemesterName, s.AcademicYear
        FROM AcademicMetrics am
        JOIN Semesters s ON am.SemesterID = s.SemesterID
        WHERE am.UserID = @userId
        ORDER BY s.StartDate DESC
      `;
      
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(query);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getMetrics:', error);
      throw error;
    }
  },

  // Update profile information
  async updateProfile(userId, profileData) {
    try {
      // Connect to database
      const poolConnection = await sqlConnection.connect();
      const transaction = new sqlConnection.sql.Transaction(poolConnection);
      
      try {
        await transaction.begin();
        
        // Update Users table with basic contact info
        await transaction.request()
          .input('userId', sqlConnection.sql.BigInt, userId)
          .input('phoneNumber', sqlConnection.sql.VarChar(15), profileData.phoneNumber)
          .input('address', sqlConnection.sql.NVarChar(255), profileData.address)
          .input('city', sqlConnection.sql.NVarChar(100), profileData.city)
          .input('country', sqlConnection.sql.NVarChar(100), profileData.country)
          .input('bio', sqlConnection.sql.NVarChar(500), profileData.bio)
          .query(`
            UPDATE Users
            SET PhoneNumber = @phoneNumber,
                Address = @address,
                City = @city,
                Country = @country,
                Bio = @bio,
                UpdatedAt = GETDATE()
            WHERE UserID = @userId
          `);
        
        // Update StudentDetails table with emergency contact and bank info
        await transaction.request()
          .input('userId', sqlConnection.sql.BigInt, userId)
          .input('emergencyContact', sqlConnection.sql.NVarChar(100), profileData.emergencyContact)
          .input('emergencyPhone', sqlConnection.sql.VarChar(15), profileData.emergencyPhone)
          .input('bankAccountNumber', sqlConnection.sql.VarChar(30), profileData.bankAccountNumber)
          .input('bankName', sqlConnection.sql.NVarChar(100), profileData.bankName)
          .query(`
            UPDATE StudentDetails
            SET EmergencyContact = @emergencyContact,
                EmergencyPhone = @emergencyPhone,
                BankAccountNumber = @bankAccountNumber,
                BankName = @bankName,
                UpdatedAt = GETDATE()
            WHERE UserID = @userId
          `);
        
        // Record the update in ProfileUpdates table
        await transaction.request()
          .input('userId', sqlConnection.sql.BigInt, userId)
          .input('fieldName', sqlConnection.sql.VarChar(50), 'Contact Information')
          .input('oldValue', sqlConnection.sql.NVarChar(sqlConnection.sql.MAX), JSON.stringify(profileData))
          .input('newValue', sqlConnection.sql.NVarChar(sqlConnection.sql.MAX), JSON.stringify(profileData))
          .query(`
            INSERT INTO ProfileUpdates (UserID, FieldName, OldValue, NewValue, Status)
            VALUES (@userId, @fieldName, @oldValue, @newValue, 'Approved')
          `);
        
        await transaction.commit();
        return true;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  },

  // Get profile update history
  async getProfileUpdates(userId) {
    try {
      // Connect to database
      const poolConnection = await sqlConnection.connect();
      
      // Query profile update history
      const query = `
        SELECT 
          UpdateID, UserID, FieldName, OldValue, NewValue, 
          UpdateTime, Status, ApprovedBy, ApprovedAt, Reason
        FROM ProfileUpdates
        WHERE UserID = @userId
        ORDER BY UpdateTime DESC
      `;
      
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(query);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getProfileUpdates:', error);
      throw error;
    }
  }
};

module.exports = ProfileModel; 