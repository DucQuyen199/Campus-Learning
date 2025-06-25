CREATE TABLE [dbo].[Notifications] (
    [NotificationID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]         BIGINT         NULL,
    [Type]           VARCHAR (50)   NULL,
    [Title]          NVARCHAR (255) NULL,
    [Content]        NVARCHAR (MAX) NULL,
    [RelatedID]      BIGINT         NULL,
    [RelatedType]    VARCHAR (50)   NULL,
    [IsRead]         BIT            DEFAULT ((0)) NULL,
    [CreatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    [ExpiresAt]      DATETIME       NULL,
    [Priority]       VARCHAR (20)   DEFAULT ('normal') NULL,
    PRIMARY KEY CLUSTERED ([NotificationID] ASC),
    CONSTRAINT [CHK_Notification_Type] CHECK ([Type]='reaction' OR [Type]='mention' OR [Type]='story_view' OR [Type]='reply' OR [Type]='comment' OR [Type]='missed_call' OR [Type]='call' OR [Type]='message'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_Notifications_UserID_IsRead]
    ON [dbo].[Notifications]([UserID] ASC, [IsRead] ASC);


GO

