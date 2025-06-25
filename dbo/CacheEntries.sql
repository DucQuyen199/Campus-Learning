CREATE TABLE [dbo].[CacheEntries] (
    [CacheKey]  VARCHAR (255)  NOT NULL,
    [Value]     NVARCHAR (MAX) NULL,
    [ExpiresAt] DATETIME       NULL,
    [CreatedAt] DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt] DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([CacheKey] ASC)
);


GO

