CREATE TABLE [dbo].[PasswordResets] (
    [ResetID]      INT      IDENTITY (1, 1) NOT NULL,
    [UserID]       BIGINT   NOT NULL,
    [OTP]          CHAR (6) NOT NULL,
    [ExpiresAt]    DATETIME NOT NULL,
    [CreatedAt]    DATETIME DEFAULT (getdate()) NOT NULL,
    [IsUsed]       BIT      DEFAULT ((0)) NOT NULL,
    [AttemptCount] INT      DEFAULT ((0)) NOT NULL,
    PRIMARY KEY CLUSTERED ([ResetID] ASC),
    CONSTRAINT [FK_PasswordResets_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]) ON DELETE CASCADE
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_PasswordResets_UserID_Active]
    ON [dbo].[PasswordResets]([UserID] ASC) WHERE ([IsUsed]=(0));


GO

CREATE NONCLUSTERED INDEX [IX_PasswordResets_UserID]
    ON [dbo].[PasswordResets]([UserID] ASC);


GO

