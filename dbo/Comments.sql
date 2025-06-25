CREATE TABLE [dbo].[Comments] (
    [CommentID]       BIGINT         IDENTITY (1, 1) NOT NULL,
    [PostID]          BIGINT         NULL,
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
    FOREIGN KEY ([ParentCommentID]) REFERENCES [dbo].[Comments] ([CommentID]),
    FOREIGN KEY ([PostID]) REFERENCES [dbo].[Posts] ([PostID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

