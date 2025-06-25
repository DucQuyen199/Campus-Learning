CREATE TABLE [dbo].[MediaLikes] (
    [LikeID]    BIGINT   IDENTITY (1, 1) NOT NULL,
    [MediaID]   BIGINT   NULL,
    [UserID]    BIGINT   NULL,
    [CreatedAt] DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([LikeID] ASC),
    FOREIGN KEY ([MediaID]) REFERENCES [dbo].[PostMedia] ([MediaID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Media_Like] UNIQUE NONCLUSTERED ([MediaID] ASC, [UserID] ASC)
);


GO

