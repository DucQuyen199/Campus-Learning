/*-----------------------------------------------------------------
* File: UserProfiles.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[UserProfiles] (
    [ProfileID]               BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]                  BIGINT         NULL,
    [Education]               NVARCHAR (MAX) NULL,
    [WorkExperience]          NVARCHAR (MAX) NULL,
    [Skills]                  NVARCHAR (MAX) NULL,
    [Interests]               NVARCHAR (MAX) NULL,
    [SocialLinks]             NVARCHAR (MAX) NULL,
    [Achievements]            NVARCHAR (MAX) NULL,
    [PreferredLanguage]       VARCHAR (10)   DEFAULT ('vi') NULL,
    [TimeZone]                VARCHAR (50)   DEFAULT ('Asia/Ho_Chi_Minh') NULL,
    [NotificationPreferences] NVARCHAR (MAX) NULL,
    [UpdatedAt]               DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ProfileID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([UserID] ASC)
);


GO

