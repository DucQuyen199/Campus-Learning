/*-----------------------------------------------------------------
* File: PostTags.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[PostTags] (
    [PostID]    BIGINT   NOT NULL,
    [TagID]     INT      NOT NULL,
    [CreatedAt] DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([PostID] ASC, [TagID] ASC),
    FOREIGN KEY ([PostID]) REFERENCES [dbo].[Posts] ([PostID]),
    FOREIGN KEY ([TagID]) REFERENCES [dbo].[Tags] ([TagID])
);


GO

