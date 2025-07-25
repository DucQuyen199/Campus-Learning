/*-----------------------------------------------------------------
* File: CacheEntries.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[CacheEntries] (
    [CacheKey]  VARCHAR (255)  NOT NULL,
    [Value]     NVARCHAR (MAX) NULL,
    [ExpiresAt] DATETIME       NULL,
    [CreatedAt] DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt] DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([CacheKey] ASC)
);


GO

