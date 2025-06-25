CREATE TABLE [dbo].[CommentLikes] (
    [CommentLikeID] BIGINT   IDENTITY (1, 1) NOT NULL,
    [CommentID]     BIGINT   NULL,
    [UserID]        BIGINT   NULL,
    [CreatedAt]     DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([CommentLikeID] ASC),
    FOREIGN KEY ([CommentID]) REFERENCES [dbo].[Comments] ([CommentID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Comment_Like] UNIQUE NONCLUSTERED ([CommentID] ASC, [UserID] ASC)
);


GO

