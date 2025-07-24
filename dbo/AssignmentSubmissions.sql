/*-----------------------------------------------------------------
* File: AssignmentSubmissions.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[AssignmentSubmissions] (
    [SubmissionID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [AssignmentID] BIGINT         NOT NULL,
    [UserID]       BIGINT         NOT NULL,
    [Content]      NVARCHAR (MAX) NULL,
    [SubmittedAt]  DATETIME       DEFAULT (getdate()) NULL,
    [Status]       VARCHAR (20)   DEFAULT ('submitted') NULL,
    [Score]        INT            NULL,
    [Feedback]     NVARCHAR (MAX) NULL,
    [GradedAt]     DATETIME       NULL,
    [GradedBy]     BIGINT         NULL,
    PRIMARY KEY CLUSTERED ([SubmissionID] ASC),
    CONSTRAINT [FK_AssignmentSubmissions_Assignments] FOREIGN KEY ([AssignmentID]) REFERENCES [dbo].[Assignments] ([AssignmentID]),
    CONSTRAINT [FK_AssignmentSubmissions_Graders] FOREIGN KEY ([GradedBy]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [FK_AssignmentSubmissions_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_AssignmentSubmissions_AssignmentID]
    ON [dbo].[AssignmentSubmissions]([AssignmentID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_AssignmentSubmissions_UserID]
    ON [dbo].[AssignmentSubmissions]([UserID] ASC);


GO

