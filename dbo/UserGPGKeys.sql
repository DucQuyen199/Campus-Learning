CREATE TABLE [dbo].[UserGPGKeys] (
    [KeyID]       BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]      BIGINT         NOT NULL,
    [Title]       NVARCHAR (100) NOT NULL,
    [KeyType]     VARCHAR (20)   NOT NULL,
    [KeyValue]    NVARCHAR (MAX) NOT NULL,
    [Fingerprint] VARCHAR (100)  NOT NULL,
    [CreatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    [ExpiresAt]   DATETIME       NULL,
    [DeletedAt]   DATETIME       NULL,
    PRIMARY KEY CLUSTERED ([KeyID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_UserGPGKeys_User_Fingerprint] UNIQUE NONCLUSTERED ([UserID] ASC, [Fingerprint] ASC)
);


GO

