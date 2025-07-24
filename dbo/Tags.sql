/*-----------------------------------------------------------------
* File: Tags.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[Tags] (
    [TagID]       INT            IDENTITY (1, 1) NOT NULL,
    [Name]        NVARCHAR (50)  NOT NULL,
    [Description] NVARCHAR (255) NULL,
    [CreatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    [UsageCount]  INT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([TagID] ASC),
    UNIQUE NONCLUSTERED ([Name] ASC)
);


GO

