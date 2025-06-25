CREATE TABLE [dbo].[Courses] (
    [CourseID]         BIGINT          IDENTITY (1, 1) NOT NULL,
    [Title]            NVARCHAR (255)  NOT NULL,
    [Slug]             VARCHAR (255)   NULL,
    [Description]      NVARCHAR (MAX)  NULL,
    [ShortDescription] NVARCHAR (500)  NULL,
    [InstructorID]     BIGINT          NULL,
    [Level]            VARCHAR (20)    NULL,
    [Category]         VARCHAR (50)    NULL,
    [SubCategory]      VARCHAR (50)    NULL,
    [CourseType]       VARCHAR (20)    DEFAULT ('regular') NULL,
    [Language]         VARCHAR (20)    DEFAULT ('vi') NULL,
    [Duration]         INT             NULL,
    [Capacity]         INT             NULL,
    [EnrolledCount]    INT             DEFAULT ((0)) NULL,
    [Rating]           DECIMAL (3, 2)  DEFAULT ((0)) NULL,
    [RatingCount]      INT             DEFAULT ((0)) NULL,
    [Price]            DECIMAL (10, 2) DEFAULT ((0)) NULL,
    [DiscountPrice]    DECIMAL (10, 2) NULL,
    [ImageUrl]         VARCHAR (255)   NULL,
    [VideoUrl]         VARCHAR (255)   NULL,
    [Requirements]     NVARCHAR (MAX)  NULL,
    [Objectives]       NVARCHAR (MAX)  NULL,
    [Syllabus]         NVARCHAR (MAX)  NULL,
    [Status]           VARCHAR (20)    DEFAULT ('draft') NULL,
    [IsPublished]      BIT             DEFAULT ((0)) NULL,
    [PublishedAt]      DATETIME        NULL,
    [CreatedAt]        DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME        DEFAULT (getdate()) NULL,
    [DeletedAt]        DATETIME        NULL,
    PRIMARY KEY CLUSTERED ([CourseID] ASC),
    CONSTRAINT [CHK_Course_Level] CHECK ([Level]='expert' OR [Level]='advanced' OR [Level]='intermediate' OR [Level]='beginner'),
    CONSTRAINT [CHK_Course_Status] CHECK ([Status]='archived' OR [Status]='published' OR [Status]='review' OR [Status]='draft'),
    CONSTRAINT [CHK_Course_Type] CHECK ([CourseType]='regular' OR [CourseType]='it'),
    FOREIGN KEY ([InstructorID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([Slug] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_Courses_Status]
    ON [dbo].[Courses]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Courses_InstructorID]
    ON [dbo].[Courses]([InstructorID] ASC);


GO

