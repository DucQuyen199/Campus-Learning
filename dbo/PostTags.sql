CREATE TABLE [dbo].[PostTags] (
    [PostID]    BIGINT   NOT NULL,
    [TagID]     INT      NOT NULL,
    [CreatedAt] DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([PostID] ASC, [TagID] ASC),
    FOREIGN KEY ([PostID]) REFERENCES [dbo].[Posts] ([PostID]),
    FOREIGN KEY ([TagID]) REFERENCES [dbo].[Tags] ([TagID])
);


GO

