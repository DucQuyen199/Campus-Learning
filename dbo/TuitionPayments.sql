/*-----------------------------------------------------------------
* File: TuitionPayments.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[TuitionPayments] (
    [PaymentID]       BIGINT          IDENTITY (1, 1) NOT NULL,
    [TuitionID]       BIGINT          NOT NULL,
    [UserID]          BIGINT          NOT NULL,
    [Semester]        VARCHAR (20)    NOT NULL,
    [AcademicYear]    VARCHAR (10)    NOT NULL,
    [Amount]          DECIMAL (10, 2) NOT NULL,
    [Status]          VARCHAR (20)    DEFAULT ('PENDING') NOT NULL,
    [PaymentMethod]   VARCHAR (50)    NULL,
    [PaymentDate]     DATETIME        NULL,
    [DueDate]         DATETIME        NOT NULL,
    [CreatedAt]       DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME        DEFAULT (getdate()) NULL,
    [Notes]           NVARCHAR (500)  NULL,
    [TransactionCode] VARCHAR (100)   NULL,
    [InvoiceNumber]   VARCHAR (50)    NULL,
    [IsFullTuition]   BIT             DEFAULT ((1)) NOT NULL,
    [BankReference]   VARCHAR (100)   NULL,
    PRIMARY KEY CLUSTERED ([PaymentID] ASC),
    CONSTRAINT [CHK_TuitionPayments_Status] CHECK ([Status]='REFUNDED' OR [Status]='CANCELLED' OR [Status]='PAID' OR [Status]='PENDING'),
    FOREIGN KEY ([TuitionID]) REFERENCES [dbo].[Tuition] ([TuitionID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Tuition_User_Semester_Year] UNIQUE NONCLUSTERED ([UserID] ASC, [Semester] ASC, [AcademicYear] ASC, [IsFullTuition] ASC)
);


GO

