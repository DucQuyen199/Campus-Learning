/*-----------------------------------------------------------------
* File: Exams.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[Exams] (
    [ExamID]           BIGINT         IDENTITY (1, 1) NOT NULL,
    [CourseID]         BIGINT         NULL,
    [Title]            NVARCHAR (255) NOT NULL,
    [Description]      NVARCHAR (MAX) NULL,
    [Type]             VARCHAR (50)   NOT NULL,
    [Duration]         INT            NOT NULL,
    [TotalPoints]      INT            DEFAULT ((100)) NULL,
    [PassingScore]     INT            DEFAULT ((60)) NULL,
    [StartTime]        DATETIME       NOT NULL,
    [EndTime]          DATETIME       NOT NULL,
    [Instructions]     NVARCHAR (MAX) NULL,
    [AllowReview]      BIT            DEFAULT ((1)) NULL,
    [ShuffleQuestions] BIT            DEFAULT ((1)) NULL,
    [Status]           VARCHAR (20)   DEFAULT ('upcoming') NULL,
    [CreatedBy]        BIGINT         NULL,
    [CreatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [AlternateId]      NVARCHAR (255) NULL,
    [AllowRetakes]     BIT            DEFAULT ((0)) NULL,
    [MaxRetakes]       INT            DEFAULT ((0)) NULL,
    [ExamDate]         DATE           NULL,
    [ExamType]         VARCHAR (20)   NULL,
    [Location]         NVARCHAR (100) NULL,
    [ExamName]         NVARCHAR (100) NULL,
    [ClassID]          BIGINT         NULL,
    PRIMARY KEY CLUSTERED ([ExamID] ASC),
    CONSTRAINT [CHK_Exam_Status] CHECK ([Status]='cancelled' OR [Status]='completed' OR [Status]='ongoing' OR [Status]='upcoming'),
    CONSTRAINT [CHK_Exam_Type] CHECK ([Type]='mixed' OR [Type]='coding' OR [Type]='essay' OR [Type]='multiple_choice'),
    FOREIGN KEY ([ClassID]) REFERENCES [dbo].[CourseClasses] ([ClassID]),
    FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses] ([CourseID]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_Exams_StartTime]
    ON [dbo].[Exams]([StartTime] ASC);


GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Exams_AlternateId]
    ON [dbo].[Exams]([AlternateId] ASC) WHERE ([AlternateId] IS NOT NULL);


GO

