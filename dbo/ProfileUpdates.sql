CREATE TABLE [dbo].[ProfileUpdates] (
    [UpdateID]   BIGINT         IDENTITY (1, 1) NOT NULL,
    [UserID]     BIGINT         NULL,
    [FieldName]  VARCHAR (50)   NULL,
    [OldValue]   NVARCHAR (MAX) NULL,
    [NewValue]   NVARCHAR (MAX) NULL,
    [UpdateTime] DATETIME       DEFAULT (getdate()) NULL,
    [Status]     VARCHAR (20)   DEFAULT ('Pending') NULL,
    [ApprovedBy] BIGINT         NULL,
    [ApprovedAt] DATETIME       NULL,
    [Reason]     NVARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([UpdateID] ASC),
    CONSTRAINT [CHK_ProfileUpdate_Status] CHECK ([Status]='Rejected' OR [Status]='Approved' OR [Status]='Pending'),
    FOREIGN KEY ([ApprovedBy]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

