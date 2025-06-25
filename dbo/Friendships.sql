CREATE TABLE [dbo].[Friendships] (
    [FriendshipID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]       BIGINT         NOT NULL,
    [FriendID]     BIGINT         NOT NULL,
    [Status]       NVARCHAR (20)  DEFAULT ('pending') NOT NULL,
    [RequestedAt]  DATETIME       DEFAULT (getdate()) NOT NULL,
    [UpdatedAt]    DATETIME       NULL,
    [Notes]        NVARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([FriendshipID] ASC),
    CONSTRAINT [CHK_Different_Users] CHECK ([UserID]<>[FriendID]),
    CONSTRAINT [CHK_Friendship_Status] CHECK ([Status]='blocked' OR [Status]='rejected' OR [Status]='accepted' OR [Status]='pending'),
    FOREIGN KEY ([FriendID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Friendship] UNIQUE NONCLUSTERED ([UserID] ASC, [FriendID] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_Friendships_FriendID]
    ON [dbo].[Friendships]([FriendID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Friendships_UserID]
    ON [dbo].[Friendships]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Friendships_Status]
    ON [dbo].[Friendships]([Status] ASC);


GO

