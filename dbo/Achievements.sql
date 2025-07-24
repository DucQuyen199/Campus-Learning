/*-----------------------------------------------------------------
* File: Achievements.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[Achievements] (
    [AchievementID] INT            IDENTITY (1, 1) NOT NULL,
    [Name]          NVARCHAR (100) NOT NULL,
    [Description]   NVARCHAR (500) NULL,
    [Type]          VARCHAR (50)   NULL,
    [Icon]          VARCHAR (255)  NULL,
    [Points]        INT            DEFAULT ((0)) NULL,
    [Criteria]      NVARCHAR (MAX) NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([AchievementID] ASC)
);


GO

