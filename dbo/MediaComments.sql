/*-----------------------------------------------------------------
* File: MediaComments.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[MediaComments] (
    [CommentID]       BIGINT         IDENTITY (1, 1) NOT NULL,
    [MediaID]         BIGINT         NULL,
    [UserID]          BIGINT         NULL,
    [ParentCommentID] BIGINT         NULL,
    [Content]         NVARCHAR (MAX) NULL,
    [LikesCount]      INT            DEFAULT ((0)) NULL,
    [RepliesCount]    INT            DEFAULT ((0)) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       NULL,
    [DeletedAt]       DATETIME       NULL,
    [IsEdited]        BIT            DEFAULT ((0)) NULL,
    [IsDeleted]       BIT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([CommentID] ASC),
    FOREIGN KEY ([MediaID]) REFERENCES [dbo].[PostMedia] ([MediaID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [FK_MediaComments_ParentComment] FOREIGN KEY ([ParentCommentID]) REFERENCES [dbo].[MediaComments] ([CommentID])
);


GO

