CREATE TABLE [dbo].[CourseAchievements] (
    [AchievementID]  BIGINT         IDENTITY (1, 1) NOT NULL,
    [CourseID]       BIGINT         NULL,
    [UserID]         BIGINT         NULL,
    [CompletionTime] INT            NULL,
    [CorrectAnswers] INT            NULL,
    [TotalQuestions] INT            NULL,
    [Score]          DECIMAL (5, 2) NULL,
    [BadgeType]      VARCHAR (50)   NULL,
    [AwardedAt]      DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([AchievementID] ASC),
    CONSTRAINT [CHK_Course_Badge] CHECK ([BadgeType]='CONSISTENT_LEARNER' OR [BadgeType]='TOP_PERFORMER' OR [BadgeType]='FIRST_COMPLETER' OR [BadgeType]='PERFECT_SCORE' OR [BadgeType]='QUICK_LEARNER' OR [BadgeType]='COURSE_MASTER'),
    FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses] ([CourseID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_CourseAchievements_UserID]
    ON [dbo].[CourseAchievements]([UserID] ASC);


GO

