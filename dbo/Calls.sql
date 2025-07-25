/*-----------------------------------------------------------------
* File: Calls.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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

CREATE NONCLUSTERED INDEX [IX_Calls_Status]
    ON [dbo].[Calls]([Status] ASC);


GO

