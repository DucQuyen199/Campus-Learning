CREATE TABLE [dbo].[CompetitionProblems] (
    [ProblemID]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [CompetitionID]    BIGINT         NOT NULL,
    [Title]            NVARCHAR (200) NOT NULL,
    [Description]      NTEXT          NOT NULL,
    [Difficulty]       NVARCHAR (20)  DEFAULT (N'Trung bình') NOT NULL,
    [Points]           INT            DEFAULT ((100)) NOT NULL,
    [TimeLimit]        INT            DEFAULT ((1)) NOT NULL,
    [MemoryLimit]      INT            DEFAULT ((256)) NOT NULL,
    [InputFormat]      NTEXT          NULL,
    [OutputFormat]     NTEXT          NULL,
    [Constraints]      NTEXT          NULL,
    [SampleInput]      NTEXT          NULL,
    [SampleOutput]     NTEXT          NULL,
    [Explanation]      NTEXT          NULL,
    [CreatedAt]        DATETIME       DEFAULT (getdate()) NOT NULL,
    [UpdatedAt]        DATETIME       DEFAULT (getdate()) NOT NULL,
    [ImageURL]         NVARCHAR (500) NULL,
    [StarterCode]      NVARCHAR (MAX) NULL,
    [TestCasesVisible] NVARCHAR (MAX) NULL,
    [TestCasesHidden]  NVARCHAR (MAX) NULL,
    [Tags]             NVARCHAR (500) NULL,
    [Instructions]     NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([ProblemID] ASC),
    CONSTRAINT [CHK_Problem_Difficulty] CHECK ([Difficulty]=N'Khó' OR [Difficulty]=N'Trung bình' OR [Difficulty]=N'Dễ'),
    FOREIGN KEY ([CompetitionID]) REFERENCES [dbo].[Competitions] ([CompetitionID])
);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionProblems_CompetitionID]
    ON [dbo].[CompetitionProblems]([CompetitionID] ASC);


GO

