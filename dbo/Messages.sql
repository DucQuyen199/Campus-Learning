/*-----------------------------------------------------------------
* File: Messages.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[Messages] (
    [MessageID]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [ConversationID]   BIGINT         NULL,
    [SenderID]         BIGINT         NULL,
    [Type]             VARCHAR (20)   DEFAULT ('text') NULL,
    [Content]          NVARCHAR (MAX) NULL,
    [MediaUrl]         VARCHAR (255)  NULL,
    [MediaType]        VARCHAR (20)   NULL,
    [ReplyToMessageID] BIGINT         NULL,
    [IsEdited]         BIT            DEFAULT ((0)) NULL,
    [IsDeleted]        BIT            DEFAULT ((0)) NULL,
    [CreatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME       NULL,
    [DeletedAt]        DATETIME       NULL,
    PRIMARY KEY CLUSTERED ([MessageID] ASC),
    CONSTRAINT [CHK_Message_Type] CHECK ([Type]='location' OR [Type]='audio' OR [Type]='file' OR [Type]='video' OR [Type]='image' OR [Type]='text'),
    FOREIGN KEY ([ConversationID]) REFERENCES [dbo].[Conversations] ([ConversationID]),
    FOREIGN KEY ([ReplyToMessageID]) REFERENCES [dbo].[Messages] ([MessageID]),
    FOREIGN KEY ([SenderID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_Messages_ReplyToMessageID]
    ON [dbo].[Messages]([ReplyToMessageID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Messages_SenderID]
    ON [dbo].[Messages]([SenderID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Messages_ConversationID]
    ON [dbo].[Messages]([ConversationID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Messages_CreatedAt]
    ON [dbo].[Messages]([CreatedAt] DESC);


GO



CREATE TRIGGER TR_Messages_After_Insert
ON Messages
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE c
    SET c.LastMessageAt = i.CreatedAt,
        c.UpdatedAt = GETDATE()
    FROM Conversations c
    INNER JOIN inserted i ON c.ConversationID = i.ConversationID;
END

GO

