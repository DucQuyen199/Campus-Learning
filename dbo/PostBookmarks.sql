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

