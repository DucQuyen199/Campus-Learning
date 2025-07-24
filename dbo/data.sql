CREATE TABLE [dbo].[CompetitionSubmissions] (
    [SubmissionID]  BIGINT          IDENTITY (1, 1) NOT NULL,
    [ProblemID]     BIGINT          NOT NULL,
    [ParticipantID] BIGINT          NOT NULL,
    [SourceCode]    NTEXT           NOT NULL,
    [Language]      NVARCHAR (50)   NOT NULL,
    [Status]        NVARCHAR (50)   DEFAULT ('pending') NOT NULL,
    [Score]         INT             DEFAULT ((0)) NOT NULL,
    [ExecutionTime] DECIMAL (10, 3) NULL,
    [MemoryUsed]    INT             NULL,
    [ErrorMessage]  NTEXT           NULL,
    [SubmittedAt]   DATETIME        DEFAULT (getdate()) NOT NULL,
    [JudgedAt]      DATETIME        NULL,
    PRIMARY KEY CLUSTERED ([SubmissionID] ASC),
    CONSTRAINT [CHK_Submission_Status_New] CHECK ([Status]='compilation_error' OR [Status]='runtime_error' OR [Status]='memory_limit_exceeded' OR [Status]='time_limit_exceeded' OR [Status]='wrong_answer' OR [Status]='accepted' OR [Status]='running' OR [Status]='compiling' OR [Status]='pending'),
    CONSTRAINT [FK_CompetitionSubmissions_CompetitionParticipants] FOREIGN KEY ([ParticipantID]) REFERENCES [dbo].[CompetitionParticipants] ([ParticipantID]),
    CONSTRAINT [FK_CompetitionSubmissions_CompetitionProblems] FOREIGN KEY ([ProblemID]) REFERENCES [dbo].[CompetitionProblems] ([ProblemID])
);


GO

