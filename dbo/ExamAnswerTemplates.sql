/*-----------------------------------------------------------------
* File: ExamAnswerTemplates.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[ExamAnswerTemplates] (
    [TemplateID]             BIGINT         IDENTITY (1, 1) NOT NULL,
    [ExamID]                 BIGINT         NULL,
    [Content]                NVARCHAR (MAX) NULL,
    [Keywords]               NVARCHAR (MAX) NULL,
    [MinimumMatchPercentage] DECIMAL (5, 2) NULL,
    [CreatedBy]              BIGINT         NULL,
    [CreatedAt]              DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]              DATETIME       NULL,
    [QuestionID]             BIGINT         NULL,
    PRIMARY KEY CLUSTERED ([TemplateID] ASC),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([ExamID]) REFERENCES [dbo].[Exams] ([ExamID]),
    CONSTRAINT [FK_ExamAnswerTemplates_ExamQuestions] FOREIGN KEY ([QuestionID]) REFERENCES [dbo].[ExamQuestions] ([QuestionID])
);


GO

