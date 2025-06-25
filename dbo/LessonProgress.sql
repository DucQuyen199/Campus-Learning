CREATE TABLE [dbo].[LessonProgress] (
    [ProgressID]   BIGINT       IDENTITY (1, 1) NOT NULL,
    [EnrollmentID] BIGINT       NULL,
    [LessonID]     BIGINT       NULL,
    [Status]       VARCHAR (20) DEFAULT ('not_started') NULL,
    [CompletedAt]  DATETIME     NULL,
    [TimeSpent]    INT          DEFAULT ((0)) NULL,
    [LastPosition] INT          DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([ProgressID] ASC),
    CONSTRAINT [CHK_Lesson_Status] CHECK ([Status]='completed' OR [Status]='in_progress' OR [Status]='not_started'),
    FOREIGN KEY ([EnrollmentID]) REFERENCES [dbo].[CourseEnrollments] ([EnrollmentID]),
    FOREIGN KEY ([LessonID]) REFERENCES [dbo].[CourseLessons] ([LessonID])
);


GO

CREATE NONCLUSTERED INDEX [IX_LessonProgress_Status]
    ON [dbo].[LessonProgress]([Status] ASC);


GO

