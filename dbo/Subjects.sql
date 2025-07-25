/*-----------------------------------------------------------------
* File: Subjects.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[Subjects] (
    [SubjectID]       BIGINT         IDENTITY (1, 1) NOT NULL,
    [SubjectCode]     VARCHAR (20)   NULL,
    [SubjectName]     NVARCHAR (200) NOT NULL,
    [Credits]         INT            NOT NULL,
    [TheoryCredits]   INT            NULL,
    [PracticeCredits] INT            NULL,
    [Prerequisites]   NVARCHAR (MAX) NULL,
    [Description]     NVARCHAR (MAX) NULL,
    [Department]      NVARCHAR (100) NULL,
    [Faculty]         NVARCHAR (100) NULL,
    [IsRequired]      BIT            DEFAULT ((1)) NULL,
    [IsActive]        BIT            DEFAULT ((1)) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([SubjectID] ASC),
    UNIQUE NONCLUSTERED ([SubjectCode] ASC)
);


GO

