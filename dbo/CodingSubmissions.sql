/*-----------------------------------------------------------------
* File: CodingSubmissions.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[CodingSubmissions] (
    [SubmissionID]    BIGINT         IDENTITY (1, 1) NOT NULL,
    [ExerciseID]      BIGINT         NULL,
    [UserID]          BIGINT         NULL,
    [Code]            NVARCHAR (MAX) NULL,
    [Language]        VARCHAR (50)   NULL,
    [Status]          VARCHAR (20)   NULL,
    [ExecutionTime]   INT            NULL,
    [MemoryUsed]      INT            NULL,
    [TestCasesPassed] INT            DEFAULT ((0)) NULL,
    [TotalTestCases]  INT            DEFAULT ((0)) NULL,
    [Score]           INT            DEFAULT ((0)) NULL,
    [SubmittedAt]     DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([SubmissionID] ASC),
    CONSTRAINT [CHK_Submission_Status] CHECK ([Status]='runtime_error' OR [Status]='memory_limit' OR [Status]='time_limit' OR [Status]='wrong_answer' OR [Status]='accepted' OR [Status]='running' OR [Status]='pending'),
    FOREIGN KEY ([ExerciseID]) REFERENCES [dbo].[CodingExercises] ([ExerciseID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_CodingSubmissions_Status]
    ON [dbo].[CodingSubmissions]([Status] ASC);


GO

