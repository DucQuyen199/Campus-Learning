/*-----------------------------------------------------------------
* File: AcademicWarnings.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[AcademicWarnings] (
    [WarningID]      BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]         BIGINT         NULL,
    [SemesterID]     BIGINT         NULL,
    [WarningType]    VARCHAR (20)   NULL,
    [Reason]         NVARCHAR (500) NULL,
    [WarningDate]    DATE           NULL,
    [RequiredAction] NVARCHAR (500) NULL,
    [ResolvedDate]   DATE           NULL,
    [Status]         VARCHAR (20)   DEFAULT ('Active') NULL,
    [CreatedBy]      BIGINT         NULL,
    [CreatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([WarningID] ASC),
    CONSTRAINT [CHK_Warning_Status] CHECK ([Status]='Expired' OR [Status]='Resolved' OR [Status]='Active'),
    CONSTRAINT [CHK_Warning_Type] CHECK ([WarningType]='Suspension' OR [WarningType]='Level3' OR [WarningType]='Level2' OR [WarningType]='Level1'),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([SemesterID]) REFERENCES [dbo].[Semesters] ([SemesterID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

