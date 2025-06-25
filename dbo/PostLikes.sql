CREATE TABLE [dbo].[PostLikes] (
    [LikeID]    BIGINT   IDENTITY (1, 1) NOT NULL,
    [PostID]    BIGINT   NULL,
    [UserID]    BIGINT   NULL,
    [CreatedAt] DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([LikeID] ASC),
    FOREIGN KEY ([PostID]) REFERENCES [dbo].[Posts] ([PostID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Post_Like] UNIQUE NONCLUSTERED ([PostID] ASC, [UserID] ASC)
);


GO

