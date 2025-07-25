/*-----------------------------------------------------------------
* File: StudentPrograms.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[StudentPrograms] (
    [StudentProgramID]       BIGINT       IDENTITY (1, 1) NOT NULL,
    [UserID]                 BIGINT       NULL,
    [ProgramID]              BIGINT       NULL,
    [EntryYear]              INT          NULL,
    [ExpectedGraduationYear] INT          NULL,
    [AdvisorID]              BIGINT       NULL,
    [Status]                 VARCHAR (20) DEFAULT ('Active') NULL,
    [IsPrimary]              BIT          DEFAULT ((1)) NULL,
    [CreatedAt]              DATETIME     DEFAULT (getdate()) NULL,
    [UpdatedAt]              DATETIME     DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([StudentProgramID] ASC),
    CONSTRAINT [CHK_Program_Status] CHECK ([Status]='Transferred' OR [Status]='Suspended' OR [Status]='Completed' OR [Status]='Active'),
    FOREIGN KEY ([AdvisorID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([ProgramID]) REFERENCES [dbo].[AcademicPrograms] ([ProgramID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

