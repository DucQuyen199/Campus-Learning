/*-----------------------------------------------------------------
* File: MediaCommentLikes.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[MediaCommentLikes] (
    [CommentLikeID] BIGINT   IDENTITY (1, 1) NOT NULL,
    [CommentID]     BIGINT   NULL,
    [UserID]        BIGINT   NULL,
    [CreatedAt]     DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([CommentLikeID] ASC),
    FOREIGN KEY ([CommentID]) REFERENCES [dbo].[MediaComments] ([CommentID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_MediaComment_Like] UNIQUE NONCLUSTERED ([CommentID] ASC, [UserID] ASC)
);


GO

