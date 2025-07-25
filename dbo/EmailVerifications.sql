/*-----------------------------------------------------------------
* File: EmailVerifications.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[EmailVerifications] (
    [VerificationID] BIGINT        IDENTITY (1, 1) NOT NULL,
    [UserID]         BIGINT        NOT NULL,
    [Email]          VARCHAR (100) NOT NULL,
    [OTP]            VARCHAR (6)   NOT NULL,
    [ExpiresAt]      DATETIME      NOT NULL,
    [IsUsed]         BIT           DEFAULT ((0)) NULL,
    [CreatedAt]      DATETIME      DEFAULT (getdate()) NULL,
    [Type]           VARCHAR (20)  DEFAULT ('email_verification') NULL,
    PRIMARY KEY CLUSTERED ([VerificationID] ASC),
    CONSTRAINT [FK_EmailVerifications_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_EmailVerifications_Email]
    ON [dbo].[EmailVerifications]([Email] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_EmailVerifications_UserID]
    ON [dbo].[EmailVerifications]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_EmailVerifications_OTP]
    ON [dbo].[EmailVerifications]([OTP] ASC);


GO

