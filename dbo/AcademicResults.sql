/*-----------------------------------------------------------------
* File: AcademicResults.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[AcademicResults] (
    [ResultID]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]          BIGINT         NULL,
    [ClassID]         BIGINT         NULL,
    [AttendanceScore] DECIMAL (5, 2) NULL,
    [AssignmentScore] DECIMAL (5, 2) NULL,
    [MidtermScore]    DECIMAL (5, 2) NULL,
    [FinalScore]      DECIMAL (5, 2) NULL,
    [TotalScore]      DECIMAL (5, 2) NULL,
    [LetterGrade]     VARCHAR (5)    NULL,
    [GPA]             DECIMAL (5, 2) NULL,
    [IsCompleted]     BIT            DEFAULT ((0)) NULL,
    [IsPassed]        BIT            DEFAULT ((0)) NULL,
    [Comments]        NVARCHAR (500) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ResultID] ASC),
    FOREIGN KEY ([ClassID]) REFERENCES [dbo].[CourseClasses] ([ClassID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

