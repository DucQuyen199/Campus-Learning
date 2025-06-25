CREATE TABLE [dbo].[EventTechnologies] (
    [EventID]    BIGINT        NOT NULL,
    [Technology] VARCHAR (100) NOT NULL,
    PRIMARY KEY CLUSTERED ([EventID] ASC, [Technology] ASC),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID])
);


GO

