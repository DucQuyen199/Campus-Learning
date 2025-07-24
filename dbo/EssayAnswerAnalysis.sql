/*-----------------------------------------------------------------
* File: EssayAnswerAnalysis.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[EssayAnswerAnalysis] (
    [AnalysisID]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [AnswerID]          BIGINT         NULL,
    [MatchPercentage]   DECIMAL (5, 2) NULL,
    [KeywordsMatched]   INT            NULL,
    [TotalKeywords]     INT            NULL,
    [ContentSimilarity] DECIMAL (5, 2) NULL,
    [GrammarScore]      DECIMAL (5, 2) NULL,
    [AnalyzedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [AutoGradedScore]   INT            NULL,
    [FinalScore]        INT            NULL,
    [ReviewerComments]  NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([AnalysisID] ASC),
    FOREIGN KEY ([AnswerID]) REFERENCES [dbo].[ExamAnswers] ([AnswerID])
);


GO

