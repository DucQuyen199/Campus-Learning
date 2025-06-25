CREATE TABLE [dbo].[ProgramSubjects] (
    [ProgramSubjectID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [ProgramID]        BIGINT         NULL,
    [SubjectID]        BIGINT         NULL,
    [Semester]         INT            NULL,
    [SubjectType]      VARCHAR (50)   NULL,
    [IsRequired]       BIT            DEFAULT ((1)) NULL,
    [MinimumGrade]     DECIMAL (5, 2) NULL,
    [CreatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ProgramSubjectID] ASC),
    FOREIGN KEY ([ProgramID]) REFERENCES [dbo].[AcademicPrograms] ([ProgramID]),
    FOREIGN KEY ([SubjectID]) REFERENCES [dbo].[Subjects] ([SubjectID])
);


GO

