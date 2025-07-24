/*-----------------------------------------------------------------
* File: Events.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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

CREATE NONCLUSTERED INDEX [IX_Events_Status]
    ON [dbo].[Events]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Events_Category]
    ON [dbo].[Events]([Category] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Events_Date]
    ON [dbo].[Events]([EventDate] ASC);


GO

