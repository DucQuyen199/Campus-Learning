CREATE TABLE [dbo].[GraduationRegistrations] (
    [GraduationID]           BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]                 BIGINT         NULL,
    [SemesterID]             BIGINT         NULL,
    [RegistrationDate]       DATETIME       DEFAULT (getdate()) NULL,
    [ExpectedGraduationDate] DATE           NULL,
    [TotalCredits]           INT            NULL,
    [AverageGPA]             DECIMAL (5, 2) NULL,
    [HasThesis]              BIT            DEFAULT ((0)) NULL,
    [ThesisTitle]            NVARCHAR (200) NULL,
    [ThesisSupervisorID]     BIGINT         NULL,
    [EngCertificate]         NVARCHAR (100) NULL,
    [ItCertificate]          NVARCHAR (100) NULL,
    [Status]                 VARCHAR (20)   DEFAULT ('Pending') NULL,
    [ReviewedBy]             BIGINT         NULL,
    [ReviewedAt]             DATETIME       NULL,
    [Comments]               NVARCHAR (500) NULL,
    [CreatedAt]              DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]              DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([GraduationID] ASC),
    CONSTRAINT [CHK_Graduation_Status] CHECK ([Status]='Cancelled' OR [Status]='Graduated' OR [Status]='Rejected' OR [Status]='Approved' OR [Status]='Pending'),
    FOREIGN KEY ([ReviewedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([SemesterID]) REFERENCES [dbo].[Semesters] ([SemesterID]),
    FOREIGN KEY ([ThesisSupervisorID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

