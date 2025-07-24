/*-----------------------------------------------------------------
* File: SystemInfo.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[SystemInfo] (
    [ID]          INT            IDENTITY (1, 1) NOT NULL,
    [InfoKey]     NVARCHAR (50)  NOT NULL,
    [InfoValue]   NVARCHAR (MAX) NULL,
    [Category]    NVARCHAR (50)  NULL,
    [LastUpdated] DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ID] ASC),
    UNIQUE NONCLUSTERED ([InfoKey] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_SystemInfo_Category]
    ON [dbo].[SystemInfo]([Category] ASC);


GO

