/*-----------------------------------------------------------------
* File: AcademicMetrics.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[AcademicMetrics] (
    [MetricID]          BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]            BIGINT         NULL,
    [SemesterID]        BIGINT         NULL,
    [TotalCredits]      INT            DEFAULT ((0)) NULL,
    [EarnedCredits]     INT            DEFAULT ((0)) NULL,
    [SemesterGPA]       DECIMAL (5, 2) NULL,
    [CumulativeGPA]     DECIMAL (5, 2) NULL,
    [CreditsPassed]     INT            DEFAULT ((0)) NULL,
    [CreditsFailed]     INT            DEFAULT ((0)) NULL,
    [AcademicStanding]  VARCHAR (20)   NULL,
    [CreditsRegistered] INT            DEFAULT ((0)) NULL,
    [RankInClass]       INT            NULL,
    [CreatedAt]         DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]         DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([MetricID] ASC),
    CONSTRAINT [CHK_Academic_Standing] CHECK ([AcademicStanding]='Dismissed' OR [AcademicStanding]='Suspended' OR [AcademicStanding]='Probation' OR [AcademicStanding]='Warning' OR [AcademicStanding]='Good Standing'),
    FOREIGN KEY ([SemesterID]) REFERENCES [dbo].[Semesters] ([SemesterID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

