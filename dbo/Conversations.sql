CREATE TABLE [dbo].[Conversations] (
    [ConversationID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [Type]           VARCHAR (20)   DEFAULT ('private') NULL,
    [Title]          NVARCHAR (255) NULL,
    [CreatedBy]      BIGINT         NULL,
    [CreatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    [LastMessageAt]  DATETIME       NULL,
    [IsActive]       BIT            DEFAULT ((1)) NULL,
    PRIMARY KEY CLUSTERED ([ConversationID] ASC),
    CONSTRAINT [CHK_Conversation_Type] CHECK ([Type]='group' OR [Type]='private'),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID])
);


GO

