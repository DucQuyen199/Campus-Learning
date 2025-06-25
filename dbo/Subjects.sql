CREATE TABLE [dbo].[Subjects] (
    [SubjectID]       BIGINT         IDENTITY (1, 1) NOT NULL,
    [SubjectCode]     VARCHAR (20)   NULL,
    [SubjectName]     NVARCHAR (200) NOT NULL,
    [Credits]         INT            NOT NULL,
    [TheoryCredits]   INT            NULL,
    [PracticeCredits] INT            NULL,
    [Prerequisites]   NVARCHAR (MAX) NULL,
    [Description]     NVARCHAR (MAX) NULL,
    [Department]      NVARCHAR (100) NULL,
    [Faculty]         NVARCHAR (100) NULL,
    [IsRequired]      BIT            DEFAULT ((1)) NULL,
    [IsActive]        BIT            DEFAULT ((1)) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([SubjectID] ASC),
    UNIQUE NONCLUSTERED ([SubjectCode] ASC)
);


GO

