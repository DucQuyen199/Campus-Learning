CREATE TABLE [dbo].[MessageStatus] (
    [StatusID]  BIGINT       IDENTITY (1, 1) NOT NULL,
    [MessageID] BIGINT       NULL,
    [UserID]    BIGINT       NULL,
    [Status]    VARCHAR (20) DEFAULT ('sent') NULL,
    [UpdatedAt] DATETIME     DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([StatusID] ASC),
    CONSTRAINT [CHK_Message_Status] CHECK ([Status]='read' OR [Status]='delivered' OR [Status]='sent'),
    FOREIGN KEY ([MessageID]) REFERENCES [dbo].[Messages] ([MessageID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Message_User_Status] UNIQUE NONCLUSTERED ([MessageID] ASC, [UserID] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_MessageStatus_UserID]
    ON [dbo].[MessageStatus]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_MessageStatus_MessageID]
    ON [dbo].[MessageStatus]([MessageID] ASC);


GO

