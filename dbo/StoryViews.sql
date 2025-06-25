CREATE TABLE [dbo].[StoryViews] (
    [ViewID]   BIGINT   IDENTITY (1, 1) NOT NULL,
    [StoryID]  BIGINT   NULL,
    [ViewerID] BIGINT   NULL,
    [ViewedAt] DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ViewID] ASC),
    FOREIGN KEY ([StoryID]) REFERENCES [dbo].[Stories] ([StoryID]),
    FOREIGN KEY ([ViewerID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Story_View] UNIQUE NONCLUSTERED ([StoryID] ASC, [ViewerID] ASC)
);


GO

