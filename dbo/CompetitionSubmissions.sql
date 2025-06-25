CREATE TABLE [dbo].[CompetitionSubmissions] (
    [SubmissionID]  BIGINT          IDENTITY (1, 1) NOT NULL,
    [ProblemID]     BIGINT          NOT NULL,
    [ParticipantID] BIGINT          NOT NULL,
    [SourceCode]    NTEXT           NOT NULL,
    [Language]      NVARCHAR (50)   NOT NULL,
    [Status]        NVARCHAR (50)   DEFAULT ('pending') NOT NULL,
    [Score]         INT             DEFAULT ((0)) NOT NULL,
    [ExecutionTime] DECIMAL (10, 3) NULL,
    [MemoryUsed]    INT             NULL,
    [ErrorMessage]  NTEXT           NULL,
    [SubmittedAt]   DATETIME        DEFAULT (getdate()) NOT NULL,
    [JudgedAt]      DATETIME        NULL,
    PRIMARY KEY CLUSTERED ([SubmissionID] ASC),
    CONSTRAINT [CHK_Submission_Status_New] CHECK ([Status]='compilation_error' OR [Status]='runtime_error' OR [Status]='memory_limit_exceeded' OR [Status]='time_limit_exceeded' OR [Status]='wrong_answer' OR [Status]='accepted' OR [Status]='running' OR [Status]='compiling' OR [Status]='pending'),
    CONSTRAINT [FK_CompetitionSubmissions_CompetitionParticipants] FOREIGN KEY ([ParticipantID]) REFERENCES [dbo].[CompetitionParticipants] ([ParticipantID]),
    CONSTRAINT [FK_CompetitionSubmissions_CompetitionProblems] FOREIGN KEY ([ProblemID]) REFERENCES [dbo].[CompetitionProblems] ([ProblemID])
);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionSubmissions_ProblemID]
    ON [dbo].[CompetitionSubmissions]([ProblemID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionSubmissions_ParticipantID]
    ON [dbo].[CompetitionSubmissions]([ParticipantID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_CompetitionSubmissions_Status]
    ON [dbo].[CompetitionSubmissions]([Status] ASC);


GO




-- Create a trigger to automatically update participant scores when submission is evaluated
CREATE   TRIGGER TR_UpdateParticipantScore
ON CompetitionSubmissions
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Only process submissions that have been evaluated (status changed to 'accepted' or 'rejected')
    IF EXISTS (
        SELECT 1 
        FROM inserted i 
        INNER JOIN deleted d ON i.SubmissionID = d.SubmissionID
        WHERE i.Status IN ('accepted', 'rejected', 'partial') 
          AND d.Status = 'pending'
    )
    BEGIN
        -- Update participant scores based on accepted submissions
        UPDATE cp
        SET cp.Score = (
            SELECT ISNULL(SUM(
                CASE 
                    WHEN cs.Status = 'accepted' THEN p.Points
                    WHEN cs.Status = 'partial' THEN CAST(p.Points * cs.Score / 100.0 AS INT)
                    ELSE 0
                END
            ), 0)
            FROM CompetitionSubmissions cs
            INNER JOIN CompetitionProblems p ON cs.ProblemID = p.ProblemID
            WHERE cs.ParticipantID = cp.ParticipantID
              AND cs.Status IN ('accepted', 'partial')
        )
        FROM CompetitionParticipants cp
        INNER JOIN inserted i ON i.ParticipantID = cp.ParticipantID;
    END
END;

GO

