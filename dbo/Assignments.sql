/*-----------------------------------------------------------------
* File: Assignments.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[Assignments] (
    [AssignmentID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [Title]        NVARCHAR (255) NOT NULL,
    [Description]  NVARCHAR (MAX) NULL,
    [CourseID]     BIGINT         NOT NULL,
    [DueDate]      DATETIME       NULL,
    [TotalPoints]  INT            DEFAULT ((100)) NULL,
    [CreatedBy]    BIGINT         NOT NULL,
    [CreatedAt]    DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]    DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([AssignmentID] ASC),
    CONSTRAINT [FK_Assignments_Courses] FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses] ([CourseID]),
    CONSTRAINT [FK_Assignments_Users] FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_Assignments_CourseID]
    ON [dbo].[Assignments]([CourseID] ASC);


GO

