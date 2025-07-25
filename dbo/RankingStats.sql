/*-----------------------------------------------------------------
* File: RankingStats.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[RankingStats] (
    [StatID]             BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]             BIGINT         NULL,
    [PeriodType]         VARCHAR (20)   NULL,
    [StartDate]          DATE           NULL,
    [EndDate]            DATE           NULL,
    [TotalPoints]        INT            DEFAULT ((0)) NULL,
    [EventsParticipated] INT            DEFAULT ((0)) NULL,
    [CoursesCompleted]   INT            DEFAULT ((0)) NULL,
    [AverageAccuracy]    DECIMAL (5, 2) NULL,
    PRIMARY KEY CLUSTERED ([StatID] ASC),
    CONSTRAINT [CHK_Period_Type] CHECK ([PeriodType]='ALL_TIME' OR [PeriodType]='MONTHLY' OR [PeriodType]='WEEKLY'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_RankingStats_UserID_PeriodType]
    ON [dbo].[RankingStats]([UserID] ASC, [PeriodType] ASC);


GO

