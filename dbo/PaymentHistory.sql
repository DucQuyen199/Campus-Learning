/*-----------------------------------------------------------------
* File: PaymentHistory.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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

