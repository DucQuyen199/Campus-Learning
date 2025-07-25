/*-----------------------------------------------------------------
* File: CallParticipants.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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

