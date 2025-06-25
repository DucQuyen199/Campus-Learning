CREATE TABLE [dbo].[TeacherEvaluations] (
    [EvaluationID]  BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]        BIGINT         NULL,
    [TeacherID]     BIGINT         NULL,
    [ClassID]       BIGINT         NULL,
    [SemesterID]    BIGINT         NULL,
    [TeachingScore] INT            NULL,
    [ContentScore]  INT            NULL,
    [AttitudeScore] INT            NULL,
    [OverallScore]  INT            NULL,
    [Comments]      NVARCHAR (MAX) NULL,
    [IsAnonymous]   BIT            DEFAULT ((1)) NULL,
    [SubmittedAt]   DATETIME       DEFAULT (getdate()) NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([EvaluationID] ASC),
    FOREIGN KEY ([ClassID]) REFERENCES [dbo].[CourseClasses] ([ClassID]),
    FOREIGN KEY ([SemesterID]) REFERENCES [dbo].[Semesters] ([SemesterID]),
    FOREIGN KEY ([TeacherID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

