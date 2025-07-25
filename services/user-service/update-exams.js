/*-----------------------------------------------------------------
* File: update-exams.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const { pool, sql, query } = require('./config/db');

async function updateExamRetakes() {
  try {
    console.log('Connecting to database...');
    
    // Update exam 5 (and any other exams you want to test with)
    const result = await query(`
      UPDATE Exams
      SET AllowRetakes = 1, MaxRetakes = 3
      WHERE ExamID IN (5, 6)
    `);
    
    console.log('Update successful:', result);
    
    // Verify the changes
    const exams = await query(`
      SELECT ExamID, Title, AllowRetakes, MaxRetakes
      FROM Exams
      WHERE ExamID IN (5, 6)
    `);
    
    console.log('Updated exams:', exams);
    
    // Cleanup participant attempts to allow for new registrations (optional)
    const cleanupResult = await query(`
      DELETE FROM ExamParticipants
      WHERE ExamID IN (5, 6) 
      AND Status NOT IN ('completed', 'reviewed')
    `);
    
    console.log('Cleaned up in-progress attempts:', cleanupResult);
    
    console.log('Update completed successfully');
  } catch (error) {
    console.error('Error updating exams:', error);
  } finally {
    try {
      await pool.close();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error closing pool:', err);
    }
  }
}

updateExamRetakes(); 

// Add this at the end of the file
// SQL to create UserAiUsage table
const createUserAiUsageTable = `
CREATE TABLE [dbo].[UserAiUsage] (
    [UsageID]   BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]    BIGINT         NOT NULL,
    [UsageDate] DATETIME       DEFAULT (getdate()) NOT NULL,
    [UsageType] VARCHAR (50)   NOT NULL,
    PRIMARY KEY CLUSTERED ([UsageID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);

-- Create index for faster queries by user and date
CREATE NONCLUSTERED INDEX [IX_UserAiUsage_UserID_Date] 
ON [dbo].[UserAiUsage]([UserID] ASC, [UsageDate] ASC);
`;

// Execute the SQL to create the table
async function createAiUsageTable() {
  try {
    console.log('Creating UserAiUsage table...');
    await pool.query(createUserAiUsageTable);
    console.log('UserAiUsage table created successfully.');
  } catch (err) {
    if (err.message.includes('There is already an object named')) {
      console.log('UserAiUsage table already exists.');
    } else {
      console.error('Error creating UserAiUsage table:', err);
    }
  }
}

// Call the function to create the table
createAiUsageTable(); 
