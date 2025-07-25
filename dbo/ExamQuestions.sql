/*-----------------------------------------------------------------
* File: ExamQuestions.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[ExamQuestions] (
    [QuestionID]    BIGINT         IDENTITY (1, 1) NOT NULL,
    [ExamID]        BIGINT         NULL,
    [Type]          VARCHAR (50)   NOT NULL,
    [Content]       NVARCHAR (MAX) NULL,
    [Points]        INT            DEFAULT ((1)) NULL,
    [OrderIndex]    INT            NULL,
    [Options]       NVARCHAR (MAX) NULL,
    [CorrectAnswer] NVARCHAR (MAX) NULL,
    [Explanation]   NVARCHAR (MAX) NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([QuestionID] ASC),
    CONSTRAINT [CHK_Question_Type] CHECK ([Type]='coding' OR [Type]='essay' OR [Type]='multiple_choice'),
    FOREIGN KEY ([ExamID]) REFERENCES [dbo].[Exams] ([ExamID])
);


GO

