/*-----------------------------------------------------------------
* File: add-require-2fa-column.sql
* Author: Quyen Nguyen Duc
* Date: 2025-06-28
* Description: Adds RequireTwoFA column to Users table
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/

USE CampusLearning;
GO

-- Check if column exists before adding
IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'Users' 
  AND COLUMN_NAME = 'RequireTwoFA'
)
BEGIN
  ALTER TABLE [dbo].[Users]
  ADD [RequireTwoFA] BIT DEFAULT ((0)) NULL;
  
  PRINT 'RequireTwoFA column added to Users table';
END
ELSE
BEGIN
  PRINT 'RequireTwoFA column already exists';
END
GO

-- Add index for better query performance
IF NOT EXISTS (
  SELECT * FROM sys.indexes 
  WHERE name='IX_Users_RequireTwoFA' 
  AND object_id = OBJECT_ID('dbo.Users')
)
BEGIN
  CREATE NONCLUSTERED INDEX [IX_Users_RequireTwoFA]
  ON [dbo].[Users]([RequireTwoFA])
  WHERE [RequireTwoFA] = 1;
  
  PRINT 'Index created for RequireTwoFA column';
END
ELSE
BEGIN
  PRINT 'Index already exists for RequireTwoFA column';
END
GO 