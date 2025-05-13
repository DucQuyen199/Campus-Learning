const express = require('express');
const router = express.Router();
const { sql, pool } = require('../sever');

// Get student profile
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching profile for user ID: ${userId}`);

    // Connect to database
    const poolConnection = await pool.connect();

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
      .input('userId', sql.BigInt, userId)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student profile not found' 
      });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error retrieving profile',
      error: err.message
    });
  }
});

// Get student academic information
router.get('/:userId/academic', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Connect to database
    const poolConnection = await pool.connect();
    
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
      .input('userId', sql.BigInt, userId)
      .query(query);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching academic information:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error retrieving academic information',
      error: err.message
    });
  }
});

// Get student metrics
router.get('/:userId/metrics', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Connect to database
    const poolConnection = await pool.connect();
    
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
      .input('userId', sql.BigInt, userId)
      .query(query);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching student metrics:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error retrieving student metrics',
      error: err.message
    });
  }
});

// Update student profile
router.put('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { 
      phoneNumber, address, city, country, bio,
      emergencyContact, emergencyPhone, 
      bankAccountNumber, bankName
    } = req.body;
    
    // Connect to database
    const poolConnection = await pool.connect();
    const transaction = new sql.Transaction(poolConnection);
    
    try {
      await transaction.begin();
      
      // Update Users table with basic contact info
      await transaction.request()
        .input('userId', sql.BigInt, userId)
        .input('phoneNumber', sql.VarChar(15), phoneNumber)
        .input('address', sql.NVarChar(255), address)
        .input('city', sql.NVarChar(100), city)
        .input('country', sql.NVarChar(100), country)
        .input('bio', sql.NVarChar(500), bio)
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
        .input('userId', sql.BigInt, userId)
        .input('emergencyContact', sql.NVarChar(100), emergencyContact)
        .input('emergencyPhone', sql.VarChar(15), emergencyPhone)
        .input('bankAccountNumber', sql.VarChar(30), bankAccountNumber)
        .input('bankName', sql.NVarChar(100), bankName)
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
        .input('userId', sql.BigInt, userId)
        .input('fieldName', sql.VarChar(50), 'Contact Information')
        .input('oldValue', sql.NVarChar(sql.MAX), JSON.stringify(req.body))
        .input('newValue', sql.NVarChar(sql.MAX), JSON.stringify(req.body))
        .query(`
          INSERT INTO ProfileUpdates (UserID, FieldName, OldValue, NewValue, Status)
          VALUES (@userId, @fieldName, @oldValue, @newValue, 'Approved')
        `);
      
      await transaction.commit();
      
      res.json({ 
        success: true,
        message: 'Profile updated successfully' 
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating profile',
      error: err.message
    });
  }
});

// Get profile update history
router.get('/:userId/updates', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Connect to database
    const poolConnection = await pool.connect();
    
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
      .input('userId', sql.BigInt, userId)
      .query(query);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching profile updates:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error retrieving profile updates',
      error: err.message
    });
  }
});

module.exports = router; 