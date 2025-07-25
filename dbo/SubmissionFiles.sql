/*-----------------------------------------------------------------
* File: SubmissionFiles.sql
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
CREATE TABLE [dbo].[SubmissionFiles] (
    [FileID]       BIGINT         IDENTITY (1, 1) NOT NULL,
    [SubmissionID] BIGINT         NOT NULL,
    [FileName]     NVARCHAR (255) NOT NULL,
    [FilePath]     NVARCHAR (500) NOT NULL,
    [FileSize]     INT            NOT NULL,
    [FileType]     NVARCHAR (100) NOT NULL,
    [UploadedAt]   DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([FileID] ASC),
    CONSTRAINT [FK_SubmissionFiles_Submissions] FOREIGN KEY ([SubmissionID]) REFERENCES [dbo].[AssignmentSubmissions] ([SubmissionID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_SubmissionFiles_SubmissionID]
    ON [dbo].[SubmissionFiles]([SubmissionID] ASC);


GO

