CREATE TABLE [dbo].[AssignmentFiles] (
    [FileID]       BIGINT         IDENTITY (1, 1) NOT NULL,
    [AssignmentID] BIGINT         NOT NULL,
    [FileName]     NVARCHAR (255) NOT NULL,
    [FilePath]     NVARCHAR (500) NOT NULL,
    [FileSize]     INT            NOT NULL,
    [FileType]     NVARCHAR (100) NOT NULL,
    [UploadedAt]   DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([FileID] ASC),
    CONSTRAINT [FK_AssignmentFiles_Assignments] FOREIGN KEY ([AssignmentID]) REFERENCES [dbo].[Assignments] ([AssignmentID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_AssignmentFiles_AssignmentID]
    ON [dbo].[AssignmentFiles]([AssignmentID] ASC);


GO

