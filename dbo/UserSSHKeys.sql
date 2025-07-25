/*-----------------------------------------------------------------
* File: UserSSHKeys.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[UserSSHKeys] (
    [KeyID]       BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]      BIGINT         NOT NULL,
    [Title]       NVARCHAR (100) NOT NULL,
    [KeyType]     VARCHAR (20)   NOT NULL,
    [KeyValue]    NVARCHAR (MAX) NOT NULL,
    [Fingerprint] VARCHAR (100)  NOT NULL,
    [CreatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    [LastUsedAt]  DATETIME       NULL,
    [DeletedAt]   DATETIME       NULL,
    PRIMARY KEY CLUSTERED ([KeyID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_UserSSHKeys_User_Fingerprint] UNIQUE NONCLUSTERED ([UserID] ASC, [Fingerprint] ASC)
);


GO

