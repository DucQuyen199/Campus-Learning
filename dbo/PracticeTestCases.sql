/*-----------------------------------------------------------------
* File: PracticeTestCases.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[PracticeTestCases] (
    [TestCaseID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [PracticeID]     BIGINT         NULL,
    [Input]          NVARCHAR (MAX) NULL,
    [ExpectedOutput] NVARCHAR (MAX) NULL,
    [IsHidden]       BIT            DEFAULT ((0)) NULL,
    [OrderIndex]     INT            NOT NULL,
    [CreatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([TestCaseID] ASC),
    FOREIGN KEY ([PracticeID]) REFERENCES [dbo].[ModulePractices] ([PracticeID])
);


GO