CREATE TABLE [dbo].[UserPresence] (
    [PresenceID]      BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]          BIGINT         NULL,
    [Status]          VARCHAR (20)   DEFAULT ('offline') NULL,
    [LastActiveAt]    DATETIME       DEFAULT (getdate()) NULL,
    [CurrentDeviceID] VARCHAR (255)  NULL,
    [LastLocation]    NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([PresenceID] ASC),
    CONSTRAINT [CHK_Presence_Status] CHECK ([Status]='in_call' OR [Status]='busy' OR [Status]='away' OR [Status]='offline' OR [Status]='online'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[Exams] (
    [ExamID]           BIGINT         IDENTITY (1, 1) NOT NULL,
    [CourseID]         BIGINT         NULL,
    [Title]            NVARCHAR (255) NOT NULL,
    [Description]      NVARCHAR (MAX) NULL,
    [Type]             VARCHAR (50)   NOT NULL,
    [Duration]         INT            NOT NULL,
    [TotalPoints]      INT            DEFAULT ((100)) NULL,
    [PassingScore]     INT            DEFAULT ((60)) NULL,
    [StartTime]        DATETIME       NOT NULL,
    [EndTime]          DATETIME       NOT NULL,
    [Instructions]     NVARCHAR (MAX) NULL,
    [AllowReview]      BIT            DEFAULT ((1)) NULL,
    [ShuffleQuestions] BIT            DEFAULT ((1)) NULL,
    [Status]           VARCHAR (20)   DEFAULT ('upcoming') NULL,
    [CreatedBy]        BIGINT         NULL,
    [CreatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [AlternateId]      NVARCHAR (255) NULL,
    [AllowRetakes]     BIT            DEFAULT ((0)) NULL,
    [MaxRetakes]       INT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([ExamID] ASC),
    CONSTRAINT [CHK_Exam_Status] CHECK ([Status]='cancelled' OR [Status]='completed' OR [Status]='ongoing' OR [Status]='upcoming'),
    CONSTRAINT [CHK_Exam_Type] CHECK ([Type]='mixed' OR [Type]='coding' OR [Type]='essay' OR [Type]='multiple_choice'),
    FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses] ([CourseID]),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[SystemSettings] (
    [ID]           INT            IDENTITY (1, 1) NOT NULL,
    [SettingKey]   NVARCHAR (50)  NOT NULL,
    [SettingValue] NVARCHAR (MAX) NULL,
    [Description]  NVARCHAR (255) NULL,
    [Category]     NVARCHAR (50)  NULL,
    [UpdatedAt]    DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedBy]    BIGINT         NULL,
    PRIMARY KEY CLUSTERED ([ID] ASC),
    FOREIGN KEY ([UpdatedBy]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([SettingKey] ASC)
);


GO

CREATE TABLE [dbo].[CourseEnrollments] (
    [EnrollmentID]         BIGINT       IDENTITY (1, 1) NOT NULL,
    [CourseID]             BIGINT       NULL,
    [UserID]               BIGINT       NULL,
    [Progress]             INT          DEFAULT ((0)) NULL,
    [LastAccessedLessonID] BIGINT       NULL,
    [EnrolledAt]           DATETIME     DEFAULT (getdate()) NULL,
    [CompletedAt]          DATETIME     NULL,
    [CertificateIssued]    BIT          DEFAULT ((0)) NULL,
    [Status]               VARCHAR (20) DEFAULT ('active') NULL,
    PRIMARY KEY CLUSTERED ([EnrollmentID] ASC),
    CONSTRAINT [CHK_Enrollment_Status] CHECK ([Status]='suspended' OR [Status]='dropped' OR [Status]='completed' OR [Status]='active'),
    FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses] ([CourseID]),
    FOREIGN KEY ([LastAccessedLessonID]) REFERENCES [dbo].[CourseLessons] ([LessonID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[UserProfiles] (
    [ProfileID]               BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]                  BIGINT         NULL,
    [Education]               NVARCHAR (MAX) NULL,
    [WorkExperience]          NVARCHAR (MAX) NULL,
    [Skills]                  NVARCHAR (MAX) NULL,
    [Interests]               NVARCHAR (MAX) NULL,
    [SocialLinks]             NVARCHAR (MAX) NULL,
    [Achievements]            NVARCHAR (MAX) NULL,
    [PreferredLanguage]       VARCHAR (10)   DEFAULT ('vi') NULL,
    [TimeZone]                VARCHAR (50)   DEFAULT ('Asia/Ho_Chi_Minh') NULL,
    [NotificationPreferences] NVARCHAR (MAX) NULL,
    [UpdatedAt]               DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ProfileID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([UserID] ASC)
);


GO

CREATE TABLE [dbo].[ModulePractices] (
    [PracticeID]          BIGINT         IDENTITY (1, 1) NOT NULL,
    [ModuleID]            BIGINT         NULL,
    [Title]               NVARCHAR (255) NOT NULL,
    [Description]         NVARCHAR (MAX) NULL,
    [ProgrammingLanguage] VARCHAR (50)   NOT NULL,
    [InitialCode]         NVARCHAR (MAX) NULL,
    [TimeLimit]           INT            DEFAULT ((1000)) NULL,
    [MemoryLimit]         INT            DEFAULT ((256)) NULL,
    [Difficulty]          VARCHAR (20)   DEFAULT ('easy') NULL,
    [CreatedAt]           DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]           DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([PracticeID] ASC),
    CONSTRAINT [CHK_Practice_Difficulty] CHECK ([Difficulty]='expert' OR [Difficulty]='hard' OR [Difficulty]='medium' OR [Difficulty]='easy'),
    CONSTRAINT [CHK_Practice_Language] CHECK ([ProgrammingLanguage]='csharp' OR [ProgrammingLanguage]='cpp' OR [ProgrammingLanguage]='java' OR [ProgrammingLanguage]='python' OR [ProgrammingLanguage]='javascript'),
    FOREIGN KEY ([ModuleID]) REFERENCES [dbo].[CourseModules] ([ModuleID])
);


GO

CREATE TABLE [dbo].[Messages] (
    [MessageID]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [ConversationID]   BIGINT         NULL,
    [SenderID]         BIGINT         NULL,
    [Type]             VARCHAR (20)   DEFAULT ('text') NULL,
    [Content]          NVARCHAR (MAX) NULL,
    [MediaUrl]         VARCHAR (255)  NULL,
    [MediaType]        VARCHAR (20)   NULL,
    [ReplyToMessageID] BIGINT         NULL,
    [IsEdited]         BIT            DEFAULT ((0)) NULL,
    [IsDeleted]        BIT            DEFAULT ((0)) NULL,
    [CreatedAt]        DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME       NULL,
    [DeletedAt]        DATETIME       NULL,
    PRIMARY KEY CLUSTERED ([MessageID] ASC),
    CONSTRAINT [CHK_Message_Type] CHECK ([Type]='location' OR [Type]='audio' OR [Type]='file' OR [Type]='video' OR [Type]='image' OR [Type]='text'),
    FOREIGN KEY ([ConversationID]) REFERENCES [dbo].[Conversations] ([ConversationID]),
    FOREIGN KEY ([ReplyToMessageID]) REFERENCES [dbo].[Messages] ([MessageID]),
    FOREIGN KEY ([SenderID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[EventParticipants] (
    [ParticipantID]    BIGINT         IDENTITY (1, 1) NOT NULL,
    [EventID]          BIGINT         NOT NULL,
    [UserID]           BIGINT         NOT NULL,
    [RegistrationDate] DATETIME       DEFAULT (getdate()) NULL,
    [Status]           VARCHAR (20)   DEFAULT ('registered') NULL,
    [TeamName]         NVARCHAR (100) NULL,
    [PaymentStatus]    VARCHAR (20)   NULL,
    [AttendanceStatus] VARCHAR (20)   NULL,
    PRIMARY KEY CLUSTERED ([ParticipantID] ASC),
    CONSTRAINT [CHK_EventParticipant_Attendance] CHECK ([AttendanceStatus]='absent' OR [AttendanceStatus]='present' OR [AttendanceStatus]='pending'),
    CONSTRAINT [CHK_EventParticipant_Payment] CHECK ([PaymentStatus]='free' OR [PaymentStatus]='refunded' OR [PaymentStatus]='completed' OR [PaymentStatus]='pending'),
    CONSTRAINT [CHK_EventParticipant_Status] CHECK ([Status]='attended' OR [Status]='cancelled' OR [Status]='confirmed' OR [Status]='registered'),
    CONSTRAINT [FK_EventParticipants_Events] FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID]),
    CONSTRAINT [FK_EventParticipants_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Event_User] UNIQUE NONCLUSTERED ([EventID] ASC, [UserID] ASC)
);


GO

CREATE TABLE [dbo].[StoryViews] (
    [ViewID]   BIGINT   IDENTITY (1, 1) NOT NULL,
    [StoryID]  BIGINT   NULL,
    [ViewerID] BIGINT   NULL,
    [ViewedAt] DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ViewID] ASC),
    FOREIGN KEY ([StoryID]) REFERENCES [dbo].[Stories] ([StoryID]),
    FOREIGN KEY ([ViewerID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Story_View] UNIQUE NONCLUSTERED ([StoryID] ASC, [ViewerID] ASC)
);


GO

CREATE TABLE [dbo].[Posts] (
    [PostID]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]        BIGINT         NULL,
    [Content]       NVARCHAR (MAX) NULL,
    [Type]          VARCHAR (20)   DEFAULT ('regular') NULL,
    [Visibility]    VARCHAR (20)   DEFAULT ('public') NULL,
    [Location]      NVARCHAR (255) NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    [DeletedAt]     DATETIME       NULL,
    [LikesCount]    INT            DEFAULT ((0)) NULL,
    [CommentsCount] INT            DEFAULT ((0)) NULL,
    [SharesCount]   INT            DEFAULT ((0)) NULL,
    [ReportsCount]  INT            DEFAULT ((0)) NULL,
    [IsFlagged]     BIT            DEFAULT ((0)) NULL,
    [FlaggedReason] NVARCHAR (255) NULL,
    [FlaggedAt]     DATETIME       NULL,
    [IsDeleted]     BIT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([PostID] ASC),
    CONSTRAINT [CHK_Post_Type] CHECK ([Type]='announcement' OR [Type]='question' OR [Type]='article' OR [Type]='regular'),
    CONSTRAINT [CHK_Post_Visibility] CHECK ([Visibility]='friends' OR [Visibility]='private' OR [Visibility]='public'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[PostMedia] (
    [MediaID]      BIGINT        IDENTITY (1, 1) NOT NULL,
    [PostID]       BIGINT        NULL,
    [MediaUrl]     VARCHAR (255) NOT NULL,
    [MediaType]    VARCHAR (20)  NULL,
    [ThumbnailUrl] VARCHAR (255) NULL,
    [Size]         INT           NULL,
    [Width]        INT           NULL,
    [Height]       INT           NULL,
    [Duration]     INT           NULL,
    [CreatedAt]    DATETIME      DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([MediaID] ASC),
    CONSTRAINT [CHK_Media_Type] CHECK ([MediaType]='audio' OR [MediaType]='document' OR [MediaType]='video' OR [MediaType]='image'),
    FOREIGN KEY ([PostID]) REFERENCES [dbo].[Posts] ([PostID])
);


GO

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

CREATE TABLE [dbo].[SystemInfo] (
    [ID]          INT            IDENTITY (1, 1) NOT NULL,
    [InfoKey]     NVARCHAR (50)  NOT NULL,
    [InfoValue]   NVARCHAR (MAX) NULL,
    [Category]    NVARCHAR (50)  NULL,
    [LastUpdated] DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ID] ASC),
    UNIQUE NONCLUSTERED ([InfoKey] ASC)
);


GO

CREATE TABLE [dbo].[ConversationParticipants] (
    [ParticipantID]     BIGINT       IDENTITY (1, 1) NOT NULL,
    [ConversationID]    BIGINT       NULL,
    [UserID]            BIGINT       NULL,
    [JoinedAt]          DATETIME     DEFAULT (getdate()) NULL,
    [LeftAt]            DATETIME     NULL,
    [Role]              VARCHAR (20) DEFAULT ('member') NULL,
    [LastReadMessageID] BIGINT       NULL,
    [IsAdmin]           BIT          DEFAULT ((0)) NULL,
    [IsMuted]           BIT          DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([ParticipantID] ASC),
    CONSTRAINT [CHK_Participant_Role] CHECK ([Role]='moderator' OR [Role]='admin' OR [Role]='member'),
    FOREIGN KEY ([ConversationID]) REFERENCES [dbo].[Conversations] ([ConversationID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);

GO

-- Add unique constraint to prevent duplicate conversation participants
ALTER TABLE [dbo].[ConversationParticipants]
ADD CONSTRAINT [UQ_ConversationParticipants_ConversationID_UserID] UNIQUE NONCLUSTERED ([ConversationID], [UserID]);
GO

CREATE TABLE [dbo].[Reports] (
    [ReportID]    BIGINT         IDENTITY (1, 1) NOT NULL,
    [Title]       NVARCHAR (255) NOT NULL,
    [Content]     NVARCHAR (MAX) NOT NULL,
    [Category]    VARCHAR (50)   NOT NULL,
    [ReporterID]  BIGINT         NULL,
    [TargetID]    BIGINT         NOT NULL,
    [TargetType]  VARCHAR (50)   NOT NULL,
    [Status]      VARCHAR (20)   DEFAULT ('PENDING') NULL,
    [Notes]       NVARCHAR (500) NULL,
    [CreatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    [ResolvedAt]  DATETIME       NULL,
    [DeletedAt]   DATETIME       NULL,
    [ActionTaken] VARCHAR (50)   NULL,
    PRIMARY KEY CLUSTERED ([ReportID] ASC),
    CONSTRAINT [CHK_Report_Category] CHECK ([Category]='COMMENT' OR [Category]='EVENT' OR [Category]='COURSE' OR [Category]='CONTENT' OR [Category]='USER'),
    CONSTRAINT [CHK_Report_Status] CHECK ([Status]='REJECTED' OR [Status]='RESOLVED' OR [Status]='PENDING'),
    FOREIGN KEY ([ReporterID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[CodingExercises] (
    [ExerciseID]          BIGINT         IDENTITY (1, 1) NOT NULL,
    [LessonID]            BIGINT         NULL,
    [Title]               NVARCHAR (255) NOT NULL,
    [Description]         NVARCHAR (MAX) NULL,
    [ProgrammingLanguage] VARCHAR (50)   NULL,
    [InitialCode]         NVARCHAR (MAX) NULL,
    [SolutionCode]        NVARCHAR (MAX) NULL,
    [TestCases]           NVARCHAR (MAX) NULL,
    [TimeLimit]           INT            DEFAULT ((1000)) NULL,
    [MemoryLimit]         INT            DEFAULT ((256)) NULL,
    [Difficulty]          VARCHAR (20)   DEFAULT ('medium') NULL,
    [Points]              INT            DEFAULT ((0)) NULL,
    [CreatedAt]           DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]           DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ExerciseID] ASC),
    CONSTRAINT [CHK_Exercise_Difficulty] CHECK ([Difficulty]='expert' OR [Difficulty]='hard' OR [Difficulty]='medium' OR [Difficulty]='easy'),
    FOREIGN KEY ([LessonID]) REFERENCES [dbo].[CourseLessons] ([LessonID])
);


GO

CREATE TABLE [dbo].[Stories] (
    [StoryID]         BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]          BIGINT         NULL,
    [MediaUrl]        VARCHAR (255)  NULL,
    [MediaType]       VARCHAR (20)   NULL,
    [Duration]        INT            DEFAULT ((15)) NULL,
    [ViewCount]       INT            DEFAULT ((0)) NULL,
    [BackgroundColor] VARCHAR (20)   NULL,
    [TextContent]     NVARCHAR (500) NULL,
    [FontStyle]       VARCHAR (50)   NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [ExpiresAt]       DATETIME       NULL,
    [IsDeleted]       BIT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([StoryID] ASC),
    CONSTRAINT [CHK_Story_MediaType] CHECK ([MediaType]='text' OR [MediaType]='video' OR [MediaType]='image'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[LessonProgress] (
    [ProgressID]   BIGINT       IDENTITY (1, 1) NOT NULL,
    [EnrollmentID] BIGINT       NULL,
    [LessonID]     BIGINT       NULL,
    [Status]       VARCHAR (20) DEFAULT ('not_started') NULL,
    [CompletedAt]  DATETIME     NULL,
    [TimeSpent]    INT          DEFAULT ((0)) NULL,
    [LastPosition] INT          DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([ProgressID] ASC),
    CONSTRAINT [CHK_Lesson_Status] CHECK ([Status]='completed' OR [Status]='in_progress' OR [Status]='not_started'),
    FOREIGN KEY ([EnrollmentID]) REFERENCES [dbo].[CourseEnrollments] ([EnrollmentID]),
    FOREIGN KEY ([LessonID]) REFERENCES [dbo].[CourseLessons] ([LessonID])
);


GO

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

CREATE TABLE [dbo].[EventPrizes] (
    [PrizeID]     BIGINT          IDENTITY (1, 1) NOT NULL,
    [EventID]     BIGINT          NULL,
    [Rank]        INT             NULL,
    [PrizeAmount] DECIMAL (10, 2) NULL,
    [Description] NVARCHAR (500)  NULL,
    PRIMARY KEY CLUSTERED ([PrizeID] ASC),
    CONSTRAINT [CHK_Prize_Rank] CHECK ([Rank]>(0)),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID])
);


GO

CREATE TABLE [dbo].[Calls] (
    [CallID]         BIGINT        IDENTITY (1, 1) NOT NULL,
    [ConversationID] BIGINT        NULL,
    [InitiatorID]    BIGINT        NULL,
    [Type]           VARCHAR (20)  NULL,
    [StartTime]      DATETIME      DEFAULT (getdate()) NULL,
    [EndTime]        DATETIME      NULL,
    [Status]         VARCHAR (20)  DEFAULT ('initiated') NULL,
    [Duration]       INT           NULL,
    [Quality]        VARCHAR (20)  NULL,
    [RecordingUrl]   VARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([CallID] ASC),
    CONSTRAINT [CHK_Call_Status] CHECK ([Status]='rejected' OR [Status]='missed' OR [Status]='ended' OR [Status]='ongoing' OR [Status]='ringing' OR [Status]='initiated'),
    CONSTRAINT [CHK_Call_Type] CHECK ([Type]='video' OR [Type]='audio'),
    FOREIGN KEY ([ConversationID]) REFERENCES [dbo].[Conversations] ([ConversationID]),
    FOREIGN KEY ([InitiatorID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[Courses] (
    [CourseID]         BIGINT          IDENTITY (1, 1) NOT NULL,
    [Title]            NVARCHAR (255)  NOT NULL,
    [Slug]             VARCHAR (255)   NULL,
    [Description]      NVARCHAR (MAX)  NULL,
    [ShortDescription] NVARCHAR (500)  NULL,
    [InstructorID]     BIGINT          NULL,
    [Level]            VARCHAR (20)    NULL,
    [Category]         VARCHAR (50)    NULL,
    [SubCategory]      VARCHAR (50)    NULL,
    [CourseType]       VARCHAR (20)    DEFAULT ('regular') NULL,
    [Language]         VARCHAR (20)    DEFAULT ('vi') NULL,
    [Duration]         INT             NULL,
    [Capacity]         INT             NULL,
    [EnrolledCount]    INT             DEFAULT ((0)) NULL,
    [Rating]           DECIMAL (3, 2)  DEFAULT ((0)) NULL,
    [RatingCount]      INT             DEFAULT ((0)) NULL,
    [Price]            DECIMAL (10, 2) DEFAULT ((0)) NULL,
    [DiscountPrice]    DECIMAL (10, 2) NULL,
    [ImageUrl]         VARCHAR (255)   NULL,
    [VideoUrl]         VARCHAR (255)   NULL,
    [Requirements]     NVARCHAR (MAX)  NULL,
    [Objectives]       NVARCHAR (MAX)  NULL,
    [Syllabus]         NVARCHAR (MAX)  NULL,
    [Status]           VARCHAR (20)    DEFAULT ('draft') NULL,
    [IsPublished]      BIT             DEFAULT ((0)) NULL,
    [PublishedAt]      DATETIME        NULL,
    [CreatedAt]        DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME        DEFAULT (getdate()) NULL,
    [DeletedAt]        DATETIME        NULL,
    PRIMARY KEY CLUSTERED ([CourseID] ASC),
    CONSTRAINT [CHK_Course_Level] CHECK ([Level]='expert' OR [Level]='advanced' OR [Level]='intermediate' OR [Level]='beginner'),
    CONSTRAINT [CHK_Course_Status] CHECK ([Status]='archived' OR [Status]='published' OR [Status]='review' OR [Status]='draft'),
    CONSTRAINT [CHK_Course_Type] CHECK ([CourseType]='regular' OR [CourseType]='it'),
    FOREIGN KEY ([InstructorID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([Slug] ASC)
);


GO

CREATE TABLE [dbo].[MessageStatus] (
    [StatusID]  BIGINT       IDENTITY (1, 1) NOT NULL,
    [MessageID] BIGINT       NULL,
    [UserID]    BIGINT       NULL,
    [Status]    VARCHAR (20) DEFAULT ('sent') NULL,
    [UpdatedAt] DATETIME     DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([StatusID] ASC),
    CONSTRAINT [CHK_Message_Status] CHECK ([Status]='read' OR [Status]='delivered' OR [Status]='sent'),
    FOREIGN KEY ([MessageID]) REFERENCES [dbo].[Messages] ([MessageID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Message_User_Status] UNIQUE NONCLUSTERED ([MessageID] ASC, [UserID] ASC)
);


GO

CREATE TABLE [dbo].[RankingStats] (
    [StatID]             BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]             BIGINT         NULL,
    [PeriodType]         VARCHAR (20)   NULL,
    [StartDate]          DATE           NULL,
    [EndDate]            DATE           NULL,
    [TotalPoints]        INT            DEFAULT ((0)) NULL,
    [EventsParticipated] INT            DEFAULT ((0)) NULL,
    [CoursesCompleted]   INT            DEFAULT ((0)) NULL,
    [AverageAccuracy]    DECIMAL (5, 2) NULL,
    PRIMARY KEY CLUSTERED ([StatID] ASC),
    CONSTRAINT [CHK_Period_Type] CHECK ([PeriodType]='ALL_TIME' OR [PeriodType]='MONTHLY' OR [PeriodType]='WEEKLY'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[CallParticipants] (
    [CallParticipantID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [CallID]            BIGINT         NULL,
    [UserID]            BIGINT         NULL,
    [JoinTime]          DATETIME       NULL,
    [LeaveTime]         DATETIME       NULL,
    [Status]            VARCHAR (20)   NULL,
    [DeviceInfo]        NVARCHAR (255) NULL,
    [NetworkQuality]    VARCHAR (20)   NULL,
    PRIMARY KEY CLUSTERED ([CallParticipantID] ASC),
    CONSTRAINT [CHK_CallParticipant_Status] CHECK ([Status]='declined' OR [Status]='left' OR [Status]='joined' OR [Status]='invited'),
    FOREIGN KEY ([CallID]) REFERENCES [dbo].[Calls] ([CallID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[Friendships] (
    [FriendshipID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]       BIGINT         NOT NULL,
    [FriendID]     BIGINT         NOT NULL,
    [Status]       NVARCHAR (20)  DEFAULT ('pending') NOT NULL,
    [RequestedAt]  DATETIME       DEFAULT (getdate()) NOT NULL,
    [UpdatedAt]    DATETIME       NULL,
    [Notes]        NVARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([FriendshipID] ASC),
    CONSTRAINT [CHK_Different_Users] CHECK ([UserID]<>[FriendID]),
    CONSTRAINT [CHK_Friendship_Status] CHECK ([Status]='blocked' OR [Status]='rejected' OR [Status]='accepted' OR [Status]='pending'),
    FOREIGN KEY ([FriendID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Friendship] UNIQUE NONCLUSTERED ([UserID] ASC, [FriendID] ASC)
);


GO

CREATE TABLE [dbo].[EventProgrammingLanguages] (
    [EventID]  BIGINT       NOT NULL,
    [Language] VARCHAR (50) NOT NULL,
    PRIMARY KEY CLUSTERED ([EventID] ASC, [Language] ASC),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID])
);


GO

CREATE TABLE [dbo].[NotificationTemplates] (
    [TemplateID] INT            IDENTITY (1, 1) NOT NULL,
    [Type]       VARCHAR (50)   NULL,
    [Title]      NVARCHAR (255) NULL,
    [Content]    NVARCHAR (MAX) NULL,
    [Parameters] NVARCHAR (MAX) NULL,
    [CreatedAt]  DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([TemplateID] ASC)
);


GO

CREATE TABLE [dbo].[CodingSubmissions] (
    [SubmissionID]    BIGINT         IDENTITY (1, 1) NOT NULL,
    [ExerciseID]      BIGINT         NULL,
    [UserID]          BIGINT         NULL,
    [Code]            NVARCHAR (MAX) NULL,
    [Language]        VARCHAR (50)   NULL,
    [Status]          VARCHAR (20)   NULL,
    [ExecutionTime]   INT            NULL,
    [MemoryUsed]      INT            NULL,
    [TestCasesPassed] INT            DEFAULT ((0)) NULL,
    [TotalTestCases]  INT            DEFAULT ((0)) NULL,
    [Score]           INT            DEFAULT ((0)) NULL,
    [SubmittedAt]     DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([SubmissionID] ASC),
    CONSTRAINT [CHK_Submission_Status] CHECK ([Status]='runtime_error' OR [Status]='memory_limit' OR [Status]='time_limit' OR [Status]='wrong_answer' OR [Status]='accepted' OR [Status]='running' OR [Status]='pending'),
    FOREIGN KEY ([ExerciseID]) REFERENCES [dbo].[CodingExercises] ([ExerciseID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[PostLikes] (
    [LikeID]    BIGINT   IDENTITY (1, 1) NOT NULL,
    [PostID]    BIGINT   NULL,
    [UserID]    BIGINT   NULL,
    [CreatedAt] DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([LikeID] ASC),
    FOREIGN KEY ([PostID]) REFERENCES [dbo].[Posts] ([PostID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Post_Like] UNIQUE NONCLUSTERED ([PostID] ASC, [UserID] ASC)
);


GO

CREATE TABLE [dbo].[EventSchedule] (
    [ScheduleID]   BIGINT         IDENTITY (1, 1) NOT NULL,
    [EventID]      BIGINT         NULL,
    [ActivityName] NVARCHAR (255) NULL,
    [StartTime]    DATETIME       NULL,
    [EndTime]      DATETIME       NULL,
    [Description]  NVARCHAR (MAX) NULL,
    [Location]     NVARCHAR (255) NULL,
    [Type]         VARCHAR (50)   NULL,
    PRIMARY KEY CLUSTERED ([ScheduleID] ASC),
    CONSTRAINT [CHK_Schedule_Type] CHECK ([Type]='closing' OR [Type]='networking' OR [Type]='break' OR [Type]='main_event' OR [Type]='opening' OR [Type]='registration'),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID])
);


GO

CREATE TABLE [dbo].[ExamMonitoringLogs] (
    [LogID]         BIGINT         IDENTITY (1, 1) NOT NULL,
    [ParticipantID] BIGINT         NULL,
    [EventType]     VARCHAR (50)   NULL,
    [EventData]     NVARCHAR (MAX) NULL,
    [Timestamp]     DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([LogID] ASC),
    CONSTRAINT [CHK_Event_Type] CHECK ([EventType]='exam_submit' OR [EventType]='exam_start' OR [EventType]='penalty_applied' OR [EventType]='suspicious_activity' OR [EventType]='no_face' OR [EventType]='multiple_faces' OR [EventType]='face_detection' OR [EventType]='copy_paste' OR [EventType]='full_screen_return' OR [EventType]='full_screen_exit' OR [EventType]='tab_switch'),
    FOREIGN KEY ([ParticipantID]) REFERENCES [dbo].[ExamParticipants] ([ParticipantID])
);


GO

CREATE TABLE [dbo].[NotificationDelivery] (
    [DeliveryID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [NotificationID] BIGINT         NULL,
    [Channel]        VARCHAR (20)   NULL,
    [Status]         VARCHAR (20)   NULL,
    [SentAt]         DATETIME       NULL,
    [DeliveredAt]    DATETIME       NULL,
    [ErrorMessage]   NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([DeliveryID] ASC),
    CONSTRAINT [CHK_Delivery_Channel] CHECK ([Channel]='in-app' OR [Channel]='sms' OR [Channel]='push' OR [Channel]='email'),
    CONSTRAINT [CHK_Delivery_Status] CHECK ([Status]='failed' OR [Status]='delivered' OR [Status]='sent' OR [Status]='pending'),
    FOREIGN KEY ([NotificationID]) REFERENCES [dbo].[Notifications] ([NotificationID])
);


GO

CREATE TABLE [dbo].[Tags] (
    [TagID]       INT            IDENTITY (1, 1) NOT NULL,
    [Name]        NVARCHAR (50)  NOT NULL,
    [Description] NVARCHAR (255) NULL,
    [CreatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    [UsageCount]  INT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([TagID] ASC),
    UNIQUE NONCLUSTERED ([Name] ASC)
);


GO

CREATE TABLE [dbo].[EventTechnologies] (
    [EventID]    BIGINT        NOT NULL,
    [Technology] VARCHAR (100) NOT NULL,
    PRIMARY KEY CLUSTERED ([EventID] ASC, [Technology] ASC),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID])
);


GO

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

CREATE TABLE [dbo].[CommentLikes] (
    [CommentLikeID] BIGINT   IDENTITY (1, 1) NOT NULL,
    [CommentID]     BIGINT   NULL,
    [UserID]        BIGINT   NULL,
    [CreatedAt]     DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([CommentLikeID] ASC),
    FOREIGN KEY ([CommentID]) REFERENCES [dbo].[Comments] ([CommentID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Comment_Like] UNIQUE NONCLUSTERED ([CommentID] ASC, [UserID] ASC)
);


GO

CREATE TABLE [dbo].[CompetitionParticipants] (
    [ParticipantID]          BIGINT        IDENTITY (1, 1) NOT NULL,
    [CompetitionID]          BIGINT        NOT NULL,
    [UserID]                 BIGINT        NOT NULL,
    [RegistrationTime]       DATETIME      DEFAULT (getdate()) NOT NULL,
    [Score]                  INT           DEFAULT ((0)) NOT NULL,
    [Rank]                   INT           NULL,
    [Status]                 NVARCHAR (20) DEFAULT ('registered') NOT NULL,
    [StartTime]              DATETIME      NULL,
    [EndTime]                DATETIME      NULL,
    [TotalProblemsAttempted] INT           DEFAULT ((0)) NOT NULL,
    [TotalProblemsSolved]    INT           DEFAULT ((0)) NOT NULL,
    [Feedback]               NTEXT         NULL,
    [CreatedAt]              DATETIME      DEFAULT (getdate()) NOT NULL,
    [UpdatedAt]              DATETIME      DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([ParticipantID] ASC),
    CONSTRAINT [CHK_Participant_Status_New] CHECK ([Status]='disqualified' OR [Status]='completed' OR [Status]='active' OR [Status]='registered'),
    CONSTRAINT [FK_CompetitionParticipants_Competitions] FOREIGN KEY ([CompetitionID]) REFERENCES [dbo].[Competitions] ([CompetitionID]),
    CONSTRAINT [FK_CompetitionParticipants_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UC_Competition_User_New] UNIQUE NONCLUSTERED ([CompetitionID] ASC, [UserID] ASC)
);


GO

CREATE TABLE [dbo].[CacheEntries] (
    [CacheKey]  VARCHAR (255)  NOT NULL,
    [Value]     NVARCHAR (MAX) NULL,
    [ExpiresAt] DATETIME       NULL,
    [CreatedAt] DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt] DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([CacheKey] ASC)
);


GO

CREATE TABLE [dbo].[CourseModules] (
    [ModuleID]         BIGINT          IDENTITY (1, 1) NOT NULL,
    [CourseID]         BIGINT          NULL,
    [Title]            NVARCHAR (255)  NOT NULL,
    [Description]      NVARCHAR (MAX)  NULL,
    [OrderIndex]       INT             NOT NULL,
    [Duration]         INT             NULL,
    [IsPublished]      BIT             DEFAULT ((0)) NULL,
    [CreatedAt]        DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME        DEFAULT (getdate()) NULL,
    [VideoUrl]         NVARCHAR (2000) NULL,
    [ImageUrl]         NVARCHAR (500)  NULL,
    [PracticalGuide]   NVARCHAR (MAX)  NULL,
    [Objectives]       NVARCHAR (MAX)  NULL,
    [Requirements]     NVARCHAR (MAX)  NULL,
    [Materials]        NVARCHAR (MAX)  NULL,
    [DraftData]        NVARCHAR (MAX)  NULL,
    [LastDraftSavedAt] DATETIME        NULL,
    [IsDraft]          BIT             DEFAULT ((1)) NULL,
    PRIMARY KEY CLUSTERED ([ModuleID] ASC),
    FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses] ([CourseID])
);


GO

CREATE TABLE [dbo].[ExamParticipants] (
    [ParticipantID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [ExamID]            BIGINT         NULL,
    [UserID]            BIGINT         NULL,
    [StartedAt]         DATETIME       NULL,
    [CompletedAt]       DATETIME       NULL,
    [TimeSpent]         INT            NULL,
    [Score]             INT            NULL,
    [Status]            VARCHAR (20)   DEFAULT ('registered') NULL,
    [Feedback]          NVARCHAR (MAX) NULL,
    [ReviewedBy]        BIGINT         NULL,
    [ReviewedAt]        DATETIME       NULL,
    [PenaltyApplied]    BIT            DEFAULT ((0)) NOT NULL,
    [PenaltyReason]     NVARCHAR (255) NULL,
    [PenaltyPercentage] INT            DEFAULT ((0)) NOT NULL,
    PRIMARY KEY CLUSTERED ([ParticipantID] ASC),
    CONSTRAINT [CHK_Participant_Status] CHECK ([Status]='reviewed' OR [Status]='completed' OR [Status]='in_progress' OR [Status]='registered'),
    FOREIGN KEY ([ExamID]) REFERENCES [dbo].[Exams] ([ExamID]),
    FOREIGN KEY ([ReviewedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[Notifications] (
    [NotificationID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]         BIGINT         NULL,
    [Type]           VARCHAR (50)   NULL,
    [Title]          NVARCHAR (255) NULL,
    [Content]        NVARCHAR (MAX) NULL,
    [RelatedID]      BIGINT         NULL,
    [RelatedType]    VARCHAR (50)   NULL,
    [IsRead]         BIT            DEFAULT ((0)) NULL,
    [CreatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    [ExpiresAt]      DATETIME       NULL,
    [Priority]       VARCHAR (20)   DEFAULT ('normal') NULL,
    PRIMARY KEY CLUSTERED ([NotificationID] ASC),
    CONSTRAINT [CHK_Notification_Type] CHECK ([Type]='reaction' OR [Type]='mention' OR [Type]='story_view' OR [Type]='reply' OR [Type]='comment' OR [Type]='missed_call' OR [Type]='call' OR [Type]='message'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

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

CREATE TABLE [dbo].[Users] (
    [UserID]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [Username]      VARCHAR (50)   NOT NULL,
    [Email]         VARCHAR (100)  NOT NULL,
    [Password]      VARCHAR (255)  NOT NULL,
    [FullName]      NVARCHAR (100) NOT NULL,
    [DateOfBirth]   DATE           NULL,
    [School]        NVARCHAR (255) NULL,
    [Role]          VARCHAR (20)   DEFAULT ('STUDENT') NULL,
    [Status]        VARCHAR (20)   DEFAULT ('ONLINE') NULL,
    [AccountStatus] VARCHAR (20)   DEFAULT ('ACTIVE') NULL,
    [Image]         VARCHAR (255)  NULL,
    [Bio]           NVARCHAR (500) NULL,
    [Provider]      VARCHAR (20)   DEFAULT ('local') NULL,
    [ProviderID]    VARCHAR (100)  NULL,
    [EmailVerified] BIT            DEFAULT ((0)) NULL,
    [PhoneNumber]   VARCHAR (15)   NULL,
    [Address]       NVARCHAR (255) NULL,
    [City]          NVARCHAR (100) NULL,
    [Country]       NVARCHAR (100) NULL,
    [LastLoginIP]   VARCHAR (45)   NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    [LastLoginAt]   DATETIME       NULL,
    [DeletedAt]     DATETIME       NULL,
    [LockDuration]  INT            NULL,
    [LockReason]    NVARCHAR (255) NULL,
    [LockedUntil]   DATETIME       NULL,
    [Avatar]        NVARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([UserID] ASC),
    CONSTRAINT [CHK_Account_Status] CHECK ([AccountStatus]='DELETED' OR [AccountStatus]='SUSPENDED' OR [AccountStatus]='LOCKED' OR [AccountStatus]='ACTIVE'),
    CONSTRAINT [CHK_User_Role] CHECK ([Role]='ADMIN' OR [Role]='TEACHER' OR [Role]='STUDENT'),
    CONSTRAINT [CHK_User_Status] CHECK ([Status]='AWAY' OR [Status]='OFFLINE' OR [Status]='ONLINE'),
    UNIQUE NONCLUSTERED ([Email] ASC),
    UNIQUE NONCLUSTERED ([Username] ASC)
);


GO

CREATE TABLE [dbo].[Comments] (
    [CommentID]       BIGINT         IDENTITY (1, 1) NOT NULL,
    [PostID]          BIGINT         NULL,
    [UserID]          BIGINT         NULL,
    [ParentCommentID] BIGINT         NULL,
    [Content]         NVARCHAR (MAX) NULL,
    [LikesCount]      INT            DEFAULT ((0)) NULL,
    [RepliesCount]    INT            DEFAULT ((0)) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       NULL,
    [DeletedAt]       DATETIME       NULL,
    [IsEdited]        BIT            DEFAULT ((0)) NULL,
    [IsDeleted]       BIT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([CommentID] ASC),
    FOREIGN KEY ([ParentCommentID]) REFERENCES [dbo].[Comments] ([CommentID]),
    FOREIGN KEY ([PostID]) REFERENCES [dbo].[Posts] ([PostID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[Events] (
    [EventID]          BIGINT          IDENTITY (1, 1) NOT NULL,
    [Title]            NVARCHAR (255)  NOT NULL,
    [Description]      NVARCHAR (MAX)  NULL,
    [Category]         VARCHAR (50)    NULL,
    [EventDate]        DATE            NOT NULL,
    [EventTime]        TIME (7)        NOT NULL,
    [Location]         NVARCHAR (255)  NULL,
    [ImageUrl]         VARCHAR (500)   NULL,
    [MaxAttendees]     INT             NULL,
    [CurrentAttendees] INT             DEFAULT ((0)) NULL,
    [Price]            DECIMAL (10, 2) NULL,
    [Organizer]        NVARCHAR (255)  NULL,
    [Difficulty]       VARCHAR (20)    NULL,
    [Status]           VARCHAR (20)    DEFAULT ('upcoming') NULL,
    [CreatedBy]        BIGINT          NULL,
    [CreatedAt]        DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME        NULL,
    [DeletedAt]        DATETIME        NULL,
    PRIMARY KEY CLUSTERED ([EventID] ASC),
    CONSTRAINT [CHK_Event_Category] CHECK ([Category]='Security' OR [Category]='DevOps' OR [Category]='Mobile Development' OR [Category]='AI/ML' OR [Category]='Web Development' OR [Category]='Hackathon' OR [Category]='Competitive Programming'),
    CONSTRAINT [CHK_Event_Difficulty] CHECK ([Difficulty]='expert' OR [Difficulty]='advanced' OR [Difficulty]='intermediate' OR [Difficulty]='beginner'),
    CONSTRAINT [CHK_Event_Status] CHECK ([Status]='cancelled' OR [Status]='completed' OR [Status]='ongoing' OR [Status]='upcoming'),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[PostTags] (
    [PostID]    BIGINT   NOT NULL,
    [TagID]     INT      NOT NULL,
    [CreatedAt] DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([PostID] ASC, [TagID] ASC),
    FOREIGN KEY ([PostID]) REFERENCES [dbo].[Posts] ([PostID]),
    FOREIGN KEY ([TagID]) REFERENCES [dbo].[Tags] ([TagID])
);


GO

CREATE TABLE [dbo].[SequelizeMeta] (
    [name] NVARCHAR (255) NOT NULL,
    PRIMARY KEY CLUSTERED ([name] ASC),
    UNIQUE NONCLUSTERED ([name] ASC)
);


GO

CREATE TABLE [dbo].[EventRounds] (
    [RoundID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [EventID]     BIGINT         NULL,
    [Name]        NVARCHAR (255) NULL,
    [Duration]    INT            NULL,
    [Problems]    INT            NULL,
    [Description] NVARCHAR (MAX) NULL,
    [StartTime]   DATETIME       NULL,
    [EndTime]     DATETIME       NULL,
    PRIMARY KEY CLUSTERED ([RoundID] ASC),
    FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID])
);


GO

CREATE TABLE [dbo].[NotificationSettings] (
    [ID]                 INT      IDENTITY (1, 1) NOT NULL,
    [UserID]             BIGINT   NOT NULL,
    [EmailNotifications] BIT      DEFAULT ((1)) NULL,
    [NewUserAlerts]      BIT      DEFAULT ((1)) NULL,
    [SystemAlerts]       BIT      DEFAULT ((1)) NULL,
    [ReportAlerts]       BIT      DEFAULT ((1)) NULL,
    [EventReminders]     BIT      DEFAULT ((1)) NULL,
    [ExamNotifications]  BIT      DEFAULT ((1)) NULL,
    [UpdatedAt]          DATETIME DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

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

CREATE TABLE [dbo].[CompetitionRegistrations] (
    [RegistrationID]   INT           IDENTITY (1, 1) NOT NULL,
    [UserID]           INT           NOT NULL,
    [CompetitionID]    INT           NOT NULL,
    [RegistrationDate] DATETIME      CONSTRAINT [DF_CompetitionRegistrations_RegistrationDate] DEFAULT (getdate()) NULL,
    [Status]           NVARCHAR (20) DEFAULT ('REGISTERED') NOT NULL,
    [Score]            INT           DEFAULT ((0)) NULL,
    [ProblemsSolved]   INT           DEFAULT ((0)) NULL,
    [Ranking]          INT           NULL,
    [CreatedAt]        DATETIME      CONSTRAINT [DF_CompetitionRegistrations_CreatedAt] DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME      CONSTRAINT [DF_CompetitionRegistrations_UpdatedAt] DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([RegistrationID] ASC)
);


GO

CREATE TABLE [dbo].[PaymentTransactions] (
    [TransactionID]   BIGINT          IDENTITY (1, 1) NOT NULL,
    [UserID]          BIGINT          NULL,
    [CourseID]        BIGINT          NULL,
    [Amount]          DECIMAL (10, 2) NOT NULL,
    [Currency]        VARCHAR (10)    DEFAULT ('VND') NULL,
    [PaymentMethod]   VARCHAR (50)    NOT NULL,
    [TransactionCode] VARCHAR (100)   NULL,
    [PaymentStatus]   VARCHAR (20)    DEFAULT ('pending') NULL,
    [PaymentDate]     DATETIME        NULL,
    [CreatedAt]       DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME        DEFAULT (getdate()) NULL,
    [PaymentDetails]  NVARCHAR (MAX)  NULL,
    PRIMARY KEY CLUSTERED ([TransactionID] ASC),
    CONSTRAINT [CHK_Payment_Method] CHECK ([PaymentMethod]='paypal' OR [PaymentMethod]='free' OR [PaymentMethod]='momo' OR [PaymentMethod]='bank_transfer' OR [PaymentMethod]='credit_card' OR [PaymentMethod]='vnpay'),
    CONSTRAINT [CHK_Payment_Status] CHECK ([PaymentStatus]='cancelled' OR [PaymentStatus]='refunded' OR [PaymentStatus]='failed' OR [PaymentStatus]='completed' OR [PaymentStatus]='pending'),
    FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses] ([CourseID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([TransactionCode] ASC)
);


GO

CREATE TABLE [dbo].[Conversations] (
    [ConversationID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [Type]           VARCHAR (20)   DEFAULT ('private') NULL,
    [Title]          NVARCHAR (255) NULL,
    [CreatedBy]      BIGINT         NULL,
    [CreatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    [LastMessageAt]  DATETIME       NULL,
    [IsActive]       BIT            DEFAULT ((1)) NULL,
    PRIMARY KEY CLUSTERED ([ConversationID] ASC),
    CONSTRAINT [CHK_Conversation_Type] CHECK ([Type]='group' OR [Type]='private'),
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE TABLE [dbo].[CompetitionProblems] (
    [ProblemID]        BIGINT         IDENTITY (1, 1) NOT NULL,
    [CompetitionID]    BIGINT         NOT NULL,
    [Title]            NVARCHAR (200) NOT NULL,
    [Description]      NTEXT          NOT NULL,
    [Difficulty]       NVARCHAR (20)  DEFAULT (N'Trung bình') NOT NULL,
    [Points]           INT            DEFAULT ((100)) NOT NULL,
    [TimeLimit]        INT            DEFAULT ((1)) NOT NULL,
    [MemoryLimit]      INT            DEFAULT ((256)) NOT NULL,
    [InputFormat]      NTEXT          NULL,
    [OutputFormat]     NTEXT          NULL,
    [Constraints]      NTEXT          NULL,
    [SampleInput]      NTEXT          NULL,
    [SampleOutput]     NTEXT          NULL,
    [Explanation]      NTEXT          NULL,
    [CreatedAt]        DATETIME       DEFAULT (getdate()) NOT NULL,
    [UpdatedAt]        DATETIME       DEFAULT (getdate()) NOT NULL,
    [ImageURL]         NVARCHAR (500) NULL,
    [StarterCode]      NVARCHAR (MAX) NULL,
    [TestCasesVisible] NVARCHAR (MAX) NULL,
    [TestCasesHidden]  NVARCHAR (MAX) NULL,
    [Tags]             NVARCHAR (500) NULL,
    [Instructions]     NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([ProblemID] ASC),
    CONSTRAINT [CHK_Problem_Difficulty] CHECK ([Difficulty]=N'Khó' OR [Difficulty]=N'Trung bình' OR [Difficulty]=N'Dễ'),
    FOREIGN KEY ([CompetitionID]) REFERENCES [dbo].[Competitions] ([CompetitionID])
);


GO

CREATE TABLE [dbo].[PracticeTestCases] (
    [TestCaseID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [PracticeID]     BIGINT         NULL,
    [Input]          NVARCHAR (MAX) NULL,
    [ExpectedOutput] NVARCHAR (MAX) NULL,
    [IsHidden]       BIT            DEFAULT ((0)) NULL,
    [OrderIndex]     INT            NOT NULL,
    [CreatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([TestCaseID] ASC),
    FOREIGN KEY ([PracticeID]) REFERENCES [dbo].[ModulePractices] ([PracticeID])
);


GO

CREATE TABLE [dbo].[CourseLessons] (
    [LessonID]    BIGINT         IDENTITY (1, 1) NOT NULL,
    [ModuleID]    BIGINT         NULL,
    [Title]       NVARCHAR (255) NOT NULL,
    [Description] NVARCHAR (MAX) NULL,
    [Type]        VARCHAR (50)   NOT NULL,
    [Content]     NVARCHAR (MAX) NULL,
    [VideoUrl]    VARCHAR (255)  NULL,
    [Duration]    INT            NULL,
    [OrderIndex]  INT            NOT NULL,
    [IsPreview]   BIT            DEFAULT ((0)) NULL,
    [IsPublished] BIT            DEFAULT ((0)) NULL,
    [CreatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([LessonID] ASC),
    CONSTRAINT [CHK_Lesson_Type] CHECK ([Type]='exercise' OR [Type]='coding' OR [Type]='assignment' OR [Type]='quiz' OR [Type]='text' OR [Type]='video'),
    FOREIGN KEY ([ModuleID]) REFERENCES [dbo].[CourseModules] ([ModuleID])
);


GO

CREATE TABLE [dbo].[PaymentHistory] (
    [HistoryID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [TransactionID] BIGINT         NULL,
    [Status]        VARCHAR (50)   NOT NULL,
    [Message]       NVARCHAR (500) NULL,
    [ResponseData]  NVARCHAR (MAX) NULL,
    [IPAddress]     VARCHAR (50)   NULL,
    [UserAgent]     NVARCHAR (500) NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([HistoryID] ASC),
    FOREIGN KEY ([TransactionID]) REFERENCES [dbo].[PaymentTransactions] ([TransactionID])
);


GO

CREATE TABLE [dbo].[UserSettings] (
    [SettingID]         BIGINT       IDENTITY (1, 1) NOT NULL,
    [UserID]            BIGINT       NOT NULL,
    [Theme]             VARCHAR (20) DEFAULT ('light') NULL,
    [NotificationEmail] BIT          DEFAULT ((1)) NULL,
    [NotificationPush]  BIT          DEFAULT ((1)) NULL,
    [NotificationInApp] BIT          DEFAULT ((1)) NULL,
    [Language]          VARCHAR (10) DEFAULT ('vi-VN') NULL,
    [TimeZone]          VARCHAR (50) DEFAULT ('Asia/Ho_Chi_Minh') NULL,
    [ProfileVisibility] VARCHAR (20) DEFAULT ('public') NULL,
    [LastLoggedIn]      DATETIME     NULL,
    [LastUpdated]       DATETIME     DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([SettingID] ASC),
    CONSTRAINT [CHK_Profile_Visibility] CHECK ([ProfileVisibility]='private' OR [ProfileVisibility]='friends' OR [ProfileVisibility]='public'),
    CONSTRAINT [CHK_User_Theme] CHECK ([Theme]='system' OR [Theme]='dark' OR [Theme]='light'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([UserID] ASC)
);


GO

CREATE TABLE [dbo].[Achievements] (
    [AchievementID] INT            IDENTITY (1, 1) NOT NULL,
    [Name]          NVARCHAR (100) NOT NULL,
    [Description]   NVARCHAR (500) NULL,
    [Type]          VARCHAR (50)   NULL,
    [Icon]          VARCHAR (255)  NULL,
    [Points]        INT            DEFAULT ((0)) NULL,
    [Criteria]      NVARCHAR (MAX) NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([AchievementID] ASC)
);


GO

CREATE TABLE [dbo].[Competitions] (
    [CompetitionID]       BIGINT          IDENTITY (1, 1) NOT NULL,
    [Title]               NVARCHAR (200)  NOT NULL,
    [Description]         NTEXT           NOT NULL,
    [StartTime]           DATETIME        NOT NULL,
    [EndTime]             DATETIME        NOT NULL,
    [Duration]            INT             NOT NULL,
    [Difficulty]          NVARCHAR (20)   DEFAULT (N'Trung bình') NOT NULL,
    [Status]              NVARCHAR (20)   DEFAULT ('draft') NOT NULL,
    [MaxParticipants]     INT             DEFAULT ((100)) NOT NULL,
    [CurrentParticipants] INT             DEFAULT ((0)) NOT NULL,
    [PrizePool]           DECIMAL (12, 2) DEFAULT ((0)) NOT NULL,
    [OrganizedBy]         BIGINT          NULL,
    [ThumbnailUrl]        NVARCHAR (500)  NULL,
    [CreatedAt]           DATETIME        DEFAULT (getdate()) NOT NULL,
    [UpdatedAt]           DATETIME        DEFAULT (getdate()) NOT NULL,
    [DeletedAt]           DATETIME        NULL,
    [CoverImageURL]       NVARCHAR (500)  NULL,
    PRIMARY KEY CLUSTERED ([CompetitionID] ASC),
    CONSTRAINT [CHK_Competition_Difficulty] CHECK ([Difficulty]=N'Khó' OR [Difficulty]=N'Trung bình' OR [Difficulty]=N'Dễ'),
    CONSTRAINT [CHK_Competition_Difficulty_New] CHECK ([Difficulty]=N'Khó' OR [Difficulty]=N'Trung bình' OR [Difficulty]=N'Dễ'),
    CONSTRAINT [CHK_Competition_Status] CHECK ([Status]='cancelled' OR [Status]='completed' OR [Status]='ongoing' OR [Status]='upcoming' OR [Status]='draft'),
    CONSTRAINT [CHK_Competition_Status_New] CHECK ([Status]='cancelled' OR [Status]='completed' OR [Status]='ongoing' OR [Status]='upcoming' OR [Status]='draft'),
    FOREIGN KEY ([OrganizedBy]) REFERENCES [dbo].[Users] ([UserID])
);


GO

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



CREATE   VIEW UserAccessibleCompetitionProblems AS
SELECT 
    cp.ProblemID,
    cp.CompetitionID,
    cp.Title,
    cp.Description,
    cp.Difficulty,
    cp.Points,
    cp.TimeLimit,
    cp.MemoryLimit,
    cp.InputFormat,
    cp.OutputFormat,
    cp.Constraints,
    cp.SampleInput,
    cp.SampleOutput,
    cp.Explanation,
    cp.ImageURL,
    cp.StarterCode,
    cp.TestCasesVisible,
    cp.Instructions,
    pa.UserID,
    c.Title AS CompetitionTitle,
    c.StartTime,
    c.EndTime,
    c.Status AS CompetitionStatus,
    pa.Status AS ParticipationStatus
FROM CompetitionProblems cp
INNER JOIN Competitions c ON cp.CompetitionID = c.CompetitionID
INNER JOIN CompetitionParticipants pa ON c.CompetitionID = pa.CompetitionID
WHERE c.Status = 'active'
AND c.StartTime <= GETDATE()
AND c.EndTime >= GETDATE()
AND pa.Status IN ('registered', 'participating');

GO

CREATE NONCLUSTERED INDEX [IX_Reports_Category]
    ON [dbo].[Reports]([Category] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CourseAchievements_UserID]
    ON [dbo].[CourseAchievements]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionProblems_CompetitionID]
    ON [dbo].[CompetitionProblems]([CompetitionID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_SystemInfo_Category]
    ON [dbo].[SystemInfo]([Category] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Friendships_UserID]
    ON [dbo].[Friendships]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionSubmissions_ParticipantID]
    ON [dbo].[CompetitionSubmissions]([ParticipantID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Reports_Status]
    ON [dbo].[Reports]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_MessageStatus_UserID]
    ON [dbo].[MessageStatus]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_ExamMonitoringLogs_Timestamp]
    ON [dbo].[ExamMonitoringLogs]([Timestamp] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Messages_ConversationID]
    ON [dbo].[Messages]([ConversationID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Friendships_Status]
    ON [dbo].[Friendships]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Courses_Status]
    ON [dbo].[Courses]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Users_Status]
    ON [dbo].[Users]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Exams_StartTime]
    ON [dbo].[Exams]([StartTime] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Events_Date]
    ON [dbo].[Events]([EventDate] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_UserPresence_Status]
    ON [dbo].[UserPresence]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Courses_InstructorID]
    ON [dbo].[Courses]([InstructorID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Messages_CreatedAt]
    ON [dbo].[Messages]([CreatedAt] DESC);


GO

CREATE NONCLUSTERED INDEX [IX_UserRankings_TotalPoints]
    ON [dbo].[UserRankings]([TotalPoints] DESC);


GO

CREATE NONCLUSTERED INDEX [IX_Events_Status]
    ON [dbo].[Events]([Status] ASC);


GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_Exams_AlternateId]
    ON [dbo].[Exams]([AlternateId] ASC) WHERE ([AlternateId] IS NOT NULL);


GO

CREATE NONCLUSTERED INDEX [IX_Calls_Status]
    ON [dbo].[Calls]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Competitions_OrganizedBy]
    ON [dbo].[Competitions]([OrganizedBy] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_ConversationParticipants_UserID]
    ON [dbo].[ConversationParticipants]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Notifications_UserID_IsRead]
    ON [dbo].[Notifications]([UserID] ASC, [IsRead] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionParticipants_Score]
    ON [dbo].[CompetitionParticipants]([CompetitionID] ASC, [Score] DESC);


GO

CREATE NONCLUSTERED INDEX [IX_Reports_CreatedAt]
    ON [dbo].[Reports]([CreatedAt] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_SystemSettings_Category]
    ON [dbo].[SystemSettings]([Category] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_EventAchievements_UserID]
    ON [dbo].[EventAchievements]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_ExamParticipants_Status]
    ON [dbo].[ExamParticipants]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Reports_ReporterID]
    ON [dbo].[Reports]([ReporterID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Stories_ExpiresAt]
    ON [dbo].[Stories]([ExpiresAt] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CourseEnrollments_UserID]
    ON [dbo].[CourseEnrollments]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionSubmissions_Status]
    ON [dbo].[CompetitionSubmissions]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Friendships_FriendID]
    ON [dbo].[Friendships]([FriendID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_RankingStats_UserID_PeriodType]
    ON [dbo].[RankingStats]([UserID] ASC, [PeriodType] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Competitions_Status]
    ON [dbo].[Competitions]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Messages_ReplyToMessageID]
    ON [dbo].[Messages]([ReplyToMessageID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Competitions_StartTime]
    ON [dbo].[Competitions]([StartTime] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_UserRankings_Tier]
    ON [dbo].[UserRankings]([Tier] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CourseEnrollments_Status]
    ON [dbo].[CourseEnrollments]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Messages_SenderID]
    ON [dbo].[Messages]([SenderID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Events_Category]
    ON [dbo].[Events]([Category] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CodingSubmissions_Status]
    ON [dbo].[CodingSubmissions]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionParticipants_CompetitionID]
    ON [dbo].[CompetitionParticipants]([CompetitionID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_NotificationSettings_UserID]
    ON [dbo].[NotificationSettings]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionSubmissions_ProblemID]
    ON [dbo].[CompetitionSubmissions]([ProblemID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_MessageStatus_MessageID]
    ON [dbo].[MessageStatus]([MessageID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_LessonProgress_Status]
    ON [dbo].[LessonProgress]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_RankingHistory_UserID]
    ON [dbo].[RankingHistory]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionParticipants_UserID]
    ON [dbo].[CompetitionParticipants]([UserID] ASC);


GO



-- Create a trigger to automatically update participant scores when submission is evaluated
CREATE   TRIGGER TR_UpdateParticipantScore
ON CompetitionSubmissions
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Only process submissions that have been evaluated (status changed to 'accepted' or 'rejected')
    IF EXISTS (
        SELECT 1 
        FROM inserted i 
        INNER JOIN deleted d ON i.SubmissionID = d.SubmissionID
        WHERE i.Status IN ('accepted', 'rejected', 'partial') 
          AND d.Status = 'pending'
    )
    BEGIN
        -- Update participant scores based on accepted submissions
        UPDATE cp
        SET cp.Score = (
            SELECT ISNULL(SUM(
                CASE 
                    WHEN cs.Status = 'accepted' THEN p.Points
                    WHEN cs.Status = 'partial' THEN CAST(p.Points * cs.Score / 100.0 AS INT)
                    ELSE 0
                END
            ), 0)
            FROM CompetitionSubmissions cs
            INNER JOIN CompetitionProblems p ON cs.ProblemID = p.ProblemID
            WHERE cs.ParticipantID = cp.ParticipantID
              AND cs.Status IN ('accepted', 'partial')
        )
        FROM CompetitionParticipants cp
        INNER JOIN inserted i ON i.ParticipantID = cp.ParticipantID;
    END
END;

GO


CREATE TRIGGER TR_Messages_After_Insert
ON Messages
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE c
    SET c.LastMessageAt = i.CreatedAt,
        c.UpdatedAt = GETDATE()
    FROM Conversations c
    INNER JOIN inserted i ON c.ConversationID = i.ConversationID;
END

GO

use CampusLearning;

USE CampusLearning;
GO

-- Xóa bảng PasswordResets nếu đã tồn tại
IF OBJECT_ID(N'[dbo].[PasswordResets]', N'U') IS NOT NULL
    DROP TABLE [dbo].[PasswordResets];
GO

-- Tạo bảng PasswordResets với hỗ trợ OTP
CREATE TABLE [dbo].[PasswordResets] (
    [ResetID] INT IDENTITY(1,1) PRIMARY KEY,
    [UserID] BIGINT NOT NULL,
    [OTP] CHAR(6) NOT NULL,
    [ExpiresAt] DATETIME NOT NULL,
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [IsUsed] BIT NOT NULL DEFAULT 0,
    [AttemptCount] INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_PasswordResets_Users FOREIGN KEY ([UserID]) 
        REFERENCES [dbo].[Users]([UserID])
        ON DELETE CASCADE
);
GO

-- Tạo chỉ mục để truy vấn nhanh theo UserID
CREATE NONCLUSTERED INDEX IX_PasswordResets_UserID 
ON [dbo].[PasswordResets]([UserID]);
GO

-- (Tùy chọn) Nếu muốn đảm bảo mỗi user chỉ có 1 OTP đang hoạt động
-- Có thể tạo một chỉ mục lọc theo IsUsed = 0
CREATE UNIQUE NONCLUSTERED INDEX IX_PasswordResets_UserID_Active 
ON [dbo].[PasswordResets]([UserID])
WHERE [IsUsed] = 0;
GO
