/*-----------------------------------------------------------------
* File: Internships.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[Internships] (
    [InternshipID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]           BIGINT         NULL,
    [CompanyName]      NVARCHAR (200) NULL,
    [Position]         NVARCHAR (100) NULL,
    [Department]       NVARCHAR (100) NULL,
    [Supervisor]       NVARCHAR (100) NULL,
    [ContactEmail]     VARCHAR (100)  NULL,
    [ContactPhone]     VARCHAR (20)   NULL,
    [StartDate]        DATE           NULL,
    [EndDate]          DATE           NULL,
    [Status]           VARCHAR (20)   DEFAULT ('Planned') NULL,
    [WeeklyHours]      INT            NULL,
    [Description]      NVARCHAR (MAX) NULL,
    [ObjectivesMet]    NVARCHAR (MAX) NULL,
    [FacultyAdvisorID] BIGINT         NULL,
    [Grade]            VARCHAR (5)    NULL,
    [CreatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([InternshipID] ASC),
    CONSTRAINT [CHK_Internship_Status] CHECK ([Status]='Failed' OR [Status]='Cancelled' OR [Status]='Completed' OR [Status]='Ongoing' OR [Status]='Planned'),
    FOREIGN KEY ([FacultyAdvisorID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

