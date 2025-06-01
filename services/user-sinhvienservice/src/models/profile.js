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
  async updateProfile(userId, profileData, updateType = 'profile') {
    try {
      const poolConnection = await sqlConnection.connect();
      
      // Start a transaction
      const transaction = new sqlConnection.sql.Transaction(poolConnection);
      await transaction.begin();
      
      try {
        // Get the current profile data for tracking changes
        const currentProfile = await this.getProfile(userId);
        let oldValue = null;

        // Handle different types of profile updates
        switch(updateType) {
          case 'basicInfo': 
            // Update basic information in Users table
            await poolConnection.request()
              .input('userId', sqlConnection.sql.BigInt, userId)
              .input('fullName', sqlConnection.sql.NVarChar(100), profileData.FullName)
              .input('dateOfBirth', sqlConnection.sql.Date, profileData.DateOfBirth)
              .input('updatedAt', sqlConnection.sql.DateTime, new Date())
              .query(`
                UPDATE Users 
                SET 
                  FullName = COALESCE(@fullName, FullName),
                  DateOfBirth = COALESCE(@dateOfBirth, DateOfBirth),
                  UpdatedAt = @updatedAt
                WHERE UserID = @userId
              `);
            
            // Update basic information in StudentDetails table
            await poolConnection.request()
              .input('userId', sqlConnection.sql.BigInt, userId)
              .input('gender', sqlConnection.sql.VarChar(10), profileData.Gender)
              .input('birthPlace', sqlConnection.sql.NVarChar(100), profileData.BirthPlace)
              .input('homeTown', sqlConnection.sql.NVarChar(100), profileData.HomeTown)
              .input('ethnicity', sqlConnection.sql.NVarChar(50), profileData.Ethnicity)
              .input('religion', sqlConnection.sql.NVarChar(50), profileData.Religion)
              .input('updatedAt', sqlConnection.sql.DateTime, new Date())
              .query(`
                IF EXISTS (SELECT 1 FROM StudentDetails WHERE UserID = @userId)
                BEGIN
                  UPDATE StudentDetails 
                  SET 
                    Gender = COALESCE(@gender, Gender),
                    BirthPlace = COALESCE(@birthPlace, BirthPlace),
                    HomeTown = COALESCE(@homeTown, HomeTown),
                    Ethnicity = COALESCE(@ethnicity, Ethnicity),
                    Religion = COALESCE(@religion, Religion),
                    UpdatedAt = @updatedAt
                  WHERE UserID = @userId
                END
                ELSE
                BEGIN
                  INSERT INTO StudentDetails 
                  (UserID, Gender, BirthPlace, HomeTown, Ethnicity, Religion, CreatedAt, UpdatedAt)
                  VALUES 
                  (@userId, @gender, @birthPlace, @homeTown, @ethnicity, @religion, @updatedAt, @updatedAt)
                END
              `);
              
            oldValue = {
              FullName: currentProfile?.FullName,
              DateOfBirth: currentProfile?.DateOfBirth,
              Gender: currentProfile?.Gender,
              BirthPlace: currentProfile?.BirthPlace,
              HomeTown: currentProfile?.HomeTown,
              Ethnicity: currentProfile?.Ethnicity,
              Religion: currentProfile?.Religion
            };
            break;
            
          case 'documents':
            // Update document information in StudentDetails table
            await poolConnection.request()
              .input('userId', sqlConnection.sql.BigInt, userId)
              .input('identityCardNumber', sqlConnection.sql.VarChar(20), profileData.IdentityCardNumber)
              .input('identityCardIssueDate', sqlConnection.sql.Date, profileData.IdentityCardIssueDate)
              .input('identityCardIssuePlace', sqlConnection.sql.NVarChar(100), profileData.IdentityCardIssuePlace)
              .input('healthInsuranceNumber', sqlConnection.sql.VarChar(20), profileData.HealthInsuranceNumber)
              .input('bankAccountNumber', sqlConnection.sql.VarChar(30), profileData.BankAccountNumber)
              .input('bankName', sqlConnection.sql.NVarChar(100), profileData.BankName)
              .input('updatedAt', sqlConnection.sql.DateTime, new Date())
              .query(`
                IF EXISTS (SELECT 1 FROM StudentDetails WHERE UserID = @userId)
                BEGIN
                  UPDATE StudentDetails 
                  SET 
                    IdentityCardNumber = COALESCE(@identityCardNumber, IdentityCardNumber),
                    IdentityCardIssueDate = COALESCE(@identityCardIssueDate, IdentityCardIssueDate),
                    IdentityCardIssuePlace = COALESCE(@identityCardIssuePlace, IdentityCardIssuePlace),
                    HealthInsuranceNumber = COALESCE(@healthInsuranceNumber, HealthInsuranceNumber),
                    BankAccountNumber = COALESCE(@bankAccountNumber, BankAccountNumber),
                    BankName = COALESCE(@bankName, BankName),
                    UpdatedAt = @updatedAt
                  WHERE UserID = @userId
                END
                ELSE
                BEGIN
                  INSERT INTO StudentDetails 
                  (UserID, IdentityCardNumber, IdentityCardIssueDate, IdentityCardIssuePlace, 
                   HealthInsuranceNumber, BankAccountNumber, BankName, CreatedAt, UpdatedAt)
                  VALUES 
                  (@userId, @identityCardNumber, @identityCardIssueDate, @identityCardIssuePlace, 
                   @healthInsuranceNumber, @bankAccountNumber, @bankName, @updatedAt, @updatedAt)
                END
              `);
              
            oldValue = {
              IdentityCardNumber: currentProfile?.IdentityCardNumber,
              IdentityCardIssueDate: currentProfile?.IdentityCardIssueDate,
              IdentityCardIssuePlace: currentProfile?.IdentityCardIssuePlace,
              HealthInsuranceNumber: currentProfile?.HealthInsuranceNumber,
              BankAccountNumber: currentProfile?.BankAccountNumber,
              BankName: currentProfile?.BankName
            };
            break;
            
          case 'contactInfo':
            // Update contact information in Users table
            await poolConnection.request()
              .input('userId', sqlConnection.sql.BigInt, userId)
              .input('phoneNumber', sqlConnection.sql.VarChar(15), profileData.PhoneNumber)
              .input('email', sqlConnection.sql.VarChar(100), profileData.Email)
              .input('address', sqlConnection.sql.NVarChar(255), profileData.Address)
              .input('city', sqlConnection.sql.NVarChar(100), profileData.City)
              .input('country', sqlConnection.sql.NVarChar(100), profileData.Country)
              .input('updatedAt', sqlConnection.sql.DateTime, new Date())
              .query(`
                UPDATE Users 
                SET 
                  PhoneNumber = COALESCE(@phoneNumber, PhoneNumber), 
                  Email = COALESCE(@email, Email),
                  Address = COALESCE(@address, Address),
                  City = COALESCE(@city, City),
                  Country = COALESCE(@country, Country),
                  UpdatedAt = @updatedAt
                WHERE UserID = @userId
              `);
              
            oldValue = {
              PhoneNumber: currentProfile?.PhoneNumber,
              Email: currentProfile?.Email,
              Address: currentProfile?.Address,
              City: currentProfile?.City,
              Country: currentProfile?.Country
            };
            break;
            
          case 'familyInfo':
            // Update family information in StudentDetails table
            await poolConnection.request()
              .input('userId', sqlConnection.sql.BigInt, userId)
              .input('parentName', sqlConnection.sql.NVarChar(100), profileData.ParentName)
              .input('parentPhone', sqlConnection.sql.VarChar(15), profileData.ParentPhone)
              .input('parentEmail', sqlConnection.sql.VarChar(100), profileData.ParentEmail)
              .input('emergencyContact', sqlConnection.sql.NVarChar(100), profileData.EmergencyContact)
              .input('emergencyPhone', sqlConnection.sql.VarChar(15), profileData.EmergencyPhone)
              .input('updatedAt', sqlConnection.sql.DateTime, new Date())
              .query(`
                IF EXISTS (SELECT 1 FROM StudentDetails WHERE UserID = @userId)
                BEGIN
                  UPDATE StudentDetails 
                  SET 
                    ParentName = COALESCE(@parentName, ParentName),
                    ParentPhone = COALESCE(@parentPhone, ParentPhone),
                    ParentEmail = COALESCE(@parentEmail, ParentEmail),
                    EmergencyContact = COALESCE(@emergencyContact, EmergencyContact),
                    EmergencyPhone = COALESCE(@emergencyPhone, EmergencyPhone),
                    UpdatedAt = @updatedAt
                  WHERE UserID = @userId
                END
                ELSE
                BEGIN
                  INSERT INTO StudentDetails 
                  (UserID, ParentName, ParentPhone, ParentEmail, EmergencyContact, EmergencyPhone, CreatedAt, UpdatedAt)
                  VALUES 
                  (@userId, @parentName, @parentPhone, @parentEmail, @emergencyContact, @emergencyPhone, @updatedAt, @updatedAt)
                END
              `);
              
            oldValue = {
              ParentName: currentProfile?.ParentName,
              ParentPhone: currentProfile?.ParentPhone,
              ParentEmail: currentProfile?.ParentEmail,
              EmergencyContact: currentProfile?.EmergencyContact,
              EmergencyPhone: currentProfile?.EmergencyPhone
            };
            break;
            
          default: // Handle legacy profile updates
            // Update Users table
            await poolConnection.request()
              .input('userId', sqlConnection.sql.BigInt, userId)
              .input('phoneNumber', sqlConnection.sql.VarChar(15), profileData.PhoneNumber || profileData.phoneNumber)
              .input('address', sqlConnection.sql.NVarChar(255), profileData.Address || profileData.address)
              .input('city', sqlConnection.sql.NVarChar(100), profileData.City || profileData.city)
              .input('country', sqlConnection.sql.NVarChar(100), profileData.Country || profileData.country)
              .input('bio', sqlConnection.sql.NVarChar(500), profileData.Bio || profileData.bio)
              .input('updatedAt', sqlConnection.sql.DateTime, new Date())
              .query(`
                UPDATE Users 
                SET 
                  PhoneNumber = COALESCE(@phoneNumber, PhoneNumber), 
                  Address = COALESCE(@address, Address),
                  City = COALESCE(@city, City),
                  Country = COALESCE(@country, Country),
                  Bio = COALESCE(@bio, Bio),
                  UpdatedAt = @updatedAt
                WHERE UserID = @userId
              `);
              
            oldValue = {
              PhoneNumber: currentProfile?.PhoneNumber,
              Address: currentProfile?.Address,
              City: currentProfile?.City,
              Country: currentProfile?.Country,
              Bio: currentProfile?.Bio
            };
            break;
        }
        
        // Record the update in ProfileUpdates table
        await poolConnection.request()
          .input('userId', sqlConnection.sql.BigInt, userId)
          .input('fieldName', sqlConnection.sql.VarChar(50), updateType)
          .input('oldValue', sqlConnection.sql.NVarChar(sqlConnection.sql.MAX), oldValue ? JSON.stringify(oldValue) : null)
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