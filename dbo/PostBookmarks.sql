/*-----------------------------------------------------------------
* File: PostBookmarks.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[PostBookmarks] (
    [BookmarkID] BIGINT   IDENTITY (1, 1) NOT NULL,
    [PostID]     BIGINT   NULL,
    [UserID]     BIGINT   NULL,
    [CreatedAt]  DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([BookmarkID] ASC),
    FOREIGN KEY ([PostID]) REFERENCES [dbo].[Posts] ([PostID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_PostBookmarks_PostID_UserID] UNIQUE NONCLUSTERED ([PostID] ASC, [UserID] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_PostBookmarks_UserID]
    ON [dbo].[PostBookmarks]([UserID] ASC);


GO

