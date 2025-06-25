CREATE TABLE [dbo].[EventPrizes] (
    [PrizeID]     BIGINT          IDENTITY (1, 1) NOT NULL,
    [EventID]     BIGINT          NULL,
    [Rank]        INT             NULL,
    [PrizeAmount] DECIMAL (10, 2) NULL,
    [Description] NVARCHAR (500)  NULL,
    PRIMARY KEY CLUSTERED ([PrizeID] ASC),
    CONSTRAINT [CHK_Prize_Rank] CHECK ([Rank]>(0)),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID])
);


GO

