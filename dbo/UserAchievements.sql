CREATE TABLE [dbo].[UserAchievements] (
    [UserAchievementID] BIGINT   IDENTITY (1, 1) NOT NULL,
    [UserID]            BIGINT   NULL,
    [AchievementID]     INT      NULL,
    [EarnedAt]          DATETIME DEFAULT (getdate()) NULL,
    [Progress]          INT      DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([UserAchievementID] ASC),
    FOREIGN KEY ([AchievementID]) REFERENCES [dbo].[Achievements] ([AchievementID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_User_Achievement] UNIQUE NONCLUSTERED ([UserID] ASC, [AchievementID] ASC)
);


GO

