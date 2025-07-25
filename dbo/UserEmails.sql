/*-----------------------------------------------------------------
* File: UserEmails.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[UserEmails] (
    [EmailID]           BIGINT        IDENTITY (1, 1) NOT NULL,
    [UserID]            BIGINT        NOT NULL,
    [Email]             VARCHAR (255) NOT NULL,
    [IsPrimary]         BIT           DEFAULT ((0)) NOT NULL,
    [IsVerified]        BIT           DEFAULT ((0)) NOT NULL,
    [Visibility]        VARCHAR (20)  DEFAULT ('private') NOT NULL,
    [VerificationToken] VARCHAR (255) NULL,
    [CreatedAt]         DATETIME      DEFAULT (getdate()) NULL,
    [VerifiedAt]        DATETIME      NULL,
    PRIMARY KEY CLUSTERED ([EmailID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_UserEmails_User_Email] UNIQUE NONCLUSTERED ([UserID] ASC, [Email] ASC)
);


GO

