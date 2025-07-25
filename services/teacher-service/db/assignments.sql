-- Create Assignments table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Assignments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Assignments] (
        [AssignmentID] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [Title] NVARCHAR(255) NOT NULL,
        [Description] NVARCHAR(MAX),
        [CourseID] BIGINT NOT NULL,
        [DueDate] DATETIME,
        [TotalPoints] INT DEFAULT 100,
        [CreatedBy] BIGINT NOT NULL,
        [CreatedAt] DATETIME DEFAULT GETDATE(),
        [UpdatedAt] DATETIME DEFAULT GETDATE(),
        CONSTRAINT [FK_Assignments_Courses] FOREIGN KEY ([CourseID]) REFERENCES [dbo].[Courses]([CourseID]),
        CONSTRAINT [FK_Assignments_Users] FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users]([UserID])
    );
END
-- Create Assignment Files table for file attachments
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AssignmentFiles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AssignmentFiles] (
        [FileID] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [AssignmentID] BIGINT NOT NULL,
        [FileName] NVARCHAR(255) NOT NULL,
        [FilePath] NVARCHAR(500) NOT NULL,
        [FileSize] INT NOT NULL,
        [FileType] NVARCHAR(100) NOT NULL,
        [UploadedAt] DATETIME DEFAULT GETDATE(),
        CONSTRAINT [FK_AssignmentFiles_Assignments] FOREIGN KEY ([AssignmentID]) REFERENCES [dbo].[Assignments]([AssignmentID]) ON DELETE CASCADE
    );
END

-- Create Assignment Submissions table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AssignmentSubmissions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AssignmentSubmissions] (
        [SubmissionID] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [AssignmentID] BIGINT NOT NULL,
        [UserID] BIGINT NOT NULL,
        [Content] NVARCHAR(MAX), -- Written answer or notes
        [SubmittedAt] DATETIME DEFAULT GETDATE(),
        [Status] VARCHAR(20) DEFAULT 'submitted', -- submitted, graded, late
        [Score] INT,
        [Feedback] NVARCHAR(MAX),
        [GradedAt] DATETIME,
        [GradedBy] BIGINT,
        CONSTRAINT [FK_AssignmentSubmissions_Assignments] FOREIGN KEY ([AssignmentID]) REFERENCES [dbo].[Assignments]([AssignmentID]),
        CONSTRAINT [FK_AssignmentSubmissions_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users]([UserID]),
        CONSTRAINT [FK_AssignmentSubmissions_Graders] FOREIGN KEY ([GradedBy]) REFERENCES [dbo].[Users]([UserID])
    );
END

-- Create Submission Files table for file attachments in submissions
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SubmissionFiles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SubmissionFiles] (
        [FileID] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [SubmissionID] BIGINT NOT NULL,
        [FileName] NVARCHAR(255) NOT NULL,
        [FilePath] NVARCHAR(500) NOT NULL,
        [FileSize] INT NOT NULL,
        [FileType] NVARCHAR(100) NOT NULL,
        [UploadedAt] DATETIME DEFAULT GETDATE(),
        CONSTRAINT [FK_SubmissionFiles_Submissions] FOREIGN KEY ([SubmissionID]) REFERENCES [dbo].[AssignmentSubmissions]([SubmissionID]) ON DELETE CASCADE
    );
END

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Assignments_CourseID' AND object_id = OBJECT_ID(N'[dbo].[Assignments]'))
    CREATE INDEX [IX_Assignments_CourseID] ON [dbo].[Assignments]([CourseID]);
    
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AssignmentSubmissions_AssignmentID' AND object_id = OBJECT_ID(N'[dbo].[AssignmentSubmissions]'))
    CREATE INDEX [IX_AssignmentSubmissions_AssignmentID] ON [dbo].[AssignmentSubmissions]([AssignmentID]);
    
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AssignmentSubmissions_UserID' AND object_id = OBJECT_ID(N'[dbo].[AssignmentSubmissions]'))
    CREATE INDEX [IX_AssignmentSubmissions_UserID] ON [dbo].[AssignmentSubmissions]([UserID]);
    
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AssignmentFiles_AssignmentID' AND object_id = OBJECT_ID(N'[dbo].[AssignmentFiles]'))
    CREATE INDEX [IX_AssignmentFiles_AssignmentID] ON [dbo].[AssignmentFiles]([AssignmentID]);
    
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SubmissionFiles_SubmissionID' AND object_id = OBJECT_ID(N'[dbo].[SubmissionFiles]'))
    CREATE INDEX [IX_SubmissionFiles_SubmissionID] ON [dbo].[SubmissionFiles]([SubmissionID]); 