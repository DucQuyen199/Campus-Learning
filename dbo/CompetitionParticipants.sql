/*-----------------------------------------------------------------
* File: CompetitionParticipants.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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

CREATE NONCLUSTERED INDEX [IX_CompetitionParticipants_CompetitionID]
    ON [dbo].[CompetitionParticipants]([CompetitionID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionParticipants_Score]
    ON [dbo].[CompetitionParticipants]([CompetitionID] ASC, [Score] DESC);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionParticipants_UserID]
    ON [dbo].[CompetitionParticipants]([UserID] ASC);


GO

