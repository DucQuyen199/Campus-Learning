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

