CREATE TABLE [dbo].[ExamRegistrations] (
    [ExamRegistrationID] BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]             BIGINT         NULL,
    [ExamID]             BIGINT         NULL,
    [RegistrationTime]   DATETIME       DEFAULT (getdate()) NULL,
    [Status]             VARCHAR (20)   DEFAULT ('Pending') NULL,
    [AdminApproval]      BIT            DEFAULT ((0)) NULL,
    [ApprovedBy]         BIGINT         NULL,
    [ApprovedAt]         DATETIME       NULL,
    [CancellationReason] NVARCHAR (255) NULL,
    [CancelledAt]        DATETIME       NULL,
    [CreatedAt]          DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]          DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ExamRegistrationID] ASC),
    CONSTRAINT [CHK_ExamRegistration_Status] CHECK ([Status]='Cancelled' OR [Status]='Rejected' OR [Status]='Approved' OR [Status]='Pending'),
    FOREIGN KEY ([ApprovedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([ExamID]) REFERENCES [dbo].[Exams] ([ExamID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

