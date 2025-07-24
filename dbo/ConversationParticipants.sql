/*-----------------------------------------------------------------
* File: ConversationParticipants.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_ConversationParticipants_ConversationID_UserID] UNIQUE NONCLUSTERED ([ConversationID] ASC, [UserID] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_ConversationParticipants_UserID]
    ON [dbo].[ConversationParticipants]([UserID] ASC);


GO

