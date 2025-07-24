/*-----------------------------------------------------------------
* File: AcademicPrograms.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[AcademicPrograms] (
    [ProgramID]       BIGINT         IDENTITY (1, 1) NOT NULL,
    [ProgramCode]     VARCHAR (20)   NULL,
    [ProgramName]     NVARCHAR (200) NOT NULL,
    [Department]      NVARCHAR (100) NULL,
    [Faculty]         NVARCHAR (100) NULL,
    [Description]     NVARCHAR (MAX) NULL,
    [TotalCredits]    INT            NULL,
    [ProgramDuration] INT            NULL,
    [DegreeName]      NVARCHAR (100) NULL,
    [ProgramType]     VARCHAR (50)   NULL,
    [IsActive]        BIT            DEFAULT ((1)) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ProgramID] ASC),
    UNIQUE NONCLUSTERED ([ProgramCode] ASC)
);


GO

