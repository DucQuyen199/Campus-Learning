const { sqlConnection } = require('../config/database');

// Profile model with database queries
const ProfileModel = {
  // Get user profile
  async getProfile(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT 
            u.UserID, u.Username, u.Email, u.FullName, u.DateOfBirth, 
            u.School, u.Role, u.Status, u.AccountStatus, u.Bio, u.Provider,
            u.EmailVerified, u.PhoneNumber, u.Address, u.City, u.Country,
            u.LastLoginAt, u.Avatar,
            up.Education, up.WorkExperience, up.Skills, up.Interests, 
            up.SocialLinks, up.Achievements, up.PreferredLanguage, up.TimeZone,
            sd.StudentCode, sd.IdentityCardNumber, sd.IdentityCardIssueDate,
            sd.IdentityCardIssuePlace, sd.Gender, sd.MaritalStatus, 
            sd.BirthPlace, sd.Ethnicity, sd.Religion, sd.HomeTown,
            sd.ParentName, sd.ParentPhone, sd.ParentEmail,
            sd.EmergencyContact, sd.EmergencyPhone, sd.HealthInsuranceNumber,
            sd.BloodType, sd.EnrollmentDate, sd.GraduationDate, sd.Class,
            sd.CurrentSemester, sd.AcademicStatus, sd.BankAccountNumber, sd.BankName,
            ap.ProgramName, ap.Department, ap.Faculty, ap.TotalCredits,
            ap.ProgramDuration, ap.DegreeName, ap.ProgramType,
            sp.EntryYear, sp.ExpectedGraduationYear, sp.Status AS ProgramStatus,
            adv.FullName AS AdvisorName, adv.Email AS AdvisorEmail, 
            adv.PhoneNumber AS AdvisorPhone
          FROM Users u
          LEFT JOIN UserProfiles up ON u.UserID = up.UserID
          LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
          LEFT JOIN StudentPrograms sp ON u.UserID = sp.UserID
          LEFT JOIN AcademicPrograms ap ON sp.ProgramID = ap.ProgramID
          LEFT JOIN Users adv ON sp.AdvisorID = adv.UserID
          WHERE u.UserID = @userId AND (sp.IsPrimary = 1 OR sp.IsPrimary IS NULL)
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error in getProfile model:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(userId, profileData) {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Start a transaction
      const transaction = new sqlConnection.sql.Transaction(poolConnection);
      await transaction.begin();
      
      try {
        // Update Users table
        await poolConnection.request()
          .input('userId', sqlConnection.sql.BigInt, userId)
          .input('phoneNumber', sqlConnection.sql.VarChar(15), profileData.phoneNumber)
          .input('address', sqlConnection.sql.NVarChar(255), profileData.address)
          .input('city', sqlConnection.sql.NVarChar(100), profileData.city)
          .input('country', sqlConnection.sql.NVarChar(100), profileData.country)
          .input('bio', sqlConnection.sql.NVarChar(500), profileData.bio)
          .input('updatedAt', sqlConnection.sql.DateTime, new Date())
          .query(`
            UPDATE Users 
            SET 
              PhoneNumber = @phoneNumber, 
              Address = @address,
              City = @city,
              Country = @country,
              Bio = @bio,
              UpdatedAt = @updatedAt
            WHERE UserID = @userId
          `);
        
        // Record the update in ProfileUpdates table
        await poolConnection.request()
          .input('userId', sqlConnection.sql.BigInt, userId)
          .input('fieldName', sqlConnection.sql.VarChar(50), 'Profile')
          .input('oldValue', sqlConnection.sql.NVarChar(sqlConnection.sql.MAX), null)
          .input('newValue', sqlConnection.sql.NVarChar(sqlConnection.sql.MAX), JSON.stringify(profileData))
          .input('updateTime', sqlConnection.sql.DateTime, new Date())
          .input('status', sqlConnection.sql.VarChar(20), 'Approved')
          .query(`
            INSERT INTO ProfileUpdates (UserID, FieldName, OldValue, NewValue, UpdateTime, Status)
            VALUES (@userId, @fieldName, @oldValue, @newValue, @updateTime, @status)
          `);
        
        // Commit the transaction
        await transaction.commit();
        
        // Get the updated profile
        const updatedProfile = await this.getProfile(userId);
        
        return updatedProfile;
      } catch (error) {
        // If there's an error, roll back the transaction
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in updateProfile model:', error);
      throw error;
    }
  },

  // Get profile updates history
  async getProfileUpdates(userId) {
    try {
      const poolConnection = await sqlConnection.connect();
      const result = await poolConnection.request()
        .input('userId', sqlConnection.sql.BigInt, userId)
        .query(`
          SELECT pu.*, u.FullName as ApprovedByName
          FROM ProfileUpdates pu
          LEFT JOIN Users u ON pu.ApprovedBy = u.UserID
          WHERE pu.UserID = @userId
          ORDER BY pu.UpdateTime DESC
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error in getProfileUpdates model:', error);
      throw error;
    }
  }
};

module.exports = ProfileModel; 