/*-----------------------------------------------------------------
* File: Semesters.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[Semesters] (
    [SemesterID]            BIGINT         IDENTITY (1, 1) NOT NULL,
    [SemesterCode]          VARCHAR (20)   NULL,
    [SemesterName]          NVARCHAR (100) NULL,
    [AcademicYear]          VARCHAR (20)   NULL,
    [StartDate]             DATE           NULL,
    [EndDate]               DATE           NULL,
    [RegistrationStartDate] DATE           NULL,
    [RegistrationEndDate]   DATE           NULL,
    [Status]                VARCHAR (20)   DEFAULT ('Upcoming') NULL,
    [IsCurrent]             BIT            DEFAULT ((0)) NULL,
    [CreatedAt]             DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]             DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([SemesterID] ASC),
    CONSTRAINT [CHK_Semester_Status] CHECK ([Status]='Cancelled' OR [Status]='Completed' OR [Status]='Ongoing' OR [Status]='Upcoming'),
    UNIQUE NONCLUSTERED ([SemesterCode] ASC)
);


GO

