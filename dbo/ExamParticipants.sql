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

CREATE NONCLUSTERED INDEX [IX_ExamParticipants_Status]
    ON [dbo].[ExamParticipants]([Status] ASC);


GO

