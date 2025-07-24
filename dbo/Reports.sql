/*-----------------------------------------------------------------
* File: Reports.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
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

CREATE NONCLUSTERED INDEX [IX_Reports_Status]
    ON [dbo].[Reports]([Status] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Reports_CreatedAt]
    ON [dbo].[Reports]([CreatedAt] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Reports_Category]
    ON [dbo].[Reports]([Category] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Reports_ReporterID]
    ON [dbo].[Reports]([ReporterID] ASC);


GO

