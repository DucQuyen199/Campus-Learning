CREATE TABLE [dbo].[CourseLessons] (
    [LessonID]    BIGINT         IDENTITY (1, 1) NOT NULL,
    [ModuleID]    BIGINT         NULL,
    [Title]       NVARCHAR (255) NOT NULL,
    [Description] NVARCHAR (MAX) NULL,
    [Type]        VARCHAR (50)   NOT NULL,
    [Content]     NVARCHAR (MAX) NULL,
    [VideoUrl]    VARCHAR (255)  NULL,
    [Duration]    INT            NULL,
    [OrderIndex]  INT            NOT NULL,
    [IsPreview]   BIT            DEFAULT ((0)) NULL,
    [IsPublished] BIT            DEFAULT ((0)) NULL,
    [CreatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([LessonID] ASC),
    CONSTRAINT [CHK_Lesson_Type] CHECK ([Type]='exercise' OR [Type]='coding' OR [Type]='assignment' OR [Type]='quiz' OR [Type]='text' OR [Type]='video'),
    FOREIGN KEY ([ModuleID]) REFERENCES [dbo].[CourseModules] ([ModuleID])
);


GO

