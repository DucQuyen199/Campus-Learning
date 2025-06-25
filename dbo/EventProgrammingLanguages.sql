CREATE TABLE [dbo].[EventProgrammingLanguages] (
    [EventID]  BIGINT       NOT NULL,
    [Language] VARCHAR (50) NOT NULL,
    PRIMARY KEY CLUSTERED ([EventID] ASC, [Language] ASC),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID])
);


GO

