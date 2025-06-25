CREATE TABLE [dbo].[UserPresence] (
    [PresenceID]      BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]          BIGINT         NULL,
    [Status]          VARCHAR (20)   DEFAULT ('offline') NULL,
    [LastActiveAt]    DATETIME       DEFAULT (getdate()) NULL,
    [CurrentDeviceID] VARCHAR (255)  NULL,
    [LastLocation]    NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([PresenceID] ASC),
    CONSTRAINT [CHK_Presence_Status] CHECK ([Status]='in_call' OR [Status]='busy' OR [Status]='away' OR [Status]='offline' OR [Status]='online'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_UserPresence_Status]
    ON [dbo].[UserPresence]([Status] ASC);


GO

