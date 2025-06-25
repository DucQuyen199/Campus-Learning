CREATE TABLE [dbo].[UserRankings] (
    [RankingID]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]           BIGINT         NULL,
    [Tier]             VARCHAR (20)   NULL,
    [TotalPoints]      INT            DEFAULT ((0)) NULL,
    [EventPoints]      INT            DEFAULT ((0)) NULL,
    [CoursePoints]     INT            DEFAULT ((0)) NULL,
    [ProblemsSolved]   INT            DEFAULT ((0)) NULL,
    [Accuracy]         DECIMAL (5, 2) DEFAULT ((0)) NULL,
    [Wins]             INT            DEFAULT ((0)) NULL,
    [MonthlyScore]     INT            DEFAULT ((0)) NULL,
    [WeeklyScore]      INT            DEFAULT ((0)) NULL,
    [LastCalculatedAt] DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([RankingID] ASC),
    CONSTRAINT [CHK_Ranking_Tier] CHECK ([Tier]='BRONZE' OR [Tier]='SILVER' OR [Tier]='GOLD' OR [Tier]='PLATINUM' OR [Tier]='DIAMOND' OR [Tier]='MASTER'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_UserRankings_Tier]
    ON [dbo].[UserRankings]([Tier] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_UserRankings_TotalPoints]
    ON [dbo].[UserRankings]([TotalPoints] DESC);


GO

