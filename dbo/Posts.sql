CREATE TABLE [dbo].[Posts] (
    [PostID]         BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]         BIGINT         NULL,
    [Content]        NVARCHAR (MAX) NULL,
    [Type]           VARCHAR (20)   DEFAULT ('regular') NULL,
    [Visibility]     VARCHAR (20)   DEFAULT ('public') NULL,
    [Location]       NVARCHAR (255) NULL,
    [CreatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    [DeletedAt]      DATETIME       NULL,
    [LikesCount]     INT            DEFAULT ((0)) NULL,
    [CommentsCount]  INT            DEFAULT ((0)) NULL,
    [SharesCount]    INT            DEFAULT ((0)) NULL,
    [ReportsCount]   INT            DEFAULT ((0)) NULL,
    [IsFlagged]      BIT            DEFAULT ((0)) NULL,
    [FlaggedReason]  NVARCHAR (255) NULL,
    [FlaggedAt]      DATETIME       NULL,
    [IsDeleted]      BIT            DEFAULT ((0)) NULL,
    [BookmarksCount] INT            DEFAULT ((0)) NOT NULL,
    PRIMARY KEY CLUSTERED ([PostID] ASC),
    CONSTRAINT [CHK_Post_Type] CHECK ([Type]='announcement' OR [Type]='question' OR [Type]='article' OR [Type]='regular'),
    CONSTRAINT [CHK_Post_Visibility] CHECK ([Visibility]='friends' OR [Visibility]='private' OR [Visibility]='public'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

