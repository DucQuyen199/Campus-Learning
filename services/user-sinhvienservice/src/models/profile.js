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
          SELECT u.*, up.*, sd.*
          FROM Users u
          LEFT JOIN UserProfiles up ON u.UserID = up.UserID
          LEFT JOIN StudentDetails sd ON u.UserID = sd.UserID
          WHERE u.UserID = @userId
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
          .input('newValue', sqlConnection.sql.NVarChar(sqlConnection.sql.MAX), JSON.stringify(profileData))
          .input('updateTime', sqlConnection.sql.DateTime, new Date())
          .input('status', sqlConnection.sql.VarChar(20), 'Approved')
          .query(`
            INSERT INTO ProfileUpdates (UserID, FieldName, NewValue, UpdateTime, Status)
            VALUES (@userId, @fieldName, @newValue, @updateTime, @status)
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