/*-----------------------------------------------------------------
* File: NotificationTemplates.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[NotificationTemplates] (
    [TemplateID] INT            IDENTITY (1, 1) NOT NULL,
    [Type]       VARCHAR (50)   NULL,
    [Title]      NVARCHAR (255) NULL,
    [Content]    NVARCHAR (MAX) NULL,
    [Parameters] NVARCHAR (MAX) NULL,
    [CreatedAt]  DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([TemplateID] ASC)
);


GO

