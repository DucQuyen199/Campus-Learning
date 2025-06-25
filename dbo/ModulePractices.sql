CREATE TABLE [dbo].[ModulePractices] (
    [PracticeID]          BIGINT         IDENTITY (1, 1) NOT NULL,
    [ModuleID]            BIGINT         NULL,
    [Title]               NVARCHAR (255) NOT NULL,
    [Description]         NVARCHAR (MAX) NULL,
    [ProgrammingLanguage] VARCHAR (50)   NOT NULL,
    [InitialCode]         NVARCHAR (MAX) NULL,
    [TimeLimit]           INT            DEFAULT ((1000)) NULL,
    [MemoryLimit]         INT            DEFAULT ((256)) NULL,
    [Difficulty]          VARCHAR (20)   DEFAULT ('easy') NULL,
    [CreatedAt]           DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]           DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([PracticeID] ASC),
    CONSTRAINT [CHK_Practice_Difficulty] CHECK ([Difficulty]='expert' OR [Difficulty]='hard' OR [Difficulty]='medium' OR [Difficulty]='easy'),
    CONSTRAINT [CHK_Practice_Language] CHECK ([ProgrammingLanguage]='csharp' OR [ProgrammingLanguage]='cpp' OR [ProgrammingLanguage]='java' OR [ProgrammingLanguage]='python' OR [ProgrammingLanguage]='javascript'),
    FOREIGN KEY ([ModuleID]) REFERENCES [dbo].[CourseModules] ([ModuleID])
);


GO

