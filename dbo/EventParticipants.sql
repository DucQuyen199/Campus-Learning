CREATE TABLE [dbo].[EventParticipants] (
    [ParticipantID]    BIGINT         IDENTITY (1, 1) NOT NULL,
    [EventID]          BIGINT         NOT NULL,
    [UserID]           BIGINT         NOT NULL,
    [RegistrationDate] DATETIME       DEFAULT (getdate()) NULL,
    [Status]           VARCHAR (20)   DEFAULT ('registered') NULL,
    [TeamName]         NVARCHAR (100) NULL,
    [PaymentStatus]    VARCHAR (20)   NULL,
    [AttendanceStatus] VARCHAR (20)   NULL,
    PRIMARY KEY CLUSTERED ([ParticipantID] ASC),
    CONSTRAINT [CHK_EventParticipant_Attendance] CHECK ([AttendanceStatus]='absent' OR [AttendanceStatus]='present' OR [AttendanceStatus]='pending'),
    CONSTRAINT [CHK_EventParticipant_Payment] CHECK ([PaymentStatus]='free' OR [PaymentStatus]='refunded' OR [PaymentStatus]='completed' OR [PaymentStatus]='pending'),
    CONSTRAINT [CHK_EventParticipant_Status] CHECK ([Status]='attended' OR [Status]='cancelled' OR [Status]='confirmed' OR [Status]='registered'),
    CONSTRAINT [FK_EventParticipants_Events] FOREIGN KEY ([EventID]) REFERENCES [dbo].[Events] ([EventID]),
    CONSTRAINT [FK_EventParticipants_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [UQ_Event_User] UNIQUE NONCLUSTERED ([EventID] ASC, [UserID] ASC)
);


GO

