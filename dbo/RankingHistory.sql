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

