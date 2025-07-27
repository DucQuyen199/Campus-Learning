/*-----------------------------------------------------------------
* File: login-security-tables.sql
* Author: Quyen Nguyen Duc
* Date: 2025-01-19
* Description: Database tables for login security features including 
*              failed login attempt tracking and account unlock functionality
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/

-- Table to track login attempts by IP address
CREATE TABLE [dbo].[LoginAttempts] (
    [AttemptID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [IPAddress]     VARCHAR (45)   NOT NULL,
    [Email]         VARCHAR (100)  NULL,
    [UserID]        BIGINT         NULL,
    [AttemptTime]   DATETIME       DEFAULT (getdate()) NOT NULL,
    [IsSuccessful]  BIT            DEFAULT ((0)) NOT NULL,
    [UserAgent]     NVARCHAR (500) NULL,
    [FailureReason] NVARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([AttemptID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);

GO

-- Table to store account unlock verification tokens
CREATE TABLE [dbo].[AccountUnlockTokens] (
    [TokenID]       BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]        BIGINT         NOT NULL,
    [UnlockToken]   VARCHAR (255)  NOT NULL,
    [EmailToken]    VARCHAR (255)  NOT NULL,
    [IPAddress]     VARCHAR (45)   NOT NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NOT NULL,
    [ExpiresAt]     DATETIME       NOT NULL,
    [IsUsed]        BIT            DEFAULT ((0)) NOT NULL,
    [UsedAt]        DATETIME       NULL,
    PRIMARY KEY CLUSTERED ([TokenID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([UnlockToken] ASC),
    UNIQUE NONCLUSTERED ([EmailToken] ASC)
);

GO

-- Indexes for performance
CREATE NONCLUSTERED INDEX [IX_LoginAttempts_IPAddress_AttemptTime]
    ON [dbo].[LoginAttempts]([IPAddress] ASC, [AttemptTime] ASC);

GO

CREATE NONCLUSTERED INDEX [IX_LoginAttempts_Email_AttemptTime]
    ON [dbo].[LoginAttempts]([Email] ASC, [AttemptTime] ASC);

GO

CREATE NONCLUSTERED INDEX [IX_AccountUnlockTokens_ExpiresAt]
    ON [dbo].[AccountUnlockTokens]([ExpiresAt] ASC);

GO

-- Add 2FA secret column to Users table if not exists (already exists)
-- ALTER TABLE [dbo].[Users] ADD [TwoFASecret] VARCHAR(255) NULL;
-- ALTER TABLE [dbo].[Users] ADD [TwoFAEnabled] BIT DEFAULT ((0)) NULL; 