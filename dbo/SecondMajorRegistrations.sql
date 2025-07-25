/*-----------------------------------------------------------------
* File: SecondMajorRegistrations.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[SecondMajorRegistrations] (
    [RegistrationID]   BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]           BIGINT         NULL,
    [ProgramID]        BIGINT         NULL,
    [RegistrationDate] DATETIME       DEFAULT (getdate()) NULL,
    [CurrentGPA]       DECIMAL (5, 2) NULL,
    [CompletedCredits] INT            NULL,
    [Reason]           NVARCHAR (MAX) NULL,
    [Status]           VARCHAR (20)   DEFAULT ('Pending') NULL,
    [ReviewedBy]       BIGINT         NULL,
    [ReviewedAt]       DATETIME       NULL,
    [Comments]         NVARCHAR (500) NULL,
    [StartSemesterID]  BIGINT         NULL,
    [CreatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([RegistrationID] ASC),
    CONSTRAINT [CHK_SecondMajor_Status] CHECK ([Status]='Completed' OR [Status]='Cancelled' OR [Status]='Rejected' OR [Status]='Approved' OR [Status]='Pending'),
    FOREIGN KEY ([ProgramID]) REFERENCES [dbo].[AcademicPrograms] ([ProgramID]),
    FOREIGN KEY ([ReviewedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([StartSemesterID]) REFERENCES [dbo].[Semesters] ([SemesterID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

