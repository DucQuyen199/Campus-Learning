CREATE TABLE [dbo].[StudentFeedback] (
    [FeedbackID]  BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]      BIGINT         NULL,
    [Title]       NVARCHAR (200) NULL,
    [Content]     NVARCHAR (MAX) NULL,
    [Type]        VARCHAR (50)   NULL,
    [Department]  NVARCHAR (100) NULL,
    [Status]      VARCHAR (20)   DEFAULT ('Submitted') NULL,
    [Response]    NVARCHAR (MAX) NULL,
    [RespondedBy] BIGINT         NULL,
    [RespondedAt] DATETIME       NULL,
    [IsAnonymous] BIT            DEFAULT ((0)) NULL,
    [CreatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]   DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([FeedbackID] ASC),
    CONSTRAINT [CHK_Feedback_Status] CHECK ([Status]='Rejected' OR [Status]='Resolved' OR [Status]='Responded' OR [Status]='Processing' OR [Status]='Submitted'),
    CONSTRAINT [CHK_Feedback_Type] CHECK ([Type]='Other' OR [Type]='Request' OR [Type]='Question' OR [Type]='Complaint' OR [Type]='Suggestion'),
    FOREIGN KEY ([RespondedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

