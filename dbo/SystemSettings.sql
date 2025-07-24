/*-----------------------------------------------------------------
* File: SystemSettings.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[SystemSettings] (
    [ID]           INT            IDENTITY (1, 1) NOT NULL,
    [SettingKey]   NVARCHAR (50)  NOT NULL,
    [SettingValue] NVARCHAR (MAX) NULL,
    [Description]  NVARCHAR (255) NULL,
    [Category]     NVARCHAR (50)  NULL,
    [UpdatedAt]    DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedBy]    BIGINT         NULL,
    PRIMARY KEY CLUSTERED ([ID] ASC),
    FOREIGN KEY ([UpdatedBy]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([SettingKey] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_SystemSettings_Category]
    ON [dbo].[SystemSettings]([Category] ASC);


GO

