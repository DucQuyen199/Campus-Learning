/*-----------------------------------------------------------------
* File: CompetitionRegistrations.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[CompetitionRegistrations] (
    [RegistrationID]   INT           IDENTITY (1, 1) NOT NULL,
    [UserID]           INT           NOT NULL,
    [CompetitionID]    INT           NOT NULL,
    [RegistrationDate] DATETIME      CONSTRAINT [DF_CompetitionRegistrations_RegistrationDate] DEFAULT (getdate()) NULL,
    [Status]           NVARCHAR (20) DEFAULT ('REGISTERED') NOT NULL,
    [Score]            INT           DEFAULT ((0)) NULL,
    [ProblemsSolved]   INT           DEFAULT ((0)) NULL,
    [Ranking]          INT           NULL,
    [CreatedAt]        DATETIME      CONSTRAINT [DF_CompetitionRegistrations_CreatedAt] DEFAULT (getdate()) NULL,
    [UpdatedAt]        DATETIME      CONSTRAINT [DF_CompetitionRegistrations_UpdatedAt] DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([RegistrationID] ASC)
);


GO

