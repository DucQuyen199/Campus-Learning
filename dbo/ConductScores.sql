CREATE TABLE [dbo].[ConductScores] (
    [ConductID]      BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]         BIGINT         NULL,
    [SemesterID]     BIGINT         NULL,
    [SelfScore]      INT            NULL,
    [ClassScore]     INT            NULL,
    [FacultyScore]   INT            NULL,
    [TotalScore]     INT            NULL,
    [Classification] VARCHAR (20)   NULL,
    [Comments]       NVARCHAR (500) NULL,
    [Status]         VARCHAR (20)   DEFAULT ('Draft') NULL,
    [CreatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ConductID] ASC),
    CONSTRAINT [CHK_Conduct_Classification] CHECK ([Classification]='Poor' OR [Classification]='Below Average' OR [Classification]='Average' OR [Classification]='Good' OR [Classification]='Excellent'),
    CONSTRAINT [CHK_Conduct_Status] CHECK ([Status]='Finalized' OR [Status]='Reviewed' OR [Status]='Submitted' OR [Status]='Draft'),
    FOREIGN KEY ([SemesterID]) REFERENCES [dbo].[Semesters] ([SemesterID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

