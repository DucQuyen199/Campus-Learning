/*-----------------------------------------------------------------
* File: CourseModules.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[CourseModules] (
    [ModuleID]         BIGINT          IDENTITY (1, 1) NOT NULL,
    [CourseID]         BIGINT          NULL,
    [Title]            NVARCHAR (255)  NOT NULL,
    [Description]      NVARCHAR (MAX)  NULL,
    [OrderIndex]       INT             NOT NULL,
    [Duration]         INT             NULL,
    [IsPublished]      BIT             DEFAULT ((0)) NULL,
    [CreatedAt]        DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME        DEFAULT (getdate()) NULL,
    [VideoUrl]         NVARCHAR (2000) NULL,
    [ImageUrl]         NVARCHAR (500)  NULL,
    [PracticalGuide]   NVARCHAR (MAX)  NULL,
    [Objectives]       NVARCHAR (MAX)  NULL,
    [Requirements]     NVARCHAR (MAX)  NULL,
    [Materials]        NVARCHAR (MAX)  NULL,
    [DraftData]        NVARCHAR (MAX)  NULL,
    [LastDraftSavedAt] DATETIME        NULL,
    [IsDraft]          BIT             DEFAULT ((1)) NULL,
    PRIMARY KEY CLUSTERED ([ModuleID] ASC),
    FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses] ([CourseID])
);


GO

