CREATE TABLE [dbo].[CodingExercises] (
    [ExerciseID]          BIGINT         IDENTITY (1, 1) NOT NULL,
    [LessonID]            BIGINT         NULL,
    [Title]               NVARCHAR (255) NOT NULL,
    [Description]         NVARCHAR (MAX) NULL,
    [ProgrammingLanguage] VARCHAR (50)   NULL,
    [InitialCode]         NVARCHAR (MAX) NULL,
    [SolutionCode]        NVARCHAR (MAX) NULL,
    [TestCases]           NVARCHAR (MAX) NULL,
    [TimeLimit]           INT            DEFAULT ((1000)) NULL,
    [MemoryLimit]         INT            DEFAULT ((256)) NULL,
    [Difficulty]          VARCHAR (20)   DEFAULT ('medium') NULL,
    [Points]              INT            DEFAULT ((0)) NULL,
    [CreatedAt]           DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]           DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ExerciseID] ASC),
    CONSTRAINT [CHK_Exercise_Difficulty] CHECK ([Difficulty]='expert' OR [Difficulty]='hard' OR [Difficulty]='medium' OR [Difficulty]='easy'),
    FOREIGN KEY ([LessonID]) REFERENCES [dbo].[CourseLessons] ([LessonID])
);


GO

