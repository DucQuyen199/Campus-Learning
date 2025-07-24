/*-----------------------------------------------------------------
* File: UserAchievements.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[UserAchievements] (
    [UserAchievementID] BIGINT   IDENTITY (1, 1) NOT NULL,
    [UserID]            BIGINT   NULL,
    [AchievementID]     INT      NULL,
    [EarnedAt]          DATETIME DEFAULT (getdate()) NULL,
    [Progress]          INT      DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([UserAchievementID] ASC),
    FOREIGN KEY ([AchievementID]) REFERENCES [dbo].[Achievements] ([AchievementID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_User_Achievement] UNIQUE NONCLUSTERED ([UserID] ASC, [AchievementID] ASC)
);


GO

