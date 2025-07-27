/*-----------------------------------------------------------------
* File: RegistrationAttempts.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: SQL table for tracking registration attempts by IP
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/

CREATE TABLE [dbo].[RegistrationAttempts] (
    [AttemptID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [IPAddress] VARCHAR(45) NOT NULL,
    [AttemptCount] INT DEFAULT 1,
    [LastAttemptAt] DATETIME DEFAULT GETDATE(),
    [BlockedUntil] DATETIME NULL,
    [CreatedAt] DATETIME DEFAULT GETDATE()
);

-- Create index for fast IP lookup
CREATE NONCLUSTERED INDEX [IX_RegistrationAttempts_IPAddress] 
    ON [dbo].[RegistrationAttempts]([IPAddress]);

GO 