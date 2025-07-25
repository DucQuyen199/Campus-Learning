/*-----------------------------------------------------------------
* File: ExamMonitoringLogs.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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

CREATE NONCLUSTERED INDEX [IX_ExamMonitoringLogs_Timestamp]
    ON [dbo].[ExamMonitoringLogs]([Timestamp] ASC);


GO

