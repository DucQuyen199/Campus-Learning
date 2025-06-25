CREATE TABLE [dbo].[Users] (
    [UserID]             BIGINT         IDENTITY (1, 1) NOT NULL,
    [Username]           VARCHAR (50)   NOT NULL,
    [Email]              VARCHAR (100)  NOT NULL,
    [Password]           VARCHAR (255)  NOT NULL,
    [FullName]           NVARCHAR (100) NOT NULL,
    [DateOfBirth]        DATE           NULL,
    [School]             NVARCHAR (255) NULL,
    [Role]               VARCHAR (20)   DEFAULT ('STUDENT') NULL,
    [Status]             VARCHAR (20)   DEFAULT ('ONLINE') NULL,
    [AccountStatus]      VARCHAR (20)   DEFAULT ('ACTIVE') NULL,
    [Image]              VARCHAR (255)  NULL,
    [Bio]                NVARCHAR (500) NULL,
    [Provider]           VARCHAR (20)   DEFAULT ('local') NULL,
    [ProviderID]         VARCHAR (100)  NULL,
    [EmailVerified]      BIT            DEFAULT ((0)) NULL,
    [PhoneNumber]        VARCHAR (15)   NULL,
    [Address]            NVARCHAR (255) NULL,
    [City]               NVARCHAR (100) NULL,
    [Country]            NVARCHAR (100) NULL,
    [LastLoginIP]        VARCHAR (45)   NULL,
    [CreatedAt]          DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]          DATETIME       DEFAULT (getdate()) NULL,
    [LastLoginAt]        DATETIME       NULL,
    [DeletedAt]          DATETIME       NULL,
    [LockDuration]       INT            NULL,
    [LockReason]         NVARCHAR (255) NULL,
    [LockedUntil]        DATETIME       NULL,
    [Avatar]             NVARCHAR (255) NULL,
    [PasskeyCredentials] NVARCHAR (MAX) NULL,
    [HasPasskey]         BIT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([UserID] ASC),
    CONSTRAINT [CHK_Account_Status] CHECK ([AccountStatus]='DELETED' OR [AccountStatus]='SUSPENDED' OR [AccountStatus]='LOCKED' OR [AccountStatus]='ACTIVE'),
    CONSTRAINT [CHK_User_Role] CHECK ([Role]='ADMIN' OR [Role]='TEACHER' OR [Role]='STUDENT'),
    CONSTRAINT [CHK_User_Status] CHECK ([Status]='AWAY' OR [Status]='OFFLINE' OR [Status]='ONLINE'),
    UNIQUE NONCLUSTERED ([Email] ASC),
    UNIQUE NONCLUSTERED ([Username] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_Users_Status]
    ON [dbo].[Users]([Status] ASC);


GO

