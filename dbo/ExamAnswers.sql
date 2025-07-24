/*-----------------------------------------------------------------
* File: ExamAnswers.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[ExamAnswers] (
    [AnswerID]         BIGINT         IDENTITY (1, 1) NOT NULL,
    [ParticipantID]    BIGINT         NULL,
    [QuestionID]       BIGINT         NULL,
    [Answer]           NVARCHAR (MAX) NULL,
    [IsCorrect]        BIT            NULL,
    [Score]            INT            NULL,
    [ReviewerComments] NVARCHAR (MAX) NULL,
    [SubmittedAt]      DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([AnswerID] ASC),
    FOREIGN KEY ([ParticipantID]) REFERENCES [dbo].[ExamParticipants] ([ParticipantID]),
    FOREIGN KEY ([QuestionID]) REFERENCES [dbo].[ExamQuestions] ([QuestionID])
);


GO

