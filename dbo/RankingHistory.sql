/*-----------------------------------------------------------------
* File: RankingHistory.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[RankingHistory] (
    [HistoryID]    BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]       BIGINT         NULL,
    [Type]         VARCHAR (20)   NULL,
    [RelatedID]    BIGINT         NULL,
    [PointsEarned] INT            NULL,
    [Reason]       NVARCHAR (255) NULL,
    [CreatedAt]    DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([HistoryID] ASC),
    CONSTRAINT [CHK_Ranking_Type] CHECK ([Type]='COURSE' OR [Type]='EVENT'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_RankingHistory_UserID]
    ON [dbo].[RankingHistory]([UserID] ASC);


GO

