CREATE TABLE [dbo].[Assignments] (
    [AssignmentID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [Title]        NVARCHAR (255) NOT NULL,
    [Description]  NVARCHAR (MAX) NULL,
    [CourseID]     BIGINT         NOT NULL,
    [DueDate]      DATETIME       NULL,
    [TotalPoints]  INT            DEFAULT ((100)) NULL,
    [CreatedBy]    BIGINT         NOT NULL,
    [CreatedAt]    DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]    DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([AssignmentID] ASC),
    CONSTRAINT [FK_Assignments_Courses] FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses] ([CourseID]),
    CONSTRAINT [FK_Assignments_Users] FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_Assignments_CourseID]
    ON [dbo].[Assignments]([CourseID] ASC);


GO

