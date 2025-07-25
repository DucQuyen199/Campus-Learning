/*-----------------------------------------------------------------
* File: StudentAwards.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[StudentAwards] (
    [AwardID]        BIGINT          IDENTITY (1, 1) NOT NULL,
    [UserID]         BIGINT          NULL,
    [AwardType]      VARCHAR (20)    NULL,
    [Title]          NVARCHAR (200)  NULL,
    [Description]    NVARCHAR (MAX)  NULL,
    [AwardDate]      DATE            NULL,
    [Amount]         DECIMAL (10, 2) NULL,
    [IssuedBy]       NVARCHAR (100)  NULL,
    [DocumentNumber] VARCHAR (50)    NULL,
    [CreatedAt]      DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]      DATETIME        DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([AwardID] ASC),
    CONSTRAINT [CHK_Award_Type] CHECK ([AwardType]='Warning' OR [AwardType]='Discipline' OR [AwardType]='Scholarship' OR [AwardType]='Reward'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

