/*-----------------------------------------------------------------
* File: Tuition.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[Tuition] (
    [TuitionID]         BIGINT          IDENTITY (1, 1) NOT NULL,
    [UserID]            BIGINT          NULL,
    [SemesterID]        BIGINT          NULL,
    [TotalCredits]      INT             NULL,
    [AmountPerCredit]   DECIMAL (10, 2) NULL,
    [TotalAmount]       DECIMAL (10, 2) NULL,
    [ScholarshipAmount] DECIMAL (10, 2) DEFAULT ((0)) NULL,
    [FinalAmount]       DECIMAL (10, 2) NULL,
    [DueDate]           DATE            NULL,
    [Status]            VARCHAR (20)    DEFAULT ('Unpaid') NULL,
    [CreatedAt]         DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]         DATETIME        DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([TuitionID] ASC),
    CONSTRAINT [CHK_Tuition_Status] CHECK ([Status]='Waived' OR [Status]='Overdue' OR [Status]='Paid' OR [Status]='Partial' OR [Status]='Unpaid'),
    FOREIGN KEY ([SemesterID]) REFERENCES [dbo].[Semesters] ([SemesterID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

