/*-----------------------------------------------------------------
* File: SequelizeMeta.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[SequelizeMeta] (
    [name] NVARCHAR (255) NOT NULL,
    PRIMARY KEY CLUSTERED ([name] ASC),
    UNIQUE NONCLUSTERED ([name] ASC)
);


GO

