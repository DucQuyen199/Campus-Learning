CREATE TABLE [dbo].[PaymentHistory] (
    [HistoryID]     BIGINT          IDENTITY (1, 1) NOT NULL,
    [TransactionID] BIGINT          NULL,
    [Status]        VARCHAR (50)    NOT NULL,
    [Message]       NVARCHAR (500)  NULL,
    [ResponseData]  NVARCHAR (MAX)  NULL,
    [IPAddress]     VARCHAR (50)    NULL,
    [UserAgent]     NVARCHAR (500)  NULL,
    [CreatedAt]     DATETIME        DEFAULT (getdate()) NULL,
    [Notes]         NVARCHAR (1000) NULL,
    [UpdatedAt]     DATETIME        DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([HistoryID] ASC),
    FOREIGN KEY ([TransactionID]) REFERENCES [dbo].[PaymentTransactions] ([TransactionID])
);


GO

