/*-----------------------------------------------------------------
* File: CourseEnrollments.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[CourseEnrollments] (
    [EnrollmentID]         BIGINT       IDENTITY (1, 1) NOT NULL,
    [CourseID]             BIGINT       NULL,
    [UserID]               BIGINT       NULL,
    [Progress]             INT          DEFAULT ((0)) NULL,
    [LastAccessedLessonID] BIGINT       NULL,
    [EnrolledAt]           DATETIME     DEFAULT (getdate()) NULL,
    [CompletedAt]          DATETIME     NULL,
    [CertificateIssued]    BIT          DEFAULT ((0)) NULL,
    [Status]               VARCHAR (20) DEFAULT ('active') NULL,
    PRIMARY KEY CLUSTERED ([EnrollmentID] ASC),
    CONSTRAINT [CHK_Enrollment_Status] CHECK ([Status]='suspended' OR [Status]='dropped' OR [Status]='completed' OR [Status]='active'),
    FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses] ([CourseID]),
    FOREIGN KEY ([LastAccessedLessonID]) REFERENCES [dbo].[CourseLessons] ([LessonID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_CourseEnrollments_UserID]
    ON [dbo].[CourseEnrollments]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CourseEnrollments_Status]
    ON [dbo].[CourseEnrollments]([Status] ASC);


GO

