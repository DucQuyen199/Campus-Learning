CREATE TABLE [dbo].[Tags] (
    [TagID]       INT            IDENTITY (1, 1) NOT NULL,
    [Name]        NVARCHAR (50)  NOT NULL,
    [Description] NVARCHAR (255) NULL,
    [CreatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    [UsageCount]  INT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([TagID] ASC),
    UNIQUE NONCLUSTERED ([Name] ASC)
);


GO

