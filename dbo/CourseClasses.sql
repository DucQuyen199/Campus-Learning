CREATE TABLE [dbo].[CourseClasses] (
    [ClassID]         BIGINT         IDENTITY (1, 1) NOT NULL,
    [ClassCode]       VARCHAR (20)   NULL,
    [SubjectID]       BIGINT         NULL,
    [SemesterID]      BIGINT         NULL,
    [TeacherID]       BIGINT         NULL,
    [MaxStudents]     INT            NULL,
    [CurrentStudents] INT            DEFAULT ((0)) NULL,
    [StartDate]       DATE           NULL,
    [EndDate]         DATE           NULL,
    [Schedule]        NVARCHAR (MAX) NULL,
    [Location]        NVARCHAR (100) NULL,
    [Status]          VARCHAR (20)   DEFAULT ('Planned') NULL,
    [Type]            VARCHAR (20)   DEFAULT ('Regular') NULL,
    [IsOnline]        BIT            DEFAULT ((0)) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ClassID] ASC),
    CONSTRAINT [CHK_Class_Status] CHECK ([Status]='Cancelled' OR [Status]='Completed' OR [Status]='Ongoing' OR [Status]='Registration' OR [Status]='Planned'),
    CONSTRAINT [CHK_Class_Type] CHECK ([Type]='Improvement' OR [Type]='Retake' OR [Type]='Regular'),
    FOREIGN KEY ([SemesterID]) REFERENCES [dbo].[Semesters] ([SemesterID]),
    FOREIGN KEY ([SubjectID]) REFERENCES [dbo].[Subjects] ([SubjectID]),
    FOREIGN KEY ([TeacherID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([ClassCode] ASC)
);


GO

