/*-----------------------------------------------------------------
* File: CourseRegistrations.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[CourseRegistrations] (
    [RegistrationID]     BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]             BIGINT         NULL,
    [ClassID]            BIGINT         NULL,
    [RegistrationType]   VARCHAR (20)   DEFAULT ('Regular') NULL,
    [RegistrationTime]   DATETIME       DEFAULT (getdate()) NULL,
    [Status]             VARCHAR (20)   DEFAULT ('Pending') NULL,
    [AdminApproval]      BIT            DEFAULT ((0)) NULL,
    [ApprovedBy]         BIGINT         NULL,
    [ApprovedAt]         DATETIME       NULL,
    [CancellationReason] NVARCHAR (255) NULL,
    [CancelledAt]        DATETIME       NULL,
    [CreatedAt]          DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]          DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([RegistrationID] ASC),
    CONSTRAINT [CHK_Registration_Status] CHECK ([Status]='Cancelled' OR [Status]='Rejected' OR [Status]='Approved' OR [Status]='Pending'),
    CONSTRAINT [CHK_Registration_Type] CHECK ([RegistrationType]='Improvement' OR [RegistrationType]='Retake' OR [RegistrationType]='Regular'),
    FOREIGN KEY ([ApprovedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([ClassID]) REFERENCES [dbo].[CourseClasses] ([ClassID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

