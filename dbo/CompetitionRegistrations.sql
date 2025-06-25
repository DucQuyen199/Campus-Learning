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

