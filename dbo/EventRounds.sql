CREATE TABLE [dbo].[EventRounds] (
    [RoundID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [EventID]     BIGINT         NULL,
    [Name]        NVARCHAR (255) NULL,
    [Duration]    INT            NULL,
    [Problems]    INT            NULL,
    [Description] NVARCHAR (MAX) NULL,
    [StartTime]   DATETIME       NULL,
    [EndTime]     DATETIME       NULL,
    PRIMARY KEY CLUSTERED ([RoundID] ASC),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID])
);


GO

