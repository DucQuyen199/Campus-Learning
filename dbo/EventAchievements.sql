CREATE TABLE [dbo].[EventAchievements] (
    [AchievementID] BIGINT       IDENTITY (1, 1) NOT NULL,
    [EventID]       BIGINT       NULL,
    [UserID]        BIGINT       NULL,
    [Position]      INT          NULL,
    [Points]        INT          NULL,
    [BadgeType]     VARCHAR (50) NULL,
    [AwardedAt]     DATETIME     DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([AchievementID] ASC),
    CONSTRAINT [CHK_Badge_Type] CHECK ([BadgeType]='TEAM_WINNER' OR [BadgeType]='FAST_SOLVER' OR [BadgeType]='PERFECT_SCORE' OR [BadgeType]='TOP_10' OR [BadgeType]='TOP_3' OR [BadgeType]='FIRST_PLACE' OR [BadgeType]='BRONZE_MEDAL' OR [BadgeType]='SILVER_MEDAL' OR [BadgeType]='GOLD_MEDAL'),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_EventAchievements_UserID]
    ON [dbo].[EventAchievements]([UserID] ASC);


GO

