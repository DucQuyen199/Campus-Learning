/*-----------------------------------------------------------------
* File: Competitions.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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

CREATE NONCLUSTERED INDEX [IX_Competitions_StartTime]
    ON [dbo].[Competitions]([StartTime] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Competitions_OrganizedBy]
    ON [dbo].[Competitions]([OrganizedBy] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Competitions_Status]
    ON [dbo].[Competitions]([Status] ASC);


GO

